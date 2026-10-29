/* =========================================================================
   Orbit — app.js (Phase 1)
   Warm editorial workspace. Same localStorage schema.
   ========================================================================= */

(function () {
  "use strict";

  // --- Defensive checks ---------------------------------------------------
  // If lessons.js failed to load, we cannot proceed.
  if (
    typeof SCHEMA_VERSION === "undefined" ||
    typeof ACCOUNTS === "undefined" ||
    typeof starterCurriculum === "undefined" ||
    typeof STORAGE_KEY === "undefined"
  ) {
    document.body.innerHTML =
      '<div style="padding:2rem;font-family:sans-serif;color:#721c24;background:#f8d7da;border:1px solid #f5c6cb;border-radius:4px;margin:2rem;"><h2>Orbit could not start.</h2><p><strong>lessons.js</strong> is missing or failed to load. Please make sure it exists in the same folder as <code>index.html</code>.</p></div>';
    return;
  }

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

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }
  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600),
      m = Math.floor((sec % 3600) / 60),
      s = sec % 60;
    if (h) return h + " h " + m + " min";
    if (m) return m + " min";
    return s + " s";
  }
  function fmtClock(sec) {
    sec = Math.max(0, Math.round(sec));
    return [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
  }
  function paragraphs(t) {
    return String(t || "")
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((p) => "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>")
      .join("");
  }

  /* ---------- State ---------- */
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
        console.warn("Orbit: Old schema detected. Backing up and resetting.");
        return defaultState();
      }
      parsed.curriculum = parsed.curriculum || starterCurriculum();
      parsed.progress = parsed.progress || {};
      parsed.ui = parsed.ui || { theme: "light" };
      return parsed;
    } catch (err) {
      console.error("Orbit: Failed to parse state", err);
      try {
        localStorage.setItem("orbit.backup." + Date.now(), raw);
      } catch {}
      return defaultState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      toast("Could not save — browser storage may be full.");
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

  /* ---------- Data helpers ---------- */
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
        questions: [],
        notes: [], // Added for Phase 1 home screen
      };
    } else {
      // Ensure new arrays exist for existing users
      if (!state.progress[accountId].questions)
        state.progress[accountId].questions = [];
      if (!state.progress[accountId].notes)
        state.progress[accountId].notes = [];
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

  /* ---------- Router ---------- */
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
        go(currentAccount().role === "teacher" ? "teacher" : "student");
        return;
      }
      html = renderLogin();
    } else if (route === "teacher") {
      const a = currentAccount();
      if (!a || a.role !== "teacher") {
        go("login");
        return;
      }
      html = renderTeacherShell(sub || "home");
    } else if (route === "student") {
      const a = currentAccount();
      if (!a) {
        go("login");
        return;
      }
      html = renderStudentShell(sub, id);
    } else {
      html =
        '<div class="empty">That page does not exist. <a href="#login">Go back</a>.</div>';
    }
    $("#app").innerHTML = html;
    $("#sidebar")?.classList.remove("open");
    $(".sidebar-backdrop")?.classList.remove("show");
    const h = $("#main-heading");
    if (h) {
      h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
    }
  }

  /* ---------- Toast / dialog ---------- */
  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }
  function openDialog(title, body, opts) {
    opts = opts || {};
    $("#modal-root").innerHTML =
      '<div class="dialog-backdrop">' +
      '<div class="dialog ' +
      (opts.wide ? "wide" : "") +
      '" role="dialog" aria-modal="true" aria-labelledby="dlg-title">' +
      '<div class="dialog-head"><h2 id="dlg-title">' +
      esc(title) +
      "</h2>" +
      '<button class="icon-close" type="button" data-action="modal-close" aria-label="Close">✕</button>' +
      "</div>" +
      '<div class="dialog-body">' +
      body +
      "</div>" +
      (opts.footer
        ? '<div class="dialog-foot">' + opts.footer + "</div>"
        : "") +
      "</div>" +
      "</div>";
    const first = $(
      "#modal-root input, #modal-root textarea, #modal-root select, #modal-root button",
    );
    if (first) first.focus({ preventScroll: true });
  }
  function closeModal() {
    $("#modal-root").innerHTML = "";
  }
  function openConfirm(title, msg, onConfirm, label) {
    openDialog(title, msg, {
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

  /* ---------- Login ---------- */
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
          '<span><span class="initials">' +
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
        "</strong> · <code>" +
        esc(a.key) +
        "</code></li>",
    ).join("");

    return (
      '<div class="login-wrap">' +
      '<div class="login-card">' +
      '<div class="brand">Orbit</div>' +
      '<div class="tagline">learning workspace</div>' +
      "<h1>Sign in</h1>" +
      '<p class="lede">A quiet workspace for two people learning together. Choose a profile to continue.</p>' +
      '<div class="role-tabs" role="tablist" aria-label="Role">' +
      '<button type="button" role="tab" aria-selected="' +
      (role === "student") +
      '" data-action="login-role" data-role="student">Student</button>' +
      '<button type="button" role="tab" aria-selected="' +
      (role === "teacher") +
      '" data-action="login-role" data-role="teacher">Teacher</button>' +
      "</div>" +
      '<form data-form="login">' +
      '<fieldset style="border:0;padding:0;margin:0 0 1rem"><legend class="hint" style="padding:0;margin-bottom:0.4rem">Profile</legend>' +
      '<div class="profile-list">' +
      options +
      "</div>" +
      "</fieldset>" +
      '<label class="field"><span>Access key</span>' +
      '<input type="password" name="key" required autocomplete="off" spellcheck="false" placeholder="enter your key">' +
      "</label>" +
      '<button class="btn primary block" type="submit">Continue</button>' +
      "</form>" +
      '<div class="login-foot">' +
      'Just exploring? <button type="button" class="link-btn" data-action="visitor-login">Continue as visitor</button>' +
      "</div>" +
      '<details class="demo-keys"><summary>Demo access keys</summary><ul>' +
      keys +
      "</ul></details>" +
      "</div>" +
      "</div>"
    );
  }

  /* ---------- Sidebar / shell ---------- */
  function navGroup(title, items, active) {
    return (
      '<div class="nav-group">' +
      '<div class="label">' +
      esc(title) +
      "</div>" +
      items
        .map(
          (item) =>
            '<a href="#' +
            item.path +
            '"' +
            (item.path === active ? ' aria-current="page"' : "") +
            ">" +
            esc(item.label) +
            "</a>",
        )
        .join("") +
      "</div>"
    );
  }

  function shell(navItems, activePath, content) {
    const a = currentAccount();
    return (
      '<div class="app">' +
      '<div class="sidebar-backdrop" data-action="close-sidebar"></div>' +
      '<aside class="sidebar" id="sidebar" aria-label="Main navigation">' +
      '<div class="brand">' +
      '<a class="name" href="#' +
      (a.role === "teacher" ? "teacher" : "student") +
      '">Orbit</a>' +
      '<div class="tagline">learning workspace</div>' +
      "</div>" +
      navItems +
      '<div class="spacer"></div>' +
      '<div class="user-box">' +
      '<span class="initials" aria-hidden="true">' +
      esc(a.initials) +
      "</span>" +
      '<div class="meta"><div class="name">' +
      esc(a.name) +
      '</div><div class="role">' +
      esc(a.role) +
      "</div></div>" +
      '<a class="switch" href="#" data-action="logout" title="Sign out">Switch</a>' +
      "</div>" +
      "</aside>" +
      '<main class="main" id="main">' +
      '<div class="main-inner">' +
      '<div class="topbar">' +
      '<button type="button" class="menu-btn" data-action="toggle-sidebar" aria-label="Open menu" aria-expanded="false" aria-controls="sidebar">Menu</button>' +
      '<button class="theme-btn" type="button" data-action="toggle-theme" aria-label="Toggle light and dark mode">' +
      (state.ui.theme === "dark" ? "Light" : "Dark") +
      "</button>" +
      "</div>" +
      content +
      "</div>" +
      "</main>" +
      "</div>"
    );
  }

  /* ---------- STUDENT NAV ---------- */
  const STUDENT_NAV_HTML = (active) =>
    navGroup(
      "Learn",
      [
        { path: "student", label: "Home" },
        { path: "student/explore", label: "Explore" },
        { path: "student/prompt-lab", label: "Prompt lab" },
        { path: "student/notes", label: "Notes" },
        { path: "student/lessons", label: "Lessons" },
        { path: "student/projects", label: "Projects" },
      ],
      active,
    ) +
    navGroup(
      "Workspace",
      [
        { path: "student/playground", label: "Playground" },
        { path: "student/terminal", label: "Terminal" },
        { path: "student/timer", label: "Study timer" },
      ],
      active,
    ) +
    navGroup(
      "Share",
      [{ path: "student/data", label: "Data & sharing" }],
      active,
    );

  /* ---------- STUDENT views ---------- */
  function renderStudentShell(sub, id) {
    if (sub === "lesson" && id) {
      return shell(
        STUDENT_NAV_HTML("student/lessons"),
        "student/lessons",
        studentLesson(id),
      );
    }
    const map = {
      "": { active: "student", view: studentHome },
      explore: {
        active: "student/explore",
        view: studentPlaceholder("Explore"),
      },
      "prompt-lab": {
        active: "student/prompt-lab",
        view: studentPlaceholder("Prompt lab"),
      },
      notes: { active: "student/notes", view: studentPlaceholder("Notes") },
      lessons: { active: "student/lessons", view: studentLessonsList },
      projects: {
        active: "student/projects",
        view: studentPlaceholder("Projects"),
      },
      playground: { active: "student/playground", view: studentPlayground },
      terminal: { active: "student/terminal", view: studentTerminal },
      timer: { active: "student/timer", view: studentTimer },
      data: { active: "student/data", view: dataView },
    };
    const entry = map[sub || ""] || map[""];
    return shell(STUDENT_NAV_HTML(entry.active), entry.active, entry.view());
  }

  function studentPlaceholder(label) {
    return function () {
      return (
        '<div class="page-head">' +
        '<div class="eyebrow">' +
        esc(label) +
        "</div>" +
        '<h1 id="main-heading">' +
        esc(label) +
        "</h1>" +
        '<p class="lede">This section is being rebuilt in Phase 2. Your notes, drafts, and progress remain safe in this browser.</p>' +
        "</div>" +
        '<div class="empty-state"><strong>Phase 2</strong>' +
        "The " +
        esc(label) +
        " page will get its own reading layout and interactions in the next phase." +
        "</div>"
      );
    };
  }

  /* ---------- STUDENT HOME ---------- */
  function studentHome() {
    const accId = myId();
    const account = currentAccount();
    const list = publishedModules();
    const done = completedCount(accId);
    const target =
      list.find((m) => readRecord(accId, m).status === "in-progress") ||
      list.find((m) => readRecord(accId, m).status === "not-started") ||
      list[0] ||
      null;

    const b = bucket(accId);
    const questions = (b.questions || []).slice();
    const notes = (b.notes || [])
      .slice()
      .sort((x, y) => String(y.updatedAt).localeCompare(String(x.updatedAt)))
      .slice(0, 4);

    const firstInitial = account.name.split(" ")[0];

    const continueBlock = target
      ? '<section class="continue-card">' +
        '<div class="label">Continue learning</div>' +
        "<h3>" +
        esc(target.title) +
        "</h3>" +
        "<p>" +
        esc(target.goal) +
        "</p>" +
        '<div class="actions">' +
        '<a class="btn primary" href="#student/lesson/' +
        esc(target.id) +
        '">' +
        (readRecord(accId, target).status === "in-progress"
          ? "Continue lesson"
          : "Start lesson") +
        "</a>" +
        '<a class="btn ghost" href="#student/lessons">All lessons</a>' +
        '<span class="hint">' +
        esc(target.estimatedMinutes) +
        " min · " +
        (target.sessions || []).length +
        " sessions</span>" +
        "</div>" +
        "</section>"
      : '<section class="continue-card">' +
        '<div class="label">Continue learning</div>' +
        "<h3>No published lessons yet</h3>" +
        "<p>Your teacher will publish the first module when it is ready.</p>" +
        '<div class="actions"><a class="btn" href="#student/lessons">Browse lessons</a></div>' +
        "</section>";

    const focusItems = buildFocusItems(accId);
    const focusBlock =
      '<section class="section">' +
      '<div class="section-head"><h2>Today, if you have an hour</h2><span class="count">optional</span></div>' +
      '<ul class="focus-list">' +
      focusItems
        .map(
          (f) =>
            "<li>" +
            '<span class="mark' +
            (f.done ? " done" : "") +
            '" aria-hidden="true">' +
            (f.done ? "✓" : "") +
            "</span>" +
            '<div class="body">' +
            esc(f.text) +
            (f.when ? '<div class="when">' + esc(f.when) + "</div>" : "") +
            "</div>" +
            "</li>",
        )
        .join("") +
      "</ul>" +
      "</section>";

    const questionsBlock =
      '<section class="section">' +
      '<div class="section-head"><h2>Questions I want to explore</h2><span class="count">' +
      questions.length +
      "</span></div>" +
      (questions.length
        ? '<ul class="questions">' +
          questions.map((q) => "<li>" + esc(q.text) + "</li>").join("") +
          "</ul>"
        : '<p class="questions"><span class="q-empty">Nothing on your list yet. Add the first thing you\'re curious about.</span></p>') +
      '<form class="question-form" data-form="add-question">' +
      '<input type="text" name="text" placeholder="What are you wondering about?" maxlength="200" required aria-label="New question">' +
      '<button class="btn sm" type="submit">Add</button>' +
      "</form>" +
      "</section>";

    const notesBlock =
      '<section class="section">' +
      '<div class="section-head"><h2>Recently saved notes</h2><span class="count">' +
      notes.length +
      "</span></div>" +
      (notes.length
        ? '<ul class="notes-list">' +
          notes
            .map(
              (n) =>
                "<li>" +
                '<div class="n-title">' +
                esc(n.title || n.question || "Untitled note") +
                "</div>" +
                '<div class="n-meta">' +
                esc(fmtDate(n.updatedAt || n.createdAt)) +
                (n.checkedAt ? " · checked" : "") +
                "</div>" +
                "</li>",
            )
            .join("") +
          "</ul>"
        : '<p class="notes-empty">No notes yet. When you save one from Notes, it appears here.</p>') +
      "</section>";

    const progressBlock =
      '<section class="section">' +
      '<div class="section-head"><h2>This week</h2></div>' +
      '<div class="progress-summary">' +
      '<div><span class="num">' +
      done +
      "</span><small>of " +
      list.length +
      " lessons complete</small></div>" +
      '<ul class="list">' +
      "<li><strong>" +
      b.quizAttempts.length +
      "</strong> quiz attempts</li>" +
      "<li><strong>" +
      b.challengeResults.filter((c) => c.passed).length +
      "</strong> challenges passed</li>" +
      "<li><strong>" +
      b.feedback.length +
      "</strong> feedback notes sent</li>" +
      "<li><strong>" +
      fmtDur(b.studySessions.reduce((s, x) => s + (x.seconds || 0), 0)) +
      "</strong> recorded study time</li>" +
      "</ul>" +
      '<p class="hint" style="margin-top:0.6rem">Study time is what you chose to record. It is not a measure of understanding.</p>' +
      "</div>" +
      "</section>";

    const greeting = greetingFor(account.name);
    const eyebrow = todayEyebrow();

    return (
      '<div class="page-head">' +
      '<div class="eyebrow">' +
      esc(eyebrow) +
      "</div>" +
      '<h1 id="main-heading">' +
      esc(greeting) +
      ", " +
      esc(firstInitial) +
      ".</h1>" +
      '<p class="lede">A short session, when you have one. Everything is saved in this browser and stays yours.</p>' +
      "</div>" +
      '<div class="home-grid">' +
      '<div class="home-main">' +
      continueBlock +
      focusBlock +
      questionsBlock +
      notesBlock +
      "</div>" +
      '<aside class="home-side">' +
      progressBlock +
      "</aside>" +
      "</div>"
    );
  }

  function greetingFor(name) {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }
  function todayEyebrow() {
    try {
      return new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Today";
    }
  }

  function buildFocusItems(accId) {
    const items = [];
    const inProg = publishedModules().find(
      (m) => readRecord(accId, m).status === "in-progress",
    );
    if (inProg) {
      items.push({
        text: "Finish the current lesson: " + inProg.title,
        when: "in progress",
        done: false,
      });
    } else {
      const next = publishedModules().find(
        (m) => readRecord(accId, m).status === "not-started",
      );
      if (next)
        items.push({
          text: "Start " + next.title,
          when: next.estimatedMinutes + " min",
          done: false,
        });
    }
    if (bucket(accId).questions.length === 0) {
      items.push({
        text: "Add one question you want to explore",
        when: "takes a minute",
        done: false,
      });
    }
    if (bucket(accId).notes.length === 0) {
      items.push({
        text: "Write a short note in your own words",
        when: "one idea is enough",
        done: false,
      });
    }
    if (items.length < 2) {
      items.push({
        text: "Revisit a lesson you liked",
        when: "no pressure",
        done: false,
      });
    }
    return items.slice(0, 3);
  }

  /* ---------- STUDENT lessons list ---------- */
  function studentLessonsList() {
    const accId = myId();
    const list = publishedModules();
    return (
      '<div class="page-head">' +
      '<div class="eyebrow">Lessons</div>' +
      '<h1 id="main-heading">All lessons</h1>' +
      '<p class="lede">Small lessons you can revisit. Nothing is timed.</p>' +
      "</div>" +
      (list.length
        ? "<div>" +
          list
            .map((m, i) => {
              const rec = readRecord(accId, m);
              return (
                '<div class="module-row">' +
                '<span class="order">' +
                (i + 1) +
                "</span>" +
                "<div>" +
                '<div class="title">' +
                esc(m.title) +
                ' <span class="hint" style="margin-left:.4rem">· ' +
                esc(statusLabel(rec.status)) +
                "</span></div>" +
                '<div class="meta">' +
                esc(m.goal) +
                " · " +
                esc(m.estimatedMinutes) +
                " min</div>" +
                "</div>" +
                '<div class="actions">' +
                '<a class="btn sm" href="#student/lesson/' +
                esc(m.id) +
                '">' +
                (rec.status === "completed"
                  ? "Revisit"
                  : rec.status === "in-progress"
                    ? "Continue"
                    : "Open") +
                "</a>" +
                "</div>" +
                "</div>"
              );
            })
            .join("") +
          "</div>"
        : '<div class="empty-state"><strong>No published lessons yet.</strong>When your teacher publishes a module it will appear here.</div>')
    );
  }
  function statusLabel(s) {
    if (s === "completed") return "Completed";
    if (s === "in-progress") return "In progress";
    return "Not started";
  }

  /* ---------- TEACHER NAV ---------- */
  const TEACHER_NAV_HTML = (active) =>
    navGroup(
      "Teach",
      [
        { path: "teacher", label: "Home" },
        { path: "teacher/curriculum", label: "Curriculum" },
        { path: "teacher/resources", label: "Resources" },
        { path: "teacher/challenges", label: "Challenges" },
        { path: "teacher/quizzes", label: "Quizzes & polls" },
        { path: "teacher/students", label: "Learner work" },
      ],
      active,
    ) +
    navGroup(
      "Share",
      [{ path: "teacher/data", label: "Data & sharing" }],
      active,
    );

  function renderTeacherShell(sub) {
    if (!sub || sub === "home") {
      return shell(TEACHER_NAV_HTML("teacher"), "teacher", teacherHome());
    }
    const map = {
      curriculum: teacherCurriculum,
      resources: teacherResources,
      challenges: teacherChallenges,
      quizzes: teacherQuizzes,
      students: teacherStudents,
      data: dataView,
    };
    const view = map[sub] || teacherHome;
    return shell(TEACHER_NAV_HTML("teacher/" + sub), "teacher/" + sub, view());
  }

  /* ---------- TEACHER HOME ---------- */
  function teacherHome() {
    const modules = state.curriculum.modules
      .slice()
      .sort((a, b) => a.order - b.order);
    const published = modules.filter((m) => m.published).length;
    const drafts = modules.length - published;
    const students = ACCOUNTS.filter((a) => a.role === "student");

    const recentFeedback = [];
    Object.keys(state.progress).forEach((accId) => {
      const acc = ACCOUNTS.find((a) => a.id === accId);
      const label = acc ? acc.name : accId === VISITOR.id ? "Visitor" : accId;
      (state.progress[accId].feedback || []).forEach((f) => {
        recentFeedback.push({
          label,
          moduleId: f.moduleId,
          sentiment: f.sentiment,
          note: f.note,
          at: f.at,
        });
      });
    });
    recentFeedback.sort((a, b) => String(b.at).localeCompare(String(a.at)));

    const pendingDrafts = modules.filter((m) => !m.published);

    return (
      '<div class="page-head">' +
      '<div class="eyebrow">' +
      esc(todayEyebrow()) +
      "</div>" +
      '<h1 id="main-heading">Good to see you, ' +
      esc((currentAccount().name || "").split(" ")[0]) +
      ".</h1>" +
      '<p class="lede">A calm view of the curriculum, drafts, and the work learners have shared.</p>' +
      "</div>" +
      '<div class="home-grid">' +
      '<div class="home-main">' +
      '<section class="section">' +
      '<div class="section-head"><h2>Curriculum at a glance</h2><a class="hint" href="#teacher/curriculum">Open curriculum →</a></div>' +
      '<ul class="focus-list">' +
      '<li><span class="mark done" aria-hidden="true">✓</span><div class="body"><strong>' +
      published +
      "</strong> published modules</div></li>" +
      '<li><span class="mark" aria-hidden="true"></span><div class="body"><strong>' +
      drafts +
      "</strong> drafts waiting for review</div></li>" +
      '<li><span class="mark" aria-hidden="true"></span><div class="body"><strong>' +
      state.curriculum.resources.length +
      "</strong> resources in the library</div></li>" +
      '<li><span class="mark" aria-hidden="true"></span><div class="body"><strong>' +
      state.curriculum.quizzes.length +
      "</strong> quizzes · <strong>" +
      state.curriculum.challenges.length +
      "</strong> challenges</div></li>" +
      "</ul>" +
      "</section>" +
      (pendingDrafts.length
        ? '<section class="section">' +
          '<div class="section-head"><h2>Drafts to review</h2><a class="hint" href="#teacher/curriculum">Manage</a></div>' +
          '<ul class="questions">' +
          pendingDrafts
            .map(
              (m) =>
                "<li><strong>" +
                esc(m.title) +
                '</strong> · <span class="hint">' +
                esc(m.estimatedMinutes) +
                " min</span></li>",
            )
            .join("") +
          "</ul>" +
          "</section>"
        : "") +
      '<section class="section">' +
      '<div class="section-head"><h2>Recent learner feedback</h2><a class="hint" href="#teacher/students">Learner work →</a></div>' +
      (recentFeedback.length
        ? '<table class="table"><thead><tr><th>Learner</th><th>Module</th><th>Signal</th><th>Note</th><th>When</th></tr></thead><tbody>' +
          recentFeedback
            .slice(0, 6)
            .map(
              (f) =>
                "<tr><td>" +
                esc(f.label) +
                "</td><td>" +
                esc(f.moduleId) +
                "</td><td>" +
                esc(f.sentiment) +
                "</td><td>" +
                esc(f.note || "—") +
                '</td><td class="num">' +
                esc(fmtDate(f.at)) +
                "</td></tr>",
            )
            .join("") +
          "</tbody></table>"
        : '<p class="notes-empty">No feedback yet. When a learner sends a note it will appear here.</p>') +
      "</section>" +
      "</div>" +
      '<aside class="home-side">' +
      '<section class="section">' +
      '<div class="section-head"><h2>Learners</h2></div>' +
      '<table class="table"><thead><tr><th>Name</th><th>Lessons</th><th>Quizzes</th></tr></thead><tbody>' +
      students
        .map((acc) => {
          const b = bucket(acc.id);
          return (
            "<tr><td>" +
            esc(acc.name) +
            '</td><td class="num">' +
            completedCount(acc.id) +
            "/" +
            publishedModules().length +
            '</td><td class="num">' +
            b.quizAttempts.length +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table>" +
      '<p class="hint" style="margin-top:0.5rem">Progress shown is only from this browser. Import a progress file to see other devices.</p>' +
      "</section>" +
      '<section class="section">' +
      '<div class="section-head"><h2>Share</h2></div>' +
      '<p class="hint" style="margin-bottom:0.6rem">Data stays in this browser. Use files to move updates between devices.</p>' +
      '<div style="display:flex;flex-direction:column;gap:.4rem">' +
      '<a class="btn sm" href="#teacher/data">Open data &amp; sharing</a>' +
      "</div>" +
      "</section>" +
      "</aside>" +
      "</div>"
    );
  }

  /* ---------- Lesson Detail ---------- */
  function studentLesson(moduleId) {
    const m = findModule(moduleId);
    if (!m || !m.published)
      return '<div class="empty">This lesson is not available. <a href="#student/lessons">Back to lessons</a>.</div>';
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
              '<div style="padding:.6rem 0;border-bottom:1px solid var(--rule)">' +
              '<div style="font-weight:500">' +
              esc(r.title) +
              (r.needsVerification
                ? ' <span class="chip warn">needs verification</span>'
                : "") +
              "</div>" +
              (r.description
                ? '<div class="hint">' + esc(r.description) + "</div>"
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
                  : '<p style="margin-top:.3rem">' + esc(r.body) + "</p>"
                : "") +
              "</div>",
          )
          .join("")
      : '<p class="hint">No resources attached yet.</p>';

    const sessionsHtml = (m.sessions || [])
      .map(
        (s, i) =>
          "<li><span>" +
          (i + 1) +
          ". " +
          esc(s.title) +
          '</span><span class="hint">' +
          s.minutes +
          " min</span></li>",
      )
      .join("");

    const checkHtml = (m.checklist || [])
      .map(
        (item, i) =>
          '<label class="check"><input type="checkbox" data-action="toggle-checklist" data-module="' +
          esc(m.id) +
          '" data-index="' +
          i +
          '"' +
          (rec.checklist && rec.checklist[i] ? " checked" : "") +
          "><span>" +
          esc(item) +
          "</span></label>",
      )
      .join("");

    return (
      '<div class="page-head">' +
      '<div class="eyebrow"><a href="#student/lessons">← Lessons</a> · Module ' +
      esc(m.order) +
      "</div>" +
      '<h1 id="main-heading">' +
      esc(m.title) +
      "</h1>" +
      '<p class="lede">' +
      esc(m.goal) +
      "</p>" +
      '<p class="hint">' +
      esc(m.estimatedMinutes) +
      " min · " +
      (m.sessions || []).length +
      " sessions · " +
      esc(statusLabel(rec.status)) +
      "</p>" +
      "</div>" +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:2.5rem;align-items:start" class="lesson-2col">' +
      "<div>" +
      '<section class="section">' +
      '<div class="section-head"><h2>Understand</h2></div>' +
      paragraphs(m.explanation) +
      "</section>" +
      '<section class="section">' +
      '<div class="section-head"><h2>Resources</h2></div>' +
      resourcesHtml +
      "</section>" +
      '<section class="section">' +
      '<div class="section-head"><h2>Try</h2></div>' +
      "<p>" +
      esc(m.practice) +
      "</p>" +
      (challenge
        ? '<div style="margin-top:1rem">' +
          challengeBlock(challenge, m) +
          "</div>"
        : "") +
      "</section>" +
      (quiz
        ? '<section class="section"><div class="section-head"><h2>Check</h2></div>' +
          quizBlock(quiz, m) +
          "</section>"
        : "") +
      '<section class="section">' +
      '<div class="section-head"><h2>Reflect</h2></div>' +
      "<p>" +
      esc(m.reflection) +
      "</p>" +
      '<label class="field"><span>Your answer (optional)</span>' +
      '<textarea data-reflection="' +
      esc(m.id) +
      '" rows="3">' +
      esc((bucket(accId).drafts["reflection_" + m.id] || {}).text || "") +
      "</textarea>" +
      "</label>" +
      "</section>" +
      '<section class="section">' +
      '<div class="section-head"><h2>How was this lesson?</h2></div>' +
      '<p class="hint">Optional. Never graded.</p>' +
      '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem">' +
      ["Clear", "Need an example", "I'm stuck"]
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
      '<label class="field" style="margin-top:.9rem"><span>Add a note (optional)</span>' +
      '<input type="text" id="fb-note-' +
      esc(m.id) +
      '" placeholder="One sentence is plenty"></label>' +
      "</section>" +
      "</div>" +
      "<aside>" +
      '<section class="section">' +
      '<h3 style="margin-bottom:.5rem">Completion checklist</h3>' +
      (checkHtml || '<p class="hint">No checklist items.</p>') +
      '<button type="button" class="btn primary block" style="margin-top:.9rem" data-action="complete-module" data-id="' +
      esc(m.id) +
      '"' +
      (rec.status === "completed" ? " disabled" : "") +
      ">" +
      (rec.status === "completed" ? "✓ Marked complete" : "Mark complete") +
      "</button>" +
      "</section>" +
      '<section class="section">' +
      '<h3 style="margin-bottom:.5rem">Sessions</h3>' +
      (sessionsHtml
        ? '<ul style="list-style:none;padding:0;margin:0;font-size:.88rem">' +
          sessionsHtml +
          "</ul>"
        : '<p class="hint">No sessions listed.</p>') +
      "</section>" +
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
          '<p class="hint" style="margin-bottom:.4rem">Tick each item honestly. This confirms a self-check, not perfect code.</p>' +
          (challenge.checklist || [])
            .map(
              (item, i) =>
                '<label class="check"><input type="checkbox" data-action="toggle-challenge-check" data-challenge="' +
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
        ? '<details style="margin:.6rem 0"><summary class="hint" style="cursor:pointer">Show hints</summary><ul style="font-size:.88rem;margin-top:.4rem">' +
          challenge.hints.map((h) => "<li>" + esc(h) + "</li>").join("") +
          "</ul></details>"
        : "") +
      '<p class="hint" style="margin:.9rem 0;padding:.7rem .9rem;border:1px solid var(--rule);border-radius:var(--radius);background:var(--warn-bg);color:var(--warn-ink)">Run only code you trust. The preview is sandboxed, but it is not a hardened environment for arbitrary untrusted programs.</p>' +
      playgroundHtml(module.id, draft) +
      '<div style="margin-top:.9rem;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">' +
      '<button type="button" class="btn primary sm" data-action="check-challenge" data-challenge="' +
      esc(challenge.id) +
      '" data-module="' +
      esc(module.id) +
      '">Check my work</button>' +
      (last
        ? '<span class="hint">' +
          (last.passed ? "Passed" : "Not passed") +
          " · " +
          esc(fmtDate(last.at)) +
          "</span>"
        : "") +
      "</div>" +
      '<p class="hint" style="margin-top:.6rem">Sample: ' +
      esc(challenge.sampleResult || "—") +
      "</p>" +
      checklistHtml
    );
  }

  function quizBlock(quiz, module) {
    const b = bucket(myId());
    const attempts = b.quizAttempts.filter((a) => a.quizId === quiz.id);
    const last = attempts[attempts.length - 1];

    return (
      '<form data-form="quiz-answer" data-quiz="' +
      esc(quiz.id) +
      '" data-module="' +
      esc(module.id) +
      '">' +
      quiz.questions
        .map(
          (q, qi) =>
            '<div style="padding:1rem 0;border-bottom:1px solid var(--rule)">' +
            '<p style="font-weight:500;margin-bottom:.5rem">' +
            (qi + 1) +
            ". " +
            esc(q.prompt) +
            "</p>" +
            q.options
              .map(
                (opt, oi) =>
                  '<label class="check"><input type="radio" name="q_' +
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
        .join("") +
      '<div style="margin-top:1rem"><button class="btn primary sm" type="submit">Check answers</button></div>' +
      "</form>" +
      (last
        ? '<div style="margin-top:1rem;padding:.8rem 1rem;border:1px solid var(--rule);border-radius:var(--radius);background:var(--surface)">' +
          "Last attempt: <strong>" +
          last.score +
          " / " +
          last.total +
          "</strong> · " +
          esc(fmtDate(last.at)) +
          '<div class="hint" style="margin-top:.2rem">Retries are unlimited and never penalised.</div>' +
          "</div>"
        : "")
    );
  }

  function playgroundHtml(scope, draft) {
    return (
      '<div data-scope="' +
      esc(scope) +
      '">' +
      '<div class="field"><span>HTML</span><textarea data-code="html" aria-label="HTML" style="font-family:var(--font-mono);min-height:100px">' +
      esc(draft.html) +
      "</textarea></div>" +
      '<div class="field"><span>CSS</span><textarea data-code="css" aria-label="CSS" style="font-family:var(--font-mono);min-height:90px">' +
      esc(draft.css) +
      "</textarea></div>" +
      '<div class="field"><span>JavaScript</span><textarea data-code="js" aria-label="JavaScript" style="font-family:var(--font-mono);min-height:110px">' +
      esc(draft.js) +
      "</textarea></div>" +
      '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.4rem">' +
      '<button class="btn primary sm" type="button" data-action="run-code" data-scope="' +
      esc(scope) +
      '">Run</button>' +
      '<button class="btn sm" type="button" data-action="reset-code" data-scope="' +
      esc(scope) +
      '">Reset</button>' +
      '<button class="btn sm" type="button" data-action="save-draft" data-scope="' +
      esc(scope) +
      '">Save draft</button>' +
      "</div>" +
      '<div style="border:1px solid var(--rule);border-radius:var(--radius-sm);overflow:hidden;margin-top:.7rem;background:#fff">' +
      '<iframe data-sandbox="' +
      esc(scope) +
      '" title="Preview" sandbox="allow-scripts" style="width:100%;height:220px;border:0;display:block"></iframe>' +
      "</div>" +
      '<pre class="pg-out" data-output="' +
      esc(scope) +
      '" aria-live="polite" style="margin-top:.6rem;min-height:60px">Console output appears here after you click Run.</pre>' +
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
      '<div class="page-head"><div class="eyebrow">Playground</div><h1 id="main-heading">Try some code</h1>' +
      '<p class="lede">A small sandbox for HTML, CSS, and JavaScript. Drafts are saved in this browser.</p></div>' +
      '<p class="hint" style="margin-bottom:1rem;padding:.7rem .9rem;border:1px solid var(--rule);border-radius:var(--radius);background:var(--warn-bg);color:var(--warn-ink)">Run only code you trust. The preview is sandboxed but not a hardened environment for arbitrary untrusted programs.</p>' +
      '<div class="card">' +
      playgroundHtml("__sandbox__", draft) +
      "</div>"
    );
  }

  function studentTerminal() {
    const jsLen = (bucket(myId()).drafts["__sandbox__"] || {}).js?.length || 0;
    return (
      '<div class="page-head"><div class="eyebrow">Terminal</div><h1 id="main-heading">Terminal simulator</h1>' +
      '<p class="lede">A fixed set of simulated commands. No operating-system commands are executed.</p></div>' +
      '<div class="term" style="background:#1c1f1c;border-radius:var(--radius);border:1px solid var(--rule);overflow:hidden;font-family:var(--font-mono);font-size:.88rem">' +
      '<div id="term-out" style="padding:1rem 1.2rem;height:320px;overflow:auto;white-space:pre-wrap;word-break:break-word;color:#c8d3c5;line-height:1.6"><span style="color:#b2c8a5">orbit:~$</span> Type <span style="color:#e5ab91">help</span> to see commands.\n</div>' +
      '<form data-form="terminal" style="display:flex;align-items:center;gap:.6rem;border-top:1px solid #333a34;padding:.7rem 1.2rem;background:#161916">' +
      '<span style="color:#b2c8a5">orbit:~$</span>' +
      '<input type="text" name="cmd" id="term-input" autocomplete="off" spellcheck="false" aria-label="Command" placeholder="help" style="flex:1;background:transparent;border:0;color:#e6ecff;outline:none;padding:.2rem 0;font-family:var(--font-mono);font-size:.88rem">' +
      "</form>" +
      "</div>" +
      '<div class="card" style="margin-top:1rem"><h3 style="margin-bottom:.5rem">Supported commands</h3>' +
      '<ul style="font-size:.9rem;color:var(--ink-2)">' +
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
    termPrint("orbit:~$ " + cmd);
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
        termPrint("index.js is empty. Save a draft in the Playground first.");
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
    termPrint("Unknown command: " + cmd + '. Type "help".');
  }

  function studentTimer() {
    const sessions = bucket(myId()).studySessions;
    const totalSec = sessions.reduce((s, x) => s + (x.seconds || 0), 0);
    const rows = sessions.length
      ? sessions
          .slice()
          .reverse()
          .map(
            (s) =>
              '<li style="display:flex;justify-content:space-between;align-items:center;padding:.5rem .7rem;border:1px solid var(--rule);border-radius:var(--radius-sm);background:var(--surface)">' +
              "<span>" +
              fmtDur(s.seconds) +
              ' <span class="hint">· ' +
              esc(fmtDate(s.at)) +
              "</span></span>" +
              '<button class="btn sm danger" type="button" data-action="delete-session" data-id="' +
              esc(s.id) +
              '">Delete</button>' +
              "</li>",
          )
          .join("")
      : "";

    return (
      '<div class="page-head"><div class="eyebrow">Timer</div><h1 id="main-heading">Study timer</h1>' +
      '<p class="lede">An estimate of time spent, not proof of attention. Nothing runs in the background.</p></div>' +
      '<div class="card" style="padding:1.5rem;margin-bottom:1rem">' +
      '<div id="timer-display" style="font-family:var(--font-mono);font-size:2.4rem;letter-spacing:.02em;margin-bottom:.4rem">' +
      fmtClock(timer.seconds) +
      "</div>" +
      '<p class="hint" style="margin-bottom:1rem">Focus session</p>' +
      '<div style="display:flex;gap:.5rem;flex-wrap:wrap">' +
      '<button class="btn primary" type="button" data-action="timer-start"' +
      (timer.running ? " disabled" : "") +
      ">Start</button>" +
      '<button class="btn" type="button" data-action="timer-pause"' +
      (timer.running ? "" : " disabled") +
      ">Pause</button>" +
      '<button class="btn" type="button" data-action="timer-stop">Stop &amp; save</button>' +
      "</div>" +
      '<label class="check" style="margin-top:.9rem">' +
      '<input type="checkbox" id="timer-record"' +
      (timer.record ? " checked" : "") +
      ">" +
      "<span>Record this session and show it to my teacher</span>" +
      "</label>" +
      "</div>" +
      '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.7rem">' +
      '<h3>Recorded sessions</h3><span class="hint">' +
      fmtDur(totalSec) +
      " total</span>" +
      "</div>" +
      (rows
        ? '<ul style="list-style:none;padding:0;margin:0;display:grid;gap:.4rem">' +
          rows +
          "</ul>"
        : '<p class="notes-empty">No sessions recorded yet.</p>') +
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

  /* ---------- Data view ---------- */
  function dataView() {
    return (
      '<div class="page-head"><div class="eyebrow">Share</div>' +
      '<h1 id="main-heading">Data &amp; sharing</h1>' +
      '<p class="lede">Data stays in this browser. Use files to share updates between devices.</p></div>' +
      '<section class="section">' +
      '<div class="section-head"><h2>Export</h2></div>' +
      '<p class="hint" style="margin-bottom:.6rem">Curriculum and progress are separate so you never mix lesson content with learner progress.</p>' +
      '<div style="display:flex;gap:.5rem;flex-wrap:wrap">' +
      '<button class="btn" type="button" data-action="export-curriculum">Export curriculum</button>' +
      '<button class="btn" type="button" data-action="export-progress">Export progress</button>' +
      '<button class="btn" type="button" data-action="export-full">Full backup</button>' +
      "</div>" +
      "</section>" +
      '<section class="section">' +
      '<div class="section-head"><h2>Import</h2></div>' +
      '<p class="hint" style="margin-bottom:.6rem">You will see a preview and confirm before anything is replaced. A safety copy is downloaded first.</p>' +
      '<label class="field"><span>Choose a JSON file</span>' +
      '<input type="file" accept="application/json,.json" id="import-file"></label>' +
      "</section>"
    );
  }

  /* ---------- Export / import ---------- */
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

  /* ---------- Teacher curriculum (functional) ---------- */
  function teacherCurriculum() {
    const modules = state.curriculum.modules
      .slice()
      .sort((a, b) => a.order - b.order);
    const rows = modules.length
      ? modules
          .map(
            (m, i) =>
              '<div class="module-row">' +
              '<span class="order">' +
              (i + 1) +
              "</span>" +
              "<div>" +
              '<div class="title">' +
              esc(m.title) +
              ' <span class="hint" style="margin-left:.4rem">' +
              '<span class="status-dot ' +
              (m.published ? "pub" : "draft") +
              '"></span>' +
              (m.published ? "Published" : "Draft") +
              " · v" +
              m.version +
              "</span></div>" +
              '<div class="meta">' +
              esc(m.estimatedMinutes) +
              " min · " +
              (m.sessions || []).length +
              " sessions · " +
              (m.checklist || []).length +
              " checklist</div>" +
              "</div>" +
              '<div class="actions">' +
              '<button class="btn sm" type="button" data-action="move-up" data-id="' +
              esc(m.id) +
              '"' +
              (i === 0 ? " disabled" : "") +
              ">↑</button>" +
              '<button class="btn sm" type="button" data-action="move-down" data-id="' +
              esc(m.id) +
              '"' +
              (i === modules.length - 1 ? " disabled" : "") +
              ">↓</button>" +
              '<button class="btn sm" type="button" data-action="toggle-publish" data-id="' +
              esc(m.id) +
              '">' +
              (m.published ? "Unpublish" : "Publish") +
              "</button>" +
              '<button class="btn sm" type="button" data-action="edit-module" data-id="' +
              esc(m.id) +
              '">Edit</button>' +
              '<button class="btn sm danger" type="button" data-action="delete-module" data-id="' +
              esc(m.id) +
              '">Delete</button>' +
              "</div>" +
              "</div>",
          )
          .join("")
      : '<div class="empty-state"><strong>No modules yet.</strong>Add your first module to begin.</div>';

    return (
      '<div class="page-head"><div class="eyebrow">Teach</div><h1 id="main-heading">Curriculum</h1>' +
      '<p class="lede">Order, publish, and edit the modules learners see.</p></div>' +
      '<div class="section-head" style="display:flex;justify-content:flex-end;margin-bottom:.9rem">' +
      '<button class="btn primary" type="button" data-action="add-module">New module</button>' +
      "</div>" +
      "<div>" +
      rows +
      "</div>"
    );
  }

  function teacherResources() {
    const rows = state.curriculum.resources
      .map(
        (r) =>
          '<div class="module-row">' +
          '<span class="order">' +
          (r.type === "link" ? "↗" : r.type === "snippet" ? "{}" : "✎") +
          "</span>" +
          "<div>" +
          '<div class="title">' +
          esc(r.title) +
          ' <span class="hint">· ' +
          esc(r.type) +
          (r.needsVerification ? " · needs verification" : "") +
          "</span></div>" +
          '<div class="meta">' +
          (r.url ? esc(r.url) : "local note") +
          "</div>" +
          "</div>" +
          '<div class="actions">' +
          '<button class="btn sm" type="button" data-action="preview-resource" data-id="' +
          esc(r.id) +
          '">Preview</button>' +
          '<button class="btn sm" type="button" data-action="edit-resource" data-id="' +
          esc(r.id) +
          '">Edit</button>' +
          '<button class="btn sm danger" type="button" data-action="delete-resource" data-id="' +
          esc(r.id) +
          '">Delete</button>' +
          "</div>" +
          "</div>",
      )
      .join("");
    return (
      '<div class="page-head"><div class="eyebrow">Teach</div><h1 id="main-heading">Resources</h1>' +
      '<p class="lede">Links, notes and code snippets that support each module.</p></div>' +
      '<div class="section-head" style="display:flex;justify-content:flex-end;margin-bottom:.9rem">' +
      '<button class="btn primary" type="button" data-action="add-resource">New resource</button></div>' +
      (rows
        ? "<div>" + rows + "</div>"
        : '<div class="empty-state"><strong>No resources yet.</strong>Add your first one.</div>')
    );
  }

  function teacherChallenges() {
    const rows = state.curriculum.challenges
      .map(
        (c) =>
          '<div class="module-row">' +
          '<span class="order">⚑</span>' +
          "<div>" +
          '<div class="title">' +
          esc(c.title) +
          ' <span class="hint">· ' +
          (c.checkType === "console" ? "Console match" : "Self-check") +
          "</span></div>" +
          '<div class="meta">' +
          (c.checkType === "console"
            ? "Expected: " + esc(c.expectedOutput || "—")
            : (c.checklist || []).length + " checklist items") +
          "</div>" +
          "</div>" +
          '<div class="actions">' +
          '<button class="btn sm" type="button" data-action="edit-challenge" data-id="' +
          esc(c.id) +
          '">Edit</button>' +
          '<button class="btn sm danger" type="button" data-action="delete-challenge" data-id="' +
          esc(c.id) +
          '">Delete</button>' +
          "</div>" +
          "</div>",
      )
      .join("");
    return (
      '<div class="page-head"><div class="eyebrow">Teach</div><h1 id="main-heading">Challenges</h1>' +
      '<p class="lede">Practical exercises with clear checking methods.</p></div>' +
      '<div class="section-head" style="display:flex;justify-content:flex-end;margin-bottom:.9rem">' +
      '<button class="btn primary" type="button" data-action="add-challenge">New challenge</button></div>' +
      (rows
        ? "<div>" + rows + "</div>"
        : '<div class="empty-state"><strong>No challenges yet.</strong>Add your first one.</div>')
    );
  }

  function teacherQuizzes() {
    const quizRows = state.curriculum.quizzes
      .map(
        (q) =>
          '<div class="module-row">' +
          '<span class="order">?</span>' +
          '<div><div class="title">' +
          esc(q.title) +
          "</div>" +
          '<div class="meta">' +
          q.questions.length +
          " questions</div></div>" +
          '<div class="actions">' +
          '<button class="btn sm" type="button" data-action="edit-quiz" data-id="' +
          esc(q.id) +
          '">Edit</button>' +
          '<button class="btn sm danger" type="button" data-action="delete-quiz" data-id="' +
          esc(q.id) +
          '">Delete</button>' +
          "</div>" +
          "</div>",
      )
      .join("");
    const pollRows = state.curriculum.polls
      .map(
        (p) =>
          '<div class="module-row">' +
          '<span class="order">◔</span>' +
          '<div><div class="title">' +
          esc(p.title) +
          "</div>" +
          '<div class="meta">' +
          esc(p.question) +
          "</div></div>" +
          '<div class="actions">' +
          '<button class="btn sm" type="button" data-action="edit-poll" data-id="' +
          esc(p.id) +
          '">Edit</button>' +
          '<button class="btn sm danger" type="button" data-action="delete-poll" data-id="' +
          esc(p.id) +
          '">Delete</button>' +
          "</div>" +
          "</div>",
      )
      .join("");
    return (
      '<div class="page-head"><div class="eyebrow">Teach</div><h1 id="main-heading">Quizzes &amp; polls</h1>' +
      '<p class="lede">Check understanding. Unlimited retries, no penalties.</p></div>' +
      '<div class="section-head" style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.5rem"><h2>Quizzes</h2>' +
      '<button class="btn primary sm" type="button" data-action="add-quiz">New quiz</button></div>' +
      (quizRows
        ? '<div style="margin-bottom:1.5rem">' + quizRows + "</div>"
        : '<p class="notes-empty">No quizzes yet.</p>') +
      '<div class="section-head" style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.5rem"><h2>Polls &amp; reflection</h2>' +
      '<button class="btn primary sm" type="button" data-action="add-poll">New poll</button></div>' +
      (pollRows
        ? "<div>" + pollRows + "</div>"
        : '<p class="notes-empty">No polls yet.</p>')
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
          "<td>" +
          esc(acc.name) +
          "</td>" +
          '<td class="num">' +
          done +
          " / " +
          publishedModules().length +
          "</td>" +
          '<td class="num">' +
          b.quizAttempts.length +
          "</td>" +
          '<td class="num">' +
          b.challengeResults.filter((c) => c.passed).length +
          "</td>" +
          '<td class="num">' +
          b.feedback.length +
          "</td>" +
          '<td class="num">' +
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
      .slice(0, 20)
      .map(
        (f) =>
          "<tr><td>" +
          esc(f.label) +
          "</td><td>" +
          esc(f.moduleId) +
          "</td><td>" +
          esc(f.sentiment) +
          "</td><td>" +
          esc(f.note || "—") +
          '</td><td class="num">' +
          esc(fmtDate(f.at)) +
          "</td></tr>",
      )
      .join("");

    return (
      '<div class="page-head"><div class="eyebrow">Teach</div><h1 id="main-heading">Learner work</h1>' +
      '<p class="lede">Progress from this browser only. Import a progress file to see other devices.</p></div>' +
      '<section class="section">' +
      '<div class="section-head"><h2>Overview</h2></div>' +
      '<table class="table"><thead><tr><th>Learner</th><th>Lessons</th><th>Quizzes</th><th>Challenges</th><th>Feedback</th><th>Study time</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>" +
      "</section>" +
      '<section class="section">' +
      '<div class="section-head"><h2>Recent feedback</h2></div>' +
      (fbRows
        ? '<table class="table"><thead><tr><th>Learner</th><th>Module</th><th>Signal</th><th>Note</th><th>When</th></tr></thead><tbody>' +
          fbRows +
          "</tbody></table>"
        : '<p class="notes-empty">No feedback yet.</p>') +
      "</section>"
    );
  }

  /* ---------- Editors (module / resource / challenge / quiz / poll) ---------- */
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
      "><span>Published (visible to learners)</span></label>" +
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
      '<label class="field"><span>Body</span><textarea name="body" rows="6" style="font-family:var(--font-mono);font-size:.82rem">' +
      esc(d.body) +
      "</textarea></label>" +
      '<label class="check"><input type="checkbox" name="needsVerification"' +
      (d.needsVerification ? " checked" : "") +
      "><span>Needs verification (link unvetted)</span></label>" +
      '<div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:1rem">' +
      '<button type="button" class="btn ghost" data-action="modal-close">Cancel</button>' +
      '<button type="submit" class="btn primary">Save to this browser</button>' +
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
      '<label class="field"><span>HTML</span><textarea name="starterHtml" rows="4" style="font-family:var(--font-mono);font-size:.82rem">' +
      esc(d.starterHtml) +
      "</textarea></label>" +
      '<label class="field"><span>CSS</span><textarea name="starterCss" rows="3" style="font-family:var(--font-mono);font-size:.82rem">' +
      esc(d.starterCss) +
      "</textarea></label>" +
      '<label class="field"><span>JavaScript</span><textarea name="starterJs" rows="4" style="font-family:var(--font-mono);font-size:.82rem">' +
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

  /* ---------- Click handler ---------- */
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-action]");
    if (!t) {
      if (e.target.classList && e.target.classList.contains("dialog-backdrop"))
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
        const sb = $("#sidebar");
        const bd = $(".sidebar-backdrop");
        if (!sb) break;
        const isOpen = sb.classList.toggle("open");
        bd?.classList.toggle("show", isOpen);
        t.setAttribute("aria-expanded", String(isOpen));
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

      /* teacher: modules */
      case "add-module":
        openDialog("New module", moduleFormHtml(null), { wide: true });
        break;
      case "edit-module": {
        const m = findModule(id);
        if (m) openDialog("Edit module", moduleFormHtml(m), { wide: true });
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
        toast(m.published ? "Published." : "Moved back to draft.");
        break;
      }

      /* teacher: resources */
      case "add-resource":
        openDialog("New resource", resourceFormHtml(null), { wide: true });
        break;
      case "edit-resource": {
        const r = state.curriculum.resources.find((x) => x.id === id);
        if (r) openDialog("Edit resource", resourceFormHtml(r), { wide: true });
        break;
      }
      case "preview-resource": {
        const r = state.curriculum.resources.find((x) => x.id === id);
        if (!r) break;
        openDialog(
          "Preview: " + r.title,
          "<div>" +
            '<p style="font-weight:500">' +
            esc(r.title) +
            "</p>" +
            (r.description
              ? '<p class="hint">' + esc(r.description) + "</p>"
              : "") +
            (r.url
              ? '<p><a href="' +
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
            "</div>",
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
        openDialog("New challenge", challengeFormHtml(null), { wide: true });
        break;
      case "edit-challenge": {
        const c = state.curriculum.challenges.find((x) => x.id === id);
        if (c)
          openDialog("Edit challenge", challengeFormHtml(c), { wide: true });
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
        openDialog("New quiz", quizFormHtml(null), { wide: true });
        break;
      case "edit-quiz": {
        const q = state.curriculum.quizzes.find((x) => x.id === id);
        if (q) openDialog("Edit quiz", quizFormHtml(q), { wide: true });
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
        openDialog(
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
        openDialog(
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
        openDialog("New poll", pollFormHtml(null));
        break;
      case "edit-poll": {
        const p = state.curriculum.polls.find((x) => x.id === id);
        if (p) openDialog("Edit poll", pollFormHtml(p));
        break;
      }
      case "delete-poll":
        openConfirm(
          "Delete poll?",
          "<p>It will disappear from the learner view.</p>",
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
        toast("Marked complete.");
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
            s.style.color = "var(--accent-2)";
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
        toast("Editor reset.");
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
    render();
  }

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
        toast("That key does not match. Check the demo keys.");
        return;
      }
      state.session = { accountId: acc.id, role: acc.role };
      save();
      go(acc.role === "teacher" ? "teacher" : "student");
      return;
    }

    if (kind === "add-question") {
      const text = String(fd.get("text") || "").trim();
      if (!text) return;
      const b = bucket(myId());
      b.questions = b.questions || [];
      b.questions.push({ id: uid("q"), text, at: nowISO() });
      save();
      form.reset();
      render();
      toast("Question added.");
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
      render();
      toast(
        "Score: " + score + " / " + quiz.questions.length + ". Retry any time.",
      );
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

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && timer.running) {
      pauseTimer();
      toast("Timer paused (tab hidden).");
    }
  });

  /* ---------- Boot ---------- */
  function init() {
    try {
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
    } catch (err) {
      console.error("Orbit: init failed", err);
      document.body.innerHTML =
        '<div style="padding:2rem;font-family:sans-serif;color:#721c24;background:#f8d7da;border:1px solid #f5c6cb;border-radius:4px;margin:2rem;"><h2>Orbit could not start.</h2><p>' +
        err.message +
        "</p></div>";
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
