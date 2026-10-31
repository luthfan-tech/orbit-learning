// ============================================
// ORBIT DATA — edit this file to update students
// ============================================
window.ORBIT_DATA = {
  meta: {
    title: "Orbit — Learn & Build Together",
    promise: "Pages load in under 2 seconds on a normal connection.",
    updated: "2025-01-15",
  },
  students: [
    {
      id: "s1",
      name: "Aarav",
      avatar: "🦊",
      focus: "HTML & CSS fundamentals",
      streak: 6,
      hoursThisWeek: 7.5,
      hoursTotal: 42,
      progress: 68, // 0–100
      lessons: [
        { title: "Semantic HTML", status: "done" },
        { title: "Flexbox", status: "done" },
        { title: "CSS Grid", status: "active" },
        { title: "Responsive design", status: "todo" },
      ],
      feedback:
        "Great momentum this week. Needs to slow down and test layouts on real devices.",
      tone: "good", // good | watch | great
    },
    {
      id: "s2",
      name: "Meera",
      avatar: "🐢",
      focus: "JavaScript basics",
      streak: 3,
      hoursThisWeek: 4,
      hoursTotal: 29,
      progress: 44,
      lessons: [
        { title: "Variables & types", status: "done" },
        { title: "Functions", status: "active" },
        { title: "Arrays", status: "todo" },
        { title: "Objects", status: "todo" },
      ],
      feedback: "Consistent but short sessions. Try 20-minute focused blocks.",
      tone: "watch",
    },
  ],
};
