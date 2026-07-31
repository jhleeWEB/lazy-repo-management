"use client";

import {
  Archive, Check, ExternalLink, GitBranch, Globe2, LoaderCircle,
  LockKeyhole, LogOut, RefreshCw, RotateCcw, Search, Trash2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  interpolate, localeOptions, resolveLocale, translations, type Locale,
} from "@/lib/i18n";
import { type RepoFilter, type ViewName, useRepoStore } from "@/store/useRepoStore";

const languageColors: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", CSS: "#663399",
  HTML: "#e34c26", Python: "#3572a5", Java: "#b07219",
  Go: "#00add8", Rust: "#dea584",
};

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function relativeDate(date: string, locale: Locale) {
  const days = Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(days) < 30) return formatter.format(days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return formatter.format(months, "month");
  return formatter.format(Math.round(months / 12), "year");
}

function LanguagePicker({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  return (
    <label className="language-picker">
      <Globe2 size={15} />
      <span className="sr-only">{translations[locale].language}</span>
      <select value={locale} onChange={(event) => onChange(event.target.value as Locale)} aria-label={translations[locale].language}>
        {localeOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
      </select>
    </label>
  );
}

export default function Home() {
  const store = useRepoStore();
  const [locale, setLocale] = useState<Locale>("ko");
  const [localeReady, setLocaleReady] = useState(false);
  const [oauthWorking, setOauthWorking] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const t = translations[locale];

  useEffect(() => {
    const nextLocale = resolveLocale(localStorage.getItem("reposweep:locale") ?? navigator.language);
    queueMicrotask(() => {
      setLocale(nextLocale);
      setLocaleReady(true);
    });
    document.documentElement.lang = nextLocale;
    store.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    const oauthFailure = params.get("error_description") ?? params.get("error");
    const activeCopy = translations[resolveLocale(localStorage.getItem("reposweep:locale") ?? navigator.language)];

    if (oauthFailure) {
      queueMicrotask(() => setOauthError(oauthFailure));
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    if (!code) return;

    const expectedState = sessionStorage.getItem("reposweep:oauth-state");
    const verifier = sessionStorage.getItem("reposweep:oauth-verifier");
    const redirectUri = sessionStorage.getItem("reposweep:oauth-redirect");
    const bridgeUrl = process.env.NEXT_PUBLIC_OAUTH_BRIDGE_URL;
    queueMicrotask(() => setOauthWorking(true));

    async function finishOAuth() {
      try {
        if (!returnedState || returnedState !== expectedState || !verifier || !redirectUri) throw new Error(activeCopy.loginError);
        if (!bridgeUrl) throw new Error(activeCopy.oauthConfig);
        const response = await fetch(`${bridgeUrl.replace(/\/$/, "")}/api/oauth/github`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, code_verifier: verifier, redirect_uri: redirectUri }),
        });
        const payload = (await response.json()) as { access_token?: string; error?: string };
        if (!response.ok || !payload.access_token) throw new Error(payload.error ?? activeCopy.loginError);
        await useRepoStore.getState().connect(payload.access_token);
      } catch (error) {
        setOauthError(error instanceof Error ? error.message : activeCopy.loginError);
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
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    localStorage.setItem("reposweep:locale", nextLocale);
    document.documentElement.lang = nextLocale;
  }

  async function handleConnect() {
    setOauthError(null);
    const clientId = process.env.NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID;
    if (!clientId) { setOauthError(t.oauthConfig); return; }
    const verifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    const challenge = toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
    const state = toBase64Url(crypto.getRandomValues(new Uint8Array(24)));
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    sessionStorage.setItem("reposweep:oauth-state", state);
    sessionStorage.setItem("reposweep:oauth-verifier", verifier);
    sessionStorage.setItem("reposweep:oauth-redirect", redirectUri);
    const params = new URLSearchParams({ client_id: clientId, code_challenge: challenge, code_challenge_method: "S256", redirect_uri: redirectUri, scope: "repo delete_repo", state });
    window.location.assign(`https://github.com/login/oauth/authorize?${params}`);
  }

  const archivedView = store.view === "archive";
  const visibleRepos = useMemo(() => store.repos
    .filter((repo) => repo.archived === archivedView)
    .filter((repo) => store.filter === "public" ? !repo.private : store.filter === "private" ? repo.private : store.filter === "fork" ? repo.fork : true)
    .filter((repo) => repo.full_name.toLowerCase().includes(store.query.toLowerCase()))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
  [archivedView, store.filter, store.query, store.repos]);

  const selectedAll = visibleRepos.length > 0 && visibleRepos.every((repo) => store.selected.includes(repo.full_name));

  async function handleArchive() {
    const result = await store.archiveSelected();
    if (result.succeeded.length) setToast(interpolate(t.toastArchived, { count: result.succeeded.length }));
  }
  async function handleRestore() {
    const result = await store.restoreSelected();
    if (result.succeeded.length) setToast(interpolate(t.toastRestored, { count: result.succeeded.length }));
  }
  async function handleDelete() {
    const result = await store.deleteSelected();
    setDeleteOpen(false); setConfirmText("");
    if (result.succeeded.length) setToast(interpolate(t.toastDeleted, { count: result.succeeded.length }));
  }
  function moveTo(view: ViewName) { store.setView(view); }

  if (!localeReady || !store.hydrated || (store.token && store.demo && store.loading)) {
    return <main className="loading-screen" aria-live="polite"><LoaderCircle className="spin" size={22} /></main>;
  }

  if (store.demo) {
    return (
      <main className="login-screen">
        <div className="login-language"><LanguagePicker locale={locale} onChange={changeLocale} /></div>
        <section className="login-card">
          <div className="login-brand"><span><Trash2 size={22} /></span>RepoSweep</div>
          <p className="kicker">{t.loginKicker}</p>
          <h1>{t.loginTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
          <p className="login-copy">{t.loginBody}</p>
          <button className="github-login" type="button" onClick={handleConnect} disabled={oauthWorking || store.loading}>
            {oauthWorking || store.loading ? <LoaderCircle className="spin" size={19} /> : <GitBranch size={19} />}
            {oauthWorking ? t.loginWorking : t.loginButton}
          </button>
          {oauthError && <p className="error-message">{oauthError}</p>}
          <p className="permission-note"><LockKeyhole size={14} />{t.loginPermissions}</p>
        </section>
        <p className="login-stamp">NO DB · NO PASSWORD · LESS CLICKING</p>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="app-header">
        <button className="wordmark" onClick={() => moveTo("repositories")} aria-label="RepoSweep"><span><Trash2 size={17} /></span>RepoSweep</button>
        <nav className="tabs" aria-label="RepoSweep">
          <button className={store.view === "repositories" ? "active" : ""} onClick={() => moveTo("repositories")}>{t.repositories}</button>
          <button className={store.view === "archive" ? "active" : ""} onClick={() => moveTo("archive")}>{t.archive}<b>{store.repos.filter((repo) => repo.archived).length}</b></button>
          <button className={store.view === "activity" ? "active" : ""} onClick={() => moveTo("activity")}>{t.stats}</button>
        </nav>
        <div className="header-actions">
          <LanguagePicker locale={locale} onChange={changeLocale} />
          <button className="icon-action" onClick={store.refresh} aria-label={t.refresh} title={t.refresh}><RefreshCw size={16} className={store.loading ? "spin" : ""} /></button>
          <button className="avatar-button" onClick={store.disconnect} aria-label={t.logout} title={t.logout}>
            {store.user?.avatar_url ? <Image src={store.user.avatar_url} alt="" width={34} height={34} unoptimized /> : <LogOut size={16} />}
          </button>
        </div>
      </header>

      <section className="content-shell">
        <div className="intro">
          <p className="kicker">{interpolate(t.hello, { name: store.user?.name || store.user?.login || "GitHub" })}</p>
          <h1>{store.view === "activity" ? t.stats : store.view === "archive" ? t.archiveTitle : t.repoTitle}</h1>
          <p>{store.view === "activity" ? t.statsLocal : store.view === "archive" ? t.archiveSubtitle : t.repoSubtitle}</p>
        </div>

        {store.view === "activity" ? (
          <section className="stats-panel">
            {[[t.statsVisits, store.stats.visits], [t.statsArchived, store.stats.archived], [t.statsRestored, store.stats.restored], [t.statsDeleted, store.stats.deleted]].map(([label, value], index) => (
              <article key={String(label)} data-index={index}><span>{label}</span><strong>{value}</strong></article>
            ))}
            <p>{t.statsLocal}</p>
          </section>
        ) : (
          <>
            <section className="toolbar">
              <label className="search"><Search size={17} /><input value={store.query} onChange={(event) => store.setQuery(event.target.value)} placeholder={t.search} /></label>
              <select className="filter" value={store.filter} onChange={(event) => store.setFilter(event.target.value as RepoFilter)} aria-label={t.filterAll}>
                <option value="all">{t.filterAll}</option><option value="public">{t.filterPublic}</option><option value="private">{t.filterPrivate}</option><option value="fork">{t.filterFork}</option>
              </select>
            </section>

            <section className="repo-card">
              <div className="select-bar">
                <label><input type="checkbox" checked={selectedAll} onChange={(event) => store.setSelected(event.target.checked ? visibleRepos.map((repo) => repo.full_name) : [])} />{t.selectAll}</label>
                <span>{interpolate(t.selected, { count: store.selected.length })}</span>
              </div>
              <div className="repo-list">
                {visibleRepos.length ? visibleRepos.map((repo) => (
                  <label className={`repo-row ${store.selected.includes(repo.full_name) ? "selected" : ""}`} key={repo.id}>
                    <input type="checkbox" checked={store.selected.includes(repo.full_name)} onChange={() => store.toggleSelected(repo.full_name)} />
                    <span className="repo-glyph">{repo.archived ? <Archive size={17} /> : repo.private ? <LockKeyhole size={17} /> : <GitBranch size={17} />}</span>
                    <span className="repo-main"><strong>{repo.name}</strong><small>{repo.full_name}</small></span>
                    <span className="repo-tags"><i>{repo.private ? t.private : t.public}</i>{repo.fork && <i>{t.fork}</i>}</span>
                    <span className="repo-language"><b style={{ background: languageColors[repo.language ?? ""] ?? "#8c959f" }} />{repo.language ?? "—"}</span>
                    <span className="repo-date">{relativeDate(repo.updated_at, locale)}</span>
                    <a href={repo.html_url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={repo.full_name}><ExternalLink size={16} /></a>
                  </label>
                )) : <div className="empty"><Trash2 size={24} /><strong>{archivedView ? t.emptyArchive : t.emptyRepos}</strong></div>}
              </div>
            </section>

            {store.selected.length > 0 && (
              <div className="action-dock">
                <strong>{interpolate(t.selected, { count: store.selected.length })}</strong>
                {archivedView ? <>
                  <button onClick={handleRestore} disabled={store.loading}><RotateCcw size={16} />{t.restoreAction}</button>
                  <button className="danger" onClick={() => setDeleteOpen(true)} disabled={store.loading}><Trash2 size={16} />{t.deleteAction}</button>
                </> : <button onClick={handleArchive} disabled={store.loading}><Archive size={16} />{t.archiveAction}</button>}
              </div>
            )}
          </>
        )}
        {store.error && <p className="page-error">{t.errorGeneric}</p>}
      </section>

      {deleteOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <span className="danger-mark"><Trash2 size={22} /></span>
            <h2 id="delete-title">{t.deleteTitle}</h2><p>{t.deleteBody}</p>
            <div className="delete-names">{store.selected.slice(0, 4).map((name) => <span key={name}>{name}</span>)}{store.selected.length > 4 && <span>+{store.selected.length - 4}</span>}</div>
            <label>{t.deleteLabel}<input autoFocus value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder={t.deletePlaceholder} /></label>
            <div className="modal-actions">
              <button onClick={() => { setDeleteOpen(false); setConfirmText(""); }}>{t.deleteCancel}</button>
              <button className="danger" onClick={handleDelete} disabled={confirmText !== "DELETE" || store.loading}>{store.loading ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{t.deleteConfirm}</button>
            </div>
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </main>
  );
}