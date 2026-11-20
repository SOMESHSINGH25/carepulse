const abusiveTerms = [
  /\basshole\b/i,
  /\bass\b/i,
  /\bbastard\b/i,
  /\bbitch(?:es)?\b/i,
  /\bcrap\b/i,
  /\bdamn\b/i,
  /\bdick(?:head)?\b/i,
  /\bfuck\w*\b/i,
  /\bidiot(?:s)?\b/i,
  /\bmoron(?:s)?\b/i,
  /\bshit\w*\b/i,
  /\bstupid\b/i,
  /\bwhore\b/i,
]

export function containsAbusiveLanguage(comment) {
  return abusiveTerms.some((term) => term.test(comment))
}
