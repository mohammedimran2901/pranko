/**
 * 5 real case studies for the homepage showcase.
 * Each one: real Unsplash photo → fal.ai video. Before image + after video.
 *
 * To regenerate videos: `node scripts/generate-case-studies.mjs`
 *   (needs FAL_KEY with available balance in .env.local)
 */
export type CaseStudyId = "cs1" | "cs2" | "cs3" | "cs4" | "cs5";

export interface CaseStudy {
  id: CaseStudyId;
  emoji: string;
  categoryLabel: string;
  beforeImage: string;
  beforeAlt: string;
  beforeGradient: string;
  beforeInitials: string;
  afterVideo: string;
  afterFallbackGradient: string;
  falPrompt: string;
  sfxPrompt?: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    // cs1 — BOSS: "Got arrested" prank
    id: "cs1",
    emoji: "👔",
    categoryLabel: "Boss",
    beforeImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1200&q=80&auto=format&fit=crop",
    beforeAlt: "A confident business person in a hallway",
    beforeGradient: "from-slate-400 via-zinc-500 to-stone-600",
    beforeInitials: "👔",
    afterVideo: "/showcase/cs1.mp4",
    afterFallbackGradient: "from-blue-600 via-red-500 to-amber-600",
    falPrompt:
      "This person being arrested by two police officers, hands cuffed behind their back, being led away toward a patrol car with flashing blue and red lights, looking down in shame, chaotic street scene.",
    sfxPrompt: "police siren wailing, urgent radio chatter, handcuffs clicking, crowd murmuring",
  },
  {
    // cs2 — EX: "CEO to homeless" (classic)
    id: "cs2",
    emoji: "💔",
    categoryLabel: "Ex",
    beforeImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80&auto=format&fit=crop",
    beforeAlt: "A well-dressed man in a suit, confident portrait",
    beforeGradient: "from-slate-500 via-zinc-600 to-stone-700",
    beforeInitials: "🕴️",
    afterVideo: "/showcase/cs2.mp4",
    afterFallbackGradient: "from-amber-700 via-yellow-900 to-stone-800",
    falPrompt:
      "Same person in the same setting, but now as a drunken homeless man — disheveled hair, torn stained clothes, holding a bottle in a paper bag, swaying, mumbling, looking exhausted and broke.",
    sfxPrompt: "wind blowing, distant traffic, bottle clinking, muffled mumbling, street atmosphere",
  },
  {
    // cs3 — MOM: "Grandma breakdancing" (iconic crowd-pleaser)
    id: "cs3",
    emoji: "👩‍👧",
    categoryLabel: "Mom",
    beforeImage: "https://images.unsplash.com/photo-1559963110-71b394e7494d?w=1200&q=80&auto=format&fit=crop",
    beforeAlt: "A fragile elderly grandmother looking at the camera",
    beforeGradient: "from-rose-300 via-pink-400 to-fuchsia-500",
    beforeInitials: "👵",
    afterVideo: "/showcase/cs3.mp4",
    afterFallbackGradient: "from-purple-600 via-fuchsia-500 to-pink-500",
    falPrompt:
      "Her dancing to an upbeat funky track — breakdancing, doing the moonwalk, spinning on her back, full energy, sweaty but unstoppable, her grandma clothes flying with the moves, crowd cheering in the background.",
    sfxPrompt: "upbeat funky breakdance music, crowd cheering and clapping, energetic 80s beat",
  },
  {
    // cs4 — ROOMMATE: "Living room destroyed" (classic)
    id: "cs4",
    emoji: "🏠",
    categoryLabel: "Roommate",
    beforeImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80&auto=format&fit=crop",
    beforeAlt: "A clean, neatly arranged living room",
    beforeGradient: "from-teal-300 via-emerald-400 to-green-500",
    beforeInitials: "🛋️",
    afterVideo: "/showcase/cs4.mp4",
    afterFallbackGradient: "from-pink-500 via-rose-500 to-red-500",
    falPrompt:
      "The same living room, but after a wild house party — bottles and red cups everywhere, confetti and balloons, tipped furniture, someone passed out on the couch, total chaos, TV screen cracked.",
    sfxPrompt: "thumping party music, bottles clinking, people laughing and shouting, distant police siren",
  },
  {
    // cs5 — CRUSH: "Singing in the rain" (happy/funny)
    id: "cs5",
    emoji: "😍",
    categoryLabel: "Crush",
    beforeImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80&auto=format&fit=crop",
    beforeAlt: "A smiling woman outdoors",
    beforeGradient: "from-amber-300 via-orange-400 to-rose-400",
    beforeInitials: "💃",
    afterVideo: "/showcase/cs5.mp4",
    afterFallbackGradient: "from-blue-500 via-cyan-400 to-teal-400",
    falPrompt:
      "This person dancing and singing ecstatically in heavy pouring rain on a city street, spinning around a lamppost with one arm outstretched, classic musical-film style, huge joyful smile, water splashing everywhere, dramatic lighting.",
    sfxPrompt: "romantic orchestral music swelling, heavy rain pouring, splashing in puddles, joyful humming",
  },
];