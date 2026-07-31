"use client";

import {
  Archive,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  ExternalLink,
  GitBranch,
  Inbox,
  KeyRound,
  LayoutGrid,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type RepoFilter,
  type ViewName,
  useRepoStore,
} from "@/store/useRepoStore";

const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  CSS: "#663399",
  HTML: "#e34c26",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
};

function timeAgo(date: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000),
  );
  if (days === 0) return "오늘 업데이트";
  if (days === 1) return "어제 업데이트";
  if (days < 30) return `${days}일 전 업데이트`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전 업데이트`;
  return `${Math.floor(days / 365)}년 전 업데이트`;
}

function formatSize(size: number) {
  if (size < 1024) return `${size} KB`;
  return `${(size / 1024).toFixed(1)} MB`;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export default function Home() {
  const store = useRepoStore();
  const [connectOpen, setConnectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [oauthWorking, setOauthWorking] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    store.hydrate();
    // The store action is stable for the lifetime of the app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    const oauthFailure = params.get("error_description") ?? params.get("error");

    if (oauthFailure) {
      queueMicrotask(() => {
        setConnectOpen(true);
        setOauthError(oauthFailure);
      });
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    if (!code) return;

    const expectedState = sessionStorage.getItem("reposweep:oauth-state");
    const verifier = sessionStorage.getItem("reposweep:oauth-verifier");
    const redirectUri = sessionStorage.getItem("reposweep:oauth-redirect");
    const bridgeUrl = process.env.NEXT_PUBLIC_OAUTH_BRIDGE_URL;

    queueMicrotask(() => {
      setConnectOpen(true);
      setOauthWorking(true);
    });

    async function finishOAuth() {
      try {
        if (!returnedState || returnedState !== expectedState || !verifier || !redirectUri) {
          throw new Error("OAuth 요청 검증에 실패했습니다. 다시 로그인해 주세요.");
        }
        if (!bridgeUrl) {
          throw new Error("OAuth 인증 서버가 설정되지 않았습니다.");
        }

        const response = await fetch(`${bridgeUrl.replace(/\/$/, "")}/api/oauth/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            code_verifier: verifier,
            redirect_uri: redirectUri,
          }),
        });
        const payload = (await response.json()) as {
          access_token?: string;
          error?: string;
        };
        if (!response.ok || !payload.access_token) {
          throw new Error(payload.error ?? "GitHub 로그인에 실패했습니다.");
        }

        await useRepoStore.getState().connect(payload.access_token);
        setConnectOpen(false);
        setToast("GitHub 계정이 안전하게 연결되었습니다.");
      } catch (error) {
        setOauthError(
          error instanceof Error ? error.message : "GitHub 로그인에 실패했습니다.",
        );
      } finally {
        sessionStorage.removeItem("reposweep:oauth-state");
        sessionStorage.removeItem("reposweep:oauth-verifier");
        sessionStorage.removeItem("reposweep:oauth-redirect");
        window.history.replaceState({}, "", redirectUri ?? window.location.pathname);
        setOauthWorking(false);
      }
    }

    void finishOAuth();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleRepos = useMemo(() => {
    const archivedView = store.view === "archive";
    return store.repos
      .filter((repo) => repo.archived === archivedView)
      .filter((repo) => {
        if (store.filter === "public") return !repo.private;
        if (store.filter === "private") return repo.private;
        if (store.filter === "fork") return repo.fork;
        return true;
      })
      .filter((repo) =>
        repo.full_name.toLowerCase().includes(store.query.toLowerCase()),
      );
  }, [store.repos, store.view, store.filter, store.query]);

  const archivedCount = store.repos.filter((repo) => repo.archived).length;
  const selectedAll =
    visibleRepos.length > 0 &&
    visibleRepos.every((repo) => store.selected.includes(repo.full_name));

  async function handleConnect() {
    setOauthError(null);
    const clientId = process.env.NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID;
    if (!clientId) {
      setOauthError("OAuth Client ID가 설정되지 않았습니다.");
      return;
    }

    const random = crypto.getRandomValues(new Uint8Array(32));
    const verifier = toBase64Url(random);
    const challenge = toBase64Url(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
      ),
    );
    const state = toBase64Url(crypto.getRandomValues(new Uint8Array(24)));
    const redirectUri = `${window.location.origin}${window.location.pathname}`;

    sessionStorage.setItem("reposweep:oauth-state", state);
    sessionStorage.setItem("reposweep:oauth-verifier", verifier);
    sessionStorage.setItem("reposweep:oauth-redirect", redirectUri);

    const params = new URLSearchParams({
      client_id: clientId,
      code_challenge: challenge,
      code_challenge_method: "S256",
      redirect_uri: redirectUri,
      scope: "repo delete_repo",
      state,
    });
    window.location.assign(`https://github.com/login/oauth/authorize?${params}`);
  }

  async function handleArchive() {
    const count = store.selected.length;
    const result = await store.archiveSelected();
    if (result.succeeded.length) {
      setToast(`${count}개 저장소를 아카이브로 옮겼습니다.`);
    }
  }

  async function handleRestore() {
    const count = store.selected.length;
    const result = await store.restoreSelected();
    if (result.succeeded.length) {
      setToast(`${count}개 저장소를 복원했습니다.`);
    }
  }

  async function handleDelete() {
    const count = store.selected.length;
    const result = await store.deleteSelected();
    setDeleteOpen(false);
    setConfirmText("");
    if (result.succeeded.length) {
      setToast(`${count}개 저장소를 완전히 삭제했습니다.`);
    }
  }

  function moveTo(view: ViewName) {
    store.setView(view);
    setMobileNav(false);
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Trash2 size={17} strokeWidth={2.3} />
          </span>
          <span>RepoSweep</span>
          <button
            className="mobile-close"
            aria-label="메뉴 닫기"
            onClick={() => setMobileNav(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="main-nav" aria-label="주요 메뉴">
          <button
            className={store.view === "repositories" ? "active" : ""}
            onClick={() => moveTo("repositories")}
          >
            <LayoutGrid size={18} />
            저장소
            <span>{store.repos.filter((repo) => !repo.archived).length}</span>
          </button>
          <button
            className={store.view === "archive" ? "active" : ""}
            onClick={() => moveTo("archive")}
          >
            <Archive size={18} />
            아카이브
            <span>{archivedCount}</span>
          </button>
          <button
            className={store.view === "activity" ? "active" : ""}
            onClick={() => moveTo("activity")}
          >
            <BarChart3 size={18} />
            사용 기록
          </button>
        </nav>

        <div className="sidebar-tip">
          <span className="tip-icon">
            <Sparkles size={16} />
          </span>
          <strong>안전한 2단계 삭제</strong>
          <p>먼저 아카이브한 뒤, 원할 때만 영구 삭제하세요.</p>
          <button onClick={() => moveTo("archive")}>
            아카이브 보기 <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="sidebar-bottom">
          <button className="sidebar-link">
            <CircleHelp size={17} /> 도움말
          </button>
          <div className="account-card">
            <span className="avatar">
              {store.user?.avatar_url ? (
                <img src={store.user.avatar_url} alt="" />
              ) : (
                <GitBranch size={18} />
              )}
            </span>
            <div>
              <strong>{store.user?.name || store.user?.login || "체험 계정"}</strong>
              <span>{store.demo ? "데모 데이터" : `@${store.user?.login}`}</span>
            </div>
            {store.demo ? (
              <button
                aria-label="GitHub 연결"
                onClick={() => setConnectOpen(true)}
              >
                <ExternalLink size={16} />
              </button>
            ) : (
              <button aria-label="연결 해제" onClick={store.disconnect}>
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="nav-backdrop"
          aria-label="메뉴 닫기"
          onClick={() => setMobileNav(false)}
        />
      )}

      <section className="workspace">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="메뉴 열기"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>내 GitHub</span>
            <span>/</span>
            <strong>
              {store.view === "repositories"
                ? "저장소"
                : store.view === "archive"
                  ? "아카이브"
                  : "사용 기록"}
            </strong>
          </div>
          <div className="top-actions">
            {store.demo && <span className="demo-pill">체험 모드</span>}
            <button
              className="icon-button"
              aria-label="새로고침"
              onClick={store.refresh}
            >
              <RefreshCw size={17} className={store.loading ? "spin" : ""} />
            </button>
            <button
              className="connect-button"
              onClick={() => setConnectOpen(true)}
            >
              <GitBranch size={17} />
              {store.demo ? "GitHub 연결" : "연결 관리"}
            </button>
          </div>
        </header>

        <div className="content">
          {store.view === "activity" ? (
            <ActivityView
              visits={store.stats.visits}
              archived={store.stats.archived}
              restored={store.stats.restored}
              deleted={store.stats.deleted}
              currentArchived={archivedCount}
            />
          ) : (
            <>
              <section className="hero-row">
                <div>
                  <span className="eyebrow">
                    {store.view === "archive" ? "ARCHIVE" : "REPOSITORIES"}
                  </span>
                  <h1>
                    {store.view === "archive"
                      ? "잠시 치워둔 저장소"
                      : "지울 레포, 한 번에 정리하세요."}
                  </h1>
                  <p>
                    {store.view === "archive"
                      ? "복원하거나, 필요 없는 저장소를 완전히 비울 수 있어요."
                      : "일일이 설정에 들어갈 필요 없이 고르고 아카이브하면 끝."}
                  </p>
                </div>
                <div className="hero-stat">
                  <span>
                    {store.view === "archive" ? "보관 중" : "선택 가능"}
                  </span>
                  <strong>
                    {store.view === "archive"
                      ? archivedCount
                      : store.repos.filter((repo) => !repo.archived).length}
                  </strong>
                  <small>repositories</small>
                </div>
              </section>

              {store.demo && (
                <section className="connect-banner">
                  <div className="connect-banner-icon">
                    <GitBranch size={22} />
                  </div>
                  <div>
                    <strong>지금은 체험 데이터로 보고 있어요</strong>
                    <p>GitHub를 연결하면 내 저장소를 바로 불러옵니다.</p>
                  </div>
                  <button onClick={() => setConnectOpen(true)}>
                    1분 만에 연결 <ArrowUpRight size={16} />
                  </button>
                </section>
              )}

              <section className="repo-panel">
                <div className="repo-toolbar">
                  <label className="search-box">
                    <Search size={17} />
                    <input
                      value={store.query}
                      onChange={(event) => store.setQuery(event.target.value)}
                      placeholder="저장소 이름 검색"
                    />
                    <kbd>⌘ K</kbd>
                  </label>
                  <FilterSelect
                    value={store.filter}
                    onChange={store.setFilter}
                  />
                  <button className="sort-button">
                    최근 업데이트순 <ChevronDown size={15} />
                  </button>
                </div>

                <div className="selection-row">
                  <label className="check-control">
                    <input
                      type="checkbox"
                      checked={selectedAll}
                      onChange={() =>
                        store.setSelected(
                          selectedAll
                            ? []
                            : visibleRepos.map((repo) => repo.full_name),
                        )
                      }
                    />
                    <span>
                      {store.selected.length
                        ? `${store.selected.length}개 선택`
                        : "전체 선택"}
                    </span>
                  </label>
                  <span className="result-count">{visibleRepos.length}개 저장소</span>
                  {store.selected.length > 0 && (
                    <div className="batch-actions">
                      {store.view === "archive" ? (
                        <>
                          <button
                            className="restore-button"
                            onClick={handleRestore}
                            disabled={store.loading}
                          >
                            <RotateCcw size={15} /> 복원
                          </button>
                          <button
                            className="danger-button"
                            onClick={() => setDeleteOpen(true)}
                            disabled={store.loading}
                          >
                            <Trash2 size={15} /> 완전 삭제
                          </button>
                        </>
                      ) : (
                        <button
                          className="archive-button"
                          onClick={handleArchive}
                          disabled={store.loading}
                        >
                          {store.loading ? (
                            <LoaderCircle className="spin" size={15} />
                          ) : (
                            <Archive size={15} />
                          )}
                          아카이브로 이동
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="repo-list">
                  {visibleRepos.length ? (
                    visibleRepos.map((repo) => (
                      <article
                        className={`repo-row ${
                          store.selected.includes(repo.full_name)
                            ? "selected"
                            : ""
                        }`}
                        key={repo.id}
                      >
                        <label className="repo-check">
                          <input
                            type="checkbox"
                            checked={store.selected.includes(repo.full_name)}
                            onChange={() => store.toggleSelected(repo.full_name)}
                            aria-label={`${repo.full_name} 선택`}
                          />
                        </label>
                        <div className="repo-icon">
                          {repo.private ? (
                            <LockKeyhole size={19} />
                          ) : (
                            <Inbox size={19} />
                          )}
                        </div>
                        <div className="repo-main">
                          <div className="repo-title">
                            <strong>{repo.name}</strong>
                            <span className={repo.private ? "private" : "public"}>
                              {repo.private ? "Private" : "Public"}
                            </span>
                            {repo.fork && <span className="fork">Fork</span>}
                          </div>
                          <div className="repo-meta">
                            <span>{repo.owner.login}</span>
                            {repo.language && (
                              <span>
                                <i
                                  style={{
                                    background:
                                      languageColors[repo.language] ?? "#8b949e",
                                  }}
                                />
                                {repo.language}
                              </span>
                            )}
                            <span>{formatSize(repo.size)}</span>
                          </div>
                        </div>
                        <div className="repo-date">
                          <Clock3 size={14} />
                          {timeAgo(repo.updated_at)}
                        </div>
                        <a
                          className="repo-link"
                          href={repo.html_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${repo.name} GitHub에서 열기`}
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button className="repo-more" aria-label="더 보기">
                          <MoreHorizontal size={18} />
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="empty-state">
                      <span>
                        {store.view === "archive" ? (
                          <Archive size={24} />
                        ) : (
                          <Search size={24} />
                        )}
                      </span>
                      <strong>
                        {store.view === "archive"
                          ? "아카이브가 비어 있어요"
                          : "조건에 맞는 저장소가 없어요"}
                      </strong>
                      <p>
                        {store.view === "archive"
                          ? "저장소 탭에서 정리할 레포를 먼저 아카이브해 보세요."
                          : "검색어나 필터를 바꿔보세요."}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <p className="privacy-note">
                <ShieldCheck size={15} />
                토큰은 현재 탭에만 보관되며 GitHub API 요청에만 사용됩니다.
              </p>
            </>
          )}
        </div>
      </section>

      {connectOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal connect-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-title"
          >
            <button
              className="modal-close"
              aria-label="닫기"
              onClick={() => setConnectOpen(false)}
            >
              <X size={19} />
            </button>
            <span className="modal-icon">
              <GitBranch size={25} />
            </span>
            <h2 id="connect-title">내 GitHub 연결하기</h2>
            <p className="modal-copy">
              GitHub 공식 인증 화면에서 로그인합니다. 비밀번호나 개인 토큰을
              RepoSweep에 직접 입력하지 않아요.
            </p>
            <div className="permission-card">
              <span>
                <KeyRound size={18} />
              </span>
              <div>
                <strong>요청하는 GitHub 권한</strong>
                <p>
                  저장소 관리(repo) · 관리자 저장소 삭제(delete_repo)
                </p>
              </div>
            </div>
            <button
              className="primary-submit"
              type="button"
              onClick={handleConnect}
              disabled={oauthWorking || store.loading}
            >
              {oauthWorking || store.loading ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <GitBranch size={17} />
              )}
              {oauthWorking ? "GitHub 인증 확인 중" : "GitHub로 계속하기"}
            </button>
            {(oauthError || store.error) && (
              <p className="form-error">{oauthError ?? store.error}</p>
            )}
            <a
              className="token-link"
              href="https://docs.github.com/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps"
              target="_blank"
              rel="noreferrer"
            >
              요청 권한 자세히 보기 <ArrowUpRight size={15} />
            </a>
          </section>
        </div>
      )}

      {deleteOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <button
              className="modal-close"
              aria-label="닫기"
              onClick={() => {
                setDeleteOpen(false);
                setConfirmText("");
              }}
            >
              <X size={19} />
            </button>
            <span className="modal-icon danger">
              <Trash2 size={24} />
            </span>
            <h2 id="delete-title">
              {store.selected.length}개 저장소를 완전히 삭제할까요?
            </h2>
            <p className="modal-copy">
              GitHub에서도 즉시 삭제되며 되돌릴 수 없습니다. 계속하려면 아래에{" "}
              <strong>완전 삭제</strong>를 입력하세요.
            </p>
            <div className="delete-list">
              {store.selected.slice(0, 3).map((name) => (
                <span key={name}>
                  <Check size={13} /> {name}
                </span>
              ))}
              {store.selected.length > 3 && (
                <span>외 {store.selected.length - 3}개</span>
              )}
            </div>
            <label htmlFor="delete-confirm">확인 문구</label>
            <input
              id="delete-confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="완전 삭제"
              autoComplete="off"
            />
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setDeleteOpen(false);
                  setConfirmText("");
                }}
              >
                취소
              </button>
              <button
                className="confirm-delete"
                disabled={confirmText !== "완전 삭제" || store.loading}
                onClick={handleDelete}
              >
                {store.loading ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
                영구 삭제하기
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </main>
  );
}

function FilterSelect({
  value,
  onChange,
}: {
  value: RepoFilter;
  onChange: (value: RepoFilter) => void;
}) {
  return (
    <label className="filter-select">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as RepoFilter)}
        aria-label="저장소 공개 범위"
      >
        <option value="all">전체 유형</option>
        <option value="public">Public</option>
        <option value="private">Private</option>
        <option value="fork">Fork</option>
      </select>
      <ChevronDown size={15} />
    </label>
  );
}

function ActivityView({
  visits,
  archived,
  restored,
  deleted,
  currentArchived,
}: {
  visits: number;
  archived: number;
  restored: number;
  deleted: number;
  currentArchived: number;
}) {
  const cards = [
    {
      label: "방문 세션",
      value: visits,
      note: "이 기기 기준",
      icon: LayoutGrid,
      tone: "lime",
    },
    {
      label: "누적 아카이브",
      value: archived,
      note: `현재 ${currentArchived}개 보관 중`,
      icon: Archive,
      tone: "lavender",
    },
    {
      label: "누적 복원",
      value: restored,
      note: "다시 활성화한 저장소",
      icon: RotateCcw,
      tone: "blue",
    },
    {
      label: "완전 삭제",
      value: deleted,
      note: "되돌릴 수 없는 작업",
      icon: Trash2,
      tone: "coral",
    },
  ];

  return (
    <>
      <section className="hero-row activity-hero">
        <div>
          <span className="eyebrow">LOCAL INSIGHTS</span>
          <h1>내 정리 기록</h1>
          <p>별도 서버 없이 이 브라우저에만 안전하게 기록됩니다.</p>
        </div>
        <span className="local-badge">
          <ShieldCheck size={16} /> 이 기기 전용
        </span>
      </section>
      <section className="stats-grid">
        {cards.map(({ label, value, note, icon: Icon, tone }) => (
          <article className={`stat-card ${tone}`} key={label}>
            <span className="stat-icon">
              <Icon size={19} />
            </span>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </section>
      <section className="activity-panel">
        <div>
          <span className="activity-mark">
            <ShieldCheck size={22} />
          </span>
          <h2>개인정보를 모으지 않는 통계</h2>
          <p>
            방문 수와 작업 횟수는 현재 기기의 localStorage에만 저장됩니다.
            중앙 서버나 데이터베이스가 없어서 다른 사용자와 합산되지 않습니다.
          </p>
        </div>
        <div className="activity-bars">
          <div>
            <span>아카이브</span>
            <i>
              <b style={{ width: `${Math.min(100, archived * 12)}%` }} />
            </i>
            <strong>{archived}</strong>
          </div>
          <div>
            <span>복원</span>
            <i>
              <b style={{ width: `${Math.min(100, restored * 12)}%` }} />
            </i>
            <strong>{restored}</strong>
          </div>
          <div>
            <span>완전 삭제</span>
            <i>
              <b style={{ width: `${Math.min(100, deleted * 12)}%` }} />
            </i>
            <strong>{deleted}</strong>
          </div>
        </div>
      </section>
    </>
  );
}
