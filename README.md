# Orbit — Learn & Build Together

A local-first learning platform for a first-year CSE student working through the
**Journey to Mars** project. Vanilla HTML, CSS and JavaScript only. No backend,
no build step, no paid services.

 https://luthfan-tech.github.io/orbit-learning/
---

## Run it locally

1. Download or clone the folder. It should contain exactly:
   `index.html`, `styles.css`, `app.js`, `lessons.js`, `README.md`.
2. Double-click `index.html` (it also works from `file://`).
   _For the most reliable experience, serve it over HTTP:_
   ```bash
   # Python 3
   python -m http.server 8000
   # then open http://localhost:8000
   ```
3. Sign in with one of the demo keys below.

### Demo access keys

| Role    | Name    | Key                                   |
| ------- | ------- | ------------------------------------- |
| Teacher | Ms. Rao | `orbit-teacher`                       |
| Student | Aarav   | `orbit-aarav`                         |
| Student | Diya    | `orbit-diya`                          |
| Student | Kabir   | `orbit-kabir`                         |
| Student | Meera   | `orbit-meera`                         |
| —       | Visitor | _(no key — button on the login page)_ |

Change these in `lessons.js` before sharing the site.

---

## Publish on GitHub Pages

```bash
git init
git add .
git commit -m "Orbit: initial version"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then on GitHub:

1. **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Save. The site appears at
   `https://<your-username>.github.io/<repo-name>/`

All paths in this project are **relative**, so it works under a project
sub-path as well as at a domain root.

---

## Exchanging curriculum and progress between two devices

Everything is stored in `localStorage`, so devices do not talk to each other.
Exchange files by hand:

**On device A**

1. Sign in as the teacher.
2. Open **Data**.
3. Click **Export curriculum** → produces `orbit-curriculum-*.json`.
4. For learner progress, sign in as that student and click **Export progress**.

**On device B**

1. Sign in to the matching role.
2. Open **Data** → **Choose a JSON file**.
3. Orbit shows a **preview** of what will change.
4. Confirm. A safety backup of the current data downloads automatically
   before anything is replaced.

Notes on import rules:

- Curriculum import keeps learner progress for **matching module IDs**.
- If a module's content changed (its version number was bumped), the old
  progress is **kept separately** and the new version starts fresh.
- Progress import never touches curriculum.
- Older or newer schema files are rejected with an explicit message instead of
  being guessed at.

---

## What is local-only

- Everything: curriculum, resources, challenges, quizzes, polls, progress,
  drafts, feedback, badges, study sessions, and the chosen theme.
- Nothing is uploaded. There is no account server, no analytics, no telemetry.
- Two tabs of the **same browser** stay in sync via the `storage` event.
  Different browsers and different devices do **not** sync.
- The code playground runs inside a sandboxed iframe
  (`sandbox="allow-scripts"`, no `allow-same-origin`, no popups, no downloads).
  It is suitable for practice code you trust — **not** a hardened environment
  for arbitrary untrusted programs.
- The terminal is a **simulation**. It supports only:
  `help`, `clear`, `lessons`, `progress`, `run index.js`, `starmap`.
  It never executes operating-system commands.

---

## Why the role switch is not authentication

`lessons.js` is a plain text file that the browser downloads. Anyone can open
it, read the access keys, or edit their own copy. The role picker exists so a
teacher and a student can share one browser without mixing up progress data —
it is a **preference switch, not a lock**.

Consequences to be honest about:

- Data in this browser is **not private** from other people using the same
  browser profile.
- The Visitor account gives read/practise access with its own progress bucket.
- Do not treat any key here as a password. If you need real separation, you need
  a server and real authentication, which this project deliberately does not have.

---

## Manual testing checklist

**Login**

- [ ] Student tab lists four students; Teacher tab lists the admin.
- [ ] Wrong key shows a message; correct key opens the right dashboard.
- [ ] Visitor button opens the student dashboard.
- [ ] Reload keeps you signed in. Sign out returns to `#login`.

**Teacher**

- [ ] Create a module, save it, confirm it appears with the next order number.
- [ ] Move it up/down; reload; order persists.
- [ ] Publish/unpublish changes the chip and hides it from the student roadmap.
- [ ] Edit the explanation, save → version number increments.
- [ ] Delete a module; confirm it disappears and student progress records remain.
- [ ] Add a resource of each type (link, note, snippet); Preview shows it.
- [ ] Add a challenge with `console` checking, then one with `checklist`.
- [ ] Create a quiz with three questions; add and remove a question.
- [ ] Create a poll with three options.
- [ ] Progress page shows the five students with real (zero if unused) counts.

**Student**

- [ ] Roadmap lists only published modules in order.
- [ ] First visit to a lesson flips the status to In progress.
- [ ] Continue Learning jumps to the first unfinished module.
- [ ] Playground: Run renders HTML/CSS and captures `console.log`.
- [ ] Playground: a thrown error appears in red as text, not as HTML.
- [ ] Reset restores starter code; Save draft survives a reload.
- [ ] Console challenge passes on the exact trimmed output and fails otherwise.
- [ ] Checklist challenge records ticks and updates the passed count.
- [ ] Quiz: retry freely, score is recorded, explanations are present.
- [ ] Feedback buttons save locally and appear on the teacher Progress page.
- [ ] Timer: start, hide the tab (it pauses), stop, delete a recorded session.
- [ ] Terminal: `help`, `lessons`, `progress`, `run index.js`, `starmap`,
      an unknown command → error line.

**Data**

- [ ] Export each of the three files; they open as valid JSON.
- [ ] Import a curriculum file → preview appears → confirm → modules update.
- [ ] Import a progress file → curriculum is unchanged.
- [ ] Import a file with a wrong `schemaVersion` → clear error, no data lost.
- [ ] Import malformed JSON → message, existing data intact.

**Accessibility / responsive**

- [ ] Tab reaches every control; focus ring is visible.
- [ ] Escape closes the modal; the close button is reachable.
- [ ] At 360px wide there is no horizontal scrolling.
- [ ] Toggle light/dark; text stays readable in both.
- [ ] With _Reduce motion_ enabled, transitions are effectively removed.

---

## File map

| File         | Responsibility                                     |
| ------------ | -------------------------------------------------- |
| `index.html` | Shell, font loading, script order                  |
| `styles.css` | Theme tokens, layout, components, responsive rules |
| `lessons.js` | Schema version, accounts, starter curriculum       |
| `app.js`     | Router, state, dashboards, sandbox, export/import  |
| `README.md`  | This document                                      |
