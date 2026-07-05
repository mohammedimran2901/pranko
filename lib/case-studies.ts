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
  sourceLabel: string;
  sfxPrompt?: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    // cs1 — BOSS: "Beat-up Rolex"
    id: "cs1",
    emoji: "�",
    categoryLabel: "Boss",
    beforeImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop",
    beforeAlt: "A close-up of an expensive watch on someone's wrist",
    beforeGradient: "from-amber-400 via-yellow-500 to-orange-500",
    beforeInitials: "⌚",
    afterVideo: "/showcase/cs1.mp4",
    afterFallbackGradient: "from-red-500 via-rose-600 to-amber-700",
    falPrompt:
      "Show this on my hand but damaged quite badly with a cracked glass, deep scratches all over the bezel, and scuffed metal — looking beat up and neglected, like it just survived a car crash.",
    sfxPrompt: "glass cracking, metal scraping, dramatic orchestral sting",
    sourceLabel: "Unsplash · close-up watch",
  },
  {
    // cs2 — EX: "CEO to homeless" (iconic)
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
    sfxPrompt: "wind blowing, distant traffic, bottle clinking, muffled mumbling",
    sourceLabel: "Unsplash · business portrait",
  },
  {
    // cs3 — MOM: "Grandma breakdancing" (crowd favorite)
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
      "Her dancing to an upbeat funky track — breakdancing, doing the moonwalk, spinning on her back, full energy, sweaty but unstoppable, her grandma clothes flying with the moves, crowd cheering.",
    sfxPrompt: "upbeat funky breakdance music, crowd cheering and clapping, energetic 80s beat",
    sourceLabel: "Unsplash · grandma portrait",
  },
  {
    // cs4 — ROOMMATE: "Speedometer to 180"
    id: "cs4",
    emoji: "🏠",
    categoryLabel: "Roommate",
    beforeImage: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop",
    beforeAlt: "A car speedometer dashboard",
    beforeGradient: "from-cyan-500 via-blue-500 to-indigo-600",
    beforeInitials: "🏎️",
    afterVideo: "/showcase/cs4.mp4",
    afterFallbackGradient: "from-red-600 via-orange-600 to-yellow-500",
    falPrompt:
      "First-person view of driving like a maniac — well over the speed limit, the speedometer pinned, weaving between cars, hands gripping the wheel, blurry roadside, completely unhinged.",
    sfxPrompt: "engine roaring, tires screeching, horn honking, adrenaline rush",
    sourceLabel: "Unsplash · car dashboard",
  },
  {
    // cs5 — CRUSH: "Tidy living room → wild house party"
    id: "cs5",
    emoji: "😍",
    categoryLabel: "Crush",
    beforeImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80&auto=format&fit=crop",
    beforeAlt: "A clean, neatly arranged living room",
    beforeGradient: "from-teal-300 via-emerald-400 to-green-500",
    beforeInitials: "�️",
    afterVideo: "/showcase/cs5.mp4",
    afterFallbackGradient: "from-pink-500 via-rose-500 to-red-500",
    falPrompt:
      "The same living room, but after a wild house party — bottles and red cups everywhere, confetti and balloons, tipped furniture, someone passed out on the couch, total chaos, TV cracked.",
    sfxPrompt: "thumping party music, bottles clinking, people laughing and shouting, distant siren",
    sourceLabel: "Unsplash · tidy living room",
  },
];