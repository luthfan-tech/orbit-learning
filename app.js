(function () {
  // Load from LocalStorage OR fallback to data.js
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

  render();

  // EDITOR LOGIC - Clean & Direct
  const modal = document.getElementById("editor-modal");
  const forms = document.getElementById("editor-forms");

  document.getElementById("open-editor").onclick = () => {
    forms.innerHTML = "";

    D.students.forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "edit-group";
      div.innerHTML = `
        <h3>${s.name}</h3>
        <div class="edit-row">
          <label>Hrs this week <input type="number" step="0.5" id="hrs-${i}" value="${s.hoursThisWeek}"></label>
          <label>Total Hrs <input type="number" step="0.5" id="tot-${i}" value="${s.hoursTotal}"></label>
          <label>Progress (%) <input type="number" id="prog-${i}" value="${s.progress}"></label>
        </div>
        <label>Feedback <textarea id="fb-${i}">${s.feedback}</textarea></label>
      `;
      forms.appendChild(div);
    });

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

    D.meta.updated = new Date().toLocaleDateString();
    localStorage.setItem("orbit_data", JSON.stringify(D));
    render();
    modal.hidden = true;
  };
})();
