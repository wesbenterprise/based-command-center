import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = 'wesbenterprise';

export async function POST(req: NextRequest) {
  try {
    const { repo, branch } = await req.json();

    if (!repo || !branch) {
      return NextResponse.json({ error: 'repo and branch required' }, { status: 400 });
    }

    // Get repo default branch
    const { data: repoData } = await octokit.repos.get({ owner: OWNER, repo });
    const base = repoData.default_branch || 'main';

    // Merge the branch into main
    const { data: merge } = await octokit.repos.merge({
      owner: OWNER,
      repo,
      base,
      head: branch,
      commit_message: `Merge ${branch} to ${base} — pushed to live via BASeD Command Center`,
    });

    return NextResponse.json({
      success: true,
      sha: merge.sha?.slice(0, 7),
      message: `Merged ${branch} → ${base}. Vercel auto-deploying.`,
    });
  } catch (error: any) {
    // Handle merge conflicts
    if (error.status === 409) {
      return NextResponse.json(
        { error: 'Merge conflict detected. Manual resolution needed.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
