(function () {
  let D = JSON.parse(localStorage.getItem("orbit_data")) || window.ORBIT_DATA;
  if (!D) return;

  const renderUI = () => {
    document.getElementById("year").textContent = new Date().getFullYear();
    document.getElementById("students").innerHTML = D.students
      .map(
        (s) => `
      <article class="card">
        <div class="card-head">
          <span class="avatar">${s.avatar || "🙂"}</span>
          <div>
            <h2 class="student-name">${s.name}</h2>
            <p class="focus">${s.focus || ""}</p>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><b>${s.streak}</b><span>streak</span></div>
          <div class="stat"><b>${s.hoursThisWeek}h</b><span>this week</span></div>
          <div class="stat"><b>${s.hoursTotal}h</b><span>total</span></div>
        </div>
        <div class="bar"><i style="width:${s.progress}%"></i></div>
        <p class="muted" style="margin:0 0 .6rem">${s.progress}% complete</p>
        <ul class="lessons">
          ${(s.lessons || []).map((l) => `<li><span class="dot ${l.status}"></span>${l.title}</li>`).join("")}
        </ul>
        <p class="feedback ${s.tone || "good"}">${s.feedback || ""}</p>
      </article>
    `,
      )
      .join("");
  };

  // Handle simple hash routing for pages
  const handleRoute = () => {
    const hash = window.location.hash.replace("#", "");
    const pages = ["dashboard", "privacy", "thankyou", "404"];
    const current = pages.includes(hash) ? hash : "dashboard";

    pages.forEach((p) => {
      document.getElementById(`view-${p}`).hidden = p !== current;
    });

    // Update breadcrumbs
    const crumb = document.getElementById("nav-crumbs");
    if (current === "dashboard") {
      crumb.innerHTML = `<span style="font-weight:600;color:var(--ink)">Dashboard</span>`;
    } else {
      crumb.innerHTML = `<a href="#">Home</a> › <span>${current}</span>`;
    }
  };

  // Render and route on load
  renderUI();
  window.addEventListener("hashchange", handleRoute);
  handleRoute();

  // --- EDITOR LOGIC ---
  const modal = document.getElementById("editor-modal");
  const forms = document.getElementById("editor-forms");

  document.getElementById("open-editor").onclick = () => {
    forms.innerHTML = D.students
      .map(
        (s, i) => `
      <div class="edit-group">
        <h3>${s.avatar || ""} ${s.name}</h3>
        <div class="edit-row">
          <label>Hrs this week <input type="number" step="0.5" id="hrs-${i}" value="${s.hoursThisWeek}"></label>
          <label>Total Hrs <input type="number" step="0.5" id="tot-${i}" value="${s.hoursTotal}"></label>
          <label>Progress (%) <input type="number" id="prog-${i}" value="${s.progress}"></label>
        </div>
        <label>Feedback <textarea id="fb-${i}">${s.feedback}</textarea></label>
      </div>
    `,
      )
      .join("");
    modal.hidden = false;
  };

  document.getElementById("close-editor").onclick = () => {
    modal.hidden = true;
  };

  document.getElementById("save-editor").onclick = () => {
    D.students.forEach((s, i) => {
      s.hoursThisWeek =
        parseFloat(document.getElementById(`hrs-${i}`).value) || 0;
      s.hoursTotal = parseFloat(document.getElementById(`tot-${i}`).value) || 0;
      s.progress = parseInt(document.getElementById(`prog-${i}`).value) || 0;
      s.feedback = document.getElementById(`fb-${i}`).value;
    });

    localStorage.setItem("orbit_data", JSON.stringify(D));
    renderUI(); // Re-draw the cards instantly
    modal.hidden = true;
  };
})();
