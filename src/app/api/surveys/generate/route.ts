import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  if (content.length > 50000) {
    return NextResponse.json({ error: 'content must be 50,000 characters or fewer' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a survey design expert. Based on the following document or description, generate a well-structured survey.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "Survey Title",
  "description": "Brief description of the survey purpose",
  "questions": [
    {
      "text": "Question text",
      "type": "text|textarea|radio|scale|select|multi|sliders|rank",
      "options": ["Option 1", "Option 2"],
      "required": true
    }
  ]
}

Rules:
- Generate 5-15 relevant questions
- Use appropriate question types for each question
- "options" is required for radio, select, multi, and rank types
- "options" should be omitted for text, textarea types
- For scale type, options should be ["1","2","3","4","5"] or similar
- For sliders type, options should describe the slider labels
- Make questions clear, concise, and unbiased

Document/Description:
${content}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
  }

  try {
    let jsonText = textBlock.text.trim();
    // Strip markdown code fences if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    const survey = JSON.parse(jsonText);
    return NextResponse.json(survey);
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: textBlock.text }, { status: 500 });
  }
}
