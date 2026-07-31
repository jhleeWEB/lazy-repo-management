export type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  total_private_repos?: number;
};

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  language: string | null;
  updated_at: string;
  pushed_at: string | null;
  size: number;
  default_branch: string;
  html_url: string;
  stargazers_count: number;
  owner: {
    login: string;
    avatar_url: string;
  };
};

const API_ROOT = "https://api.github.com";

async function githubFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : "GitHub 요청을 처리하지 못했습니다.";
    throw new Error(
      response.status === 401
        ? "토큰을 확인해 주세요."
        : response.status === 403
          ? "저장소 삭제 권한이 있는 토큰이 필요합니다."
          : message,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getViewer(token: string) {
  return githubFetch<GitHubUser>("/user", token);
}

export async function getRepositories(token: string) {
  const repositories: GitHubRepository[] = [];

  for (let page = 1; page <= 5; page += 1) {
    const batch = await githubFetch<GitHubRepository[]>(
      `/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner`,
      token,
    );
    repositories.push(...batch);
    if (batch.length < 100) break;
  }

  return repositories;
}

export function setRepositoryArchived(
  fullName: string,
  archived: boolean,
  token: string,
) {
  return githubFetch<GitHubRepository>(
    `/repos/${encodeURIComponent(fullName).replace("%2F", "/")}`,
    token,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    },
  );
}

export function deleteRepository(fullName: string, token: string) {
  return githubFetch<void>(
    `/repos/${encodeURIComponent(fullName).replace("%2F", "/")}`,
    token,
    { method: "DELETE" },
  );
}
