"use client";

import { create } from "zustand";
import {
  deleteRepository,
  getRepositories,
  getViewer,
  setRepositoryArchived,
  type GitHubRepository,
  type GitHubUser,
} from "@/lib/github";

export type ViewName = "repositories" | "archive" | "activity";
export type RepoFilter = "all" | "public" | "private" | "fork";

type UsageStats = {
  visits: number;
  archived: number;
  restored: number;
  deleted: number;
};

type OperationResult = {
  succeeded: string[];
  failed: string[];
};

type RepoState = {
  token: string | null;
  user: GitHubUser | null;
  repos: GitHubRepository[];
  selected: string[];
  view: ViewName;
  filter: RepoFilter;
  query: string;
  loading: boolean;
  hydrated: boolean;
  demo: boolean;
  error: string | null;
  stats: UsageStats;
  hydrate: () => void;
  refreshStats: () => Promise<void>;
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  setView: (view: ViewName) => void;
  setFilter: (filter: RepoFilter) => void;
  setQuery: (query: string) => void;
  toggleSelected: (fullName: string) => void;
  setSelected: (fullNames: string[]) => void;
  clearSelected: () => void;
  archiveSelected: () => Promise<OperationResult>;
  restoreSelected: () => Promise<OperationResult>;
  deleteSelected: () => Promise<OperationResult>;
};

const demoRepos: GitHubRepository[] = [
  {
    id: 1,
    name: "portfolio-v1",
    full_name: "jhleeWEB/portfolio-v1",
    private: false,
    fork: false,
    archived: false,
    language: "TypeScript",
    updated_at: "2026-07-29T08:18:00Z",
    pushed_at: "2026-07-29T08:18:00Z",
    size: 1340,
    default_branch: "main",
    html_url: "https://github.com/",
    stargazers_count: 2,
    owner: { login: "jhleeWEB", avatar_url: "" },
  },
  {
    id: 2,
    name: "next-dashboard-test",
    full_name: "jhleeWEB/next-dashboard-test",
    private: true,
    fork: false,
    archived: false,
    language: "TypeScript",
    updated_at: "2026-06-14T02:42:00Z",
    pushed_at: "2026-06-14T02:42:00Z",
    size: 4280,
    default_branch: "main",
    html_url: "https://github.com/",
    stargazers_count: 0,
    owner: { login: "jhleeWEB", avatar_url: "" },
  },
  {
    id: 3,
    name: "css-playground",
    full_name: "jhleeWEB/css-playground",
    private: false,
    fork: false,
    archived: false,
    language: "CSS",
    updated_at: "2025-12-02T12:10:00Z",
    pushed_at: "2025-12-02T12:10:00Z",
    size: 728,
    default_branch: "main",
    html_url: "https://github.com/",
    stargazers_count: 1,
    owner: { login: "jhleeWEB", avatar_url: "" },
  },
  {
    id: 4,
    name: "react-hooks-study",
    full_name: "jhleeWEB/react-hooks-study",
    private: false,
    fork: false,
    archived: true,
    language: "JavaScript",
    updated_at: "2025-03-18T07:22:00Z",
    pushed_at: "2025-03-18T07:22:00Z",
    size: 2160,
    default_branch: "main",
    html_url: "https://github.com/",
    stargazers_count: 0,
    owner: { login: "jhleeWEB", avatar_url: "" },
  },
  {
    id: 5,
    name: "weather-widget-old",
    full_name: "jhleeWEB/weather-widget-old",
    private: true,
    fork: false,
    archived: true,
    language: "JavaScript",
    updated_at: "2024-09-04T15:00:00Z",
    pushed_at: "2024-09-04T15:00:00Z",
    size: 940,
    default_branch: "master",
    html_url: "https://github.com/",
    stargazers_count: 0,
    owner: { login: "jhleeWEB", avatar_url: "" },
  },
];

const defaultStats: UsageStats = {
  visits: 0,
  archived: 0,
  restored: 0,
  deleted: 0,
};

function trackRepositoryEvents(eventName: string, count: number) {
  const tracker = (window as Window & {
    umami?: { track: (name: string) => void };
  }).umami;
  for (let index = 0; index < count; index += 1) {
    tracker?.track(eventName);
  }
}

async function fetchGlobalStats() {
  const bridgeUrl = process.env.NEXT_PUBLIC_OAUTH_BRIDGE_URL;
  if (!bridgeUrl) return null;
  const response = await fetch(`${bridgeUrl.replace(/\/$/, "")}/api/stats`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  return (await response.json()) as UsageStats;
}

async function incrementGlobalStat(
  metric: keyof UsageStats,
  count: number,
  visitorId?: string,
) {
  if (count < 1) return;
  const bridgeUrl = process.env.NEXT_PUBLIC_OAUTH_BRIDGE_URL;
  if (!bridgeUrl) return;
  const response = await fetch(`${bridgeUrl.replace(/\/$/, "")}/api/stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metric, count, visitorId }),
  });
  if (!response.ok) throw new Error("Global stats update failed.");
}

async function runOperation(
  names: string[],
  task: (fullName: string) => Promise<unknown>,
) {
  const settled = await Promise.allSettled(names.map(task));
  return settled.reduce<OperationResult>(
    (result, item, index) => {
      result[item.status === "fulfilled" ? "succeeded" : "failed"].push(
        names[index],
      );
      return result;
    },
    { succeeded: [], failed: [] },
  );
}

export const useRepoStore = create<RepoState>((set, get) => ({
  token: null,
  user: null,
  repos: demoRepos,
  selected: [],
  view: "repositories",
  filter: "all",
  query: "",
  loading: false,
  hydrated: false,
  demo: true,
  error: null,
  stats: defaultStats,

  hydrate: () => {
    if (get().hydrated) return;
    const token = sessionStorage.getItem("reposweep:token");
    set({ token, hydrated: true });
    void get().refreshStats();
    if (token) void get().refresh();
  },

  refreshStats: async () => {
    try {
      let visitorId = localStorage.getItem("reposweep:visitor-id");
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("reposweep:visitor-id", visitorId);
      }
      await incrementGlobalStat("visits", 1, visitorId);
      const stats = await fetchGlobalStats();
      if (stats) set({ stats });
    } catch {
      // Public totals are optional; repository management must keep working.
    }
  },

  connect: async (token) => {
    set({ loading: true, error: null });
    try {
      const [user, repos] = await Promise.all([
        getViewer(token),
        getRepositories(token),
      ]);
      sessionStorage.setItem("reposweep:token", token);
      set({
        token,
        user,
        repos,
        demo: false,
        loading: false,
        selected: [],
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "연결에 실패했습니다.",
      });
      throw error;
    }
  },

  disconnect: () => {
    sessionStorage.removeItem("reposweep:token");
    set({
      token: null,
      user: null,
      repos: demoRepos,
      demo: true,
      selected: [],
      view: "repositories",
      error: null,
    });
  },

  refresh: async () => {
    const { token } = get();
    if (!token) return;
    set({ loading: true, error: null });
    try {
      const [user, repos] = await Promise.all([
        getViewer(token),
        getRepositories(token),
      ]);
      set({ user, repos, demo: false, loading: false });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "저장소를 불러오지 못했습니다.",
      });
    }
  },

  setView: (view) => set({ view, selected: [], query: "", filter: "all" }),
  setFilter: (filter) => set({ filter, selected: [] }),
  setQuery: (query) => set({ query, selected: [] }),
  toggleSelected: (fullName) =>
    set((state) => ({
      selected: state.selected.includes(fullName)
        ? state.selected.filter((name) => name !== fullName)
        : [...state.selected, fullName],
    })),
  setSelected: (selected) => set({ selected }),
  clearSelected: () => set({ selected: [] }),

  archiveSelected: async () => {
    const { selected, token, demo } = get();
    set({ loading: true, error: null });
    const result = demo
      ? { succeeded: selected, failed: [] }
      : await runOperation(selected, (name) =>
          setRepositoryArchived(name, true, token!),
        );
    trackRepositoryEvents("repo_archived", result.succeeded.length);
    void incrementGlobalStat("archived", result.succeeded.length).catch(() => undefined);
    set((state) => ({
      repos: state.repos.map((repo) =>
        result.succeeded.includes(repo.full_name)
          ? { ...repo, archived: true }
          : repo,
      ),
      stats: {
        ...state.stats,
        archived: state.stats.archived + result.succeeded.length,
      },
      selected: [],
      loading: false,
      error: result.failed.length
        ? `${result.failed.length}개 저장소를 아카이브하지 못했습니다.`
        : null,
    }));
    return result;
  },

  restoreSelected: async () => {
    const { selected, token, demo } = get();
    set({ loading: true, error: null });
    const result = demo
      ? { succeeded: selected, failed: [] }
      : await runOperation(selected, (name) =>
          setRepositoryArchived(name, false, token!),
        );
    trackRepositoryEvents("repo_restored", result.succeeded.length);
    void incrementGlobalStat("restored", result.succeeded.length).catch(() => undefined);
    set((state) => ({
      repos: state.repos.map((repo) =>
        result.succeeded.includes(repo.full_name)
          ? { ...repo, archived: false }
          : repo,
      ),
      stats: {
        ...state.stats,
        restored: state.stats.restored + result.succeeded.length,
      },
      selected: [],
      loading: false,
      error: result.failed.length
        ? `${result.failed.length}개 저장소를 복원하지 못했습니다.`
        : null,
    }));
    return result;
  },

  deleteSelected: async () => {
    const { selected, token, demo } = get();
    set({ loading: true, error: null });
    const result = demo
      ? { succeeded: selected, failed: [] }
      : await runOperation(selected, (name) => deleteRepository(name, token!));
    trackRepositoryEvents("repo_deleted", result.succeeded.length);
    void incrementGlobalStat("deleted", result.succeeded.length).catch(() => undefined);
    set((state) => ({
      repos: state.repos.filter(
        (repo) => !result.succeeded.includes(repo.full_name),
      ),
      stats: {
        ...state.stats,
        deleted: state.stats.deleted + result.succeeded.length,
      },
      selected: [],
      loading: false,
      error: result.failed.length
        ? `${result.failed.length}개 저장소를 삭제하지 못했습니다. 권한을 확인해 주세요.`
        : null,
    }));
    return result;
  },
}));
