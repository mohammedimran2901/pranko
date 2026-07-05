/**
 * 5 real case studies for the homepage showcase.
 * For each one, a "before" Unsplash photo is passed through fal.ai
 * (seedance-2/mini/reference-to-video) with the specified prompt, and
 * the resulting MP4 is saved to /public/showcase/csN.mp4.
 *
 * To regenerate: `node scripts/generate-case-studies.mjs`
 *   (needs FAL_KEY in .env.local; takes ~2.5 min for all 5)
 *
 * Until the script runs, the homepage uses the `beforeGradient` + `beforeInitials`
 * placeholders so the page never shows a broken video element.
 */
export type CaseStudyId = "cs1" | "cs2" | "cs3" | "cs4" | "cs5";

export interface CaseStudy {
  id: CaseStudyId;
  emoji: string;
  categoryLabel: string; // "Boss" / "Ex" / "Mom" / "Roommate" / "Crush"
  /** i18n key suffix under `caseStudies.csN` (e.g. "cs1"). */
  beforeImage: string; // Unsplash photo URL (always present, real)
  beforeAlt: string; // short alt text for the photo
  beforeGradient: string; // Tailwind classes for the placeholder avatar
  beforeInitials: string; // initials shown in the placeholder circle
  afterVideo: string; // /showcase/cs1.mp4 (local public asset)
  afterFallbackGradient: string; // Tailwind classes for the after video's poster gradient
  falPrompt: string; // the prompt sent to fal.ai (displayed in the source / docs)
  sourceLabel: string; // human-readable attribution of the before image
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "cs1",
    emoji: "💼",
    categoryLabel: "Boss",
    beforeImage: "/showcase/cs1-before.jpg",
    beforeAlt: "A close-up of an expensive watch on someone's wrist",
    beforeGradient: "from-amber-400 via-yellow-500 to-orange-500",
    beforeInitials: "⌚",
    afterVideo: "/showcase/cs1.mp4",
    afterFallbackGradient: "from-red-500 via-rose-600 to-amber-700",
    falPrompt:
      "Show this on my hand but damaged quite badly with a cracked glass, deep scratches all over the bezel, and scuffed metal — looking beat up and neglected, like it just survived a car crash.",
    sourceLabel: "Unsplash · close-up watch",
  },
  {
    id: "cs2",
    emoji: "💔",
    categoryLabel: "Ex",
    beforeImage: "/showcase/cs2-before.jpg",
    beforeAlt: "A well-dressed man in a suit, confident portrait",
    beforeGradient: "from-slate-500 via-zinc-600 to-stone-700",
    beforeInitials: "🕴️",
    afterVideo: "/showcase/cs2.mp4",
    afterFallbackGradient: "from-amber-700 via-yellow-900 to-stone-800",
    falPrompt:
      "Same person in the same setting, but now as a drunken homeless man — disheveled hair, torn stained clothes, holding a bottle in a paper bag, swaying, mumbling, looking exhausted and broke.",
    sourceLabel: "Unsplash · business portrait",
  },
  {
    id: "cs3",
    emoji: "👩‍👧",
    categoryLabel: "Mom",
    beforeImage: "/showcase/cs3-before.jpg",
    beforeAlt: "A fragile elderly grandmother looking at the camera",
    beforeGradient: "from-rose-300 via-pink-400 to-fuchsia-500",
    beforeInitials: "👵",
    afterVideo: "/showcase/cs3.mp4",
    afterFallbackGradient: "from-purple-600 via-fuchsia-500 to-pink-500",
    falPrompt:
      "Her dancing to Michael Jackson — breakdancing, doing the moonwalk, spins, full energy, sweaty but unstoppable, her grandma clothes flying with the moves.",
    sourceLabel: "Unsplash · grandma portrait",
  },
  {
    id: "cs4",
    emoji: "🏠",
    categoryLabel: "Roommate",
    beforeImage: "/showcase/cs4-before.jpg",
    beforeAlt: "A car speedometer dashboard",
    beforeGradient: "from-cyan-500 via-blue-500 to-indigo-600",
    beforeInitials: "🏎️",
    afterVideo: "/showcase/cs4.mp4",
    afterFallbackGradient: "from-red-600 via-orange-600 to-yellow-500",
    falPrompt:
      "First-person view of driving like a maniac — well over the speed limit, the speedometer pinned, weaving between cars, hands gripping the wheel, blurry roadside, completely unhinged.",
    sourceLabel: "Unsplash · car dashboard",
  },
  {
    id: "cs5",
    emoji: "😍",
    categoryLabel: "Crush",
    beforeImage: "/showcase/cs5-before.jpg",
    beforeAlt: "A clean, neatly arranged living room",
    beforeGradient: "from-teal-300 via-emerald-400 to-green-500",
    beforeInitials: "🛋️",
    afterVideo: "/showcase/cs5.mp4",
    afterFallbackGradient: "from-pink-500 via-rose-500 to-red-500",
    falPrompt:
      "The same living room, but after a wild house party — bottles and red cups everywhere, confetti and balloons, tipped furniture, someone passed out on the couch, total chaos.",
    sourceLabel: "Unsplash · tidy living room",
  },
];
