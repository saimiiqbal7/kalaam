/**
 * Word Library — localStorage key and helpers.
 * Words are stored as array of { word, en_definition, ur_meaning, example_sentences, addedAt, source }.
 * For API-backed words, set VITE_ANTHROPIC_API_KEY in .env.
 */

const STORAGE_KEY = 'kalaam_word_library'

export function getLibrary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLibrary(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function addWord(entry) {
  const list = getLibrary()
  const normalized = normalizeWord(entry.word)
  if (list.some((e) => normalizeWord(e.word) === normalized)) return false
  const withMeta = {
    ...entry,
    word: entry.word,
    addedAt: new Date().toISOString(),
  }
  list.push(withMeta)
  saveLibrary(list)
  return true
}

export function removeWord(word) {
  const normalized = normalizeWord(word)
  const list = getLibrary().filter((e) => normalizeWord(e.word) !== normalized)
  saveLibrary(list)
}

export function hasWord(word) {
  const normalized = normalizeWord(word)
  return getLibrary().some((e) => normalizeWord(e.word) === normalized)
}

export function getWordFromLibrary(word) {
  const normalized = normalizeWord(word)
  return getLibrary().find((e) => normalizeWord(e.word) === normalized) ?? null
}

export function normalizeWord(w) {
  if (!w || typeof w !== 'string') return ''
  return w.toLowerCase().replace(/[^a-z']/g, '')
}

/**
 * Build word data for library: from vocabulary.js or from API.
 * @param {string} word - raw word (e.g. "lurched")
 * @param {string} source - e.g. "Animal Farm, Chapter 1"
 * @param {Object} vocabulary - vocab lookup { def, ur } for known words
 * @returns {Promise<{ word, en_definition, ur_meaning, example_sentences, source } | null>}
 */
export async function getWordData(word, source, vocabulary = {}) {
  const clean = normalizeWord(word)
  const displayWord = word.trim()
  if (!clean) return null

  // 1. Check vocabulary (existing tap-to-translate data)
  const lower = word.toLowerCase()
  const fromVocab = vocabulary[clean] || vocabulary[lower]
  if (fromVocab) {
    return {
      word: displayWord,
      en_definition: fromVocab.def || fromVocab.en_definition || '',
      ur_meaning: fromVocab.ur || fromVocab.ur_meaning || '',
      example_sentences: fromVocab.example_sentences || [],
      source,
    }
  }

  // 2. Already in library (cached from previous API call)
  const fromLib = getWordFromLibrary(displayWord)
  if (fromLib) {
    return {
      word: fromLib.word,
      en_definition: fromLib.en_definition,
      ur_meaning: fromLib.ur_meaning,
      example_sentences: fromLib.example_sentences || [],
      source: fromLib.source,
    }
  }

  // 3. Fetch from Anthropic API (requires VITE_ANTHROPIC_API_KEY)
  const apiKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are a vocabulary assistant for Pakistani teenagers learning English.

For the word "${displayWord}", return ONLY a JSON object with this exact structure, no explanation, no markdown, no backticks:
{
  "en_definition": "simple one-line English definition",
  "ur_meaning": "Roman Urdu meaning — how a Pakistani teenager would say it",
  "example_sentences": [
    { "en": "example sentence in English", "ur": "Roman Urdu translation" },
    { "en": "second example sentence", "ur": "Roman Urdu translation" }
  ]
}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.warn('Anthropic word lookup failed', response.status, err)
      return null
    }

    const data = await response.json()
    const text = data.content?.[0]?.text
    if (!text) return null

    const parsed = JSON.parse(text.trim())
    return {
      word: displayWord,
      en_definition: parsed.en_definition || '',
      ur_meaning: parsed.ur_meaning || '',
      example_sentences: Array.isArray(parsed.example_sentences) ? parsed.example_sentences : [],
      source,
    }
  } catch (e) {
    console.warn('Word API error', e)
    return null
  }
}
