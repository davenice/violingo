/** Shown after a successful practice, in place of the old reward reveal. */
export const PRACTICE_ENCOURAGEMENTS: string[] = [
  "Fiddle-tastic practice! 🎻",
  "You're simply ex-cello-lent! 🌟",
  "Bow-diggity, well done! 🎻",
  "That was un-Bach-lievable! 🤯",
  "You really Handel'd that one! 💪",
  "Sound the fanfare — great job! 📯",
  "Pizzicato-perfect practice! 👌",
  "You struck a chord with us today! 🎶",
  "Rosin to the occasion — nice work! ✨",
  "That practice was in perfect harmony! 🎵",
  "Great scale-ing today! 🐉",
  "Vivaldi would be proud — that was a Four Seasons of awesome! 🎼",
  "You're on a roll — a violin roll! 🥐",
  "Sharp work — no flats about it! ♯",
  "Treble-y impressive practice! 🌊",
  "You've got major-key energy today! 🔑",
  "Chin up, bow ready — you nailed it! 🎻",
  "That was music to our ears! 👂",
  "String theory confirmed: you're a star! 🔭",
  "Encore-worthy practice today! 👏",
  "You're stringing together some serious skill! 🧵",
  "That practice was note-worthy! 📝",
  "Fantastico, maestro! 🎩",
  "Bowled over by that performance! 🎳",
  "That hit all the right notes! 🎯",
  "Chord-ially, well played! 🤝",
  "You're really tuning into greatness! 🎚️",
  "Mozart-level brilliance today! 👑",
  "That was Chopin good! 🪓",
  "You've got mad viola-ent skills! 💥",
  "Well strung together, that practice! 🧶",
  "Sound-sational practice! 🔊",
  "You've got perfect pitch for effort! 🏹",
  "That was in-tune-ition — great instincts! 🧠",
  "Aren't you just the concertmaster of consistency! 🏅",
  "You're on fire, Paganini-style! 🔥",
  "Shiver me timbres, great job! 🏴‍☠️",
  "Stradivarius-approved sound today! 🏆",
  "You really know how to carry a tune! 🎻",
  "Bravissimo — take a bow! 🙇",
];

/** Picks a random encouragement; `random` is injectable for deterministic tests. */
export function pickEncouragement(random: () => number = Math.random): string {
  const index = Math.floor(random() * PRACTICE_ENCOURAGEMENTS.length);
  return PRACTICE_ENCOURAGEMENTS[index];
}
