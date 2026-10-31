(function () {
  // Load from LocalStorage (if you edited it) OR fallback to data.js
  let D = JSON.parse(localStorage.getItem("orbit_data")) || window.ORBIT_DATA;
  if (!D) return;

  const render = () => {
    document.title = D.meta.title;
    document.getElementById("promise").textContent = "⏱ " + D.meta.promise;
    document.getElementById("updated").textContent =
      "Last updated: " + D.meta.updated;
    document.getElementById("year").textContent = new Date().getFullYear();

    const host = document.getElementById("students");
    host.innerHTML = D.students
      .map(
        (s) => `
      <article class="card" aria-labelledby="nm-${s.id}">
        <div class="card-head">
          <span class="avatar" aria-hidden="true">${s.avatar || "🙂"}</span>
          <div>
            <h2 class="student-name" id="nm-${s.id}">${s.name}</h2>
            <p class="focus">${s.focus || ""}</p>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><b>${s.streak}</b><span>streak</span></div>
          <div class="stat"><b>${s.hoursThisWeek}h</b><span>this week</span></div>
          <div class="stat"><b>${s.hoursTotal}h</b><span>total</span></div>
        </div>
        <div class="bar" role="progressbar" aria-valuenow="${s.progress}" aria-valuemin="0" aria-valuemax="100">
          <i style="width:${Math.max(0, Math.min(100, s.progress))}%"></i>
        </div>
        <p class="muted" style="margin:0 0 .6rem">${s.progress}% complete</p>
        <ul class="lessons">
          ${(s.lessons || []).map((l) => `<li><span class="dot ${l.status}" aria-hidden="true"></span>${l.title}</li>`).join("")}
        </ul>
        <p class="feedback ${s.tone || "good"}">${s.feedback || ""}</p>
      </article>
    `,
      )
      .join("");
  };

  render();

  // --- EDITOR LOGIC ---
  const modal = document.getElementById("editor-modal");
  const forms = document.getElementById("editor-forms");

  document.getElementById("open-editor").onclick = () => {
    forms.innerHTML = D.students
      .map(
        (s, i) => `
      <div class="edit-group">
        <h3>${s.avatar} ${s.name}</h3>
        <div class="edit-row">
          <label>Hours This Week <input type="number" step="0.5" id="hrs-${i}" value="${s.hoursThisWeek}"></label>
          <label>Total Hours <input type="number" step="0.5" id="tot-${i}" value="${s.hoursTotal}"></label>
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
      s.hoursThisWeek = parseFloat(document.getElementById(`hrs-${i}`).value);
      s.hoursTotal = parseFloat(document.getElementById(`tot-${i}`).value);
      s.progress = parseInt(document.getElementById(`prog-${i}`).value);
      s.feedback = document.getElementById(`fb-${i}`).value;
    });
    D.meta.updated = new Date().toLocaleDateString();

    // Save to LocalStorage so it remembers!
    localStorage.setItem("orbit_data", JSON.stringify(D));
    render();
    modal.hidden = true;
  };
})();
