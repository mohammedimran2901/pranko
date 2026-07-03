/**
 * Prank templates — curated prompt library.
 * Each prank has: id, mode, emoji, title, prompt (English, used for AI generation).
 * The AI prompt is the same in all 3 languages (the visual is universal);
 * only the UI labels are translated via i18n keys.
 */

export type Mode = "ex" | "boss" | "mom" | "roommate" | "crush" | "custom";

export interface PrankTemplate {
  id: string;
  mode: Mode;
  emoji: string;
  titleKey: string; // i18n key for the title shown in UI
  descKey: string;  // i18n key for the description
  prompt: string;   // English prompt sent to AI
  trending?: boolean;
  isNew?: boolean;
}

export const MODES: { id: Mode; emoji: string; nameKey: string; taglineKey: string; descKey: string; color: string }[] = [
  { id: "ex",       emoji: "💔", nameKey: "modes.ex.name",       taglineKey: "modes.ex.tagline",       descKey: "modes.ex.desc",       color: "from-pink-500 to-red-500" },
  { id: "boss",     emoji: "💼", nameKey: "modes.boss.name",     taglineKey: "modes.boss.tagline",     descKey: "modes.boss.desc",     color: "from-blue-500 to-cyan-500" },
  { id: "mom",      emoji: "👩‍👧", nameKey: "modes.mom.name",      taglineKey: "modes.mom.tagline",      descKey: "modes.mom.desc",      color: "from-purple-500 to-pink-500" },
  { id: "roommate", emoji: "🏠", nameKey: "modes.roommate.name", taglineKey: "modes.roommate.tagline", descKey: "modes.roommate.desc", color: "from-orange-500 to-yellow-500" },
  { id: "crush",    emoji: "😍", nameKey: "modes.crush.name",    taglineKey: "modes.crush.tagline",    descKey: "modes.crush.desc",    color: "from-pranko-pink to-pranko-purple" },
  { id: "custom",   emoji: "✨", nameKey: "modes.custom.name",   taglineKey: "modes.custom.tagline",   descKey: "modes.custom.desc",   color: "from-pranko-lime to-pranko-cyan" },
];

// 30 launch templates — 5 per mode (excluded custom)
export const TEMPLATES: PrankTemplate[] = [
  // ============ EX MODE (5) ============
  {
    id: "ex-rolex",
    mode: "ex",
    emoji: "💍",
    titleKey: "templates.ex.rolex.title",
    descKey: "templates.ex.rolex.desc",
    prompt: "photo of person flexing a luxury Rolex Submariner watch on their wrist in a fancy restaurant, gold lighting, ultra realistic, sharp details",
    trending: true,
  },
  {
    id: "ex-lambo",
    mode: "ex",
    emoji: "🏎️",
    titleKey: "templates.ex.lambo.title",
    descKey: "templates.ex.lambo.desc",
    prompt: "photo of person standing next to a brand new matte orange Lamborghini Aventador in a luxury showroom, holding the keys, smiling confidently, ultra realistic",
    trending: true,
  },
  {
    id: "ex-mansion",
    mode: "ex",
    emoji: "🏡",
    titleKey: "templates.ex.mansion.title",
    descKey: "templates.ex.mansion.desc",
    prompt: "photo of person standing in front of a massive modern Beverly Hills mansion with infinity pool, holding champagne, sunset lighting, ultra realistic",
  },
  {
    id: "ex-new-partner",
    mode: "ex",
    emoji: "💑",
    titleKey: "templates.ex.partner.title",
    descKey: "templates.ex.partner.desc",
    prompt: "photo of person at a romantic candlelit dinner with a stunning model, both smiling, soft bokeh background, ultra realistic",
  },
  {
    id: "ex-yacht",
    mode: "ex",
    emoji: "🛥️",
    titleKey: "templates.ex.yacht.title",
    descKey: "templates.ex.yacht.desc",
    prompt: "photo of person relaxing on a massive luxury yacht in the Mediterranean, wearing sunglasses, holding a cocktail, blue water behind, ultra realistic",
    isNew: true,
  },

  // ============ BOSS MODE (5) ============
  {
    id: "boss-ceo",
    mode: "boss",
    emoji: "👔",
    titleKey: "templates.boss.ceo.title",
    descKey: "templates.boss.ceo.desc",
    prompt: "photo of person sitting in a CEO corner office with a glass desk and city skyline behind, hands folded confidently, ultra realistic corporate portrait",
    trending: true,
  },
  {
    id: "boss-quit",
    mode: "boss",
    emoji: "✌️",
    titleKey: "templates.boss.quit.title",
    descKey: "templates.boss.quit.desc",
    prompt: "photo of person walking out of a corporate office with a cardboard box of belongings, holding middle finger up playfully, looking back, ultra realistic",
  },
  {
    id: "boss-linkedin",
    mode: "boss",
    emoji: "💼",
    titleKey: "templates.boss.linkedin.title",
    descKey: "templates.boss.linkedin.desc",
    prompt: "professional LinkedIn headshot of person in a sleek blazer against gradient background, confident smile, corporate lighting, ultra realistic",
  },
  {
    id: "boss-fortune",
    mode: "boss",
    emoji: "💰",
    titleKey: "templates.boss.fortune.title",
    descKey: "templates.boss.fortune.desc",
    prompt: "photo of person at a fancy gala holding a giant novelty check for $10,000,000, tuxedo, sparkling background, ultra realistic",
    isNew: true,
  },
  {
    id: "boss-keynote",
    mode: "boss",
    emoji: "🎤",
    titleKey: "templates.boss.keynote.title",
    descKey: "templates.boss.keynote.desc",
    prompt: "photo of person on a massive TED Talk stage giving a keynote, huge screen behind them with their name, audience in foreground blur, dramatic lighting",
  },

  // ============ MOM MODE (5) ============
  {
    id: "mom-grammy",
    mode: "mom",
    emoji: "🏆",
    titleKey: "templates.mom.grammy.title",
    descKey: "templates.mom.grammy.desc",
    prompt: "photo of person on stage at the Grammy Awards holding a golden Grammy trophy, spotlight, audience cheering, ultra realistic",
    trending: true,
  },
  {
    id: "mom-cover",
    mode: "mom",
    emoji: "📰",
    titleKey: "templates.mom.cover.title",
    descKey: "templates.mom.cover.desc",
    prompt: "photo of a TIME magazine cover featuring the person as Person of the Year, bold red TIME logo, professional newsroom lighting, ultra realistic magazine cover",
  },
  {
    id: "mom-marathon",
    mode: "mom",
    emoji: "🏃",
    titleKey: "templates.mom.marathon.title",
    descKey: "templates.mom.marathon.desc",
    prompt: "photo of person crossing a marathon finish line breaking the tape, number 1 bib, crowd cheering, sweat and joy, ultra realistic sports photography",
  },
  {
    id: "mom-engagement",
    mode: "mom",
    emoji: "💍",
    titleKey: "templates.mom.engagement.title",
    descKey: "templates.mom.engagement.desc",
    prompt: "photo of person on one knee proposing at sunset on a clifftop overlooking the ocean, holding open ring box, romantic golden hour, ultra realistic",
  },
  {
    id: "mom-baby",
    mode: "mom",
    emoji: "👶",
    titleKey: "templates.mom.baby.title",
    descKey: "templates.mom.baby.desc",
    prompt: "photo of person holding a newborn baby wrapped in a white blanket, hospital room soft lighting, tender look, ultra realistic tender moment",
    isNew: true,
  },

  // ============ ROOMMATE MODE (5) ============
  {
    id: "roommate-mess",
    mode: "roommate",
    emoji: "🤡",
    titleKey: "templates.roommate.mess.title",
    descKey: "templates.roommate.mess.desc",
    prompt: "photo of person in a totally destroyed living room covered in glitter and confetti, holding a party horn, laughing maniacally, ultra realistic",
    trending: true,
  },
  {
    id: "roommate-eviction",
    mode: "roommate",
    emoji: "📦",
    titleKey: "templates.roommate.eviction.title",
    descKey: "templates.roommate.eviction.desc",
    prompt: "photo of person dramatically packing boxes in an empty apartment at midnight, single lamp lighting, fake sad face, ultra realistic",
  },
  {
    id: "roommate-pet",
    mode: "roommate",
    emoji: "🐍",
    titleKey: "templates.roommate.pet.title",
    descKey: "templates.roommate.pet.desc",
    prompt: "photo of person holding a giant pet python snake in their living room, looking proud, casual outfit, ultra realistic",
    isNew: true,
  },
  {
    id: "roommate-bills",
    mode: "roommate",
    emoji: "🧾",
    titleKey: "templates.roommate.bills.title",
    descKey: "templates.roommate.bills.desc",
    prompt: "photo of person holding a stack of fake utility bills up to the camera with an angry expression, kitchen background, ultra realistic documentary style",
  },
  {
    id: "roommate-glow",
    mode: "roommate",
    emoji: "✨",
    titleKey: "templates.roommate.glow.title",
    descKey: "templates.roommate.glow.desc",
    prompt: "photo of person flexing muscles in a mirror selfie after a fake workout, gym lighting, sweaty, smug smile, ultra realistic",
  },

  // ============ CRUSH MODE (5) ============
  {
    id: "crush-vacation",
    mode: "crush",
    emoji: "🏝️",
    titleKey: "templates.crush.vacation.title",
    descKey: "templates.crush.vacation.desc",
    prompt: "photo of person on a beautiful tropical beach in Bali, hammock, golden sunset, looking relaxed and dreamy, ultra realistic travel photography",
    trending: true,
  },
  {
    id: "crush-painting",
    mode: "crush",
    emoji: "🎨",
    titleKey: "templates.crush.painting.title",
    descKey: "templates.crush.painting.desc",
    prompt: "photo of person at an art gallery opening, holding a glass of wine, sophisticated outfit, surrounded by beautiful art, ultra realistic",
  },
  {
    id: "crush-book",
    mode: "crush",
    emoji: "📚",
    titleKey: "templates.crush.book.title",
    descKey: "templates.crush.book.desc",
    prompt: "photo of person at a cute independent bookstore holding a stack of literary novels, soft warm lighting, intellectual and cozy, ultra realistic",
  },
  {
    id: "crush-coffee",
    mode: "crush",
    emoji: "☕",
    titleKey: "templates.crush.coffee.title",
    descKey: "templates.crush.coffee.desc",
    prompt: "photo of person sitting at a Parisian cafe with espresso and croissant, reading a book, morning light, effortlessly cool, ultra realistic lifestyle photography",
    isNew: true,
  },
  {
    id: "crush-puppy",
    mode: "crush",
    emoji: "🐕",
    titleKey: "templates.crush.puppy.title",
    descKey: "templates.crush.puppy.desc",
    prompt: "photo of person at an animal shelter holding an adorable golden retriever puppy, soft lighting, warm smile, ultra realistic heartwarming moment",
  },
];

export function getTemplatesByMode(mode: Mode): PrankTemplate[] {
  return TEMPLATES.filter((t) => t.mode === mode);
}

export function getTemplateById(id: string): PrankTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTrendingTemplates(): PrankTemplate[] {
  return TEMPLATES.filter((t) => t.trending);
}
