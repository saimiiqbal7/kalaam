# Kalaam

A web app that helps Pakistani teenagers (14–18) improve English comprehension by reading novels in a **dual-page format**: English on the left, Roman Urdu transliteration on the right. As quiz scores improve, Urdu support gradually fades, training the reader toward full English fluency.

---

## Features

- **Library** — Grid of book cards (title, author, difficulty). Seed books: *Animal Farm*, *The Old Man and the Sea*, *The Alchemist*.
- **Reader** — Full-screen dual-page view with:
  - Left page: English text (Lora); right page: Roman Urdu (DM Sans). **Full chapter text is visible** on both pages from the start (like opening a real book).
  - **One line highlighted** at a time: current line uses background `#fff0e6`, text `#2e1a10`. Past lines in muted warm (`#7d4f3a` / `#b07060`), future lines in light muted (`#c4a898`). Tap anywhere to advance the highlight; the view **auto-scrolls** to keep the active line centred.
  - Centre spine shadow and warm off-white page background (`#fffaf6`) with subtle paper texture.

- **Support levels** (stored in `localStorage` per book):
  - **Level 1** — Full Roman Urdu, same opacity as English.
  - **Level 2** — Roman Urdu at 50% opacity.
  - **Level 3** — Roman Urdu hidden; tap a line to reveal temporarily.
  - **Level 4** — Right page blank (English only).

  Level increases automatically after completing a chapter quiz with **80%+** score.

- **Tap-to-translate** — Tap any English word to see a tooltip: Roman Urdu equivalent + one-line English definition. Styled with mahogany background and cream text.

- **Word Library** — Double-tap/double-click any English word in the reader to save it to a personal Word Library (`/words`). Each entry stores definition, Roman Urdu meaning, and example sentences. Words in `src/data/vocabulary.js` are used as-is; for other words, set `VITE_ANTHROPIC_API_KEY` in `.env` to generate definitions via Claude (see `.env.example`). Data is stored in `localStorage` under `kalaam_word_library`.

- **Chapter quiz** — Triggered only **after** the user advances **past** the last line of a chapter. A **"Chapter Complete"** transition screen appears first (book title, chapter name, simple ornament); the user taps "Continue to quiz" (or "Continue reading" if no quiz). Then:
  - 5 questions: 3 comprehension, 2 vocabulary; multiple choice, one at a time.
  - **Bilingual**: each question shows English and, below it, Roman Urdu (smaller, muted, italic). Each option shows English with Roman Urdu underneath (smaller, muted).
  - Score at end; 80%+ triggers level-up and a short celebration. Results stored in `localStorage`.

---

## Colour palette

| Variable       | Hex       |
|----------------|-----------|
| `--tomato`     | `#ff7f50` |
| `--salmon`     | `#ff9a6a` |
| `--peach`      | `#ffb08f` |
| `--cream`      | `#ffccaa` |
| `--tan`        | `#d68a4a` |
| `--rust`       | `#b24e3e` |
| `--mahogany`   | `#7d2f2a` |
| `--page-bg`    | `#fffaf6` |
| `--text-primary` | `#2e1a10` |
| `--text-muted` | `#9e7060` |

---

## Typography

- **English body** — Lora (Google Fonts), 18px, line-height 1.9.
- **Roman Urdu** — DM Sans, same size and line-height.
- **UI** — DM Sans.

---

## Tech stack

- **Vite** + **React** + **React Router**.
- No backend, no auth; data from local JSON and `localStorage`.

---

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`). From the library, open *Animal Farm* to use the reader with 2–3 chapters of dummy content and quizzes.

---

## Data format

Books and chapters live in `src/data/books.json`. Structure:

```json
{
  "books": [{
    "id": "animal-farm",
    "title": "Animal Farm",
    "author": "George Orwell",
    "difficulty": "Beginner",
    "chapters": [{
      "title": "Chapter 1",
      "lines": [
        { "en": "English sentence.", "ur": "Roman Urdu transliteration." }
      ],
      "quiz": [
        {
          "type": "comprehension",
          "question": "English question?",
          "questionUr": "Roman Urdu sawal?",
          "options": [
            { "en": "English option", "ur": "Roman Urdu option" }
          ],
          "correct": 0
        }
      ]
    }]
  }]
}
```

Vocabulary for tap-to-translate is in `src/data/vocabulary.js`: `word → { ur, def }`.

---

## Out of scope (v1)

- User accounts / auth  
- Backend / database  
- Audio / pronunciation  
- Streaks or gamification  
- Mobile app  

---

## Routes

- `/` — Homepage.
- `/library` — Book library.
- `/words` — Word Library (saved vocabulary).
- `/read/:bookId` — Reader for the given book.
