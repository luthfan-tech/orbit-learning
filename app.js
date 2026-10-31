(function () {
  // 1. Data Setup (Loads from GitHub via raw URL, or falls back to data.js)
  let D = window.ORBIT_DATA;

  // 2. Routing Logic
  const handleRoute = () => {
    const hash = window.location.hash.replace("#", "");
    const pages = ["dashboard", "profile", "edit", "login"];
    const current = pages.includes(hash) ? hash : "dashboard";

    pages.forEach((p) => {
      const el = document.getElementById(`view-${p}`);
      if (el) el.hidden = p !== current;
    });

    // Show/Hide floating edit button based on login status
    const isAuth = !!localStorage.getItem("orbit_gh_token");
    document.getElementById("floating-edit").hidden =
      !isAuth || current !== "dashboard";

    // Build page specific content
    if (current === "dashboard") renderDashboard();
    if (current === "profile") renderProfile();
    if (current === "edit") renderEditor();
  };

  // 3. Render Dashboard (One Student Card)
  const renderDashboard = () => {
    document.getElementById("year").textContent = new Date().getFullYear();
    const s = D.student;
    document.getElementById("student-container").innerHTML = `
      <article class="card" style="max-width: 400px; margin: 0 auto; cursor: pointer;" onclick="window.location.hash='profile'">
        <div class="card-head">
          <span class="avatar" style="font-size: 2.5rem;">${s.avatar || "🙂"}</span>
          <div>
            <h2 class="student-name" style="font-size: 1.5rem;">${s.name}</h2>
            <p class="focus">${s.focus}</p>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><b>${s.streak}</b><span>streak</span></div>
          <div class="stat"><b>${s.hoursThisWeek}h</b><span>this week</span></div>
          <div class="stat"><b>${s.hoursTotal}h</b><span>total</span></div>
        </div>
        <div class="bar"><i style="width:${s.progress}%"></i></div>
        <p class="muted" style="margin:0 0 .6rem">${s.progress}% complete</p>
        <p class="feedback ${s.tone || "good"}">${s.feedback || "No feedback yet."}</p>
        <div style="text-align:center; margin-top: 1rem; font-weight:bold; color:var(--muted); font-size:0.85rem;">View Full Profile →</div>
      </article>
    `;
  };

  // 4. Render Profile
  const renderProfile = () => {
    const s = D.student;
    document.getElementById("profile-header").innerHTML = `
      <h1 style="margin:0; font-size: 2.5rem;">${s.avatar} ${s.name}</h1>
      <p class="muted" style="font-size: 1.1rem;">Learning streak: ${s.streak} days</p>
    `;
    document.getElementById("p-focus").textContent = s.focus;
    document.getElementById("p-bar").style.width = s.progress + "%";
    document.getElementById("p-progress").textContent =
      s.progress + "% of curriculum completed";
  };

  // 5. Render Editor
  const renderEditor = () => {
    const s = D.student;
    document.getElementById("editor-form").innerHTML = `
      <div class="edit-group">
        <h3>${s.avatar} ${s.name}</h3>
        <div class="edit-row">
          <label>Hours This Week <input type="number" step="0.5" id="hrs-week" value="${s.hoursThisWeek}"></label>
          <label>Total Hours <input type="number" step="0.5" id="hrs-total" value="${s.hoursTotal}"></label>
          <label>Progress (%) <input type="number" id="prog" value="${s.progress}"></label>
        </div>
        <label>Current Focus <input type="text" id="focus" value="${s.focus}"></label>
        <label>Feedback <textarea id="fb">${s.feedback}</textarea></label>
      </div>
    `;
  };

  // 6. Handle Login
  document.getElementById("save-token").onclick = () => {
    const token = document.getElementById("token-input").value.trim();
    if (token) {
      localStorage.setItem("orbit_gh_token", token);
      window.location.hash = ""; // Go home
    }
  };

  // 7. Handle SAVE (The GitHub API Magic)
  document.getElementById("save-editor").onclick = async () => {
    const token = localStorage.getItem("orbit_gh_token");
    if (!token) return alert("You must be logged in to save.");

    // Get new values from form
    const s = D.student;
    s.hoursThisWeek =
      parseFloat(document.getElementById("hrs-week").value) || 0;
    s.hoursTotal = parseFloat(document.getElementById("hrs-total").value) || 0;
    s.progress = parseInt(document.getElementById("prog").value) || 0;
    s.focus = document.getElementById("focus").value;
    s.feedback = document.getElementById("fb").value;

    const btn = document.getElementById("save-editor");
    btn.textContent = "Saving to GitHub...";
    btn.disabled = true;

    // GitHub API Configuration
    // We must update the data.js file directly so it permanently saves.
    const newDataString = `window.ORBIT_DATA = ${JSON.stringify(D, null, 2)};`;

    // Your Repo details - IMPORTANT: Update these if your repo name changes!
    const repoUser = "luthfan-tech"; // Your GitHub username (I guessed based on your screenshot, change if wrong)
    const repoName = "orbit-learning"; // Your repo name (change if different)
    const filePath = "data.js";

    try {
      // 1. Get the current file SHA (GitHub requires this to update a file)
      const getFile = await fetch(
        `https://api.github.com/repos/${repoUser}/${repoName}/contents/${filePath}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!getFile.ok)
        throw new Error(
          "Could not find repo. Check your Token or Repo Name in app.js.",
        );
      const fileData = await getFile.json();

      // 2. Send the PUT request to update the file
      const putFile = await fetch(
        `https://api.github.com/repos/${repoUser}/${repoName}/contents/${filePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Orbit: Automated data update",
            content: btoa(newDataString), // Base64 encode
            sha: fileData.sha,
          }),
        },
      );

      if (!putFile.ok)
        throw new Error("Failed to save. Token might be expired.");

      // Success!
      alert(
        "Saved permanently to GitHub! It will reflect on all devices in 1-2 minutes.",
      );
      window.location.hash = "";
    } catch (err) {
      alert(err.message);
    } finally {
      btn.textContent = "Save Permanently";
      btn.disabled = false;
    }
  };

  // Init
  handleRoute();
  window.addEventListener("hashchange", handleRoute);
})();
