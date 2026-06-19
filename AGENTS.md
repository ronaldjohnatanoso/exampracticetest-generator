# Exam Practice Test — Examify

A reusable, JSON-driven HTML quiz engine. Drop new question banks as JSON files and the app supports them automatically.

## Project Structure

```
exam-practice-test/
├── index.html          # Main app entry point
├── js/
│   └── app.js          # Quiz engine (state, rendering, grading, timer)
├── css/
│   └── style.css       # All styling
├── data/
│   ├── questions-ai103.json   # AI-103 bank (50 hard questions)
│   ├── questions-az104.json   # AZ-104 bank (50 hard questions)
│   └── questions-schema.json  # JSON schema for new banks
└── .gitignore
```

## Adding a New Question Bank

1. Create `data/questions-{yourslug}.json` following the schema below
2. Add an entry to `data/manifest.json` following the same pattern as existing banks
3. That's it — the app reads `data/manifest.json` to populate the dropdown

### Minimal JSON Schema

```json
{
  "title": "AZ-900 — Azure Fundamentals",
  "description": "Core Azure cloud concepts",
  "timeLimit": 60,
  "count": 40,
  "passingScore": 70,
  "shuffle": true,
  "domains": [
    { "name": "Cloud Concepts", "weight": 25 },
    { "name": "Azure Services", "weight": 30 }
  ],
  "questions": [
    {
      "domain": "Cloud Concepts",
      "question": "What is the difference between...",
      "shuffleChoices": true,
      "choices": [
        { "text": "Option A", "correct": true },
        { "text": "Option B", "correct": false }
      ],
      "explanation": "Correct answer is A because..."
    }
  ]
}
```

### Field Reference

| Field | Type | Description |
|---|---|---|
| `title` | string | Exam name shown in UI |
| `description` | string | Short description |
| `timeLimit` | int | Minutes. `0` = no limit |
| `count` | int | Max questions. Less than total = random sample |
| `shuffle` | bool | Randomize question order |
| `passingScore` | int | Pass threshold % (default 70) |
| `domains` | array | Named categories for coverage display |
| `questions[].domain` | string | Category pill shown on the question |
| `questions[].shuffleChoices` | bool | Shuffle answer options per question |
| `questions[].choices` | array | Answer options. One must have `"correct": true` |
| `questions[].explanation` | string | Shown during answer review |

## How to Deploy

1. Push to GitHub
2. Enable **GitHub Pages** → Settings → Pages → Source: `main` branch, `/ (root)`
3. App is live at `https://ronaldjohnatanoso.github.io/exampracticetest-generator/`

## GitHub Auth (for CI/push)

- Protocol: **SSH** (not HTTPS)
- Remote: `git@github.com:ronaldjohnatanoso/exampracticetest-generator.git`
- OAuth token stored at `~/.config/gh/hosts.yml` (type `gho_...`, scopes: `admin:public_key, gist, read:org, repo`)
- PAT is **not** used — gh CLI handles auth automatically

## Examify App Features

- **Exam Mode** — all questions → submit → score + domain breakdown
- **Study Mode** — check answers on-the-fly with explanations
- **Timer** — auto-submits when time runs out
- **Flag for review** — tag questions and jump back
- **Multi-select questions** — some questions have multiple correct answers (checkbox UI)
- **Generate your own bank** — paste custom JSON or use the built-in prompt template

## Question Banks Available

| Bank | Questions | Deploy |
|---|---|---|
| AI-103 — Azure AI Engineer | 50 hard | ✅ Live |
| AZ-104 — Azure Administrator | 50 hard | ✅ Live |
| AZ-305 — Design Azure Infra | 40 sample | ✅ Live |
| AZ-305 v2 — Azure Migration Master | 50 hard | ✅ Live |
