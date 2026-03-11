import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MODEL_REGISTRY, getModelById } from '@/lib/arena/registry';
import { getAdapter } from '@/lib/arena/providers';

export async function POST(req: NextRequest) {
  try {
    const { prompt, models } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
    if (!Array.isArray(models) || models.length < 1 || models.length > 3) {
      return NextResponse.json({ error: 'models must be an array of 1-3 model IDs' }, { status: 400 });
    }

    // Resolve model configs
    const modelConfigs = models.map((id: string) => {
      const cfg = getModelById(id);
      if (!cfg) throw new Error(`Unknown model: ${id}`);
      if (!cfg.enabled) throw new Error(`Model not enabled: ${id}`);
      return cfg;
    });

    // Create the run record
    const { data: runRow, error: runErr } = await supabase
      .from('prompt_runs')
      .insert({
        prompt_text: prompt.trim(),
        selected_models: models,
        status: 'running',
      })
      .select()
      .single();

    if (runErr || !runRow) {
      return NextResponse.json({ error: `Failed to create run: ${runErr?.message}` }, { status: 500 });
    }

    // Fire all model calls in parallel
    const results = await Promise.allSettled(
      modelConfigs.map(async (cfg) => {
        const adapter = getAdapter(cfg.provider);
        const response = await adapter.call({ prompt: prompt.trim(), modelString: cfg.modelString });
        return { cfg, response };
      })
    );

    // Insert responses
    const responseRows = [];
    let anySuccess = false;
    let allFailed = true;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { cfg, response } = result.value;
        anySuccess = true;
        allFailed = false;
        const { data: respRow } = await supabase
          .from('prompt_responses')
          .insert({
            run_id: runRow.id,
            provider: cfg.provider,
            model_name: cfg.modelString,
            model_display_name: cfg.displayName,
            response_text: response.responseText,
            latency_ms: response.latencyMs,
            token_count_in: response.tokenCountIn,
            token_count_out: response.tokenCountOut,
            error: null,
          })
          .select()
          .single();
        if (respRow) responseRows.push(respRow);
      } else {
        // Find which model this was — match by index
        const idx = results.indexOf(result);
        const cfg = modelConfigs[idx];
        const { data: respRow } = await supabase
          .from('prompt_responses')
          .insert({
            run_id: runRow.id,
            provider: cfg.provider,
            model_name: cfg.modelString,
            model_display_name: cfg.displayName,
            response_text: null,
            latency_ms: null,
            token_count_in: null,
            token_count_out: null,
            error: result.reason?.message ?? 'Unknown error',
          })
          .select()
          .single();
        if (respRow) responseRows.push(respRow);
      }
    }

    // Update run status
    const finalStatus = allFailed ? 'error' : 'complete';
    await supabase
      .from('prompt_runs')
      .update({ status: finalStatus })
      .eq('id', runRow.id);

    return NextResponse.json({
      run: { ...runRow, status: finalStatus },
      responses: responseRows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
