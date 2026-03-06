import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = 'wesbenterprise';

export async function GET() {
  try {
    const { data: repos } = await octokit.repos.listForUser({
      username: OWNER,
      sort: 'pushed',
      per_page: 100,
    });

    const repoData = await Promise.all(
      repos.map(async (repo) => {
        // Get branches with unmerged commits
        try {
          const { data: branches } = await octokit.repos.listBranches({
            owner: OWNER,
            repo: repo.name,
            per_page: 20,
          });

          const unmerged = [];
          for (const branch of branches) {
            if (branch.name === 'main' || branch.name === 'master') continue;
            try {
              const { data: comparison } = await octokit.repos.compareCommits({
                owner: OWNER,
                repo: repo.name,
                base: repo.default_branch || 'main',
                head: branch.name,
              });
              if (comparison.ahead_by > 0) {
                unmerged.push({
                  name: branch.name,
                  ahead: comparison.ahead_by,
                  behind: comparison.behind_by,
                });
              }
            } catch {
              // Skip branches that can't be compared
            }
          }

          return {
            name: repo.name,
            full_name: repo.full_name,
            default_branch: repo.default_branch,
            pushed_at: repo.pushed_at,
            html_url: repo.html_url,
            homepage: repo.homepage || null,
            unmerged_branches: unmerged,
          };
        } catch {
          return {
            name: repo.name,
            full_name: repo.full_name,
            default_branch: repo.default_branch,
            pushed_at: repo.pushed_at,
            html_url: repo.html_url,
            homepage: repo.homepage || null,
            unmerged_branches: [],
          };
        }
      })
    );

    // Return all repos, sorted: unmerged first, then clean
    repoData.sort((a, b) => {
      if (a.unmerged_branches.length > 0 && b.unmerged_branches.length === 0) return -1;
      if (a.unmerged_branches.length === 0 && b.unmerged_branches.length > 0) return 1;
      return new Date(b.pushed_at || 0).getTime() - new Date(a.pushed_at || 0).getTime();
    });

    return NextResponse.json(repoData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
