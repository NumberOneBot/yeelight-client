/**
 * Characters produced by the physical `Q` key across keyboard layouts, so quit
 * works without switching back to Latin.
 *
 * Included: Latin (QWERTY/QWERTZ), ЙЦУКЕН (ru/uk/be/kk), Serbian & Macedonian
 * Cyrillic (QWERTZ-based), Arabic/Persian.
 *
 * Deliberately left out: AZERTY (fr/be) puts `a` there — too easy to hit by
 * accident on other layouts; Dvorak `'`, Greek `;`, Hebrew `/` and Bulgarian
 * BDS `,` are punctuation and would swallow future keybindings.
 */
const QUIT_KEYS = new Set(['q', 'Q', 'й', 'Й', 'љ', 'Љ', 'ض'])

export function isQuitKey(input: string): boolean {
  return QUIT_KEYS.has(input)
}
