# Exam Practice Test Generator

> A reusable, browser-based exam quiz engine. Feed it a JSON question bank, get a full Pearson VUE-style test UI — no server required.

![Screenshot](screenshot.png)

## Features

- 📝 **Scenario-based questions** — multiple choice, flag for review, navigation grid
- ⏱️ **Timer support** — optional countdown timer per exam
- 🚩 **Flag for review** — jump back to tricky questions before submitting
- ✅ **Auto-grading** — score, pass/fail, per-question breakdown with explanations
- 🔁 **Retake mode** — reset and run again with shuffled questions
- 📊 **Domain coverage** — balanced sampling across exam domains
- 🌐 **Single HTML file** — open `index.html` directly in any browser, or serve statically

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/ronaldjohnatanoso/exampracticetest-generator.git
cd exampracticetest-generator

# 2. Open in browser (or serve statically)
open index.html

# 3. Point to a question bank JSON
# Edit the JSON URL field to: data/questions-az305.json
```

## Adding a New Exam

Create a new JSON file in `data/` following the schema below. Then either:
- Update the default URL in `index.html`
- Or load it via the file upload on the start screen

## JSON Question Bank Schema

```json
{
  "title": "Exam Name",
  "description": "Optional description",
  "timeLimit": 120,        // minutes; 0 = no limit
  "count": 50,             // max questions (optional; all used if omitted)
  "shuffle": true,          // randomize question order
  "passingScore": 70,       // passing percentage
  "domains": [             // optional; used for balanced sampling
    { "name": "Identity", "weight": 30 },
    { "name": "Storage",   "weight": 25 }
  ],
  "questions": [
    {
      "id": "Q-001",                         // optional unique ID
      "domain": "Identity & Governance",     // shown as badge
      "question": "What is the best approach when...",  // question text
      "shuffleChoices": true,               // randomize answer order
      "choices": [
        { "text": "Option A — this",   "correct": false },
        { "text": "Option B — that",   "correct": true  },  // only one correct
        { "text": "Option C",          "correct": false },
        { "text": "Option D",          "correct": false }
      ],
      "explanation": "Option B is correct because...",   // shown in review
      "tags": ["managed-identity", "iam"]               // optional
    }
  ]
}
```

### Schema notes

| Field | Required | Notes |
|---|---|---|
| `title` | ✅ | Shown in the exam header |
| `questions` | ✅ | Must be a non-empty array |
| `question` | ✅ | Supports `\n` for line breaks |
| `choices[].correct` | ✅ | Exactly one must be `true` |
| `choices[].text` | ✅ | The answer text |
| `domain` | Optional | Shown as a colored badge |
| `shuffleChoices` | Optional | Randomize this question's options |
| `explanation` | Optional | Shown during answer review |
| `timeLimit` | Optional | 0 = untimed |
| `count` | Optional | Sample N questions; uses domain balancing if `domains` defined |
| `shuffle` | Optional | Shuffle entire question order |
| `passingScore` | Optional | Override the UI default |

## Project Structure

```
exampracticetest-generator/
├── index.html              # Main quiz UI
├── css/
│   └── style.css            # All styles
├── js/
│   └── app.js               # Quiz engine logic
├── data/
│   ├── questions-az305.json  # AZ-305 question bank (sample)
│   └── questions-schema.json  # JSON schema for new banks
├── SPEC.md                   # Feature spec
└── README.md
```

## Deploy

Everything is static — deploy to GitHub Pages, Netlify, Vercel, or any CDN:

```bash
# GitHub Pages: enable it under repo Settings > Pages > Source: main branch
# Netlify: drag & drop this folder
# Or: any web server (nginx, Apache, etc.)
```

## Extending

Want to add features? Key extension points in `js/app.js`:

| Feature | Location |
|---|---|
| Timer logic | `startTimer()` |
| Question picker | `pickBalanced()` |
| Score calculation | `submitExam()` |
| Review rendering | `reviewAnswers()` |
| JSON loading | `onStart()` |

## License

MIT — use freely, contribute improvements.
