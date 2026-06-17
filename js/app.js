/* =============================================
   EXAM PRACTICE TEST — JS ENGINE
   Reads from data/questions-*.json
   ============================================= */

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ── State ──────────────────────────────────────
let questionBank = null;
let examConfig   = {};
let questions    = [];       // array of question objects for this session
let answers      = {};       // qIndex → choice index
let flagged      = new Set();
let currentIndex = 0;
let timerHandle  = null;
let secondsLeft  = 0;
let passingScore = 70;
let submitted    = false;

// ── DOM Refs ───────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $('start-btn').addEventListener('click', onStart);
  $('json-file').addEventListener('change', onFileUpload);
  $('prev-btn').addEventListener('click', () => navigate(-1));
  $('next-btn').addEventListener('click', () => navigate(1));
  $('flag-btn').addEventListener('click', toggleFlag);
  $('submit-btn').addEventListener('click', confirmSubmit);
  $('review-btn').addEventListener('click', reviewAnswers);
});

function onFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      $('json-url').value = file.name;
      sessionStorage.setItem('overrideJson', file.name);
      // Store content for later use
      sessionStorage.setItem('overrideJsonContent', ev.target.result);
    } catch(err) {
      showSetupError('Invalid JSON file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

async function onStart() {
  const url    = $('json-url').value.trim();
  passingScore = parseInt($('passing-score').value) || 70;

  let raw;
  // Check for file-upload override
  const override = sessionStorage.getItem('overrideJsonContent');
  if (override) {
    raw = override;
    sessionStorage.removeItem('overrideJsonContent');
  } else {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      raw = await resp.text();
    } catch(err) {
      showSetupError('Could not load JSON: ' + err.message);
      return;
    }
  }

  try {
    questionBank = JSON.parse(raw);
  } catch(err) {
    showSetupError('Invalid JSON: ' + err.message);
    return;
  }

  if (!questionBank.questions || !Array.isArray(questionBank.questions) || questionBank.questions.length === 0) {
    showSetupError('JSON must contain a non-empty "questions" array.');
    return;
  }

  // Build exam config
  examConfig = {
    title:         questionBank.title         || 'Practice Exam',
    description:   questionBank.description   || '',
    timeLimit:     questionBank.timeLimit     || 0,   // minutes, 0 = no limit
    passingScore,
    shuffle:       questionBank.shuffle       || false,
    domains:       questionBank.domains       || [],
  };

  // Slice to requested count or all
  questions = [...questionBank.questions];
  if (questionBank.count && questionBank.count < questions.length) {
    // Pick evenly across domains if domains exist
    if (examConfig.domains.length > 0) {
      questions = pickBalanced(questions, questionBank.count, examConfig.domains);
    } else {
      questions = shuffle(questions).slice(0, questionBank.count);
    }
  } else if (examConfig.shuffle) {
    questions = shuffle(questions);
  }

  // Reset state
  answers      = {};
  flagged      = new Set();
  currentIndex = 0;
  submitted    = false;

  showScreen('exam-screen');
  buildNavGrid();
  renderQuestion();
  startTimer();
  updateProgressBar();
}

function pickBalanced(pool, count, domains) {
  // Ensure domain coverage
  const domainCounts = {};
  domains.forEach(d => domainCounts[d.name] = 0);
  const perDomain = Math.floor(count / domains.length);
  const result = [];
  const shuffled = shuffle([...pool]);
  shuffled.forEach(q => {
    const domain = q.domain || 'General';
    if (result.length < count && domainCounts[domain] < perDomain) {
      result.push(q);
      domainCounts[domain]++;
    }
  });
  // Fill any remaining slots
  if (result.length < count) {
    shuffled.forEach(q => {
      if (result.length < count && !result.includes(q)) result.push(q);
    });
  }
  return shuffle(result);
}

// ── Timer ──────────────────────────────────────
function startTimer() {
  if (!examConfig.timeLimit) return;
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
  if (!examConfig.timeLimit) { $('timer').textContent = '∞'; return; }
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  $('timer').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  if (secondsLeft < 300) $('timer').style.color = '#dc2626'; // red under 5 min
}

// ── Question rendering ───────────────────────────
function renderQuestion() {
  if (submitted) return;
  const q = questions[currentIndex];

  // Header
  $('exam-title').textContent     = examConfig.title;
  $('question-counter').textContent = `Q ${currentIndex + 1} / ${questions.length}`;
  $('q-domain').textContent       = q.domain || '';

  // Flag button
  const isFlagged = flagged.has(currentIndex);
  $('flag-btn').classList.toggle('flagged', isFlagged);
  $('flag-label').textContent = isFlagged ? 'Flagged' : 'Flag';
  updateFlaggedCount();

  // Question text
  $('question-text').textContent = q.question;

  // Choices
  const choices = q.shuffleChoices ? shuffle([...q.choices]) : q.choices;
  // Remember original index
  const choicesWithIdx = choices.map((c, i) => ({ ...c, origIdx: i }));

  const list = $('choices-list');
  list.innerHTML = '';
  choicesWithIdx.forEach((choice, renderIdx) => {
    const div = document.createElement('div');
    div.className = 'choice-item';
    div.dataset.renderIdx = renderIdx;
    if (answers[currentIndex] !== undefined && answers[currentIndex].choiceIdx === choice.origIdx) {
      div.classList.add('selected');
    }
    div.innerHTML = `
      <span class="choice-letter">${LETTERS[renderIdx]}</span>
      <span class="choice-text">${choice.text}</span>
    `;
    div.addEventListener('click', () => selectChoice(renderIdx, choice.origIdx, q));
    list.appendChild(div);
  });

  // Nav buttons
  $('prev-btn').disabled = currentIndex === 0;
  $('next-btn').disabled = currentIndex === questions.length - 1;

  // Update nav dots
  updateNavDots();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectChoice(renderIdx, origIdx, q) {
  if (submitted) return;
  answers[currentIndex] = { choiceIdx: origIdx, correct: q.choices[origIdx].correct };

  // Update UI
  document.querySelectorAll('.choice-item').forEach(el => el.classList.remove('selected'));
  document.querySelector(`.choice-item[data-render-idx="${renderIdx}"]`)?.classList.add('selected');
  updateNavDots();
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
  $('flag-label').textContent = isFlagged ? 'Flagged' : 'Flag';
  updateNavDots();
  updateFlaggedCount();
  renderFlaggedPanel();
}

function navigate(dir) {
  const next = currentIndex + dir;
  if (next < 0 || next >= questions.length) return;
  currentIndex = next;
  renderQuestion();
  updateProgressBar();
}

// ── Nav grid ────────────────────────────────────
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
    if (answers[i] !== undefined && flagged.has(i)) dot.classList.add('dot-answered', 'dot-flagged');
    else if (answers[i] !== undefined) dot.classList.add('dot-answered');
    else if (flagged.has(i)) dot.classList.add('dot-flagged');
    else dot.classList.add('dot-unanswered');
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
  toggle.style.display = n > 0 ? 'block' : 'none';
  renderFlaggedPanel();
}

function renderFlaggedPanel() {
  const list = $('flagged-list');
  if (flagged.size === 0) { list.innerHTML = '<em style="font-size:0.85rem;color:#64748b">No flagged questions</em>'; return; }
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

// ── Submit ─────────────────────────────────────
function confirmSubmit() {
  const unanswered = questions.filter((_, i) => answers[i] === undefined).length;
  const msg = unanswered > 0
    ? `You have ${unanswered} unanswered question(s). Submit anyway?`
    : 'Submit the exam? You cannot change answers after submission.';
  if (!confirm(msg)) return;
  submitExam();
}

function submitExam() {
  if (submitted) return;
  submitted = true;
  clearInterval(timerHandle);

  const total    = questions.length;
  const correct  = Object.values(answers).filter(a => a.correct).length;
  const score    = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed   = score >= passingScore;

  showScreen('results-screen');
  renderResults(score, correct, total, passed);
}

// ── Results ─────────────────────────────────────
function renderResults(score, correct, total, passed) {
  const card = $('results-card');
  const scoreColor = passed ? '#16a34a' : '#dc2626';
  const tagHTML = passed
    ? '<span class="pass-tag">✅ PASSED</span>'
    : '<span class="fail-tag">❌ FAILED</span>';

  card.innerHTML = `
    <h1>${examConfig.title}</h1>
    ${tagHTML}
    <div class="big-score" style="color:${scoreColor}">${score}%</div>
    <p class="score-detail">${correct} correct out of ${total} questions</p>
    <p class="score-detail">Passing score: ${passingScore}%</p>
    <p class="score-detail" style="margin-top:12px; font-size:0.85rem">
      Time: ${examConfig.timeLimit ? `${Math.floor((examConfig.timeLimit * 60 - secondsLeft)/60)} min used` : 'No limit'}
    </p>
  `;
}

// ── Review ──────────────────────────────────────
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

    const item = document.createElement('div');
    item.className = 'review-item' + (isUnanswered ? '' : isCorrect ? ' correct-review' : ' wrong-review');

    // Find correct choice
    const correctIdx = q.choices.findIndex(c => c.correct);
    const userChoiceIdx = userAnswer ? userAnswer.choiceIdx : null;

    let choicesHTML = '';
    q.choices.forEach((c, ci) => {
      const letter = LETTERS[ci];
      let cls = 'review-choice';
      let mark = '';
      if (ci === userChoiceIdx && ci === correctIdx) { cls += ' user-correct'; mark = ' ✓ Your answer'; }
      else if (ci === userChoiceIdx && ci !== correctIdx) { cls += ' user-wrong'; mark = ' ✗ Your answer'; }
      else if (ci === correctIdx) { cls += ' correct-answer'; mark = ' ✓ Correct'; }
      choicesHTML += `<div class="${cls}">${letter}. ${c.text}${mark}</div>`;
    });

    item.innerHTML = `
      <div class="q-num">Question ${i + 1} — ${q.domain || 'General'}</div>
      <div class="q-text">${q.question}</div>
      <div class="review-choices">${choicesHTML}</div>
      ${q.explanation ? `<div class="review-explanation"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
    `;
    list.appendChild(item);
  });

  $('review-section').scrollIntoView({ behavior: 'smooth' });
}

function restartExam() {
  showScreen('setup-screen');
  $('setup-error').classList.add('hidden');
}

// ── Helpers ─────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showSetupError(msg) {
  const el = $('setup-error');
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
