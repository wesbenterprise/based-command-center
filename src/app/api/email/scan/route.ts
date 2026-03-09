import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Find the scan script — check multiple locations
    const locations = [
      join(homedir(), 'based-command-center', 'scripts', 'email-scan.mjs'),
      '/tmp/based-email-app/scan-local.mjs',
    ];
    
    let scriptPath = locations.find(p => existsSync(p));
    
    if (!scriptPath) {
      return NextResponse.json({ success: false, error: 'Scanner script not found' }, { status: 404 });
    }

    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
      timeout: 120000,
      env: { ...process.env, PATH: process.env.PATH + ':/opt/homebrew/bin:/usr/local/bin' },
    });

    return NextResponse.json({
      success: true,
      output: stdout.trim(),
      warnings: stderr ? stderr.trim() : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message,
      stdout: e.stdout?.toString().slice(0, 500),
      stderr: e.stderr?.toString().slice(0, 500),
    }, { status: 500 });
  }
}
