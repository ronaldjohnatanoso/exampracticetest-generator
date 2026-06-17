/* =============================================
   EXAM PRACTICE TEST — JS ENGINE
   Exam Mode  : answer all → submit → review
   Study Mode  : check each answer instantly
   ============================================= */

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ── State ──────────────────────────────────────
let questionBank  = null;
let examConfig    = {};
let questions     = [];
let answers       = {};       // qIndex → { choiceIdx, correct }
let studyChecked  = {};       // qIndex → true  (study mode only)
let flagged       = new Set();
let currentIndex  = 0;
let timerHandle   = null;
let secondsLeft   = 0;
let passingScore  = 70;
let submitted     = false;
let mode          = 'exam';   // 'exam' | 'study'

// ── DOM helpers ────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Populate question bank dropdown from manifest
  await loadManifest();

  // Event listeners
  $('start-btn').addEventListener('click', onStart);
  $('json-file').addEventListener('change', onFileUpload);
  $('qb-select').addEventListener('change', onBankSelect);

  // Study mode toggle — show/hide time limit
  document.querySelectorAll('input[name="mode"]').forEach(r => {
    r.addEventListener('change', () => {
      mode = document.querySelector('input[name="mode"]:checked').value;
    });
  });
});

// ── Manifest / Dropdown ─────────────────────────
// Known question bank files — add new banks here
const KNOWN_BANKS = [
  { id: 'az305', file: 'data/questions-az305.json' },
  // Add more banks here, e.g.:
  // { id: 'az104', file: 'data/questions-az104.json' },
  // { id: 'az700', file: 'data/questions-az700.json' },
];

async function loadManifest() {
  const select = $('qb-select');
  select.innerHTML = '';

  const results = [];
  // Fetch all known banks in parallel, keep only those that load successfully
  await Promise.allSettled(
    KNOWN_BANKS.map(async (bank) => {
      try {
        const resp = await fetch(bank.file);
        if (!resp.ok) return;
        const data = await resp.json();
        results.push({
          id:          bank.id,
          file:        bank.file,
          name:        data.title      || bank.id,
          version:     data.version    || '',
          description: data.description || `${data.questions?.length || 0} questions`,
        });
      } catch { /* skip unavailable banks */ }
    })
  );

  // Sort: known banks first, then custom uploads
  results.sort((a, b) => a.id.localeCompare(b.id));

  results.forEach(bank => {
    const opt = document.createElement('option');
    opt.value = bank.file;
    const versionTag = bank.version ? ` — v${bank.version}` : '';
    opt.textContent = `${bank.name}${versionTag}`;
    opt.dataset.desc = bank.description || '';
    select.appendChild(opt);
  });

  // Separator + custom options
  const sep = document.createElement('option');
  sep.disabled = true;
  sep.textContent = '──────────';
  select.appendChild(sep);

  const genOpt = document.createElement('option');
  genOpt.value = '__generate__';
  genOpt.textContent = '💡 Generate Your Own Bank →';
  genOpt.dataset.desc = 'Open the template generator to create a custom question bank using AI.';
  select.appendChild(genOpt);

  // Auto-select first available bank
  if (results.length > 0) {
    select.selectedIndex = 0;
    $('qb-desc').textContent = results[0].description || '';
  }
}

function onBankSelect() {
  const opt = $('qb-select').selectedOptions[0];
  $('qb-desc').textContent = opt.dataset.desc || '';
}

// ── JSON Validator ───────────────────────────────
const LETTERS_GLOBAL = ['A', 'B', 'C', 'D', 'E', 'F'];

function validateQuestionBank(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return ['Root must be a JSON object.'];
  }

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Missing or invalid "title" (must be a non-empty string).');
  }

  if (!Array.isArray(data.questions)) {
    errors.push('Missing "questions" array.');
    return errors; // can't continue without it
  }

  if (data.questions.length === 0) {
    errors.push('"questions" array is empty — at least one question is required.');
  }

  data.questions.forEach((q, i) => {
    const prefix = `Question ${i + 1}`;

    if (!q.question || typeof q.question !== 'string') {
      errors.push(`${prefix}: missing or invalid "question" text.`);
    }

    if (!Array.isArray(q.choices)) {
      errors.push(`${prefix}: missing "choices" array.`);
      return;
    }

    if (q.choices.length < 2) {
      errors.push(`${prefix}: must have at least 2 choices.`);
    }

    const correctCount = q.choices.filter(c => c.correct === true).length;
    if (correctCount === 0) {
      errors.push(`${prefix}: no correct answer marked ("correct": true missing on one choice).`);
    } else if (correctCount > 1) {
      errors.push(`${prefix}: more than one correct answer marked (only one choice should have "correct": true).`);
    }

    q.choices.forEach((c, ci) => {
      const cprefix = `${prefix} > Choice ${LETTERS_GLOBAL[ci]}`;
      if (!c.text || typeof c.text !== 'string') {
        errors.push(`${cprefix}: missing or invalid "text".`);
      }
      if (typeof c.correct !== 'boolean') {
        errors.push(`${cprefix}: missing or non-boolean "correct" field.`);
      }
    });
  });

  return errors;
}

// ── Template Modal ───────────────────────────────
const TEMPLATE_PROMPT = `You are a question bank generator. Generate a valid JSON file for a practice exam quiz app.

The JSON must follow this exact structure:

{
  "title": "[YOUR EXAM NAME — e.g. AZ-305: Designing Microsoft Azure Infrastructure Solutions]",
  "description": "[Short description of the exam]",
  "timeLimit": [Number in minutes — e.g. 100, use 0 for no limit],
  "shuffle": [true or false — whether to randomize question order],
  "passingScore": [Number 1-100 — e.g. 70],
  "domains": [
    { "name": "[Domain 1 name — e.g. Identity & Governance]", "weight": [Number] },
    { "name": "[Domain 2 name]", "weight": [Number] }
  ],
  "questions": [
    {
      "id": "[Optional unique ID — e.g. ID-001]",
      "domain": "[Domain name — must match one in the domains array above]",
      "question": "[The scenario-based question text. Be specific and realistic.]",
      "shuffleChoices": [true or false],
      "choices": [
        {
          "text": "[Choice A text]",
          "correct": [true or false — exactly one must be true],
          "explanation": "[Why this choice is right or wrong — used in Study Mode]"
        },
        { "text": "[Choice B text]", "correct": false, "explanation": "[...]" },
        { "text": "[Choice C text]", "correct": false, "explanation": "[...]" },
        { "text": "[Choice D text]", "correct": false, "explanation": "[...]" }
      ],
      "explanation": "[Overall explanation for the correct answer — shown after checking in Study Mode]",
      "tags": ["optional", "tags"]
    }
  ]
}

RULES:
1. Questions must be SCENARIO-BASED — real-world design/decisions, not trivia
2. Exactly ONE choice per question must have "correct": true
3. Every choice MUST have an "explanation" field explaining WHY it is right or wrong
4. All questions within a domain should test different sub-topics
5. Include enough questions to make a realistic exam (minimum 20 recommended)
6. Output ONLY the raw JSON — no markdown code blocks, no commentary
7. Make sure the JSON is valid and parses correctly`;

const TEMPLATE_SCHEMA = `{
  "title":        "string  (required) — exam name",
  "description":  "string  (optional)",
  "timeLimit":    "number  (minutes, 0 = no limit)",
  "count":        "number  (optional — max questions to sample)",
  "shuffle":      "boolean (randomize question order)",
  "passingScore": "number  (1-100)",
  "domains": [
    { "name": "string", "weight": number }
  ],
  "questions": [
    {
      "id":          "string  (optional)",
      "domain":      "string  (category badge — match a domain name)",
      "question":    "string  (required) — scenario-based question",
      "shuffleChoices": "boolean (shuffle this question's choices)",
      "choices": [
        {
          "text":        "string  (required)",
          "correct":      "boolean (required — exactly one true per question)",
          "explanation":  "string  (why this choice is right or wrong)"
        }
      ],
      "explanation": "string  (overall explanation after checking answer)",
      "tags":         ["array of strings (optional)"]
    }
  ]
}`;

const TEMPLATE_EXAMPLE = `{
  "title": "AZ-900: Azure Fundamentals",
  "description": "Sample question bank for Azure cloud concepts",
  "timeLimit": 45,
  "shuffle": true,
  "passingScore": 70,
  "domains": [
    { "name": "Cloud Concepts", "weight": 25 },
    { "name": "Azure Services", "weight": 35 }
  ],
  "questions": [
    {
      "id": "AZ900-001",
      "domain": "Cloud Concepts",
      "question": "A company wants to move their on-premises application to Azure. They need to minimize capital expenditure and prefer paying only for what they use. Which cloud deployment model should they use?",
      "shuffleChoices": true,
      "choices": [
        {
          "text": "Private Cloud — dedicated infrastructure for exclusive use",
          "correct": false,
          "explanation": "Private cloud still requires capital investment in dedicated hardware and infrastructure, which does not minimize CapEx."
        },
        {
          "text": "Public Cloud — resources shared across multiple customers with pay-as-you-go pricing",
          "correct": true,
          "explanation": "Public cloud provides on-demand resource provisioning with no upfront hardware costs, converting CapEx to OpEx and eliminating idle resource costs."
        },
        {
          "text": "Hybrid Cloud — mix of on-premises and public cloud with private network",
          "correct": false,
          "explanation": "Hybrid cloud requires maintaining on-premises infrastructure alongside cloud resources, which does not minimize CapEx."
        },
        {
          "text": "Edge Cloud — distributed computing at the network edge",
          "correct": false,
          "explanation": "Edge cloud is designed for latency-sensitive workloads at the network edge, not for general application migration cost optimization."
        }
      ],
      "explanation": "Public cloud's pay-as-you-go model directly addresses the goal of minimizing CapEx by converting infrastructure costs to variable operational costs.",
      "tags": ["cloud-deployment", "capex", "opex"]
    }
  ]
}`;

function showTemplateModal() {
  $('prompt-text').textContent = TEMPLATE_PROMPT;
  $('schema-text').textContent = TEMPLATE_SCHEMA;
  $('example-text').textContent = TEMPLATE_EXAMPLE;
  $('template-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeTemplateModal(e) {
  if (e && e.target !== $('template-modal')) return;
  $('template-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function copyPrompt() {
  const text = $('prompt-text').textContent;
  try {
    await navigator.clipboard.writeText(text);
    flashCopyBtn('✅ Copied!');
  } catch {
    fallbackCopy(text);
    flashCopyBtn('✅ Copied!');
  }
}

function flashCopyBtn(label) {
  const btn = $('copy-prompt-btn');
  const orig = btn.textContent;
  btn.textContent = label;
  btn.style.background = 'var(--success)';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
  }, 1500);
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ── File Upload ─────────────────────────────────
function onFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  $('file-name').textContent = file.name;

  const statusEl = $('json-valid-status');
  const errorsEl = $('json-valid-errors');
  statusEl.classList.add('hidden');
  errorsEl.classList.add('hidden');

  const reader = new FileReader();
  reader.onload = ev => {
    let raw;
    try {
      raw = ev.target.result;
    } catch {
      showFileError('Could not read file.');
      return;
    }

    // Step 1: Basic JSON parse check
    let data;
    try {
      data = JSON.parse(raw);
    } catch(err) {
      showFileError(`❌ Invalid JSON — ${err.message}`, [
        `Parse error at: ${err.message}`,
        'Check for missing commas, unclosed brackets, or stray characters.',
        'Tip: Make sure you paste raw JSON, not a markdown code block.'
      ]);
      return;
    }

    // Step 2: Schema validation
    const errors = validateQuestionBank(data);
    if (errors.length > 0) {
      showFileError(`❌ Validation failed — ${errors.length} issue(s) found:`, errors);
      return;
    }

    // Valid!
    sessionStorage.setItem('customQuestionBank', JSON.stringify(data));
    sessionStorage.setItem('customBankName', file.name.replace('.json', ''));

    statusEl.textContent = `✅ Valid! ${data.questions.length} questions loaded.`;
    statusEl.className = 'json-valid-status valid';
    statusEl.classList.remove('hidden');
    errorsEl.classList.add('hidden');

    // Switch dropdown to custom
    const opt = document.createElement('option');
    opt.value = '__custom__';
    opt.textContent = `📁 ${file.name}`;
    $('qb-select').insertBefore(opt, $('qb-select').firstChild);
    $('qb-select').value = '__custom__';
    $('qb-desc').textContent = `${data.questions.length} questions from ${file.name}`;
  };
  reader.readAsText(file);
}

function showFileError(msg, details) {
  const statusEl = $('json-valid-status');
  const errorsEl = $('json-valid-errors');
  statusEl.textContent = msg;
  statusEl.className = 'json-valid-status invalid';
  statusEl.classList.remove('hidden');
  if (details && details.length > 0) {
    errorsEl.textContent = details.join('\n');
    errorsEl.classList.remove('hidden');
  }
  sessionStorage.removeItem('customQuestionBank');
  sessionStorage.removeItem('customBankName');
}

// ── Paste JSON ───────────────────────────────────
let pastedData = null;

function validatePastedJSON() {
  const raw = $('json-paste').value.trim();
  if (!raw) {
    showPasteError('Paste some JSON first.', ['The text area is empty — paste your JSON question bank here.']);
    return;
  }

  // Strip markdown code fences if present
  let cleaned = raw;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  const statusEl = $('paste-valid-status');
  const errorsEl = $('paste-valid-errors');
  statusEl.classList.add('hidden');
  errorsEl.classList.add('hidden');

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch(err) {
    showPasteError(`❌ Invalid JSON — ${err.message}`, [
      `Parse error: ${err.message}`,
      'Common causes: trailing commas, missing quotes, unclosed brackets.',
      'Make sure you pasted raw JSON, not a markdown code block.',
      'If you used "Copy code" from ChatGPT, try right-clicking and selecting "Copy raw text" instead.'
    ]);
    return;
  }

  const errors = validateQuestionBank(data);
  if (errors.length > 0) {
    showPasteError(`❌ Validation failed — ${errors.length} issue(s) found:`, errors);
    return;
  }

  // Valid!
  pastedData = data;
  statusEl.textContent = `✅ Valid JSON! ${data.questions.length} questions found. Ready to use.`;
  statusEl.className = 'json-valid-status valid';
  statusEl.classList.remove('hidden');
  errorsEl.classList.add('hidden');

  $('use-paste-btn').classList.remove('hidden');
  $('paste-hint').textContent = 'Click "Use This Bank" to start the exam with this question bank.';
  $('validate-paste-btn').innerHTML = '🔄 Re-validate';
}

function usePastedJSON() {
  if (!pastedData) return;

  const name = pastedData.title || 'Custom Exam';
  sessionStorage.setItem('customQuestionBank', JSON.stringify(pastedData));
  sessionStorage.setItem('customBankName', name);

  // Add to dropdown
  const opt = document.createElement('option');
  opt.value = '__custom__';
  opt.textContent = `📋 ${name} (pasted)`;
  $('qb-select').insertBefore(opt, $('qb-select').firstChild);
  $('qb-select').value = '__custom__';
  $('qb-desc').textContent = `${pastedData.questions.length} questions — ${pastedData.title}`;

  // Clear paste status
  const statusEl = $('paste-valid-status');
  const errorsEl = $('paste-valid-errors');
  statusEl.classList.add('hidden');
  errorsEl.classList.add('hidden');
  $('json-paste').value = '';
  $('use-paste-btn').classList.add('hidden');
  $('paste-hint').textContent = 'Paste JSON generated by an AI, then click Validate';
  $('validate-paste-btn').innerHTML = '🔍 Validate';
  pastedData = null;

  // Scroll to Start button
  $('start-btn').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showPasteError(msg, details) {
  pastedData = null;
  const statusEl = $('paste-valid-status');
  const errorsEl = $('paste-valid-errors');
  statusEl.textContent = msg;
  statusEl.className = 'json-valid-status invalid';
  statusEl.classList.remove('hidden');
  if (details && details.length > 0) {
    errorsEl.textContent = details.join('\n');
    errorsEl.classList.remove('hidden');
  }
  $('use-paste-btn').classList.add('hidden');
  $('paste-hint').textContent = 'Fix the errors above, then click Re-validate.';
}

// ── Init ───────────────────────────────────────
async function onStart() {
  const selectedFile = $('qb-select').value;

  // Intercept: open template generator instead
  if (selectedFile === '__generate__') {
    showTemplateModal();
    return;
  }

  mode         = document.querySelector('input[name="mode"]:checked').value;
  passingScore = parseInt($('passing-score').value) || 70;

  let raw;
  const bankValue = $('qb-select').value;

  // Custom file upload takes priority
  const custom = sessionStorage.getItem('customQuestionBank');
  if (bankValue === '__custom__' && custom) {
    raw = custom;
  } else if (custom && bankValue === '__custom__') {
    raw = custom;
  } else if (bankValue) {
    // Load from selected bank file
    try {
      const resp = await fetch(bankValue);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      raw = await resp.text();
    } catch(err) {
      showSetupError('Could not load question bank: ' + err.message);
      return;
    }
  } else {
    showSetupError('Please select a question bank or upload a JSON file.');
    return;
  }

  try {
    questionBank = JSON.parse(raw);
  } catch(err) {
    showSetupError('Invalid JSON: ' + err.message);
    return;
  }

  if (!questionBank.questions || questionBank.questions.length === 0) {
    showSetupError('Question bank has no questions.');
    return;
  }

  examConfig = {
    title:       questionBank.title       || 'Practice Exam',
    version:     questionBank.version     || '',
    description: questionBank.description || '',
    timeLimit:   parseInt($('time-limit').value) || 0,
    passingScore,
    shuffle:     questionBank.shuffle      || false,
    domains:     questionBank.domains      || [],
    count:       parseInt($('question-count').value) || 0,
  };

  // Build question list
  questions = [...questionBank.questions];
  if (examConfig.count > 0 && examConfig.count < questions.length) {
    questions = examConfig.domains.length > 0
      ? pickBalanced(questions, examConfig.count, examConfig.domains)
      : shuffle(questions).slice(0, examConfig.count);
  } else if (examConfig.shuffle) {
    questions = shuffle(questions);
  }

  answers      = {};
  studyChecked = {};
  flagged      = new Set();
  currentIndex = 0;
  submitted    = false;

  // Update mode badge
  $('mode-badge').textContent = mode === 'study' ? '📖 STUDY' : '📋 EXAM';
  $('mode-badge').className   = 'mode-badge ' + (mode === 'study' ? 'mode-badge-study' : 'mode-badge-exam');

  // Study mode: no submit until the end
  if (mode === 'study') {
    $('submit-btn').classList.add('hidden');
    $('study-check-btn').classList.remove('hidden');
    $('next-btn').textContent = '→ Next';
  } else {
    $('submit-btn').classList.remove('hidden');
    $('study-check-btn').classList.add('hidden');
    $('next-btn').textContent = 'Next →';
  }

  showScreen('exam-screen');
  buildNavGrid();
  renderQuestion();
  startTimer();
  updateProgressBar();
}

// ── Balanced Sampling ────────────────────────────
function pickBalanced(pool, count, domains) {
  const dc = {};
  domains.forEach(d => dc[d.name] = 0);
  const perDomain = Math.floor(count / domains.length);
  const result = [];
  const shuffled = shuffle([...pool]);
  shuffled.forEach(q => {
    const d = q.domain || 'General';
    if (result.length < count && dc[d] < perDomain) {
      result.push(q); dc[d]++;
    }
  });
  shuffled.forEach(q => {
    if (result.length < count && !result.includes(q)) result.push(q);
  });
  return shuffle(result);
}

// ── Timer ────────────────────────────────────────
function startTimer() {
  clearInterval(timerHandle);
  if (!examConfig.timeLimit) {
    $('timer').textContent = '∞';
    return;
  }
  secondsLeft = examConfig.timeLimit * 60;
  renderTimer();
  timerHandle = setInterval(() => {
    secondsLeft--;
    renderTimer();
    if (secondsLeft <= 0) {
      clearInterval(timerHandle);
      submitExam();
    }
  }, 1000);
}

function renderTimer() {
  if (!examConfig.timeLimit) return;
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  $('timer').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  $('timer').style.color = secondsLeft < 300 ? '#dc2626' : '';
}

// ── Render Question ──────────────────────────────
function renderQuestion() {
  const q = questions[currentIndex];

  const titleText = examConfig.version
    ? `${examConfig.title} — v${examConfig.version}`
    : examConfig.title;
  $('exam-title').textContent         = titleText;
  $('question-counter').textContent   = `Q ${currentIndex + 1} / ${questions.length}`;
  $('q-domain').textContent           = q.domain || '';

  // Flag button
  const isFlagged = flagged.has(currentIndex);
  $('flag-btn').classList.toggle('flagged', isFlagged);
  $('flag-label').textContent = isFlagged ? '🚩 Flagged' : '🚩 Flag';

  // Question text
  $('question-text').textContent = q.question;

  // Hide study feedback / explanation initially
  $('study-feedback').classList.add('hidden');
  $('study-explanation').classList.add('hidden');

  // Choices — store shuffled so studyCheckAnswer uses the SAME order
  q._shuffledChoices = q.shuffleChoices ? shuffle([...q.choices]) : q.choices;
  const choiceMap = q._shuffledChoices.map((c, ri) => ({ ...c, origIdx: q.choices.indexOf(c), renderIdx: ri }));

  const list = $('choices-list');
  list.innerHTML = '';

  const isChecked = studyChecked[currentIndex];
  const userAnswer = answers[currentIndex];

  choiceMap.forEach(choice => {
    const div = document.createElement('div');
    div.className = 'choice-item';
    div.dataset.renderIdx = choice.renderIdx;

    if (userAnswer && userAnswer.choiceIdx === choice.origIdx) {
      div.classList.add('selected');
    }

    // In study mode after checking: lock and color
    if (mode === 'study' && isChecked) {
      div.classList.add('locked');
      if (choice.correct) {
        div.classList.add('correct');
      } else if (userAnswer && userAnswer.choiceIdx === choice.origIdx && !choice.correct) {
        div.classList.add('incorrect');
      }
    }

    div.innerHTML = `
      <span class="choice-letter">${LETTERS[choice.renderIdx]}</span>
      <div class="choice-content">
        <span class="choice-text">${choice.text}</span>
        ${(mode === 'study' && isChecked && choice.explanation
          ? `<div class="choice-explanation">${choice.explanation}</div>` : '')}
      </div>
    `;

    div.addEventListener('click', () => handleChoiceClick(choice.renderIdx, choice.origIdx, q, div));
    list.appendChild(div);
  });

  // Study mode: if already checked, show feedback
  if (mode === 'study' && isChecked) {
    showStudyFeedback(q, userAnswer);
  }

  // Nav buttons
  $('prev-btn').disabled = currentIndex === 0;
  if (mode === 'study') {
    $('next-btn').disabled = currentIndex === questions.length - 1;
    $('study-check-btn').disabled = userAnswer === undefined || isChecked;
  } else {
    $('next-btn').disabled = currentIndex === questions.length - 1;
  }

  updateNavDots();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Handle Choice Click ──────────────────────────
function handleChoiceClick(renderIdx, origIdx, q, div) {
  if (submitted) return;

  // Study mode: don't lock in — just select, wait for Check Answer
  if (mode === 'study' && !studyChecked[currentIndex]) {
    answers[currentIndex] = { choiceIdx: origIdx, correct: q.choices[origIdx].correct };
    document.querySelectorAll('.choice-item').forEach(el => el.classList.remove('selected'));
    div.classList.add('selected');
    $('study-check-btn').disabled = false;
    return;
  }

  // Study mode already checked → ignore clicks
  if (mode === 'study' && studyChecked[currentIndex]) return;

  // Exam mode: immediate selection
  if (mode === 'exam') {
    answers[currentIndex] = { choiceIdx: origIdx, correct: q.choices[origIdx].correct };
    document.querySelectorAll('.choice-item').forEach(el => el.classList.remove('selected'));
    div.classList.add('selected');
    updateNavDots();
  }
}

// ── Copy Question to Clipboard ─────────────────
async function copyQuestion() {
  const q = questions[currentIndex];
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  let text = `📋 QUESTION ${currentIndex + 1}${q.domain ? ` — ${q.domain}` : ''}\n`;
  text += `${'─'.repeat(50)}\n\n`;
  text += `${q.question}\n\n`;
  text += `Choices:\n`;

  q.choices.forEach((c, ci) => {
    const mark = c.correct ? ' ✅ CORRECT' : '';
    text += `${LETTERS[ci]}. ${c.text}${mark}\n`;
    if (c.explanation) {
      text += `   └ ${c.explanation}\n`;
    }
  });

  if (q.explanation) {
    text += `\n💡 Explanation: ${q.explanation}\n`;
  }

  try {
    await navigator.clipboard.writeText(text);
    // Flash the button to confirm
    const btn = $('copy-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = '✅ Copied!';
    btn.style.borderColor = 'var(--success)';
    btn.style.color = 'var(--success)';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 1500);
  } catch(err) {
    // Fallback for non-HTTPS
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

// ── Study Mode: Check Answer ────────────────────
function studyCheckAnswer() {
  if (studyChecked[currentIndex]) return;
  const userAnswer = answers[currentIndex];
  if (!userAnswer) return;

  studyChecked[currentIndex] = true;
  const q = questions[currentIndex];

  // Use the SAME shuffled order stored during renderQuestion()
  const shuffledChoices = q._shuffledChoices || q.choices;

  // Color all choices
  document.querySelectorAll('.choice-item').forEach(div => {
    div.classList.add('locked');
    const ri = parseInt(div.dataset.renderIdx);
    const choice = shuffledChoices[ri]; // same choice shown at this position
    const origIdx = q.choices.indexOf(choice);

    if (origIdx === userAnswer.choiceIdx) {
      div.classList.add(userAnswer.correct ? 'correct' : 'incorrect');
    }
    if (choice.correct) {
      div.classList.add('correct');
    }
    // Add explanation if available
    if (choice.explanation) {
      const content = div.querySelector('.choice-content');
      if (content) {
        const expl = document.createElement('div');
        expl.className = 'choice-explanation';
        expl.textContent = choice.explanation;
        content.appendChild(expl);
      }
    }
  });

  // Feedback: show correct letter in the SHUFFLED order the user saw
  const correctInShuffled = shuffledChoices.findIndex(c => c.correct);
  const correctLetter = LETTERS[correctInShuffled];

  showStudyFeedback(q, userAnswer, correctLetter);
  updateNavDots();
  $('study-check-btn').disabled = true;

  if (currentIndex === questions.length - 1) {
    $('submit-btn').classList.remove('hidden');
    $('study-check-btn').classList.add('hidden');
    $('next-btn').disabled = true;
  }
}

function showStudyFeedback(q, userAnswer, correctLetter) {
  const fb = $('study-feedback');
  fb.classList.remove('hidden', 'correct-feedback', 'incorrect-feedback');

  if (userAnswer && userAnswer.correct) {
    fb.classList.add('correct-feedback');
    fb.innerHTML = `
      <div class="feedback-title">✅ Correct!</div>
      <div class="feedback-sub">Great — you got this one right.</div>
    `;
  } else {
    fb.classList.add('incorrect-feedback');
    // Use correctLetter (shuffled position) so it matches what user sees
    const correctInShuffled = (q._shuffledChoices || q.choices).findIndex(c => c.correct);
    const letter = correctLetter || LETTERS[correctInShuffled];
    const correctChoice = q.choices.find(c => c.correct);
    fb.innerHTML = `
      <div class="feedback-title">❌ Incorrect</div>
      <div class="feedback-sub">Correct answer: ${letter} — ${correctChoice.text}</div>
    `;
  }

  // Show overall explanation if available
  const explEl = $('study-explanation');
  if (q.explanation) {
    explEl.innerHTML = `<strong>💡 Explanation:</strong> ${q.explanation}`;
    explEl.classList.remove('hidden');
  } else {
    explEl.classList.add('hidden');
  }
}

// ── Navigate ────────────────────────────────────
function navigate(dir) {
  const next = currentIndex + dir;
  if (next < 0 || next >= questions.length) return;
  currentIndex = next;
  renderQuestion();
  updateProgressBar();
}

// ── Nav Grid ─────────────────────────────────────
function buildNavGrid() {
  const grid = $('q-nav-grid');
  grid.innerHTML = '';
  questions.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'nav-dot dot-unanswered';
    btn.textContent = i + 1;
    btn.addEventListener('click', () => { currentIndex = i; renderQuestion(); updateProgressBar(); });
    grid.appendChild(btn);
  });
}

function updateNavDots() {
  const dots = document.querySelectorAll('.nav-dot');
  dots.forEach((dot, i) => {
    dot.className = 'nav-dot';
    if (mode === 'study' && studyChecked[i] !== undefined) {
      // Show correct/wrong in study mode
      if (studyChecked[i]) {
        dot.classList.add(answers[i] && answers[i].correct ? 'dot-correct' : 'dot-wrong');
      }
    } else if (answers[i] !== undefined && flagged.has(i)) {
      dot.classList.add('dot-answered', 'dot-flagged');
    } else if (answers[i] !== undefined) {
      dot.classList.add('dot-answered');
    } else if (flagged.has(i)) {
      dot.classList.add('dot-flagged');
    } else {
      dot.classList.add('dot-unanswered');
    }
  });
}

function updateProgressBar() {
  const pct = ((currentIndex + 1) / questions.length) * 100;
  $('progress-bar').style.width = pct + '%';
}

function updateFlaggedCount() {
  const n = flagged.size;
  $('flagged-count').textContent = n;
  const toggle = $('flagged-toggle');
  toggle.style.display = n > 0 ? 'inline-flex' : 'none';
  renderFlaggedPanel();
}

function renderFlaggedPanel() {
  const panel = $('flagged-panel');
  if (flagged.size === 0) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  const list = $('flagged-list');
  list.innerHTML = '';
  [...flagged].sort((a,b) => a-b).forEach(idx => {
    const div = document.createElement('div');
    div.className = 'flagged-item';
    div.textContent = `Q${idx + 1}`;
    div.addEventListener('click', () => { currentIndex = idx; renderQuestion(); });
    list.appendChild(div);
  });
}

function toggleFlaggedPanel() {
  const panel = $('flagged-panel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function toggleFlag() {
  if (submitted) return;
  if (flagged.has(currentIndex)) {
    flagged.delete(currentIndex);
  } else {
    flagged.add(currentIndex);
  }
  const isFlagged = flagged.has(currentIndex);
  $('flag-btn').classList.toggle('flagged', isFlagged);
  $('flag-label').textContent = isFlagged ? '🚩 Flagged' : '🚩 Flag';
  updateNavDots();
  updateFlaggedCount();
}

// ── Submit ───────────────────────────────────────
function confirmSubmit() {
  const unanswered = questions.filter((_, i) => answers[i] === undefined).length;
  if (unanswered > 0) {
    const ok = confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
    if (!ok) return;
  } else {
    const ok = confirm('Submit the exam? You cannot change answers after submission.');
    if (!ok) return;
  }
  submitExam();
}

function submitExam() {
  if (submitted) return;
  submitted = true;
  clearInterval(timerHandle);

  const total   = questions.length;
  const correct = Object.values(answers).filter(a => a.correct).length;
  const score   = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed  = score >= passingScore;

  showScreen('results-screen');
  renderResults(score, correct, total, passed);
}

// ── Results ──────────────────────────────────────
function renderResults(score, correct, total, passed) {
  const titleText = examConfig.version
    ? `${examConfig.title} — v${examConfig.version}`
    : examConfig.title;
  const card = $('results-card');
  const color = passed ? 'var(--success)' : 'var(--danger)';
  const tag   = passed
    ? '<span class="pass-tag">✅ PASSED</span>'
    : '<span class="fail-tag">❌ FAILED</span>';
  const elapsed = examConfig.timeLimit
    ? `${Math.floor((examConfig.timeLimit * 60 - secondsLeft) / 60)} min used`
    : 'No limit';

  card.innerHTML = `
    <h1>${titleText}</h1>
    ${tag}
    <div class="big-score" style="color:${color}">${score}%</div>
    <p class="score-detail">${correct} correct out of ${total} questions</p>
    <p class="score-detail">Passing score: ${passingScore}%</p>
    <p class="score-detail">Time: ${elapsed}</p>
    <p class="score-detail">Mode: ${mode === 'study' ? '📖 Study' : '📋 Exam'}</p>
  `;

  $('review-section').classList.add('hidden');
}

// ── Review ───────────────────────────────────────
function reviewAnswers() {
  const section = $('review-section');
  section.classList.toggle('hidden');
  if (section.classList.contains('hidden')) return;

  const list = $('review-list');
  list.innerHTML = '';

  questions.forEach((q, i) => {
    const userAnswer = answers[i];
    const isCorrect  = userAnswer && userAnswer.correct;
    const isUnanswered = userAnswer === undefined;

    // Use the SAME shuffled order shown during the exam
    const shuffledChoices = q._shuffledChoices || q.choices;

    // Find which position in shuffled array the user actually picked
    const userPickedIdx = userAnswer
      ? shuffledChoices.findIndex(c => q.choices.indexOf(c) === userAnswer.choiceIdx)
      : -1;

    // Find correct in shuffled array
    const correctIdx = shuffledChoices.findIndex(c => c.correct);

    const item = document.createElement('div');
    item.className = 'review-item' + (isUnanswered ? '' : isCorrect ? ' correct-review' : ' wrong-review');

    // Build choices HTML in SHUFFLED order with correct letters
    let choicesHTML = '';
    shuffledChoices.forEach((c, ri) => {
      const letter = LETTERS[ri]; // letter in shuffled position
      const origIdx = q.choices.indexOf(c);
      let cls = 'review-choice';
      let mark = '';

      if (ri === userPickedIdx && ri === correctIdx) {
        cls += ' user-correct'; mark = ' ✓ Your answer (correct)';
      } else if (ri === userPickedIdx) {
        cls += ' user-wrong'; mark = ' ✗ Your answer';
      } else if (ri === correctIdx) {
        cls += ' correct-answer'; mark = ' ✓ Correct';
      }

      let explainHTML = '';
      if (c.explanation) {
        explainHTML = `<div class="review-choice-explain">${c.explanation}</div>`;
      }

      choicesHTML += `<div class="${cls}">${letter}. ${c.text}${mark}</div>${explainHTML}`;
    });

    const explanationHTML = q.explanation
      ? `<div class="review-explanation"><strong>💡 Overall Explanation:</strong> ${q.explanation}</div>`
      : '';

    item.innerHTML = `
      <div class="q-num">Question ${i + 1} — ${q.domain || 'General'}</div>
      <div class="q-text">${q.question}</div>
      <div class="review-choices">${choicesHTML}</div>
      ${explanationHTML}
    `;
    list.appendChild(item);
  });

  $('review-section').scrollIntoView({ behavior: 'smooth' });
}

function restartExam() {
  clearInterval(timerHandle);
  showScreen('setup-screen');
  $('setup-error').classList.add('hidden');
  sessionStorage.removeItem('customQuestionBank');
  sessionStorage.removeItem('customBankName');
  loadManifest(); // Reset dropdown
}

// ── Helpers ─────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showSetupError(msg) {
  const el = $('setup-error');
  if (!msg) { el.classList.add('hidden'); return; }
  el.textContent = msg;
  el.classList.remove('hidden');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
