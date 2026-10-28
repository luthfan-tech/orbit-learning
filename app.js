/* =========================================================================
   Orbit — app.js (Fixed Routing & Sidebar)
   ========================================================================= */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 8);
  const nowISO = () => new Date().toISOString();
  const paragraphs = (t) =>
    String(t || "")
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((p) => "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>")
      .join("");

  function fmtClock(s) {
    s = Math.max(0, Math.round(s));
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
  }
  function fmtDur(s) {
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      sec = s % 60;
    if (h) return h + "h " + m + "m";
    if (m) return m + "m " + sec + "s";
    return sec + "s";
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }

  /* ==================== ICONS ==================== */
  const ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3V4z"/><path d="M4 17a3 3 0 013-3h11"/></svg>',
    users:
      '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="18" cy="7" r="2.5"/><path d="M22 19c0-2.5-2-4.5-4.5-4.5"/></svg>',
    chart:
      '<svg viewBox="0 0 24 24"><path d="M3 20h18"/><path d="M6 16v-4"/><path d="M11 16V8"/><path d="M16 16v-7"/></svg>',
    terminal:
      '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M7 9l3 3-3 3"/><path d="M13 15h4"/></svg>',
    clock:
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    code: '<svg viewBox="0 0 24 24"><path d="M8 6l-5 6 5 6"/><path d="M16 6l5 6-5 6"/></svg>',
    data: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
    search:
      '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 004 0"/></svg>',
    arrowR:
      '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
    arrowUp:
      '<svg viewBox="0 0 24 24"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>',
    arrowDown:
      '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    play: '<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M4 3h13l-2 4 2 4H4z"/><path d="M4 3v18"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2l3 6 6 1-4.5 4.5L17.5 20 12 17 6.5 20 8 13.5 3.5 9l6-1z"/></svg>',
    warn: '<svg viewBox="0 0 24 24"><path d="M12 2L2 21h20L12 2z"/><path d="M12 9v6M12 18v.01"/></svg>',
    rocket:
      '<svg viewBox="0 0 24 24"><path d="M4 20c2-2 3-4 3-7 0-5 4-9 9-11 2 2 3 5 3 8 0 4-3 7-7 8-3 1-5 2-8 2z"/><circle cx="15" cy="9" r="2"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  };

  /* ==================== STATE ==================== */
  let state = null;
  let timer = { running: false, seconds: 0, intervalId: null, record: false };
  let loginDraft = { role: "student", selectedId: "stu-aarav" };
  let pendingImport = null;
  const sandboxHandlers = new Map();

  function defaultState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      curriculum: starterCurriculum(),
      progress: {},
      session: null,
      ui: { theme: "light" },
    };
  }

  function loadState() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (!raw) return defaultState();
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION) {
        try {
          localStorage.setItem("orbit.backup." + Date.now(), raw);
        } catch {}
        toast("Saved data was from an older version. A backup was kept.");
        return defaultState();
      }
      parsed.curriculum = parsed.curriculum || starterCurriculum();
      parsed.progress = parsed.progress || {};
      parsed.ui = parsed.ui || { theme: "light" };
      return parsed;
    } catch {
      try {
        localStorage.setItem("orbit.backup." + Date.now(), raw);
      } catch {}
      toast("Saved data could not be read. A backup was kept.");
      return defaultState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      toast("Could not save — storage may be full.");
    }
  }

  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const inc = JSON.parse(e.newValue);
      if (!inc || inc.schemaVersion !== SCHEMA_VERSION) return;
      state = inc;
      render();
    } catch {}
  });

  /* ==================== DATA HELPERS ==================== */
  function bucket(accountId) {
    if (!state.progress[accountId]) {
      state.progress[accountId] = {
        moduleRecords: {},
        quizAttempts: [],
        challengeResults: [],
        feedback: [],
        studySessions: [],
        pollResponses: [],
        drafts: {},
        badges: [],
      };
    }
    return state.progress[accountId];
  }
  const recKey = (m) => m.id + "::" + m.version;
  function readRecord(accountId, module) {
    return (
      bucket(accountId).moduleRecords[recKey(module)] || {
        status: "not-started",
        completedAt: null,
        checklist: {},
      }
    );
  }
  function writeRecord(accountId, module, patch) {
    const b = bucket(accountId);
    const k = recKey(module);
    b.moduleRecords[k] = Object.assign(
      {},
      b.moduleRecords[k] || {
        status: "not-started",
        completedAt: null,
        checklist: {},
      },
      patch,
    );
  }
  function publishedModules() {
    return state.curriculum.modules
      .filter((m) => m.published)
      .slice()
      .sort((a, b) => a.order - b.order);
  }
  function findModule(id) {
    return state.curriculum.modules.find((m) => m.id === id) || null;
  }
  function completedCount(accountId) {
    return publishedModules().filter(
      (m) => readRecord(accountId, m).status === "completed",
    ).length;
  }
  function currentAccount() {
    if (!state.session) return null;
    if (state.session.accountId === VISITOR.id) return VISITOR;
    return ACCOUNTS.find((a) => a.id === state.session.accountId) || null;
  }
  const myId = () => (state.session ? state.session.accountId : VISITOR.id);

  /* ==================== ROUTER ==================== */
  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "login";
    const parts = raw.split("/").filter(Boolean);
    return {
      parts,
      route: parts[0] || "login",
      sub: parts[1] || "",
      id: parts[2] || "",
    };
  }
  function go(path) {
    location.hash = "#" + path;
  }

  function render() {
    document.documentElement.dataset.theme =
      (state.ui && state.ui.theme) || "light";
    const { route, sub, id } = parseHash();
    if (!state.session && route !== "login") {
      go("login");
      return;
    }

    let html = "";
    if (route === "login") {
      if (state.session) {
        go(
          currentAccount().role === "teacher"
            ? "teacher/curriculum"
            : "student",
        );
        return;
      }
      html = renderLogin();
    } else if (route === "teacher") {
      const a = currentAccount();
      if (!a || a.role !== "teacher") {
        go("login");
        return;
      }
      html = renderTeacherShell(sub || "curriculum");
    } else if (route === "student") {
      const a = currentAccount();
      if (!a) {
        go("login");
        return;
      }
      html = renderStudentShell(sub, id);
    } else {
      html =
        '<div class="empty"><div class="em">🛰</div><p>That page does not exist. <a href="#login">Go back</a>.</p></div>';
    }
    $("#app").innerHTML = html;

    // Ensure the sidebar starts closed on mobile after navigation
    $("#sidebar")?.classList.remove("open");
    $(".sidebar-backdrop")?.classList.remove("show");

    const h = $("#main-heading");
    if (h) {
      h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
    }
  }

  /* ==================== UI UTILS ==================== */
  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }
  function openModal(title, body, opts) {
    opts = opts || {};
    $("#modal-root").innerHTML =
      '<div class="modal-backdrop">' +
      '<div class="modal ' +
      (opts.wide ? "wide" : "") +
      '" role="dialog" aria-modal="true" aria-labelledby="mt">' +
      '<div class="modal-head"><h2 id="mt">' +
      esc(title) +
      "</h2>" +
      '<button class="icon-btn" type="button" data-action="modal-close" aria-label="Close">' +
      ICONS.close +
      "</button>" +
      "</div>" +
      '<div class="modal-body">' +
      body +
      "</div>" +
      (opts.footer ? '<div class="modal-foot">' + opts.footer + "</div>" : "") +
      "</div>" +
      "</div>";
    const first = $(
      "#modal-root input, #modal-root textarea, #modal-root button",
    );
    if (first) first.focus({ preventScroll: true });
  }
  function closeModal() {
    $("#modal-root").innerHTML = "";
  }
  function openConfirm(title, msg, onConfirm, label) {
    openModal(title, msg, {
      footer:
        '<button class="btn ghost" type="button" data-action="modal-close">Cancel</button>' +
        '<button class="btn primary" type="button" id="cfyes">' +
        esc(label || "Confirm") +
        "</button>",
    });
    $("#cfyes").addEventListener("click", () => {
      closeModal();
      onConfirm();
    });
  }

  /* ==================== LOGIN ==================== */
  function renderLogin() {
    const role = loginDraft.role;
    const profiles = ACCOUNTS.filter((a) => a.role === role);
    if (!profiles.some((p) => p.id === loginDraft.selectedId))
      loginDraft.selectedId = profiles[0].id;

    const options = profiles
      .map(
        (p) =>
          '<label class="profile-option">' +
          '<input type="radio" name="profile" value="' +
          esc(p.id) +
          '"' +
          (p.id === loginDraft.selectedId ? " checked" : "") +
          ">" +
          '<span><span class="av">' +
          esc(p.initials) +
          "</span>" +
          esc(p.name) +
          "</span>" +
          "</label>",
      )
      .join("");

    const keys = ACCOUNTS.map(
      (a) =>
        "<li><strong>" +
        esc(a.name) +
        "</strong> — <code>" +
        esc(a.key) +
        "</code></li>",
    ).join("");

    return (
      '<div class="login-shell">' +
      '<aside class="login-visual">' +
      '<div class="brand"><span class="logo">O</span> Orbit</div>' +
      "<div>" +
      "<h1>Learn by building.</h1>" +
      "<p>A calm, project-based space to practise HTML, CSS and JavaScript. Short sessions, real results, no pressure.</p>" +
      '<div class="float-stats">' +
      '<div class="float-stat"><strong>4</strong>modules</div>' +
      '<div class="float-stat"><strong>60m</strong>per day</div>' +
      '<div class="float-stat"><strong>∞</strong>retries</div>' +
      "</div>" +
      "</div>" +
      "</aside>" +
      '<div class="login-panel">' +
      '<div class="login-card">' +
      "<h2>Welcome back</h2>" +
      "<p>Sign in to continue your Journey to Mars.</p>" +
      '<div class="role-tabs" role="tablist">' +
      '<button type="button" role="tab" aria-selected="' +
      (role === "student") +
      '" data-action="login-role" data-role="student">Student</button>' +
      '<button type="button" role="tab" aria-selected="' +
      (role === "teacher") +
      '" data-action="login-role" data-role="teacher">Teacher</button>' +
      "</div>" +
      '<form data-form="login">' +
      '<fieldset style="border:0;padding:0;margin:0 0 1rem"><legend style="padding:0;margin-bottom:.5rem">Choose a profile</legend>' +
      '<div class="profile-list">' +
      options +
      "</div>" +
      "</fieldset>" +
      '<label class="field"><span>Access key</span>' +
      '<input type="password" name="key" required autocomplete="off" spellcheck="false" placeholder="Enter your key">' +
      "</label>" +
      '<button class="btn primary block" type="submit">Continue</button>' +
      "</form>" +
      '<div class="login-foot">' +
      'Just exploring? <a href="#" data-action="visitor-login">Continue as visitor</a>' +
      "</div>" +
      '<details class="demo-keys"><summary>Demo keys</summary><ul>' +
      keys +
      "</ul></details>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  /* ==================== SHELLS ==================== */
  function sidebarNav(items, active) {
    return items
      .map(
        (item) =>
          '<a href="#' +
          item.path +
          '"' +
          (item.path === active ? ' aria-current="page"' : "") +
          ">" +
          '<span class="ico">' +
          (ICONS[item.icon] || "") +
          "</span>" +
          esc(item.label) +
          "</a>",
      )
      .join("");
  }

  function shell(navItems, activePath, content) {
    const a = currentAccount();
    return (
      '<div class="app">' +
      '<div class="sidebar-backdrop" data-action="close-sidebar"></div>' +
      '<aside class="sidebar" id="sidebar">' +
      '<div class="brand"><span class="logo">O</span> Orbit</div>' +
      '<div class="nav">' +
      sidebarNav(navItems, activePath) +
      "</div>" +
      '<div class="side-spacer"></div>' +
      '<div class="side-promo">' +
      "<h4>Keep the momentum</h4>" +
      "<p>One hour a day is enough. Small wins add up.</p>" +
      '<button type="button" data-action="promo-timer">Open timer</button>' +
      "</div>" +
      '<div class="side-user">' +
      '<div class="avatar">' +
      esc(a.initials) +
      "</div>" +
      '<div class="meta"><div class="name">' +
      esc(a.name) +
      '</div><div class="role">' +
      esc(a.role) +
      "</div></div>" +
      '<button type="button" class="signout" data-action="logout" title="Sign out">↗</button>' +
      "</div>" +
      "</aside>" +
      '<div class="main">' +
      '<div class="main-inner">' +
      '<div class="topbar">' +
      '<button type="button" class="mobile-toggle" data-action="toggle-sidebar" aria-label="Open menu">' +
      ICONS.menu +
      "</button>" +
      '<div class="search">' +
      ICONS.search +
      '<input type="text" placeholder="Search modules, resources…" aria-label="Search"></div>' +
      '<div class="top-actions">' +
      '<button class="icon-btn" type="button" data-action="toggle-theme" aria-label="Toggle theme">' +
      (state.ui.theme === "dark" ? ICONS.sun : ICONS.moon) +
      "</button>" +
      '<button class="icon-btn" type="button" aria-label="Notifications">' +
      ICONS.bell +
      "</button>" +
      "</div>" +
      "</div>" +
      content +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  /* ==================== TEACHER VIEWS ==================== */
  const TEACHER_NAV = [
    { path: "teacher/curriculum", label: "Curriculum", icon: "book" },
    { path: "teacher/resources", label: "Resources", icon: "code" },
    { path: "teacher/challenges", label: "Challenges", icon: "flag" },
    { path: "teacher/quizzes", label: "Quizzes", icon: "star" },
    { path: "teacher/students", label: "Students", icon: "users" },
    { path: "teacher/data", label: "Data", icon: "data" },
  ];

  function renderTeacherShell(tab) {
    const views = {
      curriculum: teacherCurriculum,
      resources: teacherResources,
      challenges: teacherChallenges,
      quizzes: teacherQuizzes,
      students: teacherStudents,
      data: teacherData,
    };
    const view = (views[tab] || views.curriculum)();
    return shell(TEACHER_NAV, "teacher/" + tab, view);
  }

  function teacherCurriculum() {
    const modules = state.curriculum.modules
      .slice()
      .sort((a, b) => a.order - b.order);
    const published = modules.filter((m) => m.published).length;
    const drafts = modules.length - published;

    const rows = modules.length
      ? modules
          .map(
            (m, i) =>
              '<div class="module-row ' +
              (m.published ? "" : "is-draft") +
              '">' +
              '<span class="order-badge">' +
              (i + 1) +
              "</span>" +
              "<div>" +
              '<div class="title">' +
              esc(m.title) +
              ' <span class="chip ' +
              (m.published ? "done" : "draft") +
              '">' +
              (m.published ? "Published" : "Draft") +
              "</span>" +
              ' <span class="chip">v' +
              m.version +
              "</span>" +
              "</div>" +
              '<div class="meta">' +
              "<span>" +
              esc(m.estimatedMinutes) +
              " min</span>" +
              "<span>" +
              (m.sessions || []).length +
              " sessions</span>" +
              "<span>" +
              (m.checklist || []).length +
              " checklist</span>" +
              "</div>" +
              "</div>" +
              '<div class="actions">' +
              '<button class="btn icon-only ghost" type="button" data-action="move-up" data-id="' +
              esc(m.id) +
              '" title="Move up"' +
              (i === 0 ? " disabled" : "") +
              ">" +
              ICONS.arrowUp +
              "</button>" +
              '<button class="btn icon-only ghost" type="button" data-action="move-down" data-id="' +
              esc(m.id) +
              '" title="Move down"' +
              (i === modules.length - 1 ? " disabled" : "") +
              ">" +
              ICONS.arrowDown +
              "</button>" +
              '<button class="btn icon-only ghost" type="button" data-action="toggle-publish" data-id="' +
              esc(m.id) +
              '" title="' +
              (m.published ? "Unpublish" : "Publish") +
              '">' +
              ICONS.eye +
              "</button>" +
              '<button class="btn sm ghost" type="button" data-action="edit-module" data-id="' +
              esc(m.id) +
              '">Edit</button>' +
              '<button class="btn icon-only danger" type="button" data-action="delete-module" data-id="' +
              esc(m.id) +
              '" title="Delete">' +
              ICONS.trash +
              "</button>" +
              "</div>" +
              "</div>",
          )
          .join("")
      : '<div class="empty"><div class="em">📘</div><p>No modules yet. Add your first one.</p></div>';

    return (
      '<div class="greeting"><h1 id="main-heading">Curriculum</h1><p>Design the Journey to Mars — modules, lessons, and the order they appear in.</p></div>' +
      '<div class="stats-row">' +
      '<div class="stat"><div class="ico violet">' +
      ICONS.book +
      '</div><div><div class="num">' +
      modules.length +
      '</div><div class="lbl">Modules</div></div></div>' +
      '<div class="stat"><div class="ico teal">' +
      ICONS.check +
      '</div><div><div class="num">' +
      published +
      '</div><div class="lbl">Published</div></div></div>' +
      '<div class="stat"><div class="ico amber">' +
      ICONS.edit +
      '</div><div><div class="num">' +
      drafts +
      '</div><div class="lbl">Drafts</div></div></div>' +
      '<div class="stat"><div class="ico pink">' +
      ICONS.users +
      '</div><div><div class="num">' +
      ACCOUNTS.filter((a) => a.role === "student").length +
      '</div><div class="lbl">Students</div></div></div>' +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><h2>All modules</h2>' +
      '<button class="btn primary sm" type="button" data-action="add-module">' +
      ICONS.plus +
      " New module</button>" +
      "</div>" +
      '<div class="module-rows">' +
      rows +
      "</div>" +
      "</div>"
    );
  }

  function teacherResources() {
    const rows = state.curriculum.resources
      .map(
        (r) =>
          '<div class="module-row">' +
          '<span class="order-badge">' +
          (r.type === "link" ? "↗" : r.type === "snippet" ? "{}" : "✎") +
          "</span>" +
          "<div>" +
          '<div class="title">' +
          esc(r.title) +
          ' <span class="chip">' +
          esc(r.type) +
          "</span>" +
          (r.needsVerification
            ? ' <span class="chip warn">Unverified</span>'
            : "") +
          "</div>" +
          '<div class="meta">' +
          (r.url ? esc(r.url) : '<span class="muted">local note</span>') +
          "</div>" +
          "</div>" +
          '<div class="actions">' +
          '<button class="btn sm ghost" type="button" data-action="preview-resource" data-id="' +
          esc(r.id) +
          '">Preview</button>' +
          '<button class="btn sm ghost" type="button" data-action="edit-resource" data-id="' +
          esc(r.id) +
          '">Edit</button>' +
          '<button class="btn icon-only danger" type="button" data-action="delete-resource" data-id="' +
          esc(r.id) +
          '">' +
          ICONS.trash +
          "</button>" +
          "</div>" +
          "</div>",
      )
      .join("");

    return (
      '<div class="greeting"><h1 id="main-heading">Resources</h1><p>Links, notes and code snippets that support each module.</p></div>' +
      '<div class="panel">' +
      '<div class="panel-head"><h2>Library</h2>' +
      '<button class="btn primary sm" type="button" data-action="add-resource">' +
      ICONS.plus +
      " New resource</button>" +
      "</div>" +
      (rows
        ? '<div class="module-rows">' + rows + "</div>"
        : '<div class="empty"><div class="em">📎</div><p>No resources yet.</p></div>') +
      "</div>"
    );
  }

  function teacherChallenges() {
    const rows = state.curriculum.challenges
      .map(
        (c) =>
          '<div class="module-row">' +
          '<span class="order-badge">⚑</span>' +
          "<div>" +
          '<div class="title">' +
          esc(c.title) +
          ' <span class="chip">' +
          (c.checkType === "console" ? "Console match" : "Self-check") +
          "</span></div>" +
          '<div class="meta">' +
          (c.checkType === "console"
            ? "Expected: " + esc(c.expectedOutput || "—")
            : (c.checklist || []).length + " checklist items") +
          "</div>" +
          "</div>" +
          '<div class="actions">' +
          '<button class="btn sm ghost" type="button" data-action="edit-challenge" data-id="' +
          esc(c.id) +
          '">Edit</button>' +
          '<button class="btn icon-only danger" type="button" data-action="delete-challenge" data-id="' +
          esc(c.id) +
          '">' +
          ICONS.trash +
          "</button>" +
          "</div>" +
          "</div>",
      )
      .join("");

    return (
      '<div class="greeting"><h1 id="main-heading">Challenges</h1><p>Practical exercises with clear checking methods.</p></div>' +
      '<div class="panel">' +
      '<div class="panel-head"><h2>All challenges</h2>' +
      '<button class="btn primary sm" type="button" data-action="add-challenge">' +
      ICONS.plus +
      " New challenge</button>" +
      "</div>" +
      (rows
        ? '<div class="module-rows">' + rows + "</div>"
        : '<div class="empty"><div class="em">⚑</div><p>No challenges yet.</p></div>') +
      "</div>"
    );
  }

  function teacherQuizzes() {
    const quizRows = state.curriculum.quizzes
      .map(
        (q) =>
          '<div class="module-row">' +
          '<span class="order-badge">?</span>' +
          '<div><div class="title">' +
          esc(q.title) +
          "</div>" +
          '<div class="meta">' +
          q.questions.length +
          " questions</div></div>" +
          '<div class="actions">' +
          '<button class="btn sm ghost" type="button" data-action="edit-quiz" data-id="' +
          esc(q.id) +
          '">Edit</button>' +
          '<button class="btn icon-only danger" type="button" data-action="delete-quiz" data-id="' +
          esc(q.id) +
          '">' +
          ICONS.trash +
          "</button>" +
          "</div>" +
          "</div>",
      )
      .join("");

    const pollRows = state.curriculum.polls
      .map(
        (p) =>
          '<div class="module-row">' +
          '<span class="order-badge">◔</span>' +
          '<div><div class="title">' +
          esc(p.title) +
          "</div>" +
          '<div class="meta">' +
          esc(p.question) +
          "</div></div>" +
          '<div class="actions">' +
          '<button class="btn sm ghost" type="button" data-action="edit-poll" data-id="' +
          esc(p.id) +
          '">Edit</button>' +
          '<button class="btn icon-only danger" type="button" data-action="delete-poll" data-id="' +
          esc(p.id) +
          '">' +
          ICONS.trash +
          "</button>" +
          "</div>" +
          "</div>",
      )
      .join("");

    return (
      '<div class="greeting"><h1 id="main-heading">Quizzes &amp; polls</h1><p>Check understanding. Unlimited retries, no penalties.</p></div>' +
      '<div class="panel" style="margin-bottom:1rem">' +
      '<div class="panel-head"><h2>Quizzes</h2>' +
      '<button class="btn primary sm" type="button" data-action="add-quiz">' +
      ICONS.plus +
      " New quiz</button></div>" +
      (quizRows
        ? '<div class="module-rows">' + quizRows + "</div>"
        : '<div class="empty"><div class="em">?</div><p>No quizzes yet.</p></div>') +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><h2>Polls &amp; reflection</h2>' +
      '<button class="btn primary sm" type="button" data-action="add-poll">' +
      ICONS.plus +
      " New poll</button></div>" +
      (pollRows
        ? '<div class="module-rows">' + pollRows + "</div>"
        : '<div class="empty"><div class="em">◔</div><p>No polls yet.</p></div>') +
      "</div>"
    );
  }

  function teacherStudents() {
    const students = ACCOUNTS.filter((a) => a.role === "student");
    const rows = students
      .map((acc) => {
        const b = bucket(acc.id);
        const done = completedCount(acc.id);
        const mins =
          b.studySessions.reduce((s, x) => s + (x.seconds || 0), 0) / 60;
        return (
          "<tr>" +
          '<td><span class="row-avatar"><span class="av">' +
          esc(acc.initials) +
          "</span>" +
          esc(acc.name) +
          "</span></td>" +
          "<td>" +
          done +
          " / " +
          publishedModules().length +
          "</td>" +
          "<td>" +
          b.quizAttempts.length +
          "</td>" +
          "<td>" +
          b.challengeResults.filter((c) => c.passed).length +
          "</td>" +
          "<td>" +
          b.feedback.length +
          "</td>" +
          "<td>" +
          Math.round(mins) +
          " min</td>" +
          "</tr>"
        );
      })
      .join("");

    const allFeedback = [];
    Object.keys(state.progress).forEach((accId) => {
      const acc = ACCOUNTS.find((a) => a.id === accId);
      const label = acc ? acc.name : accId === VISITOR.id ? "Visitor" : accId;
      (state.progress[accId].feedback || []).forEach((f) => {
        allFeedback.push({
          label,
          moduleId: f.moduleId,
          sentiment: f.sentiment,
          note: f.note,
          at: f.at,
        });
      });
    });
    allFeedback.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const fbRows = allFeedback
      .slice(0, 12)
      .map(
        (f) =>
          "<tr><td>" +
          esc(f.label) +
          "</td><td>" +
          esc(f.moduleId) +
          "</td>" +
          '<td><span class="chip">' +
          esc(f.sentiment) +
          "</span></td>" +
          "<td>" +
          esc(f.note || "—") +
          "</td>" +
          '<td class="muted" style="font-size:.78rem">' +
          esc(fmtDate(f.at)) +
          "</td></tr>",
      )
      .join("");

    return (
      '<div class="greeting"><h1 id="main-heading">Students</h1><p>Progress from this browser only. Import a progress file to see data from other devices.</p></div>' +
      '<div class="panel" style="margin-bottom:1rem">' +
      '<div class="panel-head"><h2>Overview</h2></div>' +
      '<div class="table-wrap"><table>' +
      "<thead><tr><th>Learner</th><th>Modules</th><th>Quizzes</th><th>Challenges</th><th>Feedback</th><th>Study time</th></tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody>" +
      "</table></div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><h2>Recent feedback</h2></div>' +
      (fbRows
        ? '<div class="table-wrap"><table><thead><tr><th>Learner</th><th>Module</th><th>Signal</th><th>Note</th><th>When</th></tr></thead><tbody>' +
          fbRows +
          "</tbody></table></div>"
        : '<div class="empty"><div class="em">💬</div><p>No feedback recorded yet.</p></div>') +
      "</div>"
    );
  }

  function teacherData() {
    return dataView();
  }

  function dataView() {
    return (
      '<div class="greeting"><h1 id="main-heading">Data</h1><p>Everything lives in this browser. Export a file to move it between devices.</p></div>' +
      '<div class="panel" style="margin-bottom:1rem">' +
      '<div class="panel-head"><h2>Export</h2></div>' +
      '<div class="row" style="display:flex;gap:.6rem;flex-wrap:wrap">' +
      '<button class="btn" type="button" data-action="export-curriculum">' +
      ICONS.data +
      " Curriculum</button>" +
      '<button class="btn" type="button" data-action="export-progress">' +
      ICONS.data +
      " Progress</button>" +
      '<button class="btn primary" type="button" data-action="export-full">' +
      ICONS.data +
      " Full backup</button>" +
      "</div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><h2>Import</h2></div>' +
      '<label class="field"><span>Choose a JSON file</span>' +
      '<input type="file" accept="application/json,.json" id="import-file"></label>' +
      '<p class="hint">You will see a preview before anything is replaced. A safety copy is downloaded first.</p>' +
      "</div>"
    );
  }

  /* ==================== STUDENT VIEWS ==================== */
  const STUDENT_NAV = [
    { path: "student", label: "Roadmap", icon: "home" },
    { path: "student/playground", label: "Playground", icon: "code" },
    { path: "student/terminal", label: "Terminal", icon: "terminal" },
    { path: "student/timer", label: "Timer", icon: "clock" },
    { path: "student/data", label: "Data", icon: "data" },
  ];

  function renderStudentShell(sub, id) {
    const active = sub === "lesson" ? "student" : "student/" + (sub || "");
    let content = "";
    if (sub === "lesson" && id) content = studentLesson(id);
    else if (sub === "playground") content = studentPlayground();
    else if (sub === "terminal") content = studentTerminal();
    else if (sub === "timer") content = studentTimer();
    else if (sub === "data") content = studentData();
    else content = studentRoadmap();
    return shell(STUDENT_NAV, active, content);
  }

  function continueTarget(accountId) {
    const list = publishedModules();
    return (
      list.find((m) => readRecord(accountId, m).status === "in-progress") ||
      list.find((m) => readRecord(accountId, m).status === "not-started") ||
      list[0] ||
      null
    );
  }
  function computeBadges(accountId) {
    const b = bucket(accountId);
    const done = completedCount(accountId);
    const earned = [];
    if (done >= 1) earned.push("first-step");
    if (done >= 2) earned.push("halfway");
    if (done >= 4) earned.push("arrival");
    if (b.quizAttempts.length >= 1) earned.push("quiz-taker");
    if (b.challengeResults.some((c) => c.passed)) earned.push("builder");
    if (b.feedback.length >= 1) earned.push("your-voice");
    let changed = false;
    earned.forEach((id) => {
      if (!b.badges.includes(id)) {
        b.badges.push(id);
        changed = true;
      }
    });
    if (changed) save();
    return b.badges;
  }

  function studentRoadmap() {
    const accId = myId();
    const list = publishedModules();
    const target = continueTarget(accId);
    const earned = computeBadges(accId);
    const doneCount = completedCount(accId);
    const remainingMin = list
      .filter((m) => readRecord(accId, m).status !== "completed")
      .reduce((s, m) => s + (m.estimatedMinutes || 0), 0);
    const pct = list.length ? Math.round((doneCount / list.length) * 100) : 0;
    const account = currentAccount();
    const greet = (() => {
      const h = new Date().getHours();
      if (h < 12) return "Good morning";
      if (h < 18) return "Good afternoon";
      return "Good evening";
    })();

    const tints = [
      "tint-violet",
      "tint-teal",
      "tint-pink",
      "tint-amber",
      "tint-lime",
    ];
    const cards = list
      .map((m, i) => {
        const rec = readRecord(accId, m);
        const status = rec.status;
        const tint = tints[i % tints.length];
        const icon = ["🌍", "🎨", "⚡", "🚀"][i % 4];
        return (
          '<article class="course-card">' +
          '<div class="cover ' +
          tint +
          '">' +
          '<span class="tag">Module ' +
          (i + 1) +
          "</span>" +
          '<span class="icon">' +
          icon +
          "</span>" +
          '<span class="status-pill ' +
          (status === "completed"
            ? "done"
            : status === "in-progress"
              ? "progress"
              : "") +
          '" style="position:absolute;left:1rem;bottom:.8rem">' +
          (status === "completed"
            ? "✓ Done"
            : status === "in-progress"
              ? "In progress"
              : "Not started") +
          "</span>" +
          "</div>" +
          '<div class="body">' +
          "<h3>" +
          esc(m.title) +
          "</h3>" +
          '<div class="desc">' +
          esc(m.goal) +
          "</div>" +
          '<div class="bar"><span style="width:' +
          (status === "completed" ? 100 : status === "in-progress" ? 50 : 0) +
          '%"></span></div>' +
          '<div class="foot">' +
          "<span>⏱ " +
          esc(m.estimatedMinutes) +
          " min</span>" +
          '<a class="btn-link" href="#student/lesson/' +
          esc(m.id) +
          '">' +
          (status === "completed"
            ? "Revisit"
            : status === "in-progress"
              ? "Continue"
              : "Start") +
          ICONS.arrowR +
          "</a>" +
          "</div>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    const streak = bucket(accId).studySessions.length;
    const weekDots = ["S", "M", "T", "W", "T", "F", "S"]
      .map(
        (d, i) =>
          '<span class="' +
          (i < Math.min(7, streak) ? "on" : "") +
          '">' +
          d +
          "</span>",
      )
      .join("");

    const badgeMini = BADGES.map(
      (b) =>
        '<div class="mini-badge ' +
        (earned.includes(b.id) ? "earned" : "") +
        '" title="' +
        esc(b.label) +
        '">' +
        (earned.includes(b.id) ? "⭐" : "☆") +
        "</div>",
    ).join("");

    const poll = state.curriculum.polls[0];
    const answered = poll
      ? bucket(accId).pollResponses.find((r) => r.pollId === poll.id)
      : null;

    const pollBlock = poll
      ? '<div class="panel" style="margin-top:1.4rem">' +
        '<div class="panel-head"><h2>' +
        esc(poll.title) +
        "</h2></div>" +
        '<p style="color:var(--ink-soft);margin-bottom:.8rem">' +
        esc(poll.question) +
        "</p>" +
        (answered
          ? '<div class="quiz-result good">Your answer: <strong>' +
            esc(poll.options[answered.optionIndex]) +
            "</strong></div>"
          : '<form data-form="poll-answer" data-poll="' +
            esc(poll.id) +
            '">' +
            poll.options
              .map(
                (opt, i) =>
                  '<label class="opt" style="display:flex;gap:.5rem;padding:.5rem;cursor:pointer"><input type="radio" name="option" value="' +
                  i +
                  '" required style="accent-color:var(--violet)"><span>' +
                  esc(opt) +
                  "</span></label>",
              )
              .join("") +
            '<div style="margin-top:.7rem"><button class="btn primary sm" type="submit">Send answer</button></div>' +
            "</form>") +
        "</div>"
      : "";

    return (
      '<div class="greeting">' +
      '<h1 id="main-heading">' +
      greet +
      ", " +
      esc(account.name.split(" ")[0]) +
      ' <span class="wave">👋</span></h1>' +
      "<p>You're " +
      pct +
      "% closer to completing the Journey to Mars project.</p>" +
      "</div>" +
      '<div class="stats-row">' +
      '<div class="stat"><div class="ico violet">' +
      ICONS.book +
      '</div><div><div class="num">' +
      doneCount +
      "/" +
      list.length +
      '</div><div class="lbl">Modules done</div></div></div>' +
      '<div class="stat"><div class="ico teal">' +
      ICONS.star +
      '</div><div><div class="num">' +
      earned.length +
      '</div><div class="lbl">Badges earned</div></div></div>' +
      '<div class="stat"><div class="ico pink">' +
      ICONS.clock +
      '</div><div><div class="num">' +
      Math.round(remainingMin) +
      '</div><div class="lbl">Minutes left</div></div></div>' +
      '<div class="stat"><div class="ico amber">' +
      ICONS.rocket +
      '</div><div><div class="num">' +
      bucket(accId).quizAttempts.length +
      '</div><div class="lbl">Quiz attempts</div></div></div>' +
      "</div>" +
      '<div class="hero-grid">' +
      '<div class="hero">' +
      '<span class="tag">' +
      ICONS.rocket +
      " Continue learning</span>" +
      "<h2>" +
      (target ? esc(target.title) : "Your roadmap is complete") +
      "</h2>" +
      "<p>" +
      (target
        ? esc(target.goal)
        : "Every module is done. Revisit any lesson whenever you like.") +
      "</p>" +
      (target
        ? '<div class="progress-line"><span style="width:' +
          pct +
          '%"></span></div>' +
          '<a class="hero-cta" href="#student/lesson/' +
          esc(target.id) +
          '">' +
          (doneCount === 0
            ? "Start first module"
            : "Pick up where you left off") +
          ICONS.arrowR +
          "</a>"
        : "") +
      "</div>" +
      '<div class="hero-side">' +
      "<h3>This week</h3>" +
      '<div class="streak-card">' +
      '<div class="big">' +
      streak +
      "</div>" +
      '<div class="meta"><strong>Study sessions</strong>recorded locally · gentle pace</div>' +
      "</div>" +
      "<div>" +
      '<div style="font-size:.78rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.4rem">Badges</div>' +
      '<div class="mini-badges">' +
      badgeMini +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="section-head">' +
      "<h2>Your modules</h2>" +
      '<a class="see-all" href="#student">See all ' +
      ICONS.arrowR +
      "</a>" +
      "</div>" +
      (list.length
        ? '<div class="course-grid">' + cards + "</div>"
        : '<div class="empty"><div class="em">🛰</div><p>No published modules yet. Your teacher will publish one soon.</p></div>') +
      pollBlock
    );
  }

  function studentLesson(moduleId) {
    const m = findModule(moduleId);
    if (!m || !m.published)
      return '<div class="empty"><div class="em">🛰</div><p>This lesson is not available. <a href="#student">Back to the roadmap</a>.</p></div>';

    const accId = myId();
    const rec = readRecord(accId, m);
    if (rec.status === "not-started") {
      writeRecord(accId, m, { status: "in-progress" });
      save();
    }

    const challenge = state.curriculum.challenges.find(
      (c) => c.id === m.challengeId,
    );
    const quiz = state.curriculum.quizzes.find((q) => q.id === m.quizId);
    const resources = (m.resourceIds || [])
      .map((id) => state.curriculum.resources.find((r) => r.id === id))
      .filter(Boolean);

    const resourcesHtml = resources.length
      ? resources
          .map(
            (r) =>
              '<div class="resource-card">' +
              '<div class="ico">' +
              (r.type === "link"
                ? ICONS.arrowR
                : r.type === "snippet"
                  ? ICONS.code
                  : ICONS.edit) +
              "</div>" +
              '<div class="meta">' +
              '<div class="r-title">' +
              esc(r.title) +
              (r.needsVerification
                ? ' <span class="chip warn">Unverified</span>'
                : "") +
              "</div>" +
              (r.description
                ? '<div class="r-desc">' + esc(r.description) + "</div>"
                : "") +
              (r.url
                ? '<div style="margin-top:.3rem"><a href="' +
                  esc(r.url) +
                  '" target="_blank" rel="noopener noreferrer">' +
                  esc(r.url) +
                  "</a></div>"
                : "") +
              (r.body
                ? r.type === "snippet"
                  ? "<pre>" + esc(r.body) + "</pre>"
                  : '<p class="r-desc" style="margin-top:.4rem">' +
                    esc(r.body) +
                    "</p>"
                : "") +
              "</div>" +
              "</div>",
          )
          .join("")
      : '<p class="muted" style="font-size:.88rem">No resources attached yet.</p>';

    const sessionsHtml = (m.sessions || [])
      .map(
        (s, i) =>
          '<li><span class="left"><span class="num">' +
          (i + 1) +
          "</span>" +
          esc(s.title) +
          "</span>" +
          '<span class="mins">' +
          s.minutes +
          " min</span></li>",
      )
      .join("");

    const checkHtml = (m.checklist || [])
      .map(
        (item, i) =>
          '<label class="checklist-item ' +
          (rec.checklist && rec.checklist[i] ? "checked" : "") +
          '">' +
          '<input type="checkbox" data-action="toggle-checklist" data-module="' +
          esc(m.id) +
          '" data-index="' +
          i +
          '"' +
          (rec.checklist && rec.checklist[i] ? " checked" : "") +
          ">" +
          "<span>" +
          esc(item) +
          "</span>" +
          "</label>",
      )
      .join("");

    return (
      '<div class="lesson-header">' +
      '<div class="crumb"><a href="#student">Roadmap</a> / Module ' +
      esc(m.order) +
      "</div>" +
      '<h1 id="main-heading">' +
      esc(m.title) +
      "</h1>" +
      '<p class="goal">' +
      esc(m.goal) +
      "</p>" +
      '<div class="lesson-meta">' +
      '<span class="chip">⏱ ' +
      esc(m.estimatedMinutes) +
      " min</span>" +
      '<span class="chip">' +
      (m.sessions || []).length +
      " sessions</span>" +
      '<span class="chip ' +
      (rec.status === "completed" ? "done" : "prog") +
      '">' +
      (rec.status === "completed" ? "Completed" : "In progress") +
      "</span>" +
      "</div>" +
      "</div>" +
      '<div class="lesson-grid">' +
      "<div>" +
      '<section class="lesson-step">' +
      '<div class="step-head"><span class="step-num">1</span><h2>What you\'ll learn</h2></div>' +
      paragraphs(m.explanation) +
      "</section>" +
      '<section class="lesson-step">' +
      '<div class="step-head"><span class="step-num">2</span><h2>Resources</h2></div>' +
      resourcesHtml +
      "</section>" +
      '<section class="lesson-step">' +
      '<div class="step-head"><span class="step-num">3</span><h2>Practice</h2></div>' +
      "<p>" +
      esc(m.practice) +
      "</p>" +
      "</section>" +
      (challenge
        ? '<section class="lesson-step"><div class="step-head"><span class="step-num">4</span><h2>Challenge</h2></div>' +
          challengeBlock(challenge, m) +
          "</section>"
        : "") +
      (quiz
        ? '<section class="lesson-step"><div class="step-head"><span class="step-num">5</span><h2>Quiz</h2></div>' +
          quizBlock(quiz, m) +
          "</section>"
        : "") +
      '<section class="lesson-step">' +
      '<div class="step-head"><span class="step-num">6</span><h2>Reflection</h2></div>' +
      "<p>" +
      esc(m.reflection) +
      "</p>" +
      '<label class="field"><span>Your answer (optional)</span>' +
      '<textarea data-reflection="' +
      esc(m.id) +
      '" rows="3">' +
      esc((bucket(accId).drafts["reflection_" + m.id] || {}).text || "") +
      "</textarea></label>" +
      "</section>" +
      '<section class="lesson-step">' +
      '<div class="step-head"><span class="step-num">7</span><h2>How was this lesson?</h2></div>' +
      '<p style="font-size:.88rem">Optional. Never graded.</p>' +
      '<div class="feedback-row">' +
      ["Clear", "Need an example", "Need help"]
        .map(
          (s) =>
            '<button type="button" class="btn sm" data-action="send-feedback" data-module="' +
            esc(m.id) +
            '" data-sentiment="' +
            esc(s) +
            '">' +
            esc(s) +
            "</button>",
        )
        .join("") +
      "</div>" +
      '<label class="field" style="margin-top:.8rem"><span>Add a note (optional)</span>' +
      '<input type="text" id="fb-note-' +
      esc(m.id) +
      '" placeholder="One sentence is plenty"></label>' +
      "</section>" +
      "</div>" +
      "<aside>" +
      '<div class="side-card">' +
      "<h3>Completion checklist</h3>" +
      (checkHtml || '<p class="muted small">No checklist items.</p>') +
      '<div style="border-top:1px solid var(--line);margin:.7rem 0"></div>' +
      '<button type="button" class="btn primary block" data-action="complete-module" data-id="' +
      esc(m.id) +
      '"' +
      (rec.status === "completed" ? " disabled" : "") +
      ">" +
      (rec.status === "completed" ? "✓ Completed" : "Mark complete") +
      "</button>" +
      "</div>" +
      '<div class="side-card">' +
      "<h3>Sessions</h3>" +
      (sessionsHtml
        ? '<ul class="session-list">' + sessionsHtml + "</ul>"
        : '<p class="muted small">No sessions listed.</p>') +
      "</div>" +
      "</aside>" +
      "</div>"
    );
  }

  function challengeBlock(challenge, module) {
    const accId = myId();
    const b = bucket(accId);
    const last = b.challengeResults
      .slice()
      .reverse()
      .find((r) => r.challengeId === challenge.id);
    const draft = b.drafts[module.id] || {
      html: challenge.starterHtml || "",
      css: challenge.starterCss || "",
      js: challenge.starterJs || "",
    };

    const checklistHtml =
      challenge.checkType === "checklist"
        ? '<div style="margin-top:.8rem">' +
          '<p style="font-size:.82rem;color:var(--muted);margin-bottom:.4rem">Tick each item honestly. This confirms self-check, not perfect code.</p>' +
          (challenge.checklist || [])
            .map(
              (item, i) =>
                '<label class="checklist-item"><input type="checkbox" data-action="toggle-challenge-check" data-challenge="' +
                esc(challenge.id) +
                '" data-module="' +
                esc(module.id) +
                '" data-index="' +
                i +
                '"><span>' +
                esc(item) +
                "</span></label>",
            )
            .join("") +
          "</div>"
        : '<p class="hint" style="margin-top:.6rem">Matches trimmed console output to <code>' +
          esc(challenge.expectedOutput) +
          "</code>. One match does not prove the whole program.</p>";

    return (
      "<p>" +
      esc(challenge.instructions) +
      "</p>" +
      ((challenge.hints || []).length
        ? '<details style="margin:.6rem 0"><summary style="cursor:pointer;font-size:.85rem;color:var(--violet);font-weight:700">Show hints</summary><ul style="font-size:.85rem;color:var(--ink-soft);margin-top:.4rem">' +
          challenge.hints.map((h) => "<li>" + esc(h) + "</li>").join("") +
          "</ul></details>"
        : "") +
      '<div class="pg-note" style="margin:.9rem 0">' +
      ICONS.warn +
      "<span>Run only code you trust. The preview is sandboxed but is not a hardened environment for arbitrary untrusted programs.</span></div>" +
      playgroundHtml(module.id, draft) +
      '<div class="row" style="margin-top:.9rem;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">' +
      '<button type="button" class="btn primary sm" data-action="check-challenge" data-challenge="' +
      esc(challenge.id) +
      '" data-module="' +
      esc(module.id) +
      '">Check my work</button>' +
      (last
        ? '<span class="chip ' +
          (last.passed ? "done" : "warn") +
          '">' +
          (last.passed ? "✓ Passed" : "Not passed") +
          " · " +
          esc(fmtDate(last.at)) +
          "</span>"
        : "") +
      "</div>" +
      '<p style="margin-top:.6rem;font-size:.82rem;color:var(--muted)"><strong>Sample:</strong> ' +
      esc(challenge.sampleResult || "—") +
      "</p>" +
      checklistHtml
    );
  }

  function quizBlock(quiz, module) {
    const b = bucket(myId());
    const attempts = b.quizAttempts.filter((a) => a.quizId === quiz.id);
    const last = attempts[attempts.length - 1];

    const qs = quiz.questions
      .map(
        (q, qi) =>
          '<div class="quiz-q">' +
          '<div class="qp">' +
          (qi + 1) +
          ". " +
          esc(q.prompt) +
          "</div>" +
          q.options
            .map(
              (opt, oi) =>
                '<label class="opt"><input type="radio" name="q_' +
                esc(q.id) +
                '" value="' +
                oi +
                '" required><span>' +
                esc(opt) +
                "</span></label>",
            )
            .join("") +
          "</div>",
      )
      .join("");

    return (
      '<form data-form="quiz-answer" data-quiz="' +
      esc(quiz.id) +
      '" data-module="' +
      esc(module.id) +
      '">' +
      qs +
      '<div style="margin-top:1rem"><button class="btn primary sm" type="submit">Check answers</button></div>' +
      "</form>" +
      (last
        ? '<div class="quiz-result ' +
          (last.score === last.total ? "good" : "mixed") +
          '">' +
          "Last attempt: <strong>" +
          last.score +
          " / " +
          last.total +
          "</strong> · " +
          esc(fmtDate(last.at)) +
          '<div style="font-size:.8rem;opacity:.8;margin-top:.2rem">Retries are unlimited and never penalised.</div>' +
          "</div>"
        : "")
    );
  }

  /* ---- Playground ---- */
  function playgroundHtml(scope, draft) {
    return (
      '<div class="playground" data-scope="' +
      esc(scope) +
      '">' +
      '<div class="pg-code"><span class="hint" style="display:block;margin-bottom:.3rem;font-family:var(--mono);font-weight:700">HTML</span>' +
      '<textarea data-code="html" aria-label="HTML">' +
      esc(draft.html) +
      "</textarea></div>" +
      '<div class="pg-code"><span class="hint" style="display:block;margin-bottom:.3rem;font-family:var(--mono);font-weight:700">CSS</span>' +
      '<textarea data-code="css" aria-label="CSS">' +
      esc(draft.css) +
      "</textarea></div>" +
      '<div class="pg-code"><span class="hint" style="display:block;margin-bottom:.3rem;font-family:var(--mono);font-weight:700">JavaScript</span>' +
      '<textarea data-code="js" aria-label="JavaScript">' +
      esc(draft.js) +
      "</textarea></div>" +
      '<div class="pg-actions">' +
      '<button class="btn primary sm" type="button" data-action="run-code" data-scope="' +
      esc(scope) +
      '">' +
      ICONS.play +
      " Run</button>" +
      '<button class="btn sm" type="button" data-action="reset-code" data-scope="' +
      esc(scope) +
      '">Reset</button>' +
      '<button class="btn sm ghost" type="button" data-action="save-draft" data-scope="' +
      esc(scope) +
      '">Save draft</button>' +
      "</div>" +
      '<div class="pg-preview"><iframe data-sandbox="' +
      esc(scope) +
      '" title="Preview" sandbox="allow-scripts"></iframe></div>' +
      '<pre class="pg-out" data-output="' +
      esc(scope) +
      '" aria-live="polite">Console output appears here after you click Run.</pre>' +
      "</div>"
    );
  }

  function studentPlayground() {
    const draft = bucket(myId()).drafts["__sandbox__"] || {
      html: '<h1>Journey to Mars</h1>\n<p id="fact">Press the button.</p>\n<button id="next" type="button">Show a fact</button>',
      css: "body { font-family: system-ui, sans-serif; padding: 1.5rem; line-height: 1.6; }\nbutton { padding: .6rem 1rem; border-radius: 8px; }",
      js: "const facts = ['Olympus Mons is the tallest volcano in the solar system.', 'A Mars day lasts 24 hours 37 minutes.'];\nconst out = document.querySelector('#fact');\ndocument.querySelector('#next').addEventListener('click', () => {\n  out.textContent = facts[Math.floor(Math.random() * facts.length)];\n});",
    };
    return (
      '<div class="greeting"><h1 id="main-heading">Playground</h1><p>A safe space to try HTML, CSS and JavaScript. Drafts stay in this browser.</p></div>' +
      '<div class="pg-note" style="margin-bottom:1rem">' +
      ICONS.warn +
      "<span>Run only code you trust. The preview is sandboxed but not a hardened environment for arbitrary untrusted programs.</span></div>" +
      '<div class="panel">' +
      playgroundHtml("__sandbox__", draft) +
      "</div>"
    );
  }

  /* ---- Terminal ---- */
  function studentTerminal() {
    const jsLen = (bucket(myId()).drafts["__sandbox__"] || {}).js?.length || 0;
    return (
      '<div class="greeting"><h1 id="main-heading">Terminal</h1><p>A fixed set of simulated commands. No operating-system commands are ever executed.</p></div>' +
      '<div class="term" style="margin-bottom:1rem">' +
      '<div class="term-out" id="term-out"><span class="prompt">orbit:~$</span> Type <span class="cmd">help</span> to see commands.\n</div>' +
      '<form class="term-in" data-form="terminal">' +
      "<span>orbit:~$</span>" +
      '<input type="text" name="cmd" id="term-input" autocomplete="off" spellcheck="false" aria-label="Command" placeholder="help">' +
      "</form>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><h2>Supported commands</h2></div>' +
      '<ul style="font-size:.88rem;color:var(--ink-soft);padding-left:1.1rem;line-height:1.9">' +
      "<li><code>help</code> — list commands</li>" +
      "<li><code>clear</code> — clear screen</li>" +
      "<li><code>lessons</code> — list modules</li>" +
      "<li><code>progress</code> — your local progress</li>" +
      "<li><code>run index.js</code> — run your saved playground JavaScript</li>" +
      "<li><code>starmap</code> — a small astronomy easter egg</li>" +
      "</ul>" +
      '<p class="hint" style="margin-top:.5rem">Saved JavaScript: ' +
      jsLen +
      " characters.</p>" +
      "</div>"
    );
  }

  function termPrint(text, cls) {
    const out = $("#term-out");
    if (!out) return;
    const s = document.createElement("span");
    if (cls) s.className = cls;
    s.textContent = text + "\n";
    out.appendChild(s);
    out.scrollTop = out.scrollHeight;
  }
  async function handleTerminalCommand(raw) {
    const cmd = String(raw || "").trim();
    if (!cmd) return;
    termPrint("orbit:~$ " + cmd, "cmd");
    if (cmd === "help") {
      termPrint(
        "Commands: help, clear, lessons, progress, run index.js, starmap",
      );
      return;
    }
    if (cmd === "clear") {
      const o = $("#term-out");
      if (o) o.textContent = "";
      return;
    }
    if (cmd === "lessons") {
      const list = publishedModules();
      if (!list.length) {
        termPrint("No published modules yet.");
        return;
      }
      list.forEach((m, i) =>
        termPrint(
          "  " +
            (i + 1) +
            ". " +
            m.title +
            "  (" +
            m.estimatedMinutes +
            " min)",
        ),
      );
      return;
    }
    if (cmd === "progress") {
      const accId = myId();
      termPrint(
        "  Completed: " +
          completedCount(accId) +
          " / " +
          publishedModules().length,
      );
      termPrint("  Quiz attempts: " + bucket(accId).quizAttempts.length);
      termPrint(
        "  Challenges passed: " +
          bucket(accId).challengeResults.filter((c) => c.passed).length,
      );
      return;
    }
    if (cmd === "run index.js") {
      const code = (bucket(myId()).drafts["__sandbox__"] || {}).js || "";
      if (!code.trim()) {
        termPrint(
          "index.js is empty. Save a draft in the Playground first.",
          "err",
        );
        return;
      }
      termPrint("  Running index.js in the sandboxed preview…");
      const output = await runSandboxAsync(code);
      if (!output) termPrint("  (no console output)");
      else output.split("\n").forEach((l) => termPrint("  " + l));
      return;
    }
    if (cmd === "starmap") {
      termPrint("        .        *      .");
      termPrint("   *        .       .        *");
      termPrint("        .       ☉  →  Mars");
      termPrint(
        "   Mars is about 225 million km away. That is a lot of very slow travel.",
      );
      return;
    }
    termPrint("Unknown command: " + cmd + '. Type "help".', "err");
  }

  /* ---- Timer ---- */
  function studentTimer() {
    const sessions = bucket(myId()).studySessions;
    const totalSec = sessions.reduce((s, x) => s + (x.seconds || 0), 0);
    const rows = sessions.length
      ? sessions
          .slice()
          .reverse()
          .map(
            (s) =>
              "<li><span>" +
              fmtDur(s.seconds) +
              ' · <span style="color:var(--muted);font-size:.78rem">' +
              esc(fmtDate(s.at)) +
              "</span></span>" +
              '<button class="btn sm danger" type="button" data-action="delete-session" data-id="' +
              esc(s.id) +
              '">Delete</button></li>',
          )
          .join("")
      : "";

    return (
      '<div class="greeting"><h1 id="main-heading">Study timer</h1><p>An estimate of time spent, not proof of attention. Nothing runs in the background.</p></div>' +
      '<div class="timer-card" style="margin-bottom:1.4rem">' +
      '<div class="timer-display" id="timer-display">' +
      fmtClock(timer.seconds) +
      "</div>" +
      '<div class="timer-label">Focus session</div>' +
      '<div class="timer-actions">' +
      '<button class="btn primary" type="button" data-action="timer-start"' +
      (timer.running ? " disabled" : "") +
      ">Start</button>" +
      '<button class="btn" type="button" data-action="timer-pause"' +
      (timer.running ? "" : " disabled") +
      ">Pause</button>" +
      '<button class="btn teal" type="button" data-action="timer-stop">Stop &amp; save</button>' +
      "</div>" +
      '<label class="check" style="margin-top:1rem;justify-content:center">' +
      '<input type="checkbox" id="timer-record"' +
      (timer.record ? " checked" : "") +
      ">" +
      "<span>Record and show to my teacher</span>" +
      "</label>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><h2>Recorded sessions</h2><span class="chip">' +
      fmtDur(totalSec) +
      " total</span></div>" +
      (rows
        ? '<ul class="session-list">' + rows + "</ul>"
        : '<div class="empty"><div class="em">⏱</div><p>No sessions recorded yet.</p></div>') +
      "</div>"
    );
  }
  function updateTimerDisplay() {
    const el = $("#timer-display");
    if (el) el.textContent = fmtClock(timer.seconds);
  }
  function startTimer() {
    if (timer.running) return;
    timer.running = true;
    timer.intervalId = setInterval(() => {
      timer.seconds += 1;
      updateTimerDisplay();
    }, 1000);
    render();
  }
  function pauseTimer() {
    if (!timer.running) return;
    timer.running = false;
    clearInterval(timer.intervalId);
    timer.intervalId = null;
    render();
  }
  function stopTimer() {
    const recEl = $("#timer-record");
    const should = recEl ? recEl.checked : timer.record;
    timer.running = false;
    clearInterval(timer.intervalId);
    timer.intervalId = null;
    if (timer.seconds > 0 && should) {
      bucket(myId()).studySessions.push({
        id: uid("s"),
        seconds: timer.seconds,
        at: nowISO(),
      });
      save();
      toast("Session saved: " + fmtDur(timer.seconds));
    } else if (timer.seconds > 0) {
      toast("Session discarded (recording off).");
    }
    timer.seconds = 0;
    render();
  }

  function studentData() {
    return dataView();
  }

  /* ==================== SANDBOX ==================== */
  const SANDBOX_BOOT =
    "<scr" +
    "ipt>" +
    "(function(){" +
    '  function f(v){ try { return typeof v === "string" ? v : JSON.stringify(v); } catch(e){ return String(v); } }' +
    '  function s(t,x){ parent.postMessage({ __orbit:true, type:t, text:String(x) }, "*"); }' +
    '  ["log","warn","error","info"].forEach(function(k){' +
    "    var o = console[k] ? console[k].bind(console) : function(){};" +
    "    console[k] = function(){" +
    '      var p = [].slice.call(arguments).map(f).join(" ");' +
    "      o.apply(null, arguments);" +
    '      s(k === "error" ? "error" : "log", p);' +
    "    };" +
    "  });" +
    '  window.onerror = function(m, src, ln){ s("error", m + " (line " + ln + ")"); return true; };' +
    '  window.addEventListener("unhandledrejection", function(e){' +
    '    var r = e.reason; s("error", "Unhandled: " + (r && r.message ? r.message : r));' +
    "  });" +
    '  window.addEventListener("message", function(e){' +
    '    if (!e.data || e.data.type !== "orbit:run") return;' +
    "    try { new Function(e.data.code)(); }" +
    '    catch (err) { s("error", (err && err.message) ? err.message : String(err)); }' +
    '    s("done", "");' +
    "  });" +
    "})();" +
    "</scr" +
    "ipt>";

  function buildDoc(html, css) {
    return (
      '<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;font-family:system-ui,sans-serif;color:#111;background:#fff}' +
      String(css || "").replace(/<\/style/gi, "<\\/style") +
      "</style></head><body>" +
      String(html || "") +
      SANDBOX_BOOT +
      "</body></html>"
    );
  }

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.__orbit !== true || typeof data.type !== "string") return;
    for (const [iframe, handler] of sandboxHandlers) {
      if (iframe.contentWindow === event.source) {
        handler(data);
        return;
      }
    }
  });

  function runSandbox(iframe, parts, onEvent) {
    sandboxHandlers.set(iframe, onEvent);
    iframe.onload = () => {
      try {
        iframe.contentWindow.postMessage(
          { type: "orbit:run", code: parts.js || "" },
          "*",
        );
      } catch {
        onEvent({ type: "error", text: "Could not start preview." });
      }
    };
    iframe.srcdoc = buildDoc(parts.html, parts.css);
  }

  function runSandboxAsync(code) {
    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.setAttribute("sandbox", "allow-scripts");
      iframe.style.cssText =
        "position:absolute;width:0;height:0;border:0;visibility:hidden;";
      const lines = [];
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        sandboxHandlers.delete(iframe);
        iframe.remove();
        resolve(lines.join("\n"));
      };
      sandboxHandlers.set(iframe, (d) => {
        if (d.type === "log" || d.type === "error") lines.push(d.text);
        else if (d.type === "done") finish();
      });
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow.postMessage(
            { type: "orbit:run", code: code || "" },
            "*",
          );
        } catch {
          finish();
        }
      };
      iframe.srcdoc = buildDoc("", "");
      setTimeout(finish, 5000);
    });
  }

  /* ==================== EXPORT / IMPORT ==================== */
  function download(name, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const stamp = () =>
    new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  function exportCurriculum() {
    download("orbit-curriculum-" + stamp() + ".json", {
      kind: "orbit-curriculum",
      schemaVersion: SCHEMA_VERSION,
      exportedAt: nowISO(),
      curriculum: state.curriculum,
    });
    toast("Curriculum exported.");
  }
  function exportProgress() {
    const accId = myId();
    download("orbit-progress-" + accId + "-" + stamp() + ".json", {
      kind: "orbit-progress",
      schemaVersion: SCHEMA_VERSION,
      exportedAt: nowISO(),
      accountId: accId,
      progress: bucket(accId),
    });
    toast("Progress exported.");
  }
  function exportFull() {
    download("orbit-full-backup-" + stamp() + ".json", {
      kind: "orbit-full",
      schemaVersion: SCHEMA_VERSION,
      exportedAt: nowISO(),
      state: state,
    });
    toast("Full backup exported.");
  }

  function validateImport(d) {
    if (!d || typeof d !== "object") return "The file is not a JSON object.";
    if (!d.kind) return 'The file has no "kind" field.';
    if (!["orbit-curriculum", "orbit-progress", "orbit-full"].includes(d.kind))
      return "Unknown file kind: " + d.kind;
    if (typeof d.schemaVersion !== "number") return "No schema version.";
    if (d.schemaVersion !== SCHEMA_VERSION)
      return (
        "Schema v" +
        d.schemaVersion +
        " does not match v" +
        SCHEMA_VERSION +
        "."
      );
    if (
      d.kind === "orbit-curriculum" &&
      (!d.curriculum || !Array.isArray(d.curriculum.modules))
    )
      return "Missing modules array.";
    if (
      d.kind === "orbit-progress" &&
      (!d.progress || typeof d.progress !== "object")
    )
      return "Missing progress object.";
    if (d.kind === "orbit-full" && (!d.state || !d.state.curriculum))
      return "Missing state object.";
    return null;
  }

  function previewImport(d) {
    if (d.kind === "orbit-curriculum") {
      const mods = d.curriculum.modules || [];
      const ids = new Set(mods.map((m) => m.id));
      const dup = mods.length - ids.size;
      const match = mods.filter((m) => findModule(m.id)).length;
      return (
        "<p>This file contains <strong>" +
        mods.length +
        "</strong> modules, <strong>" +
        (d.curriculum.resources || []).length +
        "</strong> resources, <strong>" +
        (d.curriculum.challenges || []).length +
        "</strong> challenges, <strong>" +
        (d.curriculum.quizzes || []).length +
        "</strong> quizzes.</p>" +
        '<p class="hint">' +
        match +
        " module IDs already exist and will be replaced. " +
        (mods.length - match) +
        " are new.</p>" +
        (dup > 0
          ? '<p class="chip warn">' +
            dup +
            " duplicate IDs — last one wins.</p>"
          : "") +
        '<p class="hint">Learner progress for matching IDs will be kept. Changed lesson versions keep separate progress.</p>'
      );
    }
    if (d.kind === "orbit-progress") {
      const p = d.progress;
      return (
        "<p>Progress for <strong>" +
        esc(d.accountId || "unknown") +
        "</strong>.</p>" +
        '<p class="hint">' +
        Object.keys(p.moduleRecords || {}).length +
        " module records, " +
        (p.quizAttempts || []).length +
        " quiz attempts, " +
        (p.challengeResults || []).length +
        " challenge results, " +
        (p.feedback || []).length +
        " feedback entries.</p>" +
        '<p class="hint">Replaces progress for your account only. Curriculum untouched.</p>'
      );
    }
    return (
      "<p>Full backup from <strong>" +
      esc(d.exportedAt || "—") +
      "</strong>. Will replace both curriculum and progress.</p>"
    );
  }

  function applyImport(d) {
    download("orbit-pre-import-backup-" + stamp() + ".json", {
      kind: "orbit-full",
      schemaVersion: SCHEMA_VERSION,
      exportedAt: nowISO(),
      state: state,
    });
    if (d.kind === "orbit-curriculum") {
      const seen = new Map();
      (d.curriculum.modules || []).forEach((m) => seen.set(m.id, m));
      state.curriculum = {
        modules: Array.from(seen.values()),
        resources: d.curriculum.resources || [],
        challenges: d.curriculum.challenges || [],
        quizzes: d.curriculum.quizzes || [],
        polls: d.curriculum.polls || [],
      };
      save();
      toast("Curriculum imported. Progress preserved.");
    } else if (d.kind === "orbit-progress") {
      state.progress[myId()] = d.progress;
      save();
      toast("Progress imported.");
    } else {
      state.curriculum = d.state.curriculum;
      state.progress = d.state.progress || {};
      if (d.state.ui) state.ui = d.state.ui;
      save();
      toast("Full backup restored.");
    }
    render();
  }

  function handleImportFile(file) {
    const r = new FileReader();
    r.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(String(r.result));
      } catch {
        toast("File is not valid JSON. Nothing was changed.");
        return;
      }
      const err = validateImport(parsed);
      if (err) {
        toast(err);
        return;
      }
      pendingImport = parsed;
      openConfirm(
        "Preview import",
        previewImport(parsed),
        () => {
          try {
            applyImport(pendingImport);
          } catch (e) {
            toast("Import failed: " + e.message);
          }
          pendingImport = null;
        },
        "Confirm import",
      );
    };
    r.onerror = () => toast("Could not read file.");
    r.readAsText(file);
  }

  /* ==================== FORMS ==================== */
  function moduleFormHtml(m) {
    const isNew = !m;
    const d = m || {
      title: "",
      goal: "",
      estimatedMinutes: 60,
      explanation: "",
      practice: "",
      reflection: "",
      challengeId: "",
      quizId: "",
      resourceIds: [],
      sessions: [],
      checklist: [],
      published: false,
    };
    const resChecks = state.curriculum.resources
      .map(
        (r) =>
          '<label class="check"><input type="checkbox" name="res" value="' +
          esc(r.id) +
          '"' +
          ((d.resourceIds || []).includes(r.id) ? " checked" : "") +
          "><span>" +
          esc(r.title) +
          ' <span class="hint">(' +
          esc(r.type) +
          ")</span></span></label>",
      )
      .join("");
    const chOpts = ['<option value="">— none —</option>']
      .concat(
        state.curriculum.challenges.map(
          (c) =>
            '<option value="' +
            esc(c.id) +
            '"' +
            (d.challengeId === c.id ? " selected" : "") +
            ">" +
            esc(c.title) +
            "</option>",
        ),
      )
      .join("");
    const qOpts = ['<option value="">— none —</option>']
      .concat(
        state.curriculum.quizzes.map(
          (q) =>
            '<option value="' +
            esc(q.id) +
            '"' +
            (d.quizId === q.id ? " selected" : "") +
            ">" +
            esc(q.title) +
            "</option>",
        ),
      )
      .join("");
    const sessText = (d.sessions || [])
      .map((s) => s.title + " | " + s.minutes)
      .join("\n");

    return (
      '<form data-form="module" data-id="' +
      (m ? esc(m.id) : "") +
      '">' +
      '<label class="field"><span>Title</span><input type="text" name="title" required value="' +
      esc(d.title) +
      '"></label>' +
      '<label class="field"><span>Goal</span><textarea name="goal" rows="2" required>' +
      esc(d.goal) +
      "</textarea></label>" +
      '<div class="form-grid">' +
      '<label class="field"><span>Minutes</span><input type="number" name="minutes" min="10" max="600" step="5" value="' +
      esc(d.estimatedMinutes) +
      '"></label>' +
      '<label class="field"><span>Challenge</span><select name="challengeId">' +
      chOpts +
      "</select></label>" +
      '<label class="field"><span>Quiz</span><select name="quizId">' +
      qOpts +
      "</select></label>" +
      "</div>" +
      '<label class="field"><span>Explanation</span><textarea name="explanation" rows="6">' +
      esc(d.explanation) +
      "</textarea></label>" +
      '<label class="field"><span>Practice task</span><textarea name="practice" rows="2">' +
      esc(d.practice) +
      "</textarea></label>" +
      '<label class="field"><span>Reflection question</span><textarea name="reflection" rows="2">' +
      esc(d.reflection) +
      "</textarea></label>" +
      '<label class="field"><span>Sessions — "Title | minutes" per line</span><textarea name="sessions" rows="3">' +
      esc(sessText) +
      "</textarea></label>" +
      '<label class="field"><span>Checklist — one item per line</span><textarea name="checklist" rows="3">' +
      esc((d.checklist || []).join("\n")) +
      "</textarea></label>" +
      "<fieldset><legend>Resources</legend>" +
      (resChecks || '<p class="hint">No resources yet.</p>') +
      "</fieldset>" +
      '<label class="check"><input type="checkbox" name="published"' +
      (d.published ? " checked" : "") +
      "><span>Published (visible to students)</span></label>" +
      '<div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:1rem">' +
      '<button type="button" class="btn ghost" data-action="modal-close">Cancel</button>' +
      '<button type="submit" class="btn primary">' +
      (isNew ? "Create module" : "Save changes") +
      "</button>" +
      "</div>" +
      "</form>"
    );
  }
  function moduleSig(m) {
    return JSON.stringify([
      m.title,
      m.goal,
      m.estimatedMinutes,
      m.explanation,
      m.practice,
      m.reflection,
      m.challengeId,
      m.quizId,
      m.resourceIds,
      m.sessions,
      m.checklist,
    ]);
  }

  function resourceFormHtml(r) {
    const d = r || {
      type: "link",
      title: "",
      url: "",
      description: "",
      body: "",
      needsVerification: false,
    };
    return (
      '<form data-form="resource" data-id="' +
      (r ? esc(r.id) : "") +
      '">' +
      '<div class="form-grid">' +
      '<label class="field"><span>Title</span><input type="text" name="title" required value="' +
      esc(d.title) +
      '"></label>' +
      '<label class="field"><span>Type</span><select name="type">' +
      ["link", "note", "snippet"]
        .map(
          (t) =>
            '<option value="' +
            t +
            '"' +
            (d.type === t ? " selected" : "") +
            ">" +
            t +
            "</option>",
        )
        .join("") +
      "</select></label>" +
      "</div>" +
      '<label class="field"><span>URL (links only)</span><input type="url" name="url" value="' +
      esc(d.url) +
      '" placeholder="https://…"></label>' +
      '<label class="field"><span>Description</span><textarea name="description" rows="2">' +
      esc(d.description) +
      "</textarea></label>" +
      '<label class="field"><span>Body</span><textarea name="body" rows="6" style="font-family:var(--mono);font-size:.82rem">' +
      esc(d.body) +
      "</textarea></label>" +
      '<label class="check"><input type="checkbox" name="needsVerification"' +
      (d.needsVerification ? " checked" : "") +
      "><span>Needs verification (link unvetted)</span></label>" +
      '<div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:1rem">' +
      '<button type="button" class="btn ghost" data-action="modal-close">Cancel</button>' +
      '<button type="submit" class="btn primary">Publish to this browser</button>' +
      "</div>" +
      "</form>"
    );
  }

  function challengeFormHtml(c) {
    const d = c || {
      title: "",
      instructions: "",
      starterHtml: "",
      starterCss: "",
      starterJs: "",
      hints: [],
      sampleResult: "",
      checkType: "checklist",
      expectedOutput: "",
      checklist: [],
    };
    return (
      '<form data-form="challenge" data-id="' +
      (c ? esc(c.id) : "") +
      '">' +
      '<label class="field"><span>Title</span><input type="text" name="title" required value="' +
      esc(d.title) +
      '"></label>' +
      '<label class="field"><span>Instructions</span><textarea name="instructions" rows="3">' +
      esc(d.instructions) +
      "</textarea></label>" +
      "<fieldset><legend>Starter code</legend>" +
      '<label class="field"><span>HTML</span><textarea name="starterHtml" rows="4" style="font-family:var(--mono);font-size:.82rem">' +
      esc(d.starterHtml) +
      "</textarea></label>" +
      '<label class="field"><span>CSS</span><textarea name="starterCss" rows="3" style="font-family:var(--mono);font-size:.82rem">' +
      esc(d.starterCss) +
      "</textarea></label>" +
      '<label class="field"><span>JavaScript</span><textarea name="starterJs" rows="4" style="font-family:var(--mono);font-size:.82rem">' +
      esc(d.starterJs) +
      "</textarea></label>" +
      "</fieldset>" +
      '<label class="field"><span>Hints — one per line</span><textarea name="hints" rows="2">' +
      esc((d.hints || []).join("\n")) +
      "</textarea></label>" +
      '<label class="field"><span>Sample result (shown as text)</span><textarea name="sampleResult" rows="2">' +
      esc(d.sampleResult) +
      "</textarea></label>" +
      "<fieldset><legend>Checking method</legend>" +
      '<label class="check"><input type="radio" name="checkType" value="checklist"' +
      (d.checkType === "checklist" ? " checked" : "") +
      "><span>Learner self-check checklist</span></label>" +
      '<label class="check"><input type="radio" name="checkType" value="console"' +
      (d.checkType === "console" ? " checked" : "") +
      "><span>Console output match</span></label>" +
      '<label class="field" style="margin-top:.6rem"><span>Expected console output</span><input type="text" name="expectedOutput" value="' +
      esc(d.expectedOutput) +
      '"></label>' +
      '<label class="field"><span>Checklist items</span><textarea name="checklist" rows="3">' +
      esc((d.checklist || []).join("\n")) +
      "</textarea></label>" +
      "</fieldset>" +
      '<div style="display:flex;gap:.6rem;justify-content:flex-end">' +
      '<button type="button" class="btn ghost" data-action="modal-close">Cancel</button>' +
      '<button type="submit" class="btn primary">Save challenge</button>' +
      "</div>" +
      "</form>"
    );
  }

  function quizFormHtml(quiz) {
    const d = quiz || {
      title: "",
      questions: [
        { prompt: "", options: ["", "", "", ""], answer: 0, explanation: "" },
      ],
    };
    const qs = d.questions
      .map(
        (q, i) =>
          '<fieldset data-qindex="' +
          i +
          '">' +
          "<legend>Question " +
          (i + 1) +
          "</legend>" +
          '<label class="field"><span>Prompt</span><input type="text" name="prompt_' +
          i +
          '" value="' +
          esc(q.prompt) +
          '"></label>' +
          [0, 1, 2, 3]
            .map(
              (oi) =>
                '<label class="field"><span>Option ' +
                (oi + 1) +
                (q.answer === oi ? " (correct)" : "") +
                '</span><input type="text" name="opt_' +
                i +
                "_" +
                oi +
                '" value="' +
                esc(q.options[oi] || "") +
                '"></label>',
            )
            .join("") +
          '<label class="field"><span>Correct option (1–4)</span><input type="number" name="ans_' +
          i +
          '" min="1" max="4" value="' +
          (q.answer + 1) +
          '"></label>' +
          '<label class="field"><span>Explanation</span><input type="text" name="exp_' +
          i +
          '" value="' +
          esc(q.explanation) +
          '"></label>' +
          '<button type="button" class="btn sm danger" data-action="remove-question" data-index="' +
          i +
          '">Remove question</button>' +
          "</fieldset>",
      )
      .join("");
    return (
      '<form data-form="quiz" data-id="' +
      (quiz ? esc(quiz.id) : "") +
      '">' +
      '<label class="field"><span>Quiz title</span><input type="text" name="title" required value="' +
      esc(d.title) +
      '"></label>' +
      '<div id="quiz-questions">' +
      qs +
      "</div>" +
      '<button type="button" class="btn ghost sm" data-action="add-question">+ Add question</button>' +
      '<div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:1rem">' +
      '<button type="button" class="btn ghost" data-action="modal-close">Cancel</button>' +
      '<button type="submit" class="btn primary">Save quiz</button>' +
      "</div>" +
      "</form>"
    );
  }

  function pollFormHtml(p) {
    const d = p || { title: "", question: "", options: ["", "", ""] };
    return (
      '<form data-form="poll" data-id="' +
      (p ? esc(p.id) : "") +
      '">' +
      '<label class="field"><span>Title</span><input type="text" name="title" required value="' +
      esc(d.title) +
      '"></label>' +
      '<label class="field"><span>Question</span><input type="text" name="question" required value="' +
      esc(d.question) +
      '"></label>' +
      '<label class="field"><span>Options — one per line</span><textarea name="options" rows="4">' +
      esc(d.options.join("\n")) +
      "</textarea></label>" +
      '<div style="display:flex;gap:.6rem;justify-content:flex-end">' +
      '<button type="button" class="btn ghost" data-action="modal-close">Cancel</button>' +
      '<button type="submit" class="btn primary">Save poll</button>' +
      "</div>" +
      "</form>"
    );
  }

  function collectQuizForm(form) {
    const questions = [];
    $$("fieldset[data-qindex]", form).forEach((fs, i) => {
      const prompt = form.querySelector('[name="prompt_' + i + '"]');
      const exp = form.querySelector('[name="exp_' + i + '"]');
      const ans = form.querySelector('[name="ans_' + i + '"]');
      const opts = [0, 1, 2, 3].map((k) => {
        const el = form.querySelector('[name="opt_' + i + "_" + k + '"]');
        return el ? el.value : "";
      });
      questions.push({
        id: "q_" + i + "_" + Math.random().toString(36).slice(2, 6),
        prompt: prompt ? prompt.value : "",
        options: opts,
        answer: Math.max(0, Math.min(3, (Number(ans && ans.value) || 1) - 1)),
        explanation: exp ? exp.value : "",
      });
    });
    return {
      id: form.dataset.id || null,
      title: form.querySelector('[name="title"]').value,
      questions,
    };
  }

  /* ==================== CLICK HANDLER ==================== */
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-action]");
    if (!t) {
      if (e.target.classList && e.target.classList.contains("modal-backdrop"))
        closeModal();
      return;
    }
    const action = t.dataset.action;
    const id = t.dataset.id;

    switch (action) {
      case "modal-close":
        closeModal();
        break;

      case "toggle-theme":
        state.ui.theme = state.ui.theme === "dark" ? "light" : "dark";
        save();
        render();
        break;

      case "toggle-sidebar": {
        $("#sidebar")?.classList.add("open");
        $(".sidebar-backdrop")?.classList.add("show");
        break;
      }
      case "close-sidebar": {
        $("#sidebar")?.classList.remove("open");
        $(".sidebar-backdrop")?.classList.remove("show");
        break;
      }
      case "logout":
        state.session = null;
        save();
        loginDraft.selectedId = "stu-aarav";
        go("login");
        break;

      case "login-role":
        loginDraft.role = t.dataset.role;
        render();
        break;

      case "visitor-login":
        state.session = { accountId: VISITOR.id, role: "student" };
        save();
        go("student");
        break;

      case "promo-timer":
        go("student/timer");
        break;

      /* teacher: modules */
      case "add-module":
        openModal("New module", moduleFormHtml(null), { wide: true });
        break;
      case "edit-module": {
        const m = findModule(id);
        if (m) openModal("Edit module", moduleFormHtml(m), { wide: true });
        break;
      }
      case "delete-module": {
        const m = findModule(id);
        if (!m) break;
        openConfirm(
          "Delete module?",
          "<p>Delete <strong>" +
            esc(m.title) +
            "</strong>? Learner progress records stay in storage.</p>",
          () => {
            state.curriculum.modules = state.curriculum.modules.filter(
              (x) => x.id !== id,
            );
            state.curriculum.modules.forEach((x, i) => (x.order = i + 1));
            save();
            render();
            toast("Module deleted.");
          },
          "Delete",
        );
        break;
      }
      case "move-up":
      case "move-down": {
        const list = state.curriculum.modules
          .slice()
          .sort((a, b) => a.order - b.order);
        const i = list.findIndex((m) => m.id === id);
        const j = action === "move-up" ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= list.length) break;
        [list[i], list[j]] = [list[j], list[i]];
        list.forEach((m, k) => (m.order = k + 1));
        state.curriculum.modules = list;
        save();
        render();
        break;
      }
      case "toggle-publish": {
        const m = findModule(id);
        if (!m) break;
        m.published = !m.published;
        save();
        render();
        toast(m.published ? "Published." : "Unpublished.");
        break;
      }

      /* teacher: resources */
      case "add-resource":
        openModal("New resource", resourceFormHtml(null), { wide: true });
        break;
      case "edit-resource": {
        const r = state.curriculum.resources.find((x) => x.id === id);
        if (r) openModal("Edit resource", resourceFormHtml(r), { wide: true });
        break;
      }
      case "preview-resource": {
        const r = state.curriculum.resources.find((x) => x.id === id);
        if (!r) break;
        openModal(
          "Preview: " + r.title,
          '<div class="resource-card"><div class="ico">' +
            ICONS.arrowR +
            '</div><div class="meta">' +
            '<div class="r-title">' +
            esc(r.title) +
            "</div>" +
            (r.description
              ? '<div class="r-desc">' + esc(r.description) + "</div>"
              : "") +
            (r.url
              ? '<p style="margin-top:.4rem"><a href="' +
                esc(r.url) +
                '" target="_blank" rel="noopener noreferrer">' +
                esc(r.url) +
                "</a></p>"
              : "") +
            (r.body
              ? r.type === "snippet"
                ? "<pre>" + esc(r.body) + "</pre>"
                : "<p>" + esc(r.body) + "</p>"
              : "") +
            "</div></div>",
        );
        break;
      }
      case "delete-resource":
        openConfirm(
          "Delete resource?",
          "<p>This removes it from the library and any module referencing it.</p>",
          () => {
            state.curriculum.resources = state.curriculum.resources.filter(
              (r) => r.id !== id,
            );
            state.curriculum.modules.forEach(
              (m) =>
                (m.resourceIds = (m.resourceIds || []).filter(
                  (rid) => rid !== id,
                )),
            );
            save();
            render();
            toast("Resource deleted.");
          },
          "Delete",
        );
        break;

      /* teacher: challenges */
      case "add-challenge":
        openModal("New challenge", challengeFormHtml(null), { wide: true });
        break;
      case "edit-challenge": {
        const c = state.curriculum.challenges.find((x) => x.id === id);
        if (c)
          openModal("Edit challenge", challengeFormHtml(c), { wide: true });
        break;
      }
      case "delete-challenge":
        openConfirm(
          "Delete challenge?",
          "<p>Modules referencing it will have no challenge.</p>",
          () => {
            state.curriculum.challenges = state.curriculum.challenges.filter(
              (c) => c.id !== id,
            );
            state.curriculum.modules.forEach((m) => {
              if (m.challengeId === id) m.challengeId = "";
            });
            save();
            render();
            toast("Challenge deleted.");
          },
          "Delete",
        );
        break;

      /* teacher: quizzes + polls */
      case "add-quiz":
        openModal("New quiz", quizFormHtml(null), { wide: true });
        break;
      case "edit-quiz": {
        const q = state.curriculum.quizzes.find((x) => x.id === id);
        if (q) openModal("Edit quiz", quizFormHtml(q), { wide: true });
        break;
      }
      case "add-question": {
        const form = $('form[data-form="quiz"]');
        if (!form) break;
        const draft = collectQuizForm(form);
        draft.questions.push({
          prompt: "",
          options: ["", "", "", ""],
          answer: 0,
          explanation: "",
        });
        openModal(
          form.dataset.id ? "Edit quiz" : "New quiz",
          quizFormHtml(draft),
          { wide: true },
        );
        break;
      }
      case "remove-question": {
        const form = $('form[data-form="quiz"]');
        if (!form) break;
        const draft = collectQuizForm(form);
        if (draft.questions.length <= 1) {
          toast("A quiz needs at least one question.");
          break;
        }
        draft.questions.splice(Number(t.dataset.index), 1);
        openModal(
          form.dataset.id ? "Edit quiz" : "New quiz",
          quizFormHtml(draft),
          { wide: true },
        );
        break;
      }
      case "delete-quiz":
        openConfirm(
          "Delete quiz?",
          "<p>Modules referencing it will have no quiz.</p>",
          () => {
            state.curriculum.quizzes = state.curriculum.quizzes.filter(
              (q) => q.id !== id,
            );
            state.curriculum.modules.forEach((m) => {
              if (m.quizId === id) m.quizId = "";
            });
            save();
            render();
            toast("Quiz deleted.");
          },
          "Delete",
        );
        break;
      case "add-poll":
        openModal("New poll", pollFormHtml(null));
        break;
      case "edit-poll": {
        const p = state.curriculum.polls.find((x) => x.id === id);
        if (p) openModal("Edit poll", pollFormHtml(p));
        break;
      }
      case "delete-poll":
        openConfirm(
          "Delete poll?",
          "<p>It will disappear from the student roadmap.</p>",
          () => {
            state.curriculum.polls = state.curriculum.polls.filter(
              (p) => p.id !== id,
            );
            save();
            render();
            toast("Poll deleted.");
          },
          "Delete",
        );
        break;

      /* student: lesson */
      case "toggle-checklist": {
        const m = findModule(t.dataset.module);
        if (!m) break;
        const r = readRecord(myId(), m);
        const cl = Object.assign({}, r.checklist || {});
        cl[t.dataset.index] = t.checked;
        writeRecord(myId(), m, { checklist: cl });
        save();
        break;
      }
      case "complete-module": {
        const m = findModule(id);
        if (!m) break;
        writeRecord(myId(), m, { status: "completed", completedAt: nowISO() });
        save();
        render();
        toast("Module marked complete.");
        break;
      }
      case "send-feedback": {
        const mId = t.dataset.module;
        const noteField = $("#fb-note-" + mId);
        const note = noteField ? noteField.value.trim() : "";
        bucket(myId()).feedback.push({
          id: uid("f"),
          moduleId: mId,
          sentiment: t.dataset.sentiment,
          note,
          at: nowISO(),
        });
        save();
        if (noteField) noteField.value = "";
        toast("Feedback saved.");
        computeBadges(myId());
        break;
      }
      case "check-challenge":
        await checkChallenge(t.dataset.challenge, t.dataset.module);
        break;

      /* playground */
      case "run-code": {
        const scope = t.dataset.scope;
        const wrapper = $('[data-scope="' + scope + '"]');
        if (!wrapper) break;
        const iframe = wrapper.querySelector("iframe[data-sandbox]");
        const out = wrapper.querySelector("[data-output]");
        if (!iframe || !out) break;
        out.textContent = "";
        const parts = readCode(wrapper);
        runSandbox(iframe, parts, (d) => {
          if (d.type === "log") out.textContent += d.text + "\n";
          else if (d.type === "error") {
            const s = document.createElement("span");
            s.className = "err";
            s.textContent = d.text + "\n";
            out.appendChild(s);
          }
          out.scrollTop = out.scrollHeight;
        });
        break;
      }
      case "reset-code": {
        const wrapper = $('[data-scope="' + t.dataset.scope + '"]');
        if (!wrapper) break;
        const scope = t.dataset.scope;
        const m = findModule(scope);
        const c = m
          ? state.curriculum.challenges.find((x) => x.id === m.challengeId)
          : null;
        const def = c
          ? {
              html: c.starterHtml || "",
              css: c.starterCss || "",
              js: c.starterJs || "",
            }
          : { html: "", css: "", js: "" };
        wrapper.querySelector('[data-code="html"]').value = def.html;
        wrapper.querySelector('[data-code="css"]').value = def.css;
        wrapper.querySelector('[data-code="js"]').value = def.js;
        bucket(myId()).drafts[scope] = def;
        save();
        toast("Editor reset to starter code.");
        break;
      }
      case "save-draft": {
        const wrapper = $('[data-scope="' + t.dataset.scope + '"]');
        if (!wrapper) break;
        saveDraft(t.dataset.scope, readCode(wrapper));
        toast("Draft saved.");
        break;
      }

      /* timer */
      case "timer-start":
        startTimer();
        break;
      case "timer-pause":
        pauseTimer();
        break;
      case "timer-stop":
        stopTimer();
        break;
      case "delete-session": {
        bucket(myId()).studySessions = bucket(myId()).studySessions.filter(
          (s) => s.id !== id,
        );
        save();
        render();
        toast("Session deleted.");
        break;
      }

      /* data */
      case "export-curriculum":
        exportCurriculum();
        break;
      case "export-progress":
        exportProgress();
        break;
      case "export-full":
        exportFull();
        break;

      default:
        break;
    }
  });

  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "import-file" && t.files && t.files[0]) {
      handleImportFile(t.files[0]);
      t.value = "";
      return;
    }
    if (t.id === "timer-record") {
      timer.record = t.checked;
      return;
    }
    if (t.matches("[data-code]")) {
      const w = t.closest("[data-scope]");
      if (w) saveDraft(w.dataset.scope, readCode(w), true);
      return;
    }
    if (t.matches("[data-reflection]")) {
      const mId = t.dataset.reflection;
      bucket(myId()).drafts["reflection_" + mId] = { text: t.value };
      save();
      return;
    }
    if (t.matches('[data-action="toggle-challenge-check"]')) {
      const b = bucket(myId());
      let entry = b.challengeResults.find(
        (r) =>
          r.challengeId === t.dataset.challenge &&
          r.moduleId === t.dataset.module,
      );
      if (!entry) {
        entry = {
          id: uid("c"),
          challengeId: t.dataset.challenge,
          moduleId: t.dataset.module,
          method: "checklist",
          passed: false,
          note: "",
          at: nowISO(),
          ticks: {},
        };
        b.challengeResults.push(entry);
      }
      entry.ticks = entry.ticks || {};
      entry.ticks[t.dataset.index] = t.checked;
      save();
      return;
    }
  });

  function readCode(w) {
    return {
      html: w.querySelector('[data-code="html"]').value,
      css: w.querySelector('[data-code="css"]').value,
      js: w.querySelector('[data-code="js"]').value,
    };
  }
  function saveDraft(scope, parts, silent) {
    bucket(myId()).drafts[scope] = {
      html: parts.html,
      css: parts.css,
      js: parts.js,
    };
    save();
    if (!silent) computeBadges(myId());
  }

  async function checkChallenge(challengeId, moduleId) {
    const c = state.curriculum.challenges.find((x) => x.id === challengeId);
    if (!c) return;
    const w = $('[data-scope="' + moduleId + '"]');
    const parts = w ? readCode(w) : { html: "", css: "", js: "" };
    const b = bucket(myId());

    if (c.checkType === "console") {
      const output = await runSandboxAsync(parts.js);
      const expected = String(c.expectedOutput || "").trim();
      const actual = String(output || "").trim();
      const passed = expected.length > 0 && actual === expected;
      b.challengeResults.push({
        id: uid("c"),
        challengeId,
        moduleId,
        method: "console",
        passed,
        note: actual.slice(0, 400),
        at: nowISO(),
      });
      save();
      toast(
        passed
          ? "Console output matched. One match does not prove the whole program."
          : 'Not matched. Expected "' +
              expected +
              '" but saw "' +
              actual +
              '".',
      );
    } else {
      const entry = b.challengeResults
        .filter((r) => r.challengeId === challengeId && r.moduleId === moduleId)
        .pop();
      const ticks = (entry && entry.ticks) || {};
      const total = (c.checklist || []).length;
      const ticked = Object.keys(ticks).filter((k) => ticks[k]).length;
      const passed = total > 0 && ticked === total;
      b.challengeResults.push({
        id: uid("c"),
        challengeId,
        moduleId,
        method: "checklist",
        passed,
        note: ticked + "/" + total + " ticked",
        at: nowISO(),
        ticks,
      });
      save();
      toast(
        passed
          ? "Self-check recorded — every item ticked."
          : "Self-check recorded: " + ticked + " of " + total + ".",
      );
    }
    computeBadges(myId());
    render();
  }

  /* ==================== SUBMIT ==================== */
  document.addEventListener("submit", (e) => {
    const form = e.target.closest("form[data-form]");
    if (!form) return;
    e.preventDefault();
    const kind = form.dataset.form;
    const fd = new FormData(form);

    if (kind === "login") {
      const key = String(fd.get("key") || "").trim();
      const acc = ACCOUNTS.find((a) => a.id === loginDraft.selectedId);
      if (!acc) {
        toast("Pick a profile first.");
        return;
      }
      if (key !== acc.key) {
        toast("That key does not match.");
        return;
      }
      state.session = { accountId: acc.id, role: acc.role };
      save();
      go(acc.role === "teacher" ? "teacher/curriculum" : "student");
      return;
    }

    if (kind === "module") {
      const existing = form.dataset.id ? findModule(form.dataset.id) : null;
      const sessions = String(fd.get("sessions") || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((line) => {
          const [title, minutes] = line.split("|").map((x) => x.trim());
          return { title: title || "Session", minutes: Number(minutes) || 15 };
        });
      const updated = {
        id: existing ? existing.id : "m_" + uid("mod"),
        version: existing ? existing.version : 1,
        order: existing ? existing.order : state.curriculum.modules.length + 1,
        published: fd.get("published") === "on",
        title: String(fd.get("title") || "").trim() || "Untitled",
        goal: String(fd.get("goal") || "").trim(),
        estimatedMinutes: Number(fd.get("minutes")) || 60,
        explanation: String(fd.get("explanation") || ""),
        practice: String(fd.get("practice") || ""),
        reflection: String(fd.get("reflection") || ""),
        challengeId: String(fd.get("challengeId") || ""),
        quizId: String(fd.get("quizId") || ""),
        resourceIds: fd.getAll("res"),
        sessions,
        checklist: String(fd.get("checklist") || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (existing) {
        if (moduleSig(updated) !== moduleSig(existing))
          updated.version = existing.version + 1;
        else updated.version = existing.version;
        const i = state.curriculum.modules.findIndex(
          (m) => m.id === existing.id,
        );
        state.curriculum.modules[i] = updated;
      } else state.curriculum.modules.push(updated);
      state.curriculum.modules.forEach((m, i) => (m.order = i + 1));
      save();
      closeModal();
      render();
      toast(existing ? "Module saved." : "Module created.");
      return;
    }

    if (kind === "resource") {
      const data = {
        id: form.dataset.id || uid("r"),
        type: String(fd.get("type") || "link"),
        title: String(fd.get("title") || "").trim() || "Untitled",
        url: String(fd.get("url") || "").trim(),
        description: String(fd.get("description") || "").trim(),
        body: String(fd.get("body") || ""),
        needsVerification: fd.get("needsVerification") === "on",
      };
      const i = state.curriculum.resources.findIndex((r) => r.id === data.id);
      if (i >= 0) state.curriculum.resources[i] = data;
      else state.curriculum.resources.push(data);
      save();
      closeModal();
      render();
      toast("Resource saved.");
      return;
    }

    if (kind === "challenge") {
      const data = {
        id: form.dataset.id || uid("c"),
        title: String(fd.get("title") || "").trim() || "Untitled",
        instructions: String(fd.get("instructions") || ""),
        starterHtml: String(fd.get("starterHtml") || ""),
        starterCss: String(fd.get("starterCss") || ""),
        starterJs: String(fd.get("starterJs") || ""),
        hints: String(fd.get("hints") || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        sampleResult: String(fd.get("sampleResult") || ""),
        checkType: String(fd.get("checkType") || "checklist"),
        expectedOutput: String(fd.get("expectedOutput") || ""),
        checklist: String(fd.get("checklist") || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const i = state.curriculum.challenges.findIndex((c) => c.id === data.id);
      if (i >= 0) state.curriculum.challenges[i] = data;
      else state.curriculum.challenges.push(data);
      save();
      closeModal();
      render();
      toast("Challenge saved.");
      return;
    }

    if (kind === "quiz") {
      const d = collectQuizForm(form);
      d.id = form.dataset.id || uid("q");
      d.title = d.title.trim() || "Untitled quiz";
      const i = state.curriculum.quizzes.findIndex((q) => q.id === d.id);
      if (i >= 0) state.curriculum.quizzes[i] = d;
      else state.curriculum.quizzes.push(d);
      save();
      closeModal();
      render();
      toast("Quiz saved.");
      return;
    }

    if (kind === "poll") {
      const data = {
        id: form.dataset.id || uid("p"),
        title: String(fd.get("title") || "").trim() || "Untitled poll",
        question: String(fd.get("question") || "").trim(),
        options: String(fd.get("options") || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const i = state.curriculum.polls.findIndex((p) => p.id === data.id);
      if (i >= 0) state.curriculum.polls[i] = data;
      else state.curriculum.polls.push(data);
      save();
      closeModal();
      render();
      toast("Poll saved.");
      return;
    }

    if (kind === "quiz-answer") {
      const qId = form.dataset.quiz,
        mId = form.dataset.module;
      const quiz = state.curriculum.quizzes.find((q) => q.id === qId);
      if (!quiz) return;
      let score = 0;
      const answers = {};
      quiz.questions.forEach((q) => {
        const chosen = form.querySelector(
          'input[name="q_' + q.id + '"]:checked',
        );
        const v = chosen ? Number(chosen.value) : -1;
        answers[q.id] = v;
        if (v === q.answer) score++;
      });
      bucket(myId()).quizAttempts.push({
        id: uid("a"),
        moduleId: mId,
        quizId: qId,
        score,
        total: quiz.questions.length,
        answers,
        at: nowISO(),
      });
      save();
      computeBadges(myId());
      render();
      toast(
        "Score: " + score + " / " + quiz.questions.length + ". Retry any time.",
      );
      return;
    }

    if (kind === "poll-answer") {
      const chosen = form.querySelector('input[name="option"]:checked');
      if (!chosen) {
        toast("Pick an option first.");
        return;
      }
      bucket(myId()).pollResponses.push({
        pollId: form.dataset.poll,
        optionIndex: Number(chosen.value),
        at: nowISO(),
      });
      save();
      render();
      toast("Answer recorded.");
      return;
    }

    if (kind === "terminal") {
      const input = form.querySelector('[name="cmd"]');
      const cmd = input.value;
      input.value = "";
      handleTerminalCommand(cmd);
      return;
    }
  });

  /* ==================== VISIBILITY & BOOT ==================== */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && timer.running) {
      pauseTimer();
      toast("Timer paused (tab hidden).");
    }
  });

  function init() {
    state = loadState();
    ACCOUNTS.filter((a) => a.role === "student").forEach((a) => bucket(a.id));
    if (
      state.session &&
      state.session.accountId !== VISITOR.id &&
      !ACCOUNTS.some((a) => a.id === state.session.accountId)
    ) {
      state.session = null;
    }
    save();
    render();
    window.addEventListener("hashchange", render);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
