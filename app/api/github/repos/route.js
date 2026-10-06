import { Octokit } from "@octokit/rest";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  if (
    !process.env.GITHUB_ID ||
    !process.env.GITHUB_SECRET ||
    !process.env.NEXTAUTH_SECRET
  ) {
    return NextResponse.json(
      { error: "github_auth_not_configured" },
      { status: 503 },
    );
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.githubAccessToken) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  try {
    const octokit = new Octokit({ auth: token.githubAccessToken });
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const repositories = await octokit.paginate(
      octokit.rest.repos.listForUser,
      {
        username: user.login,
        type: "owner",
        sort: "updated",
        per_page: 100,
      },
    );

    return NextResponse.json({
      user: {
        login: user.login,
        avatarUrl: user.avatar_url,
      },
      repositories: repositories
        .filter((repository) => !repository.private)
        .map((repository) => ({
          id: repository.id,
          name: repository.name,
          description: repository.description,
          htmlUrl: repository.html_url,
          homepage: repository.homepage,
          language: repository.language,
          stars: repository.stargazers_count,
          forks: repository.forks_count,
          updatedAt: repository.updated_at,
          topics: repository.topics,
        })),
    });
  } catch (error) {
    if (error.status === 401) {
      return NextResponse.json(
        { error: "github_authorization_expired" },
        { status: 401 },
      );
    }

    console.error("GitHub repository import failed:", error);
    return NextResponse.json(
      { error: "github_request_failed" },
      { status: 502 },
    );
  }
}
