import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowDownToLine, ArrowRight, ArrowUp, BookOpen, Check, ChevronDown,
  Database, FileOutput, FileSpreadsheet, FileText, Headphones, KeyRound, LogOut, MessageSquare,
  Phone, Plus, RefreshCw, Search, Send, Settings2, ShieldCheck, Sparkles, Trash2, UserRound,
  UsersRound, WandSparkles, X,
} from "lucide-react";
import { Sun, Moon } from "lucide-react";
import "./styles.css";

const api = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: { ...(options.body instanceof FormData ? {} : { "content-type": "application/json" }), ...options.headers },
  });
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const body = contentType.includes("application/json") ? await response.json() : null;
    throw new Error(body?.error || `Request failed (${response.status}).`);
  }

function Checklist({ items, onChange }) {
  const [text, setText] = useState("");
  function add() {
    const t = text.trim();
    if (!t) return;
    const next = [...items, { id: Date.now(), text: t, done: false }];
    onChange(next); setText("");
  }
  function toggle(id) { onChange(items.map(i => i.id === id ? { ...i, done: !i.done } : i)); }
  function remove(id) { onChange(items.filter(i => i.id !== id)); }
  return (
    <div>
      <ul>
        {items.map((it) => <li key={it.id}><label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} /><span className={it.done ? 'done' : ''}>{it.text}</span><button style={{ marginLeft: 'auto' }} onClick={() => remove(it.id)} aria-label="Remove">✕</button></label></li>)}
      </ul>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add checklist item" />
        <button className="primary-button" onClick={add}>Add</button>
      </div>
    </div>
  );
}
  return contentType.includes("application/json") ? response.json() : response;
};

function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
      <div>
        <div className="brand-name">ELYANO<span> AI</span></div>
        {!compact && <div className="brand-subtitle">YOUR WORKDAY, IN GOOD HANDS</div>}
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div className="splash">
      <div className="splash-orbit orbit-one" /><div className="splash-orbit orbit-two" />
      <div className="splash-core"><Sparkles size={30} /></div>
      <div className="splash-word">ELYANO</div>
      <div className="splash-caption">Agent · Mustafa Elyan</div>
      <div className="splash-progress"><span /></div>
    </div>
  );
}

function Login({ onSuccess, setupRequired }) {
  const [username, setUsername] = useState(setupRequired ? "admin" : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api(setupRequired ? "/api/setup" : "/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onSuccess(result.user);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-a" /><div className="auth-glow auth-glow-b" />
      <section className="auth-card">
        <div className="auth-brand"><Logo /></div>
        <div className="auth-kicker"><span className="status-dot" /> PRIVATE WORKSPACE ASSISTANT</div>
        <h1>{setupRequired ? "Create your admin account" : "A smarter way to work."}</h1>
        <p className="auth-intro">{setupRequired
          ? "Set a strong password to initialize Elyano Agent. This account controls users and the agent's learned knowledge."
          : "Sign in with your hospital account or a local account created by your administrator."}</p>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="username">Username</label>
          <div className="input-with-icon"><UserRound size={17} /><input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></div>
          <div className="label-row"><label htmlFor="password">Password</label>{!setupRequired && <span>AD or local account</span>}</div>
          <div className="input-with-icon"><ShieldCheck size={17} /><input id="password" type="password" autoComplete={setupRequired ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={setupRequired ? 12 : undefined} required /></div>
          {setupRequired && <div className="field-hint">Use at least 12 characters. Avoid a shared or default password.</div>}
          <button className="primary-button auth-submit" disabled={busy}>{busy ? <span className="spinner" /> : <>{setupRequired ? "Create administrator" : "Sign in"} <ArrowRight size={17} /></>}</button>
        </form>
        <div className="auth-foot"><ShieldCheck size={15} /> Encrypted session · No local AI model required</div>
      </section>
      <footer className="copyright">ELYANO AGENT <span>·</span> CREATED BY MUSTAFA ELYAN</footer>
    </main>
  );
}

const navItems = [
  { id: "chat", title: "Assistant", icon: MessageSquare, subtitle: "Ask and get things done" },
  { id: "documents", title: "Documents", icon: FileOutput, subtitle: "Create or convert files" },
  { id: "directory", title: "Directory", icon: Phone, subtitle: "Find a hospital extension" },
];

function App() {
  const [user, setUser] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [starting, setStarting] = useState(true);
  const [startupError, setStartupError] = useState("");
  const [section, setSection] = useState("chat");
  const [providers, setProviders] = useState(null);
  const [provider, setProvider] = useState("gemini");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [pageError, setPageError] = useState("");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [contacts, setContacts] = useState([]);
  const [directoryBusy, setDirectoryBusy] = useState(false);
  const [knowledge, setKnowledge] = useState([]);
  const [users, setUsers] = useState([]);
  const [toolStatus, setToolStatus] = useState(null);
  const [maxUploadMb, setMaxUploadMb] = useState(40);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("elyano_theme") || "dark");
  const [checklist, setChecklist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("elyano_checklist") || "[]"); } catch { return []; }
  });
  const chatEndRef = useRef(null);

  const loadProviders = useCallback(async () => {
    const result = await api("/api/providers");
    setProviders(result.providers);
    setToolStatus(result.tools);
    setMaxUploadMb(result.maxUploadMb);
    if (!result.providers.gemini.configured && result.providers.deepseek.configured) setProvider("deepseek");
  }, []);

  useEffect(() => {
    // Apply theme on mount
    document.body.classList.toggle("light-theme", theme === "light");
    localStorage.setItem("elyano_theme", theme);
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem("elyano_checklist", JSON.stringify(checklist)); } catch { }
  }, [checklist]);
  useEffect(() => {
    let active = true;
    let splashTimer;
    const startedAt = Date.now();
    const finishLoading = (activeUser, needsSetup) => {
      splashTimer = window.setTimeout(() => {
        if (!active) return;
        setUser(activeUser);
        setSetupRequired(needsSetup);
        setStarting(false);
      }, Math.max(0, 900 - (Date.now() - startedAt)));
    };
    Promise.all([
      api("/api/me").then((result) => result.user).catch(() => null),
      api("/api/setup/status").then((result) => result.setupRequired),
    ]).then(([activeUser, needsSetup]) => {
      if (active) finishLoading(activeUser, needsSetup);
    }).catch((error) => {
      if (!active) return;
      setStartupError(error.message || "The agent service could not be reached.");
      finishLoading(null, false);
    });
    return () => { active = false; window.clearTimeout(splashTimer); };
  }, []);

  useEffect(() => {
    if (!user) return;
    loadProviders().catch((error) => setPageError(error.message));
  }, [user, loadProviders]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function sendMessage(text = draft) {
    const content = text.trim();
    if (!content || pending) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setPageError("");
    setPending(true);
    try {
      const result = await api("/api/chat", { method: "POST", body: JSON.stringify({ provider, messages: next.slice(-24) }) });
      setMessages((current) => [...current, { role: "assistant", content: result.text, context: result.context, contextWarning: result.contextWarning }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", error: error.message }]);
    } finally {
      setPending(false);
    }
  }

  async function searchDirectory(event) {
    event?.preventDefault();
    const query = directoryQuery.trim();
    if (!query) return;
    setDirectoryBusy(true);
    setPageError("");
    try {
      const result = await api(`/api/directory?q=${encodeURIComponent(query)}`);
      setContacts(result.contacts || []);
    } catch (error) {
      setPageError(error.message);
      setContacts([]);
    } finally {
      setDirectoryBusy(false);
    }
  }

  async function logout() {
    try { await api("/api/logout", { method: "POST", body: "{}" }); } catch (error) { setPageError(error.message); }
    setUser(null);
    setMessages([]);
  }

  if (starting) return <Splash />;
  if (startupError) return <main className="auth-screen"><section className="auth-card"><Logo /><h1>Unable to connect</h1><p className="auth-intro">{startupError}</p><button className="primary-button auth-submit" onClick={() => window.location.reload()}>Retry <ArrowRight size={16} /></button></section><footer className="copyright">ELYANO AGENT · CREATED BY MUSTAFA ELYAN</footer></main>;
  if (!user) return <Login setupRequired={setupRequired} onSuccess={(nextUser) => { setUser(nextUser); setSetupRequired(false); }} />;

  const configuredProviders = Object.entries(providers || {}).filter(([, value]) => value.configured);
  const admin = user.role === "admin";
  const heading = section === "chat" ? "How can I help today?" : section === "documents" ? "Make documents work for you." : section === "directory" ? "Find the right person." : "Agent administration";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand"><Logo /></div>
        <button className="new-chat" onClick={() => { setSection("chat"); setMessages([]); setMobileNavOpen(false); }}><Plus size={17} /> New conversation</button>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ id, title, subtitle, icon: Icon }) => (
            <button key={id} className={`nav-item ${section === id ? "active" : ""}`} onClick={() => { setSection(id); setMobileNavOpen(false); }}>
              <Icon size={18} /><span><strong>{title}</strong><small>{subtitle}</small></span>
            </button>
          ))}
        </nav>
        {admin && <div className="admin-nav">
          <div className="nav-caption">CONTROL ROOM</div>
          <button className={`nav-item ${section === "admin" ? "active" : ""}`} onClick={() => { setSection("admin"); setMobileNavOpen(false); }}>
            <Settings2 size={18} /><span><strong>Admin & learning</strong><small>Teach and manage users</small></span>
          </button>
        </div>}
        <div className="shortcuts-panel">
          <h3>Shortcuts</h3>
          <div className="shortcut-item" role="button" onClick={() => { setSection("chat"); setMobileNavOpen(false); }}><MessageSquare size={14} /> Assistant</div>
          <div className="shortcut-item" role="button" onClick={() => { setSection("documents"); setMobileNavOpen(false); }}><FileOutput size={14} /> Documents</div>
          <div className="shortcut-item" role="button" onClick={() => { setSection("directory"); setMobileNavOpen(false); }}><Phone size={14} /> Directory</div>
          <div className="shortcut-item" role="button" onClick={() => { setSection("admin"); setMobileNavOpen(false); }}><Settings2 size={14} /> Admin</div>
        </div>

        <div className="daily-checklist">
          <h4>Daily checklist</h4>
          <Checklist items={checklist} onChange={setChecklist} />
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><Headphones size={16} /><span>Here for your workday</span></div>
          <div className="account-row"><div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div><div className="account-info"><strong>{user.username}</strong><small>{admin ? "Administrator" : user.source === "ldap" ? "Hospital account" : "Local account"}</small></div><button className="icon-button logout-button" title="Sign out" onClick={logout}><LogOut size={17} /></button></div>
          <div className="sidebar-copyright">© Mustafa Elyan</div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNavOpen((open) => !open)} aria-label="Toggle navigation"><ChevronDown size={20} /></button>
          <div className="topbar-brand"><Logo compact /></div>
          <div className="secure-label"><span className="status-dot" /> Private workspace</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="theme-toggle" onClick={() => setTheme((t) => t === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">{theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}</button>
            <button className="user-pill" onClick={logout} title="Sign out"><span className="avatar avatar-small">{user.username.slice(0, 1).toUpperCase()}</span><span>{user.username}</span><LogOut size={15} /></button>
          </div>
        </header>

        <div className="content-scroll">
          {pageError && <div className="error-banner page-error"><span>{pageError}</span><button className="icon-button" onClick={() => setPageError("")}><X size={16} /></button></div>}
          {section === "chat" && <ChatSection
            heading={heading} messages={messages} pending={pending} draft={draft} setDraft={setDraft}
            sendMessage={sendMessage} chatEndRef={chatEndRef} providers={providers} provider={provider}
            setProvider={setProvider} configuredProviders={configuredProviders}
          />}
          {section === "documents" && <DocumentsSection providers={configuredProviders} provider={provider} setProvider={setProvider} tools={toolStatus} maxUploadMb={maxUploadMb} />}
          {section === "directory" && <DirectorySection query={directoryQuery} setQuery={setDirectoryQuery} contacts={contacts} busy={directoryBusy} search={searchDirectory} />}
          {section === "admin" && admin && <AdminSection knowledge={knowledge} setKnowledge={setKnowledge} users={users} setUsers={setUsers} provider={provider} onSettingsSaved={loadProviders} onPasswordChanged={() => setUser(null)} />}
        </div>
        <footer className="main-footer"><span>Elyano Agent</span><span>·</span><span>Created by Mustafa Elyan</span><span className="footer-safe"><ShieldCheck size={13} /> Handle sensitive information with care</span></footer>
      </main>
    </div>
  );
}

function ChatSection({ heading, messages, pending, draft, setDraft, sendMessage, chatEndRef, providers, provider, setProvider, configuredProviders }) {
  const starters = [
    ["Fix a technical issue", "Help me troubleshoot: "],
    ["Find a department number", "What is the phone number for "],
    ["Automate a repetitive task", "Help me automate this repetitive task: "],
  ];
  return (
    <section className={`chat-layout ${messages.length ? "has-messages" : ""}`}>
      <div className="quick-actions">
        <button className="quick-action" onClick={() => sendMessage('Create a short document: ')}><FileText size={14} /> New brief</button>
        <button className="quick-action" onClick={() => setTimeout(() => document.getElementById('file-input')?.click(), 100)}><FileSpreadsheet size={14} /> Convert</button>
        <button className="quick-action" onClick={() => { /* focus admin tab if allowed */ window.dispatchEvent(new CustomEvent('open-admin-teach')); }}><BookOpen size={14} /> Teach</button>
        <button className="quick-action" onClick={() => setTimeout(() => document.querySelector('.directory-search input')?.focus(), 100)}><Phone size={14} /> Directory</button>
      </div>
      {!messages.length ? <div className="welcome-panel">
        <div className="welcome-glyph"><WandSparkles size={24} /></div>
        <div className="eyebrow">YOUR PRACTICAL AI PARTNER</div>
        <h1>{heading}</h1>
        <p>Get technical guidance, look up hospital extensions, or turn a repetitive task into a simple workflow.</p>
        {!configuredProviders.length && <div className="info-note provider-missing">An administrator must configure Gemini or DeepSeek on the server before AI chat is available.</div>}
        <div className="starter-grid">
          {starters.map(([title, prompt], index) => {
            const Icon = [Headphones, Phone, Activity][index];
            return <button className="starter-card" key={title} onClick={() => sendMessage(prompt)}><Icon size={18} /><span>{title}</span><ArrowRight size={15} /></button>;
          })}
        </div>
      </div> : <div className="conversation">
        {messages.map((message, index) => <div className={`message-row ${message.role}`} key={`${index}-${message.role}`}>
          <div className={`message-avatar ${message.role}`}>{message.role === "assistant" ? <Sparkles size={16} /> : <UserRound size={16} />}</div>
          <div className="message-body"><div className="message-author">{message.role === "assistant" ? "Elyano Agent" : "You"}</div>
            {message.error ? <div className="error-inline">{message.error}</div> : <div className="message-text">{message.content}</div>}
            {message.context && (message.context.contacts || message.context.knowledge || message.context.itStaff || message.context.infoBotAnswer) ? <div className="context-note"><Check size={13} /> Used verified Elyano Connect directory, on-duty IT, or Information Bot context</div> : null}
            {message.contextWarning && <div className="context-warning">{message.contextWarning}</div>}
          </div>
        </div>)}
        {pending && <div className="message-row assistant"><div className="message-avatar assistant"><Sparkles size={16} /></div><div className="message-body"><div className="message-author">Elyano Agent</div><div className="typing-indicator"><i /><i /><i /></div></div></div>}
        <div ref={chatEndRef} />
      </div>}
      <div className="composer-wrap">
        <form className="composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
          <textarea aria-label="Message Elyano Agent" placeholder="Tell me what you need help with…" rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} />
          <button type="submit" className="send-button" disabled={pending || !draft.trim() || !configuredProviders.length} aria-label="Send message"><ArrowUp size={19} /></button>
        </form>
        <div className="composer-meta"><span><ShieldCheck size={13} /> Avoid sharing passwords or patient-identifying information</span>
          <label className="provider-select" title="Choose a configured cloud AI provider">
            <span>AI</span><select value={provider} onChange={(event) => setProvider(event.target.value)} disabled={!configuredProviders.length}>
              {configuredProviders.map(([key, value]) => <option value={key} key={key}>{key === "gemini" ? "Gemini" : "DeepSeek"} · {value.model}</option>)}
              {!configuredProviders.length && <option value="gemini">No provider configured</option>}
            </select><ChevronDown size={13} />
          </label>
        </div>
      </div>
    </section>
  );
}

function DocumentsSection({ providers, provider, setProvider, tools, maxUploadMb }) {
  const [instructions, setInstructions] = useState("");
  const [instructionFile, setInstructionFile] = useState(null);
  const instructionInputRef = useRef(null);
  const [workbookFile, setWorkbookFile] = useState(null);
  const [workbookInstructions, setWorkbookInstructions] = useState("");
  const [transforming, setTransforming] = useState(false);
  const workbookInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [type, setType] = useState("xlsx");
  const [generating, setGenerating] = useState(false);
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("pdf");
  const [converting, setConverting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const maxSize = `${maxUploadMb} MB`;
  const options = type === "xlsx"
    ? ["Excel workbook", "A staff rota with shifts, staff names, dates, and totals.", "A monthly inventory tracker with opening stock, added items, used items, closing balance, and restock flag."]
    : ["Word document", "A one-page IT troubleshooting guide for staff.", "Meeting minutes with sections for attendees, agenda, decisions, and action owners."];
  const formats = ["pdf", "docx", "xlsx", "odt", "rtf", "txt", "html", "csv", "pptx", "ods"];

  async function generate(event) {
    event.preventDefault();
    setGenerating(true); setError(""); setNotice("");
    try {
      let completeInstructions = instructions.trim();
      if (instructionFile) {
        if (instructionFile.size > 256 * 1024) throw new Error("Instruction files must be smaller than 256 KB.");
        const uploadedText = (await instructionFile.text()).trim();
        if (!uploadedText) throw new Error("The uploaded instruction file is empty.");
        completeInstructions = [completeInstructions, `Uploaded instruction file:\n${uploadedText}`].filter(Boolean).join("\n\n");
      }
      if (completeInstructions.length > 8000) throw new Error("Combined instructions must be no longer than 8,000 characters.");
      if (completeInstructions.length < 5) throw new Error("Add instructions or upload a text file.");
      const result = await api("/api/generate-document", { method: "POST", body: JSON.stringify({ type, provider, instructions: completeInstructions }) });
      setInstructionFile(null);
      if (instructionInputRef.current) instructionInputRef.current.value = "";
      setNotice(`${result.filename} is ready.`);
      window.location.assign(result.downloadUrl);
    } catch (failure) { setError(failure.message); }
    finally { setGenerating(false); }
  }

  async function convert(event) {
    event.preventDefault();
    if (!file) { setError("Choose a file first."); return; }
    setConverting(true); setError(""); setNotice("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("format", format);
      const result = await api("/api/convert", { method: "POST", body: form });
      setNotice(`${result.filename} is ready (${(result.outputBytes / 1024 / 1024).toFixed(1)} MB).`);
      window.location.assign(result.downloadUrl);
    } catch (failure) { setError(failure.message); }
    finally { setConverting(false); }
  }

  async function transformWorkbook(event) {
    event.preventDefault();
    if (!workbookFile) { setError("Choose an .xlsx workbook to automate."); return; }
    setTransforming(true); setError(""); setNotice("");
    try {
      const form = new FormData();
      form.append("file", workbookFile);
      form.append("instructions", workbookInstructions);
      form.append("provider", provider);
      const result = await api("/api/transform-workbook", { method: "POST", body: form });
      setNotice(`${result.filename} is ready. ${result.changedCells} cell change(s), ${result.removedRows} row(s) removed.`);
      window.location.assign(result.downloadUrl);
    } catch (failure) { setError(failure.message); }
    finally { setTransforming(false); }
  }

  return (
    <section className="page-section">
      <div className="page-heading"><div className="eyebrow">DOCUMENT STUDIO</div><h1>Make documents work for you.</h1><p>Describe the result you need, or convert an existing office file.</p></div>
      {error && <div className="error-banner">{error}</div>}{notice && <div className="success-banner"><Check size={16} />{notice}</div>}
      {!providers.length && <div className="info-note provider-missing">Document drafting needs an administrator-configured Gemini or DeepSeek API key. File conversion works independently.</div>}
      <div className="document-grid">
        <article className="surface-card create-card">
          <div className="card-heading"><div className="card-icon teal"><WandSparkles size={20} /></div><div><h2>Create from instructions</h2><p>Turn a brief into an editable office file.</p></div></div>
          <form onSubmit={generate} className="stack-form">
            <label>File type</label>
            <div className="segmented">
              <button type="button" className={type === "xlsx" ? "selected" : ""} onClick={() => setType("xlsx")}><FileSpreadsheet size={16} /> Excel</button>
              <button type="button" className={type === "docx" ? "selected" : ""} onClick={() => setType("docx")}><FileText size={16} /> Word</button>
            </div>
            <label htmlFor="doc-instructions">What should it contain?</label>
            <textarea id="doc-instructions" rows={5} value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder={options[1]} maxLength={8000} required={!instructionFile} />
            <label className="instruction-upload" htmlFor="instruction-file">Or upload text instructions (.txt or .md, max 256 KB){instructionFile && <span>{instructionFile.name}</span>}</label>
            <input id="instruction-file" ref={instructionInputRef} className="hidden-file-input" type="file" accept=".txt,.md,text/plain,text/markdown" onChange={(event) => setInstructionFile(event.target.files?.[0] || null)} />
            <div className="prompt-chips">{options.slice(1).map((prompt) => <button type="button" key={prompt} onClick={() => setInstructions(prompt)}>{prompt.slice(0, 48)}…</button>)}</div>
            <label>Cloud provider</label>
            <select value={provider} onChange={(event) => setProvider(event.target.value)} disabled={!providers.length} className="form-select">
              {providers.map(([key]) => <option key={key} value={key}>{key === "gemini" ? "Google Gemini" : "DeepSeek"}</option>)}
              {!providers.length && <option>No provider configured</option>}
            </select>
            <button className="primary-button" disabled={generating || !providers.length}>{generating ? <><span className="spinner" /> Building your file…</> : <>Create {options[0]} <ArrowRight size={16} /></>}</button>
          </form>
        </article>
        <article className="surface-card convert-card">
          <div className="card-heading"><div className="card-icon blue"><FileOutput size={20} /></div><div><h2>Convert or compress</h2><p>Files are processed on this server and deleted after conversion.</p></div></div>
          <form onSubmit={convert} className="stack-form">
            <label htmlFor="file-input">Choose a file</label>
            <label className={`file-drop ${file ? "has-file" : ""}`} htmlFor="file-input">
              <input id="file-input" type="file" ref={fileInputRef} onChange={(event) => setFile(event.target.files?.[0] || null)} />
              {file ? <><Check size={22} /><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(1)} MB · up to {maxSize}</span></> : <><ArrowDownToLine size={22} /><strong>Choose a file to convert</strong><span>Office documents · up to {maxSize}</span></>}
            </label>
            <label htmlFor="target-format">Output format</label>
            <select id="target-format" value={format} onChange={(event) => setFormat(event.target.value)} className="form-select">
              {formats.map((ext) => <option key={ext} value={ext}>{ext.toUpperCase()}</option>)}
            </select>
            {file?.name.toLowerCase().endsWith(".pdf") && format === "pdf" && <div className="info-note">PDF to PDF uses Ghostscript compression when installed.</div>}
            <button className="secondary-button" disabled={converting || !file}>{converting ? <><span className="spinner" /> Converting…</> : <>Convert file <ArrowRight size={16} /></>}</button>
          </form>
          <div className="tool-requirements"><strong>VM converter status</strong><div><span className={tools?.libreOffice ? "status-dot" : "status-dot offline"} /> LibreOffice <span>{tools?.libreOffice ? "Ready" : "Not installed"}</span></div><div><span className={tools?.ghostscript ? "status-dot" : "status-dot offline"} /> Ghostscript <span>{tools?.ghostscript ? "Ready" : "Not installed"}</span></div></div>
        </article>
        <article className="surface-card workflow-card">
          <div className="card-heading"><div className="card-icon purple"><WandSparkles size={20} /></div><div><h2>Automate an Excel task</h2><p>Apply a repeatable cleanup to a copy of your workbook.</p></div></div>
          <form onSubmit={transformWorkbook} className="stack-form">
            <label htmlFor="workflow-file">Excel workbook (.xlsx)</label>
            <label className="instruction-upload" htmlFor="workflow-file">Choose workbook {workbookFile && <span>{workbookFile.name} · {(workbookFile.size / 1024 / 1024).toFixed(1)} MB</span>}</label>
            <input id="workflow-file" ref={workbookInputRef} className="hidden-file-input" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setWorkbookFile(event.target.files?.[0] || null)} />
            <label htmlFor="workflow-instructions">What should I do?</label>
            <textarea id="workflow-instructions" rows={3} maxLength={4000} value={workbookInstructions} onChange={(event) => setWorkbookInstructions(event.target.value)} placeholder="For example: trim extra spaces, remove completely blank rows, and remove duplicates using Employee ID." required />
            <label>Cloud provider</label>
            <select value={provider} onChange={(event) => setProvider(event.target.value)} disabled={!providers.length} className="form-select">
              {providers.map(([key]) => <option key={key} value={key}>{key === "gemini" ? "Google Gemini" : "DeepSeek"}</option>)}
              {!providers.length && <option>No provider configured</option>}
            </select>
            <div className="info-note">The AI receives your instructions and first-worksheet column headers only; cell values remain on this server and other worksheets stay unchanged. Supported actions: trim text, remove blank or duplicate rows, fill blanks, normalize case, and rename headers. The original file is not changed; macros and formulas are never executed.</div>
            <button className="primary-button" disabled={transforming || !providers.length || !workbookFile}>{transforming ? <><span className="spinner" /> Applying task…</> : <>Create updated workbook <ArrowRight size={16} /></>}</button>
          </form>
        </article>
      </div>
      <div className="fine-print">Office conversion depends on LibreOffice; PDF compression depends on Ghostscript. Supported formats are listed in the selector. No macro execution.</div>
    </section>
  );
}

function DirectorySection({ query, setQuery, contacts, busy, search }) {
  return (
    <section className="page-section directory-page">
      <div className="page-heading"><div className="eyebrow">HOSPITAL DIRECTORY</div><h1>Find the right person.</h1><p>Search a department or service to get a verified extension from Elyano Connect.</p></div>
      <form className="directory-search" onSubmit={search}><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: Radiology, IT helpdesk, emergency…" aria-label="Search hospital directory" /><button className="primary-button" disabled={busy || !query.trim()}>{busy ? <span className="spinner" /> : <>Search <ArrowRight size={16} /></>}</button></form>
      {!contacts.length ? <div className="directory-empty"><div className="empty-icon"><Phone size={22} /></div><h2>Verified contacts, when you need them.</h2><p>Search for a department, a service, or a location. Elyano Agent only returns matches from the hospital directory.</p></div> : <div className="contact-results">
        <div className="results-caption"><span>{contacts.length} matching contact{contacts.length === 1 ? "" : "s"}</span><span>From Elyano Connect</span></div>
        {contacts.map((contact) => <article className="contact-card" key={contact.id || `${contact.name}-${contact.extension}`}><div className="contact-icon"><Phone size={18} /></div><div className="contact-info"><strong>{contact.name}</strong><span>{contact.department} · {contact.location}</span></div><a href={`tel:${encodeURIComponent(contact.extension)}`} className="extension">{contact.extension}<ArrowRight size={15} /></a></article>)}
      </div>}
    </section>
  );
}

function AdminSection({ knowledge, setKnowledge, users, setUsers, provider, onSettingsSaved, onPasswordChanged }) {
  const [tab, setTab] = useState("learning");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [teachingMessages, setTeachingMessages] = useState([{ role: "assistant", content: "This is the administrator-only teaching conversation. Ask me to draft or clarify a procedure, review my answer, then approve it to add it to the agent's learning." }]);
  const [teachingDraft, setTeachingDraft] = useState("");
  const [teachingBusy, setTeachingBusy] = useState(false);
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [serverSettings, setServerSettings] = useState(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");
  const [clearGeminiKey, setClearGeminiKey] = useState(false);
  const [clearDeepseekKey, setClearDeepseekKey] = useState(false);
  const [defaultProvider, setDefaultProvider] = useState("gemini");
  const [providerFailover, setProviderFailover] = useState(false);
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [geminiLiveModel, setGeminiLiveModel] = useState("gemini-2.5-flash-native-audio-preview-12-2025");
  const [deepseekModel, setDeepseekModel] = useState("deepseek-chat");
  const [ldapUrl, setLdapUrl] = useState("ldap://elitehospital.org:389");
  const [ldapDomain, setLdapDomain] = useState("elitehospital.org");
  const [ldapStartTls, setLdapStartTls] = useState(true);
  const [ldapCaCert, setLdapCaCert] = useState("");
  const [clearLdapCaCert, setClearLdapCaCert] = useState(false);
  const [ldapTestUser, setLdapTestUser] = useState("");
  const [ldapTestPassword, setLdapTestPassword] = useState("");
  const [chatUrl, setChatUrl] = useState("https://localhost:3000");
  const [chatPassword, setChatPassword] = useState("");
  const [clearChatPassword, setClearChatPassword] = useState(false);
  const [chatCaCert, setChatCaCert] = useState("");
  const [clearChatCaCert, setClearChatCaCert] = useState(false);
  const [chatAutoReply, setChatAutoReply] = useState(true);
  const [sqlAuthMode, setSqlAuthMode] = useState("windows");
  const [sqlHost, setSqlHost] = useState("localhost");
  const [sqlPort, setSqlPort] = useState("1433");
  const [sqlDatabase, setSqlDatabase] = useState("EliteHospitalChatDB");
  const [sqlUser, setSqlUser] = useState("sa");
  const [sqlPassword, setSqlPassword] = useState("");
  const [clearSqlPassword, setClearSqlPassword] = useState(false);
  const [sqlEncrypt, setSqlEncrypt] = useState(false);
  const [sqlTrustServerCertificate, setSqlTrustServerCertificate] = useState(false);
  const [pingTargets, setPingTargets] = useState([]);
  const [pingAddress, setPingAddress] = useState("");
  const [pingLabel, setPingLabel] = useState("");
  const [pingBusy, setPingBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [learned, localUsers] = await Promise.all([api("/api/admin/knowledge"), api("/api/admin/users")]);
    setKnowledge(learned.entries);
    setUsers(localUsers.users);
  }, [setKnowledge, setUsers]);
  useEffect(() => { load().catch((failure) => setError(failure.message)); }, [load]);

  const loadAdminSettings = useCallback(async () => {
    const [result, pingResult] = await Promise.all([
      api("/api/admin/settings"),
      api("/api/admin/ping/status"),
    ]);
    setServerSettings(result);
    setDefaultProvider(result.providers.defaultProvider);
    setProviderFailover(result.providers.providerFailover);
    setGeminiModel(result.providers.geminiModel);
    setGeminiLiveModel(result.providers.geminiLiveModel);
    setDeepseekModel(result.providers.deepseekModel);
    setLdapUrl(result.ldap.url);
    setLdapDomain(result.ldap.domain);
    setLdapStartTls(result.ldap.startTls);
    setChatUrl(result.chat.url);
    setChatAutoReply(result.chat.autoReply);
    setSqlAuthMode(result.sql.authMode);
    setSqlHost(result.sql.host);
    setSqlPort(String(result.sql.port));
    setSqlDatabase(result.sql.database);
    setSqlUser(result.sql.user);
    setSqlEncrypt(result.sql.encrypt);
    setSqlTrustServerCertificate(result.sql.trustServerCertificate);
    setPingTargets(pingResult.targets);
  }, []);

  useEffect(() => {
    if (tab === "settings") loadAdminSettings().catch((failure) => setError(failure.message));
  }, [tab, loadAdminSettings]);

  async function saveAdminSettings(event) {
    event.preventDefault();
    setSettingsBusy(true); setError(""); setSuccess("");
    try {
      const ldap = { url: ldapUrl, domain: ldapDomain, startTls: ldapStartTls };
      if (ldapCaCert.trim()) ldap.caCert = ldapCaCert;
      if (clearLdapCaCert) ldap.caCert = "";
      const chat = { url: chatUrl, username: "Agent", autoReply: chatAutoReply };
      if (chatPassword) chat.password = chatPassword;
      if (clearChatPassword) chat.clearPassword = true;
      if (chatCaCert.trim()) chat.caCert = chatCaCert;
      if (clearChatCaCert) chat.caCert = "";
      const sql = {
        authMode: sqlAuthMode,
        host: sqlHost,
        port: Number(sqlPort),
        database: sqlDatabase,
        user: sqlUser,
        encrypt: sqlEncrypt,
        trustServerCertificate: sqlTrustServerCertificate,
      };
      if (sqlPassword) sql.password = sqlPassword;
      if (clearSqlPassword) sql.clearPassword = true;
      const result = await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          providers: {
            geminiApiKey: geminiKey,
            deepseekApiKey: deepseekKey,
            clearGeminiKey,
            clearDeepseekKey,
            geminiModel,
            geminiLiveModel,
            deepseekModel,
            defaultProvider,
            providerFailover,
          },
          ldap,
          chat,
          sql,
        }),
      });
      setServerSettings(result.settings);
      setGeminiKey(""); setDeepseekKey("");
      setChatPassword(""); setChatCaCert(""); setLdapCaCert("");
      setSqlPassword("");
      setClearGeminiKey(false); setClearDeepseekKey(false);
      setClearChatPassword(false); setClearChatCaCert(false); setClearLdapCaCert(false);
      setClearSqlPassword(false);
      await onSettingsSaved();
      setSuccess("Settings saved securely. Check the connection status above and test SQL Server to enable saved learning.");
    } catch (failure) { setError(failure.message); }
    finally { setSettingsBusy(false); }
  }

  async function testLdap(event) {
    event.preventDefault(); setSettingsBusy(true); setError(""); setSuccess("");
    try {
      const result = await api("/api/admin/test-ldap", {
        method: "POST",
        body: JSON.stringify({ username: ldapTestUser, password: ldapTestPassword }),
      });
      setSuccess(result.message); setLdapTestPassword("");
    } catch (failure) { setError(failure.message); }
    finally { setSettingsBusy(false); }
  }

  async function reconnectChat() {
    setSettingsBusy(true); setError(""); setSuccess("");
    try {
      const result = await api("/api/admin/chat/reconnect", { method: "POST", body: "{}" });
      setServerSettings((current) => current ? { ...current, chat: result.connection } : current);
      setSuccess("Reconnection requested. Connection status refreshes automatically.");
    } catch (failure) { setError(failure.message); }
    finally { setSettingsBusy(false); }
  }

  async function testSql() {
    setSettingsBusy(true); setError(""); setSuccess("");
    try {
      const result = await api("/api/admin/test-sql", { method: "POST", body: "{}" });
      setSuccess(`${result.message} ${result.entries} saved learning item(s) available.`);
      await load();
      await loadAdminSettings();
    } catch (failure) {
      setError(failure.message);
      await loadAdminSettings().catch(() => {});
    } finally { setSettingsBusy(false); }
  }

  async function savePingTargets(nextTargets) {
    setPingBusy(true); setError(""); setSuccess("");
    try {
      const result = await api("/api/admin/ping/targets", {
        method: "PUT",
        body: JSON.stringify({ targets: nextTargets }),
      });
      setPingTargets(result.targets);
      setSuccess(`IP monitor saved. Configured targets are checked every ${result.intervalSeconds} seconds.`);
      return true;
    } catch (failure) { setError(failure.message); }
    finally { setPingBusy(false); }
    return false;
  }

  async function addPingTarget(event) {
    event.preventDefault();
    const saved = await savePingTargets([...pingTargets.map(({ ip, label }) => ({ ip, label })), { ip: pingAddress.trim(), label: pingLabel.trim() }]);
    if (saved) {
      setPingAddress("");
      setPingLabel("");
    }
  }

  async function checkPingTarget(ip) {
    setPingBusy(true); setError("");
    try {
      const result = await api("/api/admin/ping/check", {
        method: "POST",
        body: JSON.stringify({ ip }),
      });
      setPingTargets((current) => current.map((target) => target.ip === ip ? { ...target, ...result.target } : target));
      setSuccess(result.target.reachable ? `${ip} responded to ping.` : `${ip} did not respond. The monitor will report its outage to IT.`);
    } catch (failure) { setError(failure.message); }
    finally { setPingBusy(false); }
  }

  useEffect(() => {
    if (tab !== "settings") return undefined;
    const interval = window.setInterval(() => {
      api("/api/admin/chat/status").then((result) => setServerSettings((current) => current ? { ...current, chat: result.connection } : current)).catch(() => {});
      api("/api/admin/sql/status").then((result) => setServerSettings((current) => current ? { ...current, sql: { ...current.sql, ...result.sql } } : current)).catch(() => {});
      api("/api/admin/ping/status").then((result) => setPingTargets(result.targets)).catch(() => {});
    }, 5000);
    return () => window.clearInterval(interval);
  }, [tab]);

  async function submitKnowledge(event) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try { await api("/api/admin/knowledge", { method: "POST", body: JSON.stringify({ title, content }) }); setTitle(""); setContent(""); await load(); setSuccess("The new learning is now available in the agent's responses."); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  async function addUser(event) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try { await api("/api/admin/users", { method: "POST", body: JSON.stringify({ username, password }) }); setUsername(""); setPassword(""); await load(); setSuccess("Local user created. Share the initial password securely."); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  async function changePassword(event) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try { const result = await api("/api/admin/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }); setSuccess(result.message); setCurrentPassword(""); setNewPassword(""); window.setTimeout(onPasswordChanged, 1200); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  async function deleteKnowledge(id) {
    setError(""); setSuccess("");
    try { await api(`/api/admin/knowledge/${id}`, { method: "DELETE", body: "{}" }); await load(); }
    catch (failure) { setError(failure.message); }
  }
  async function sendTeachingMessage(event) {
    event.preventDefault();
    const content = teachingDraft.trim();
    if (!content || teachingBusy) return;
    const next = [...teachingMessages, { role: "user", content }];
    setTeachingMessages(next);
    setTeachingDraft("");
    setTeachingBusy(true);
    setError("");
    try {
      const result = await api("/api/admin/teaching-chat", { method: "POST", body: JSON.stringify({ provider, messages: next.slice(-20) }) });
      setTeachingMessages((current) => [...current, { role: "assistant", content: result.text }]);
    } catch (failure) {
      setTeachingMessages((current) => [...current, { role: "assistant", error: failure.message }]);
    } finally { setTeachingBusy(false); }
  }
  async function approveLastAnswer() {
    const answer = teachingMessages.at(-1);
    const question = teachingMessages.at(-2);
    if (!answer || answer.role !== "assistant" || !question || question.role !== "user" || answer.error) return;
    const title = `Guidance: ${question.content.split(/\r?\n/)[0].slice(0, 100)}`;
    const learnedContent = `Administrator request:\n${question.content}\n\nReviewed agent guidance:\n${answer.content}`;
    if (learnedContent.length > 6000) {
      setError("This answer is too long to save as one learning entry. Ask the agent for a shorter procedure.");
      return;
    }
    setBusy(true); setError(""); setSuccess("");
    try {
      await api("/api/admin/knowledge", { method: "POST", body: JSON.stringify({ title, content: learnedContent }) });
      await load();
      setSuccess("Approved guidance saved to the agent's learning.");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return (
    <section className="page-section admin-page">
      <div className="page-heading"><div className="eyebrow">CONTROL ROOM</div><h1>Admin & learning</h1><p>Teach Elyano Agent trusted information and manage local access.</p></div>
      <div className="admin-tabs">
        <button className={tab === "learning" ? "selected" : ""} onClick={() => setTab("learning")}><BookOpen size={16} /> Agent learning</button>
        <button className={tab === "users" ? "selected" : ""} onClick={() => setTab("users")}><UsersRound size={16} /> Local users</button>
        <button className={tab === "settings" ? "selected" : ""} onClick={() => setTab("settings")}><Settings2 size={16} /> Services & AI</button>
        <button className={tab === "security" ? "selected" : ""} onClick={() => setTab("security")}><ShieldCheck size={16} /> Security</button>
      </div>
      {error && <div className="error-banner">{error}</div>}{success && <div className="success-banner"><Check size={16} />{success}</div>}
      {tab === "learning" && <>
        <section className="surface-card teaching-chat">
          <div className="card-heading"><div className="card-icon purple"><BookOpen size={19} /></div><div><h2>Administrator teaching chat</h2><p>Discuss a procedure with the agent, then explicitly approve its answer before it becomes shared learning.</p></div></div>
          <div className="teaching-thread" aria-live="polite">
            {teachingMessages.map((message, index) => <div className={`teaching-message ${message.role}`} key={`${index}-${message.role}`}><strong>{message.role === "user" ? "Admin" : "Elyano Agent"}</strong><p>{message.error || message.content}</p></div>)}
            {teachingBusy && <div className="teaching-message assistant"><strong>Elyano Agent</strong><p><span className="spinner" /></p></div>}
          </div>
          {teachingMessages.length > 1 && teachingMessages.at(-1)?.role === "assistant" && teachingMessages.at(-2)?.role === "user" && teachingMessages.at(-1)?.content && !teachingMessages.at(-1)?.error && <button className="approve-learning" onClick={approveLastAnswer} disabled={busy}><Check size={15} /> Approve answer & save as learning</button>}
          <form className="teaching-composer" onSubmit={sendTeachingMessage}><textarea value={teachingDraft} onChange={(event) => setTeachingDraft(event.target.value)} rows={2} maxLength={12000} placeholder="Ask about a verified work procedure to draft or refine…" aria-label="Admin teaching message" /><button className="send-button" disabled={teachingBusy || !teachingDraft.trim()} aria-label="Send teaching message"><ArrowUp size={18} /></button></form>
          <div className="teaching-privacy">Admin-only conversation. Review every answer; never teach passwords, patient details, or unverified instructions.</div>
        </section>
        <div className="admin-content-grid">
        <form className="surface-card stack-form" onSubmit={submitKnowledge}><div className="card-heading"><div className="card-icon purple"><BookOpen size={19} /></div><div><h2>Add verified knowledge</h2><p>Learning is saved in the configured SQL Server database.</p></div></div><label htmlFor="learn-title">Topic</label><input id="learn-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="e.g. Reset a staff printer queue" required /><label htmlFor="learn-content">Trusted guidance</label><textarea id="learn-content" rows={7} value={content} onChange={(event) => setContent(event.target.value)} maxLength={6000} placeholder="Add verified steps and useful constraints…" required /><div className="info-note">Test SQL Server in Services & AI before saving. Do not add passwords, patient data, or personal information. Admin-taught notes may appear in user answers.</div><button className="primary-button" disabled={busy}>Save learning <ArrowRight size={16} /></button></form>
        <form className="surface-card stack-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!photoFile || photoBusy) return;
          if (!photoTitle || photoTitle.trim().length < 2) return alert('Provide a title (2–120 characters)');
          setPhotoBusy(true);
          try {
            const fd = new FormData();
            fd.append('title', photoTitle.trim());
            fd.append('file', photoFile);
            const resp = await fetch('/api/admin/knowledge-photo', { method: 'POST', credentials: 'same-origin', body: fd });
            if (!resp.ok) {
              const body = await resp.json().catch(() => ({}));
              throw new Error(body?.error || `Upload failed (${resp.status})`);
            }
            setPhotoTitle(''); setPhotoFile(null);
            await load();
          } catch (failure) { alert(failure.message); }
          finally { setPhotoBusy(false); }
        }}>
          <div className="card-heading"><div className="card-icon teal"><FileOutput size={19} /></div><div><h2>Teach by photo</h2><p>Upload an image that the agent can reference as verified guidance.</p></div></div>
          <label>Title for image</label>
          <input value={photoTitle} onChange={(e) => setPhotoTitle(e.target.value)} maxLength={120} placeholder="e.g. Location of the printer reset button" required />
          <label className="instruction-upload" htmlFor="learn-photo">Choose image {photoFile && <span>{photoFile.name}</span>}</label>
          <input id="learn-photo" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
          <div className="info-note">Images are saved on this server and referenced in the agent's learning. Do not upload patient-identifying images.</div>
          <button className="primary-button" disabled={photoBusy || !photoFile}>{photoBusy ? <span className="spinner" /> : <>Upload image <ArrowRight size={16} /></>}</button>
        </form>
        <div className="knowledge-list"><div className="list-title"><h2>Saved learning</h2><span>{knowledge.length}</span></div>{knowledge.length ? knowledge.map((entry) => <article className="knowledge-card" key={entry.id}><div className="knowledge-card-title">{entry.title}<button className="icon-button danger-hover" onClick={() => deleteKnowledge(entry.id)} aria-label={`Delete ${entry.title}`}><Trash2 size={16} /></button></div>{entry.content && entry.content.trim().startsWith('<img') ? <div dangerouslySetInnerHTML={{ __html: entry.content }} /> : <p>{entry.content}</p>}<small>By {entry.taughtBy} · {new Date(entry.createdAt).toLocaleDateString()}</small></article>) : <div className="empty-small"><BookOpen size={20} /> No custom guidance saved yet.</div>}</div>
        </div>
      </>}
      {tab === "users" && <div className="admin-content-grid">
        <form className="surface-card stack-form" onSubmit={addUser}><div className="card-heading"><div className="card-icon blue"><UserRound size={19} /></div><div><h2>Create local user</h2><p>AD users sign in with their domain account.</p></div></div><label>Username</label><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="off" required /><label>Initial password</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} autoComplete="new-password" required /><div className="field-hint">At least 12 characters. The password is stored as a one-way hash.</div><button className="primary-button" disabled={busy}>Create local account <ArrowRight size={16} /></button></form>
        <div className="knowledge-list"><div className="list-title"><h2>Accounts</h2><span>{users.length}</span></div>{users.map((account) => <article className="user-card" key={account.username}><div className="avatar">{account.username.slice(0, 1).toUpperCase()}</div><div><strong>{account.username}</strong><small>{account.role} · {account.source}</small></div></article>)}<div className="info-note">LDAP accounts are validated against Active Directory and are not copied into the local password database.</div></div>
      </div>}
      {tab === "settings" && <div className="settings-form">
        <section className="surface-card settings-card">
          <div className="card-heading"><div className="card-icon teal"><KeyRound size={19} /></div><div><h2>External AI providers</h2><p>Add provider keys here. Keys stay on this server and are never sent back to the browser.</p></div></div>
          <div className="settings-columns">
            <div className="stack-form">
              <label htmlFor="gemini-key">Google Gemini API key</label>
              <input id="gemini-key" type="password" autoComplete="new-password" value={geminiKey} onChange={(event) => { setGeminiKey(event.target.value); setClearGeminiKey(false); }} placeholder={serverSettings?.providers.geminiConfigured ? "Saved securely · leave blank to keep current key" : "Paste Gemini API key"} />
              {serverSettings?.providers.geminiConfigured && <label className="check-row"><input type="checkbox" checked={clearGeminiKey} onChange={(event) => setClearGeminiKey(event.target.checked)} /> Remove saved Gemini key</label>}
              <label htmlFor="gemini-model">Gemini model</label><input id="gemini-model" value={geminiModel} onChange={(event) => setGeminiModel(event.target.value)} />
              <label htmlFor="gemini-live-model">Gemini Live voice model</label><input id="gemini-live-model" value={geminiLiveModel} onChange={(event) => setGeminiLiveModel(event.target.value)} />
            </div>
            <div className="stack-form">
              <label htmlFor="deepseek-key">DeepSeek API key</label>
              <input id="deepseek-key" type="password" autoComplete="new-password" value={deepseekKey} onChange={(event) => { setDeepseekKey(event.target.value); setClearDeepseekKey(false); }} placeholder={serverSettings?.providers.deepseekConfigured ? "Saved securely · leave blank to keep current key" : "Paste DeepSeek API key"} />
              {serverSettings?.providers.deepseekConfigured && <label className="check-row"><input type="checkbox" checked={clearDeepseekKey} onChange={(event) => setClearDeepseekKey(event.target.checked)} /> Remove saved DeepSeek key</label>}
              <label htmlFor="deepseek-model">DeepSeek model</label><input id="deepseek-model" value={deepseekModel} onChange={(event) => setDeepseekModel(event.target.value)} />
            </div>
          </div>
          <div className="info-note">Voice calls use the configured Gemini Live model and Gemini API key. The default model is <code>gemini-2.5-flash-native-audio-preview-12-2025</code>; availability depends on Google's account, region, and quota. Chat and document responses automatically retry through the other configured provider after a provider failure. Live calls still require Gemini Live access. Call audio is streamed to Google and not recorded by Elyano Agent. In video calls, the Agent accepts audio only.</div>
          <label htmlFor="default-provider">Default provider for replies inside Connect</label>
          <select id="default-provider" className="form-select" value={defaultProvider} onChange={(event) => setDefaultProvider(event.target.value)}><option value="gemini">Gemini</option><option value="deepseek">DeepSeek</option></select>
          <label className="check-row"><input type="checkbox" checked={providerFailover} onChange={(event) => setProviderFailover(event.target.checked)} /> Retry chat, document, and Excel tasks with the other configured provider when the selected provider fails</label>
          <div className="warning-note">When enabled, the same request may be sent to the other configured provider and use its quota or incur its charges. No hosted AI API guarantees unlimited free service; provider free tiers have limits and can change. Voice calls still use Gemini Live only.</div>
        </section>
        <section className="surface-card settings-card">
          <div className="card-heading"><div className="card-icon blue"><UsersRound size={19} /></div><div><h2>Active Directory / LDAP</h2><p>Users sign in as <code>username@elitehospital.org</code> or enter their AD username.</p></div></div>
          <div className="settings-columns">
            <div className="stack-form"><label htmlFor="ldap-url">LDAP server</label><input id="ldap-url" value={ldapUrl} onChange={(event) => setLdapUrl(event.target.value)} placeholder="ldap://elitehospital.org:389" /><label htmlFor="ldap-domain">AD user domain</label><input id="ldap-domain" value={ldapDomain} onChange={(event) => setLdapDomain(event.target.value)} /><label className="check-row"><input type="checkbox" checked={ldapStartTls} onChange={(event) => setLdapStartTls(event.target.checked)} /> Use StartTLS on ldap:// (recommended)</label>{!ldapStartTls && ldapUrl.trim().toLowerCase().startsWith("ldap://") && <div className="warning-note">StartTLS is off to match Elyano Connect's current LDAP connection. LDAP passwords will travel unencrypted over the network. Use only on a trusted network; anonymous LDAP bind does not validate a user's password.</div>}</div>
            <div className="stack-form"><label htmlFor="ldap-ca">Internal LDAP CA certificate (optional PEM)</label><textarea id="ldap-ca" rows={5} value={ldapCaCert} onChange={(event) => { setLdapCaCert(event.target.value); setClearLdapCaCert(false); }} placeholder={serverSettings?.ldap.caConfigured ? "Certificate saved securely · paste a replacement or leave blank" : "-----BEGIN CERTIFICATE-----"} />{serverSettings?.ldap.caConfigured && <label className="check-row"><input type="checkbox" checked={clearLdapCaCert} onChange={(event) => setClearLdapCaCert(event.target.checked)} /> Remove saved LDAP certificate</label>}</div>
          </div>
          <form className="ldap-test-form" onSubmit={testLdap}><strong>Test an AD account</strong><input autoComplete="off" value={ldapTestUser} onChange={(event) => setLdapTestUser(event.target.value)} placeholder="username@elitehospital.org" required /><input type="password" autoComplete="new-password" value={ldapTestPassword} onChange={(event) => setLdapTestPassword(event.target.value)} placeholder="AD password (used for this test only)" required /><button className="secondary-button" disabled={settingsBusy}>Test LDAP</button></form>
          <div className="info-note">Users are authenticated with their password using UPN, then <code>DOMAIN\username</code>, as in Elyano Connect; anonymous bind cannot validate a password. StartTLS protects passwords over port 389. If you turn StartTLS off to match Connect's current unencrypted LDAP transport, credentials will travel without encryption. If StartTLS is enabled and the LDAP test reports a certificate trust error, paste the issuing root/intermediate CA PEM above, save settings, then test again. Alternatively, install the CA in the VM trust store and start Node.js with <code>--use-system-ca</code>.</div>
        </section>
        <section className="surface-card settings-card">
          <div className="card-heading"><div className="card-icon purple"><Database size={19} /></div><div><h2>SQL Server learning storage</h2><p>Approved administrator learning is saved and loaded from this SQL Server database.</p></div></div>
          <div className={`connection-status ${serverSettings?.sql.status === "online" ? "connected" : ""}`}><span className={`status-dot ${serverSettings?.sql.status === "online" ? "" : "offline"}`} /><div><strong>{serverSettings?.sql.status || "Loading SQL status"}</strong><small>{serverSettings?.sql.message || "Checking SQL Server configuration…"}</small></div><button className="secondary-button" type="button" onClick={testSql} disabled={settingsBusy}>Test SQL Server</button></div>
          <div className="settings-columns">
            <div className="stack-form"><label htmlFor="sql-auth-mode">Authentication</label><select id="sql-auth-mode" className="form-select" value={sqlAuthMode} onChange={(event) => setSqlAuthMode(event.target.value)}><option value="windows">Windows Authentication (service account)</option><option value="sql">SQL Server Authentication</option></select><label htmlFor="sql-host">SQL Server host</label><input id="sql-host" value={sqlHost} onChange={(event) => setSqlHost(event.target.value)} placeholder="localhost" /><label htmlFor="sql-port">Port</label><input id="sql-port" type="number" min="1" max="65535" value={sqlPort} onChange={(event) => setSqlPort(event.target.value)} /><label htmlFor="sql-database">Elyano Agent database (created if missing)</label><input id="sql-database" value={sqlDatabase} onChange={(event) => setSqlDatabase(event.target.value)} placeholder="ElyanoAgentDB" /></div>
            <div className="stack-form">{sqlAuthMode === "sql" ? <><label htmlFor="sql-user">SQL login</label><input id="sql-user" autoComplete="off" value={sqlUser} onChange={(event) => setSqlUser(event.target.value)} /><label htmlFor="sql-password">SQL password</label><input id="sql-password" type="password" autoComplete="new-password" value={sqlPassword} onChange={(event) => { setSqlPassword(event.target.value); setClearSqlPassword(false); }} placeholder={serverSettings?.sql.passwordConfigured ? "Saved securely · leave blank to keep" : "Enter SQL login password"} />{serverSettings?.sql.passwordConfigured && <label className="check-row"><input type="checkbox" checked={clearSqlPassword} onChange={(event) => setClearSqlPassword(event.target.checked)} /> Remove saved password</label>}</> : <div className="info-note">Windows Authentication uses the Windows identity running Elyano Agent. Run the service under a domain/service account that is authorized in SQL Server; the current Windows user's desktop login is not used automatically by a service.</div>}<label className="check-row"><input type="checkbox" checked={sqlEncrypt} onChange={(event) => setSqlEncrypt(event.target.checked)} /> Encrypt SQL connection</label><label className="check-row"><input type="checkbox" checked={sqlTrustServerCertificate} onChange={(event) => setSqlTrustServerCertificate(event.target.checked)} /> Trust SQL certificate without validation</label></div>
          </div>
          <div className="info-note">The Agent uses its own database (default <code>ElyanoAgentDB</code>), separate from Elyano Connect. Test SQL Server creates that database if missing, then creates <code>dbo.ElyanoAgentKnowledge</code> and migrates existing local learning. The Windows service identity or SQL login needs permission to create a database and own/read/write the Agent database. Keep certificate trust disabled unless your internal SQL certificate requires it.</div>
        </section>
        <section className="surface-card settings-card">
          <div className="card-heading"><div className="card-icon teal"><Activity size={19} /></div><div><h2>Proactive IP monitoring</h2><p>Monitor private hospital network devices and automatically open an IT ticket when one stops responding.</p></div></div>
          <div className="info-note">Targets are pinged once every 60 seconds. Each outage opens one IT ticket; reports retry every 5 minutes if Connect is temporarily unavailable. When an address responds again, a future outage can be reported. Only private IPv4 ranges are accepted.</div>
          <form className="ping-target-form" onSubmit={addPingTarget}><label htmlFor="ping-address">Private IP address</label><input id="ping-address" inputMode="decimal" value={pingAddress} onChange={(event) => setPingAddress(event.target.value)} placeholder="10.11.0.25" required /><label htmlFor="ping-label">Device or location (optional)</label><input id="ping-label" value={pingLabel} onChange={(event) => setPingLabel(event.target.value)} maxLength={80} placeholder="Radiology workstation" /><button className="secondary-button" disabled={pingBusy || pingTargets.length >= 30}>Add IP</button></form>
          <div className="ping-target-list">{pingTargets.length ? pingTargets.map((target) => <article className="ping-target-row" key={target.ip}><span className={`status-dot ${target.reachable ? "" : "offline"}`} /><div><strong>{target.label || target.ip}</strong><small>{target.ip} · {target.reachable === true ? `Reachable${target.latencyMs ? ` · ${target.latencyMs} ms` : ""}` : target.reachable === false ? "No ping response" : "Waiting for first check"}{target.checkedAt ? ` · Checked ${new Date(target.checkedAt).toLocaleTimeString()}` : ""}{target.ticketId ? ` · IT ticket #${target.ticketId}` : ""}{target.reportError ? ` · Report retry pending: ${target.reportError}` : ""}</small></div><button className="secondary-button" type="button" disabled={pingBusy} onClick={() => checkPingTarget(target.ip)}>Ping now</button><button className="icon-button danger-hover" type="button" disabled={pingBusy} aria-label={`Remove ${target.ip}`} onClick={() => savePingTargets(pingTargets.filter((item) => item.ip !== target.ip).map(({ ip, label }) => ({ ip, label })))}><Trash2 size={16} /></button></article>) : <div className="empty-small">No IP targets configured yet.</div>}</div>
        </section>
        <section className="surface-card settings-card">
          <div className="card-heading"><div className={`card-icon ${serverSettings?.chat.status === "online" ? "teal" : "blue"}`}><MessageSquare size={19} /></div><div><h2>Elyano Connect presence</h2><p>Agent will sign in to Connect as <strong>Agent</strong> and appear in the online staff list.</p></div></div>
          <div className={`connection-status ${serverSettings?.chat.status === "online" ? "connected" : ""}`}><span className={`status-dot ${serverSettings?.chat.status === "online" ? "" : "offline"}`} /><div><strong>{serverSettings?.chat.status || "Loading connection status"}</strong><small>{serverSettings?.chat.message || "Checking…"}</small></div><button className="icon-button" type="button" onClick={reconnectChat} disabled={settingsBusy} title="Reconnect"><RefreshCw size={16} /></button></div>
          <div className="settings-columns">
            <div className="stack-form"><label htmlFor="chat-url">Elyano Connect server URL</label><input id="chat-url" value={chatUrl} onChange={(event) => setChatUrl(event.target.value)} placeholder="https://localhost:3000" /><label>Chat account</label><input value="Agent" readOnly /><label htmlFor="chat-password">Agent account password</label><input id="chat-password" type="password" autoComplete="new-password" value={chatPassword} onChange={(event) => { setChatPassword(event.target.value); setClearChatPassword(false); }} placeholder={serverSettings?.chat.passwordConfigured ? "Saved securely · leave blank to keep current password" : "Enter the local Connect Agent password"} />{serverSettings?.chat.passwordConfigured && <label className="check-row"><input type="checkbox" checked={clearChatPassword} onChange={(event) => setClearChatPassword(event.target.checked)} /> Remove saved password</label>}<label className="check-row"><input type="checkbox" checked={chatAutoReply} onChange={(event) => setChatAutoReply(event.target.checked)} /> Reply to direct chat messages using AI</label></div>
            <div className="stack-form"><label htmlFor="chat-ca">Elyano Connect TLS certificate (PEM)</label><textarea id="chat-ca" rows={8} value={chatCaCert} onChange={(event) => { setChatCaCert(event.target.value); setClearChatCaCert(false); }} placeholder={serverSettings?.chat.caConfigured ? "Certificate saved securely · paste a replacement or leave blank" : "Paste the chat server's cert.pem to trust its HTTPS connection"} />{serverSettings?.chat.caConfigured && <label className="check-row"><input type="checkbox" checked={clearChatCaCert} onChange={(event) => setClearChatCaCert(event.target.checked)} /> Remove saved certificate</label>}</div>
          </div>
          <div className="info-note">Create a dedicated non-admin local account called Agent in Connect. Enter its password and the Connect URL here, then save settings. If both apps share a VM and Connect's certificate names <code>localhost</code>, use <code>https://localhost:3000</code>. Otherwise use the certificate's matching hostname. Paste Connect's public <code>cert.pem</code> (never its private <code>key.pem</code>) so HTTPS stays verified. Accepting a browser warning does not make the server trust that certificate.</div>
        </section>
        <div className="settings-save-row"><span>API keys, LDAP CA, chat password, and chat certificate are stored only on the Agent server.</span><button type="button" className="primary-button" onClick={saveAdminSettings} disabled={settingsBusy}>{settingsBusy ? <><span className="spinner" /> Saving…</> : <>Save service settings <Check size={16} /></>}</button></div>
      </div>}
      {tab === "security" && <form className="surface-card password-card stack-form" onSubmit={changePassword}><div className="card-heading"><div className="card-icon teal"><ShieldCheck size={19} /></div><div><h2>Change administrator password</h2><p>Changing it signs out existing sessions.</p></div></div><label>Current password</label><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /><label>New password</label><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} autoComplete="new-password" required /><div className="field-hint">Use at least 12 characters; use a unique password.</div><button className="primary-button" disabled={busy}>Update password <ArrowRight size={16} /></button></form>}
      <div className="admin-disclaimer"><ShieldCheck size={15} /> AI providers process submitted text under their own service terms. Configure only approved providers and never submit confidential or patient-identifying information.</div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
