(function () {
  const D = window.ORBIT_DATA;
  if (!D) return;

  document.title = D.meta.title;

  // promise + updated
  const p = document.getElementById("promise");
  if (p && D.meta.promise) p.textContent = "⏱ " + D.meta.promise;

  const upd = document.getElementById("updated");
  if (upd && D.meta.updated)
    upd.textContent = "Last updated: " + D.meta.updated;

  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  // students
  const host = document.getElementById("students");
  if (!host) return;

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

      <div class="bar" role="progressbar"
           aria-valuenow="${s.progress}" aria-valuemin="0" aria-valuemax="100"
           aria-label="${s.name} progress">
        <i style="width:${Math.max(0, Math.min(100, s.progress))}%"></i>
      </div>
      <p class="muted" style="margin:0 0 .6rem">${s.progress}% complete</p>

      <ul class="lessons">
        ${(s.lessons || [])
          .map(
            (l) => `
          <li><span class="dot ${l.status}" aria-hidden="true"></span>${l.title}</li>
        `,
          )
          .join("")}
      </ul>

      <p class="feedback ${s.tone || "good"}">${s.feedback || ""}</p>
    </article>
  `,
    )
    .join("");
})();
