/* =========================================================================
   lessons.js — schema version, accounts, and starter curriculum.
   Everything here is *seed data*. It is written to localStorage once,
   on first load, and never overwrites later edits.
   ========================================================================= */

const SCHEMA_VERSION = 3;
const STORAGE_KEY = "orbit.v3";

/* --- Interface modes, NOT authentication -------------------------------
   These keys are printed in the login screen on purpose. This is a static
   site: anyone with the file can read them. The role switch exists so a
   teacher and a student can use the same browser without confusing each
   other's progress. It does not protect data from other users of this
   device — see README.                                                    */
const ACCOUNTS = [
  {
    id: "admin",
    role: "teacher",
    name: "Ms. Rao",
    initials: "MR",
    key: "orbit-teacher",
  },
  {
    id: "stu-aarav",
    role: "student",
    name: "Aarav",
    initials: "AA",
    key: "orbit-aarav",
  },
  {
    id: "stu-diya",
    role: "student",
    name: "Diya",
    initials: "DI",
    key: "orbit-diya",
  },
  {
    id: "stu-kabir",
    role: "student",
    name: "Kabir",
    initials: "KA",
    key: "orbit-kabir",
  },
  {
    id: "stu-meera",
    role: "student",
    name: "Meera",
    initials: "ME",
    key: "orbit-meera",
  },
];

const VISITOR = {
  id: "visitor",
  role: "student",
  name: "Visitor",
  initials: "VI",
  key: null,
};

/* --- Badges ------------------------------------------------------------ */
const BADGES = [
  { id: "first-step", label: "First Step", desc: "Complete your first module" },
  { id: "halfway", label: "Halfway to Mars", desc: "Complete 2 modules" },
  { id: "arrival", label: "Arrival", desc: "Complete all 4 modules" },
  { id: "quiz-taker", label: "Quiz Taker", desc: "Finish a quiz" },
  { id: "builder", label: "Builder", desc: "Pass a challenge" },
  { id: "your-voice", label: "Your Voice", desc: "Send feedback on a lesson" },
];

/* --- Starter curriculum ------------------------------------------------ */
function starterCurriculum() {
  return {
    modules: [
      {
        id: "m1",
        version: 1,
        published: true,
        title: "HTML Foundations",
        goal: "Build a one-page Mars facts site with clean, semantic HTML.",
        estimatedMinutes: 60,
        sessions: [
          { title: "Sketch the page on paper", minutes: 10 },
          { title: "Write the HTML structure", minutes: 30 },
          { title: "Check it in the browser", minutes: 20 },
        ],
        explanation:
          "HTML describes structure, not looks. Every page is a tree of elements: a heading, some paragraphs, a list of facts, and a caption.\n\n" +
          "For the Mars page you need: one <h1> for the page title, an <img> for a picture, an <ul> of three facts, and a <footer> with your name. " +
          'Use elements that describe meaning — <h1> for the main title, not <div class="big">. That choice is what makes a page readable by screen readers and search engines.',
        resourceIds: ["r1", "r2"],
        practice:
          "Create index.html with a page title, one image with alt text, and a list of three Mars facts.",
        challengeId: "c1",
        quizId: "q1",
        reflection:
          "Which HTML element surprised you the most, and why does its name describe meaning better than appearance?",
        checklist: [
          "Page has exactly one <h1>",
          "Image has descriptive alt text",
          "List has three real facts",
          "File is named index.html",
        ],
      },
      {
        id: "m2",
        version: 1,
        published: true,
        title: "CSS and Layout",
        goal: "Style the Mars page and build a row of planet-information cards.",
        estimatedMinutes: 60,
        sessions: [
          { title: "Colours, fonts and spacing", minutes: 20 },
          { title: "Flexbox card row", minutes: 25 },
          { title: "Light polish and contrast check", minutes: 15 },
        ],
        explanation:
          "CSS decides how the structure looks. Start with three decisions: a text colour, a background colour, and a comfortable line length.\n\n" +
          "Then lay out the planet cards. Flexbox is the shortest path: give the container display: flex, a gap, and flex-wrap: wrap so the cards move to a new line on narrow screens. " +
          "Check contrast with your browser dev tools before you call the styling finished.",
        resourceIds: ["r3", "r4"],
        practice:
          "Style the Mars page, then add three planet cards in a row that wrap on small screens.",
        challengeId: "c2",
        quizId: "q2",
        reflection:
          "What was the first CSS rule you wrote that changed the page in a way you could immediately see?",
        checklist: [
          "Body text is readable against the background",
          "Cards use flexbox and wrap on narrow screens",
          "Spacing is consistent (one gap value)",
          "No horizontal scrolling on a phone width",
        ],
      },
      {
        id: "m3",
        version: 1,
        published: true,
        title: "JavaScript Interactions",
        goal: "Add a fact-reveal button and a short interactive quiz.",
        estimatedMinutes: 60,
        sessions: [
          { title: "Select elements and listen for clicks", minutes: 20 },
          { title: "Reveal a random fact", minutes: 20 },
          { title: "Build the quiz check", minutes: 20 },
        ],
        explanation:
          "JavaScript lets the page react. The pattern is always the same: select an element, listen for an event, change something.\n\n" +
          "You only need three ideas here: document.querySelector to find elements, addEventListener to react to a click, and textContent to change text safely. " +
          "Use textContent rather than innerHTML — it treats your string as text, not markup.",
        resourceIds: ["r5", "r6"],
        practice:
          "Add a button that shows a random fact from an array each time it is clicked.",
        challengeId: "c3",
        quizId: "q3",
        reflection:
          "Describe, in one sentence, what happens between the click and the new text appearing.",
        checklist: [
          "Button has a visible focus state",
          "A fact changes on every click",
          "No innerHTML used for plain text",
          "The quiz gives clear right/wrong feedback",
        ],
      },
      {
        id: "m4",
        version: 1,
        published: true,
        title: "Finish and Present",
        goal: "Make the page work on a phone, check keyboard use, and present the project.",
        estimatedMinutes: 60,
        sessions: [
          { title: "Mobile pass at 360px width", minutes: 20 },
          { title: "Keyboard-only walkthrough", minutes: 20 },
          { title: "Write and rehearse the presentation", minutes: 20 },
        ],
        explanation:
          "A project is finished when someone else can use it. Resize the browser to 360px wide and fix whatever breaks. " +
          "Then put the mouse away: Tab through the page. Every interactive element should be reachable and show where focus is.\n\n" +
          "Finally, prepare three sentences: what you built, one decision you made, and one thing you would change next.",
        resourceIds: ["r7", "r4"],
        practice:
          "Fix two mobile issues and one keyboard issue, then write your three presentation sentences.",
        challengeId: "c4",
        quizId: "q4",
        reflection:
          "What would you build next on this project if you had one more hour?",
        checklist: [
          "No horizontal scroll at 360px",
          "Every button reachable with Tab",
          "Focus is visible on all controls",
          "Three presentation sentences written",
        ],
      },
    ].map((m, i) => ({ ...m, order: i + 1 })),

    resources: [
      {
        id: "r1",
        type: "link",
        title: "MDN — HTML basics",
        url: "https://developer.mozilla.org/en-US/docs/Learn/HTML",
        description:
          "Official reference for every HTML element used in this module.",
        body: "",
        needsVerification: false,
      },
      {
        id: "r2",
        type: "note",
        title: "Writing good alt text",
        url: "",
        description: "A short reminder for images.",
        body: 'Describe what the image shows in context. "Mars surface with a dust storm on the horizon" is better than "mars". Leave alt="" only for purely decorative images.',
        needsVerification: false,
      },
      {
        id: "r3",
        type: "link",
        title: "MDN — CSS layout",
        url: "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout",
        description: "Flexbox and grid, explained from the beginning.",
        body: "",
        needsVerification: false,
      },
      {
        id: "r4",
        type: "link",
        title: "MDN — Accessibility",
        url: "https://developer.mozilla.org/en-US/docs/Learn/Accessibility",
        description:
          "Practical accessibility guidance, including keyboard use.",
        body: "",
        needsVerification: false,
      },
      {
        id: "r5",
        type: "link",
        title: "MDN — JavaScript first steps",
        url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps",
        description:
          "Variables, functions, events — the parts this module needs.",
        body: "",
        needsVerification: false,
      },
      {
        id: "r6",
        type: "snippet",
        title: "Reveal-a-fact pattern",
        url: "",
        description: "A minimal working example you can adapt.",
        body: "const facts = ['Olympus Mons is the tallest volcano in the solar system.', 'A Mars day is 24 hours 37 minutes.', 'Mars has two small moons.'];\nconst out = document.querySelector('#fact');\nconst btn = document.querySelector('#next');\nbtn.addEventListener('click', () => {\n  out.textContent = facts[Math.floor(Math.random() * facts.length)];\n});",
        needsVerification: false,
      },
      {
        id: "r7",
        type: "link",
        title: "NASA — Mars overview",
        url: "https://science.nasa.gov/mars/",
        description: "Official NASA Mars facts and imagery.",
        body: "",
        needsVerification: true,
      },
      {
        id: "r8",
        type: "note",
        title: "Add your own photography resource",
        url: "",
        description: "Placeholder for a photography link you trust.",
        body: "Replace this with a resource you have actually opened and checked. Mark it as needing verification until you do.",
        needsVerification: true,
      },
    ],

    challenges: [
      {
        id: "c1",
        title: "Mars facts page",
        instructions:
          "Create index.html with an <h1>, an <img> with alt text, a <ul> of three facts, and a <footer> with your name.",
        starterHtml:
          '<h1>Mars</h1>\n<img src="mars.jpg" alt="">\n<ul>\n  <li>Fact one</li>\n</ul>\n<footer>Your name</footer>',
        starterCss:
          "body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.6; }\nimg { max-width: 100%; border-radius: 12px; }",
        starterJs: "",
        hints: [
          "An <h1> should appear once per page.",
          'alt="" means "decorative" — your Mars image is not decorative.',
        ],
        sampleResult:
          "<h1>Mars</h1><ul><li>Olympus Mons is the tallest volcano.</li></ul>",
        checkType: "checklist",
        expectedOutput: "",
        checklist: [
          "Exactly one <h1>",
          "Image has descriptive alt text",
          "List contains three facts",
          "Footer shows your name",
        ],
      },
      {
        id: "c2",
        title: "Planet card row",
        instructions:
          "Wrap three .card elements in a .row container. Use flexbox with a gap, and make the cards wrap below 600px.",
        starterHtml:
          '<div class="row">\n  <article class="card"><h2>Mars</h2><p>Rocky and cold.</p></article>\n</div>',
        starterCss:
          ".row { display: flex; gap: 1rem; flex-wrap: wrap; }\n.card { flex: 1 1 220px; border: 1px solid #ccc; padding: 1rem; border-radius: 12px; }",
        starterJs: "",
        hints: [
          "flex-wrap: wrap is what makes the row collapse on narrow screens.",
          "flex: 1 1 220px sets a sensible minimum width.",
        ],
        sampleResult:
          '<div style="display:flex;gap:1rem"><div class="card">Mars</div><div class="card">Venus</div><div class="card">Earth</div></div>',
        checkType: "checklist",
        expectedOutput: "",
        checklist: [
          "Three cards exist",
          "Cards sit in one row on a wide screen",
          "Cards stack below 600px",
          "No horizontal scrolling",
        ],
      },
      {
        id: "c3",
        title: "Describe a planet",
        instructions:
          'Write a function describePlanet(name) that returns the string "<name> is a planet." Then log describePlanet("Mars").',
        starterHtml: '<p id="out">Open the console to see the result.</p>',
        starterCss:
          "body { font-family: system-ui, sans-serif; padding: 1rem; }",
        starterJs:
          "// Write your function below\nfunction describePlanet(name) {\n  // return the sentence here\n}\n\nconsole.log(describePlanet('Mars'));",
        hints: [
          "Template literals use backticks: `${name} is a planet.`",
          "Return the value; do not console.log inside the function.",
        ],
        sampleResult: "Mars is a planet.",
        checkType: "console",
        expectedOutput: "Mars is a planet.",
        checklist: [],
      },
      {
        id: "c4",
        title: "Presentation readiness",
        instructions:
          "Make the page work at 360px, make everything keyboard reachable, and write three presentation sentences.",
        starterHtml:
          '<main>\n  <h1>Journey to Mars</h1>\n  <button type="button">Show a fact</button>\n</main>',
        starterCss:
          "main { padding: 1rem; }\nbutton { padding: .6rem 1rem; border-radius: 8px; }",
        starterJs: "",
        hints: [
          "Test with the browser device toolbar at 360px.",
          "Press Tab and watch for a visible focus ring.",
        ],
        sampleResult:
          "A page that works at 360px with visible focus on every control.",
        checkType: "checklist",
        expectedOutput: "",
        checklist: [
          "No horizontal scroll at 360px",
          "Every button reachable with Tab",
          "Focus ring visible",
          "Three sentences written",
        ],
      },
    ],

    quizzes: [
      {
        id: "q1",
        title: "HTML Foundations check",
        questions: [
          {
            id: "q1a",
            prompt:
              "Which element should be the single main heading of the page?",
            options: ["<h1>", "<div>", "<span>", "<p>"],
            answer: 0,
            explanation:
              "There should be one <h1> per page; it names the page content.",
          },
          {
            id: "q1b",
            prompt: "What makes alt text useful?",
            options: [
              "It describes the image in context",
              "It repeats the filename",
              "It makes the image load faster",
              "It is required by HTML",
            ],
            answer: 0,
            explanation:
              "Alt text exists so the meaning of the image survives when the image does not.",
          },
        ],
      },
      {
        id: "q2",
        title: "CSS and Layout check",
        questions: [
          {
            id: "q2a",
            prompt: "Which property makes a flex row wrap onto new lines?",
            options: [
              "flex-wrap: wrap",
              "display: block",
              "overflow: hidden",
              "position: absolute",
            ],
            answer: 0,
            explanation:
              "flex-wrap: wrap lets items move to the next line when space runs out.",
          },
          {
            id: "q2b",
            prompt: "Why check colour contrast?",
            options: [
              "So text stays readable for low-vision users",
              "So the page loads faster",
              "So the HTML validates",
              "So fonts render in bold",
            ],
            answer: 0,
            explanation:
              "Contrast is a readability and accessibility requirement, not decoration.",
          },
        ],
      },
      {
        id: "q3",
        title: "JavaScript Interactions check",
        questions: [
          {
            id: "q3a",
            prompt: "Which method attaches a click handler?",
            options: [
              "addEventListener",
              "querySelector",
              "textContent",
              "push",
            ],
            answer: 0,
            explanation:
              "addEventListener registers a function to run when the event fires.",
          },
          {
            id: "q3b",
            prompt: "Why prefer textContent over innerHTML for plain text?",
            options: [
              "It treats the value as text, not markup",
              "It is shorter to type",
              "It works only in Chrome",
              "It runs faster than CSS",
            ],
            answer: 0,
            explanation:
              "innerHTML parses the string as HTML, which can inject unwanted markup.",
          },
        ],
      },
      {
        id: "q4",
        title: "Finish and Present check",
        questions: [
          {
            id: "q4a",
            prompt: "What is the quickest way to test keyboard access?",
            options: [
              "Tab through the page with the mouse unplugged",
              "Zoom the page to 200%",
              "Open the console",
              "Clear the cache",
            ],
            answer: 0,
            explanation:
              "Tabbing through shows exactly what a keyboard-only user experiences.",
          },
          {
            id: "q4b",
            prompt: "A good presentation sentence says…",
            options: [
              "What you built and one decision you made",
              "How long you spent typing",
              "Which editor you used",
              "That it is finished and perfect",
            ],
            answer: 0,
            explanation:
              "Naming a decision shows the thinking behind the work.",
          },
        ],
      },
    ],

    polls: [
      {
        id: "p1",
        title: "Mars mission poll",
        question: "Which part of the Journey to Mars project excited you most?",
        options: [
          "The research and facts",
          "Styling the cards",
          "Making the button work",
          "Presenting the project",
        ],
      },
    ],
  };
}
