export const currentUser = {
  id: "user-1",
  display_name: "Amina",
  avatar_url: "",
  created_at: "2026-05-01T12:00:00Z"
};

export const groups = [
  {
    id: "group-1",
    name: "Friday Sisters Halaqa",
    description: "A weekly circle for reflection, learning, and steady practice.",
    role: "admin",
    memberCount: 18,
    is_public: false,
    invite_code: "d4c87ad0-7d16-4df8-899a-1ad827771c4a"
  },
  {
    id: "group-2",
    name: "New Muslims Study Circle",
    description: "Foundations, questions, and companionship.",
    role: "member",
    memberCount: 31,
    is_public: true,
    invite_code: "2c8fd8a9-e751-40d0-8cce-e3d2f52d8c4a"
  }
];

export const lesson = {
  id: "lesson-1",
  title: "Gratitude That Deepens the Heart",
  theme: "Gratitude",
  ayatArabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
  ayatTransliteration: "Fadhkuroonee adhkurkum washkuroo lee wa la takfuroon.",
  ayatEnglish: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.",
  ayat_reference: "Surah Al-Baqarah 2:152",
  hadith:
    "The Prophet, peace be upon him, taught that the believer's affair is wondrous: when good comes, gratitude is good for them; when hardship comes, patience is good for them.",
  hadith_reference: "Sahih Muslim",
  body_text: [
    "Gratitude in Islam is more than saying thanks after comfort arrives. It is a posture of the heart that notices the Giver within every gift, and it turns ordinary moments into invitations back to Allah.",
    "A grateful person does not pretend life is easy. They learn to recognize mercy even while carrying difficulty, and that recognition softens the way they speak, choose, forgive, and serve.",
    "This week, let gratitude become specific. Name the blessings you usually rush past. Ask what each blessing is calling you to protect, share, or use more beautifully."
  ],
  reflection_prompts: [
    "What is one blessing you often overlook, and how can you honor it this week?",
    "What is one practical act of gratitude you can protect before next week's halaqa?"
  ]
};

export const firstLessonSystemMessage =
  "Assalamu Alaikum and welcome to your halaqa. Your first lesson is ready above. Start by sharing your reflection on this week's prompt - there are no wrong answers, only honest ones.";

export const initialReflections = [
  {
    id: "reflection-1",
    user_id: "user-2",
    display_name: "Maryam",
    body: "I overlook having quiet time after Fajr. This week I want to protect it instead of immediately opening my phone.",
    created_at: "2026-06-03T06:32:00Z"
  },
  {
    id: "reflection-2",
    user_id: "user-3",
    display_name: "Layla",
    body: "I keep thinking about family meals. They are simple, but they hold so much mercy.",
    created_at: "2026-06-03T07:05:00Z"
  }
];

export const initialMessages = [
  {
    id: "system-1",
    user_id: null,
    display_name: "Halaqa",
    body: firstLessonSystemMessage,
    created_at: "2026-06-03T06:00:00Z",
    is_system: true
  },
  {
    id: "message-1",
    user_id: "user-4",
    display_name: "Hana",
    body: "The point about gratitude becoming specific really landed for me.",
    created_at: "2026-06-04T06:20:00Z",
    is_system: false
  }
];
