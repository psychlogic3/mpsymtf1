/* PsychLogic — Foundational Mock 1 : test engine */
/* ============================================================
   PsychLogic — Sample Mock Test Engine
   Question data is kept separate from the UI logic below so it
   can be swapped out (or moved to /data/questions.json) later.
   ============================================================ */
const QUESTIONS = (window.MOCK_QUESTIONS || []);

const TEST_DURATION = 120 * 60; // 120 minutes
const NEG_MARK = 0.25;         // penalty per wrong answer
const POS_MARK = 1;            // marks per correct answer

/* ---------------- State ---------------- */
const N = QUESTIONS.length;
let answers = new Array(N).fill(null);
let marked  = new Array(N).fill(false);
let visited = new Array(N).fill(false);
let timeSpent = new Array(N).fill(0);
let current = 0;
let timeLeft = TEST_DURATION;
let timerId = null;
let submitted = false;
let qEnter = 0;

/* ---------------- Element refs ---------------- */
const $ = id => document.getElementById(id);
const gateScreen = $('gateScreen'), startScreen = $('startScreen'), testScreen = $('testScreen'), resultScreen = $('resultScreen');

const ACCESS_CODES = (window.ACCESS_CODES || []);
const CODE_SET = new Set(ACCESS_CODES.map(c => c.replace(/[\s-]/g, "").toUpperCase()));
let studentName = "";

/* ---------------- Access gate ---------------- */
$('gateForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const nameEl = $('nameInput'), codeEl = $('codeInput');
  const name = nameEl.value.trim();
  const codeNorm = codeEl.value.replace(/[\s-]/g, "").toUpperCase();

  if (!name) { showGateError('Please enter your name to continue.', nameEl); return; }
  if (!codeEl.value.trim()) { showGateError('Please enter your access code.', codeEl); return; }
  if (!CODE_SET.has(codeNorm)) { showGateError('That access code is not valid. Please check and try again.', codeEl); return; }

  // success
  studentName = name.split(/\s+/)[0].charAt(0).toUpperCase() + name.split(/\s+/)[0].slice(1);
  $('gateError').hidden = true;
  $('greeting').innerHTML = `Hello, <b>${escapeHtml(studentName)}</b> <span class="wave">👋</span>`;
  gateScreen.hidden = true;
  startScreen.hidden = false;
  window.scrollTo(0, 0);
});

function showGateError(msg, el) {
  $('gateErrorText').textContent = msg;
  $('gateError').hidden = false;
  if (el) { el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 400); el.focus(); }
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------- Start ---------------- */
$('chipQ').textContent = N;
$('chipT').textContent = Math.round(TEST_DURATION / 60);
$('totNum').textContent = N;
$('sumLeft').textContent = N;

$('startBtn').addEventListener('click', startTest);

function startTest() {
  startScreen.hidden = true;
  testScreen.hidden = false;
  buildPalette();
  renderQuestion(0);
  startTimer();
  window.scrollTo(0, 0);
}

/* ---------------- Timer ---------------- */
function startTimer() {
  updateTimerDisplay();
  timerId = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerId);
      toast('Time is up — submitting your test');
      setTimeout(() => finalizeSubmit(), 900);
    }
  }, 1000);
}
function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
  $('timerVal').textContent = `${m}:${String(s).padStart(2, '0')}`;
  $('timer').classList.toggle('low', timeLeft <= 60);
}

/* ---------------- Question rendering ---------------- */
function renderQuestion(i) {
  recordTime();
  current = i;
  visited[i] = true;
  qEnter = Date.now();
  const q = QUESTIONS[i];

  $('curNum').textContent = i + 1;
  $('progressFill').style.width = ((i + 1) / N * 100) + '%';
  $('qSubject').textContent = q.subject;
  $('qDiff').textContent = q.difficulty;
  $('qText').innerHTML = q.question;

  const optBox = $('options');
  optBox.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const b = document.createElement('button');
    b.className = 'option' + (answers[i] === idx ? ' selected' : '');
    b.innerHTML = `<span class="opt-key">${'ABCD'[idx]}</span><span class="opt-text">${opt}</span>`;
    b.addEventListener('click', () => {
      answers[i] = idx;
      renderQuestion(i);
      updatePalette();
    });
    optBox.appendChild(b);
  });

  // mark button state
  const mb = $('markBtn');
  mb.classList.toggle('btn-primary', marked[i]);
  mb.querySelector('svg').setAttribute('fill', marked[i] ? 'currentColor' : 'none');
  mb.childNodes[mb.childNodes.length - 1].textContent = marked[i] ? ' Marked' : ' Mark for review';

  $('prevBtn').disabled = i === 0;
  $('prevBtnM').disabled = i === 0;
  const lastLabel = i === N - 1;
  $('nextBtn').innerHTML = lastLabel ? 'Submit <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
    : 'Next <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  $('nextBtnM').innerHTML = lastLabel ? 'Submit' : 'Next';

  updatePalette();
}

function recordTime() {
  if (qEnter) { timeSpent[current] += Date.now() - qEnter; qEnter = 0; }
}

/* ---------------- Navigation ---------------- */
function goNext() {
  if (current === N - 1) { openSubmitModal(); return; }
  renderQuestion(current + 1);
}
function goPrev() { if (current > 0) renderQuestion(current - 1); }

$('nextBtn').addEventListener('click', goNext);
$('nextBtnM').addEventListener('click', goNext);
$('prevBtn').addEventListener('click', goPrev);
$('prevBtnM').addEventListener('click', goPrev);

$('clearBtn').addEventListener('click', () => {
  answers[current] = null;
  renderQuestion(current);
  updatePalette();
});
$('markBtn').addEventListener('click', () => {
  marked[current] = !marked[current];
  renderQuestion(current);
  updatePalette();
});

/* ---------------- Palette ---------------- */
function buildPalette() {
  const g = $('pGrid');
  g.innerHTML = '';
  for (let i = 0; i < N; i++) {
    const b = document.createElement('button');
    b.className = 'p-btn';
    b.textContent = i + 1;
    b.addEventListener('click', () => {
      renderQuestion(i);
      document.body.classList.remove('palette-open');
      $('q' + 'text'); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    g.appendChild(b);
  }
  updatePalette();
}
function updatePalette() {
  const btns = $('pGrid').children;
  let ans = 0, mk = 0;
  for (let i = 0; i < N; i++) {
    const b = btns[i];
    b.className = 'p-btn';
    if (marked[i]) b.classList.add('marked');
    if (answers[i] !== null) { b.classList.add('answered'); ans++; }
    else if (visited[i]) b.classList.add('notans');
    if (marked[i]) mk++;
    if (i === current) b.classList.add('current');
  }
  $('sumAns').textContent = ans;
  $('sumMark').textContent = mk;
  $('sumLeft').textContent = N - ans;
}

/* mobile palette toggle */
$('paletteBtn').addEventListener('click', () => document.body.classList.add('palette-open'));
$('paletteClose').addEventListener('click', () => document.body.classList.remove('palette-open'));

/* ---------------- Submit ---------------- */
$('submitBtnTop').addEventListener('click', openSubmitModal);

function openSubmitModal() {
  const answered = answers.filter(a => a !== null).length;
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="m-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h0M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg></div>
      <h3>Submit your test?</h3>
      <p>Once submitted you'll see your full result analysis and answer explanations. You can't return to the questions afterwards.</p>
      <div class="m-stats">
        <div>Answered<b>${answered}/${N}</b></div>
        <div>Unanswered<b>${N - answered}</b></div>
        <div>Marked<b>${marked.filter(Boolean).length}</b></div>
      </div>
      <div class="m-actions">
        <button class="btn" id="cancelSubmit">Keep working</button>
        <button class="btn btn-accent" id="confirmSubmit">Submit now</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#cancelSubmit').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirmSubmit').addEventListener('click', () => { overlay.remove(); finalizeSubmit(); });
}

function finalizeSubmit() {
  if (submitted) return;
  submitted = true;
  recordTime();
  clearInterval(timerId);
  document.body.classList.remove('palette-open');
  testScreen.hidden = true;
  resultScreen.hidden = false;
  window.scrollTo(0, 0);
  computeAndRenderResults();
}

/* ============================================================
   RESULTS
   ============================================================ */
function computeAndRenderResults() {
  let correct = 0, incorrect = 0, unanswered = 0;
  const bySubject = {};
  QUESTIONS.forEach((q, i) => {
    const s = q.subject;
    if (!bySubject[s]) bySubject[s] = { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
    bySubject[s].total++;
    if (answers[i] === null) { unanswered++; bySubject[s].unanswered++; }
    else if (answers[i] === q.correctAnswer) { correct++; bySubject[s].correct++; }
    else { incorrect++; bySubject[s].incorrect++; }
  });
  const maxMarks = N * POS_MARK;
  const penalty = incorrect * NEG_MARK;
  const obtained = correct * POS_MARK - penalty;
  const fmt = v => (Math.round(v * 100) / 100).toString();
  const pct = Math.round(Math.max(0, obtained) / maxMarks * 100);
  const timeUsed = TEST_DURATION - timeLeft;
  const avgPer = Math.round(timeUsed / N);

  /* hero */
  $('reportFor').innerHTML = studentName ? `Report prepared for <b>${escapeHtml(studentName)}</b>` : '';
  $('scorePct').textContent = pct + '%';
  drawScoreRing(pct);
  const verdictMap = pct >= 80
    ? ['Excellent', 'Outstanding performance', "You've shown strong command across these topics. Keep this momentum and target the few gaps below."]
    : pct >= 60
    ? ['Good', 'A solid attempt', 'A good performance with clear strengths. Tightening the weaker subjects below will push you higher.']
    : pct >= 40
    ? ['Keep going', 'Room to grow', 'A fair attempt. Focus your revision on the weaker areas identified below to lift your accuracy.']
    : ['Focus', "Let's build the base", 'This is a starting point. Work steadily through the weak areas below — the analysis shows exactly where to begin.'];
  $('verdict').textContent = verdictMap[0];
  $('resultTitle').textContent = verdictMap[1];
  $('resultMsg').textContent = verdictMap[2];
  const mm = Math.floor(timeUsed / 60), ss = timeUsed % 60;
  $('scoreLine').innerHTML = `Marks <b>${fmt(obtained)} / ${maxMarks}</b> &nbsp;·&nbsp; <span class="pos">+${correct} correct</span> &nbsp;<span class="neg">&minus;${fmt(penalty)} penalty</span> &nbsp;·&nbsp; Time used <b>${mm}m ${String(ss).padStart(2,'0')}s</b>`;

  /* stat tiles */
  $('statRow').innerHTML = [
    { cls: '', label: 'Marks', num: `${fmt(obtained)}`, sub: `out of ${maxMarks} · ${pct}%`, dot: 'var(--brand)' },
    { cls: 'good', label: 'Correct', num: correct, sub: `+${correct} marks`, dot: 'var(--good)' },
    { cls: 'bad', label: 'Incorrect', num: incorrect, sub: `&minus;${fmt(penalty)} penalty`, dot: 'var(--bad)' },
    { cls: 'unans', label: 'Unanswered', num: unanswered, sub: 'No penalty', dot: 'var(--unans)' },
    { cls: '', label: 'Time Used', num: `${mm}:${String(ss).padStart(2,'0')}`, sub: `${avgPer}s avg/question`, dot: 'var(--accent)' }
  ].map(s => `
    <div class="stat ${s.cls}">
      <div class="s-top"><span class="dot-i" style="background:${s.dot}"></span>${s.label}</div>
      <div class="s-num">${s.num}</div>
      <div class="s-sub">${s.sub}</div>
    </div>`).join('');

  /* donut */
  drawDonut(correct, incorrect, unanswered);
  $('donutLegend').innerHTML = [
    ['Correct', correct, 'var(--good)'],
    ['Incorrect', incorrect, 'var(--bad)'],
    ['Unanswered', unanswered, 'var(--unans)']
  ].map(([t, v, c]) => `<div class="dl"><span class="dot-i" style="background:${c}"></span><span class="dl-t">${t}</span><span class="dl-v">${v}</span></div>`).join('');

  /* subject bars (sorted by accuracy desc) */
  const subjArr = Object.entries(bySubject).map(([name, d]) => {
    const attempted = d.correct + d.incorrect;
    const acc = attempted ? Math.round(d.correct / attempted * 100) : 0;
    return { name, ...d, attempted, acc };
  }).sort((a, b) => b.acc - a.acc || b.correct - a.correct);

  $('subjectBars').innerHTML = subjArr.map(s => {
    const col = s.acc >= 70 ? 'var(--good)' : s.acc >= 40 ? 'var(--accent)' : 'var(--bad)';
    const w = Math.max(s.acc, 6);
    return `<div class="bar-row">
      <div class="bar-head"><span class="b-name">${s.name}</span><span class="b-meta">${s.correct}/${s.total} · ${s.acc}%</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${w}%;background:${col}">${s.acc}%</div></div>
    </div>`;
  }).join('');

  /* strong / weak areas */
  const strong = subjArr.filter(s => s.attempted > 0 && s.acc >= 70);
  const weak = subjArr.filter(s => s.acc < 50 || (s.unanswered > 0 && s.attempted === 0)).sort((a, b) => a.acc - b.acc);
  $('strongAreas').innerHTML = strong.length
    ? strong.map(s => areaItem(s, 'strong')).join('')
    : `<div class="empty-note">No subject crossed 70% this time — the tips below show where to start.</div>`;
  $('weakAreas').innerHTML = weak.length
    ? weak.map(s => areaItem(s, 'weak')).join('')
    : `<div class="empty-note">No clear weak areas — nicely balanced across subjects.</div>`;

  /* tips */
  renderTips(subjArr, { correct, incorrect, unanswered, pct });

  /* answers review */
  buildSubjectFilter(Object.keys(bySubject));
  renderReview('all', 'all');
  updateFilterCounts(correct, incorrect, unanswered);
}

function areaItem(s, kind) {
  const ic = kind === 'strong'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 17l5-5 3 3 6-7"/><path d="M21 8V3h-5"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 8v5M12 17h0M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';
  return `<div class="area-item ${kind}">
    <span class="a-ic">${ic}</span>
    <span class="a-name">${s.name}</span>
    <span class="a-acc">${s.acc}%</span>
  </div>`;
}

function renderTips(subjArr, o) {
  const tips = [];
  if (o.pct >= 80) tips.push(['pos', 'Strong overall accuracy.', `You answered <b>${o.correct}/${N}</b> correctly. At this level, focus on maintaining consistency and speed rather than relearning basics.`]);
  const weakest = subjArr.filter(s => s.attempted > 0).sort((a, b) => a.acc - b.acc)[0];
  if (weakest && weakest.acc < 60) tips.push(['warn', `Revise ${weakest.name}.`, `Your accuracy here was <b>${weakest.acc}%</b>. Go back to the core concepts and practise more questions from this subject.`]);
  const strongest = subjArr.filter(s => s.attempted > 0 && s.acc >= 70)[0];
  if (strongest) tips.push(['pos', `${strongest.name} is a strength.`, `You scored <b>${strongest.acc}%</b> here — lean on this subject to secure marks and save time for weaker sections.`]);
  if (o.unanswered >= Math.ceil(N * 0.2)) tips.push(['warn', 'Several questions were left unanswered.', `You skipped <b>${o.unanswered}</b> question${o.unanswered > 1 ? 's' : ''}. Practise time management so you can attempt every question — even an educated guess beats a blank when there's no negative marking.`]);
  if (o.incorrect >= Math.ceil(N * 0.3)) tips.push(['', 'Watch out for close distractors.', `<b>${o.incorrect}</b> answers were incorrect. Many entrance questions hinge on fine distinctions — read every option before committing, and review the explanations in the Answers tab.`]);
  const statsSub = subjArr.find(s => /Statistics|Research/i.test(s.name));
  if (statsSub && statsSub.acc < 60) tips.push(['warn', 'Strengthen Statistics & Research Methodology.', 'Revise key numerical rules (e.g., the 68–95–99.7 rule) and validity/reliability concepts, and practise calculation-based items.']);
  if (!tips.length) tips.push(['pos', 'Balanced performance.', 'Your results are steady across subjects. Keep practising full-length papers to build stamina and consistency.']);

  $('tips').innerHTML = tips.map(([cls, h, b]) => `
    <div class="tip ${cls}">
      <span class="t-ic">${cls === 'pos'
        ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--good)" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg>'
        : cls === 'warn'
        ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2"><path d="M12 8v5M12 17h0M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>'
        : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h0"/></svg>'}</span>
      <span class="t-body"><b>${h}</b> ${b}</span>
    </div>`).join('');
}

/* ---------------- Charts (hand-drawn) ---------------- */
function drawScoreRing(pct) {
  const svg = $('scoreRing');
  const cx = 84, cy = 84, r = 72, C = 2 * Math.PI * r;
  const col = pct >= 80 ? 'var(--good)' : pct >= 50 ? 'var(--brand)' : pct >= 30 ? 'var(--accent)' : 'var(--bad)';
  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="13"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="13" stroke-linecap="round"
      stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 ${cx} ${cy})">
      <animate attributeName="stroke-dashoffset" from="${C}" to="${C * (1 - pct / 100)}" dur="0.9s" fill="freeze" calcMode="spline" keySplines="0.2 0.7 0.3 1"/>
    </circle>`;
}

function drawDonut(correct, incorrect, unanswered) {
  const svg = $('donut');
  const total = correct + incorrect + unanswered || 1;
  const cx = 65, cy = 65, r = 46, sw = 20, C = 2 * Math.PI * r;
  const segs = [[correct, 'var(--good)'], [incorrect, 'var(--bad)'], [unanswered, 'var(--unans)']];
  let offset = 0;
  let html = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="${sw}"/>`;
  segs.forEach(([val, col]) => {
    if (val <= 0) return;
    const len = val / total * C;
    html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}"
      stroke-dasharray="${len - 2} ${C - len + 2}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"/>`;
    offset += len;
  });
  const big = Math.max(correct, incorrect, unanswered);
  html += `<text x="${cx}" y="${cy - 3}" text-anchor="middle" font-family="var(--font-mono)" font-size="24" font-weight="700" fill="var(--ink)">${correct}</text>`;
  html += `<text x="${cx}" y="${cy + 15}" text-anchor="middle" font-family="var(--font-body)" font-size="10" fill="var(--muted)">of ${total} correct</text>`;
  svg.innerHTML = html;
}

/* ---------------- Answers review ---------------- */
let curFilter = 'all', curSubject = 'all';

function buildSubjectFilter(subjects) {
  const sel = $('subjectFilter');
  sel.innerHTML = '<option value="all">All subjects</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
  sel.addEventListener('change', () => { curSubject = sel.value; renderReview(curFilter, curSubject); });
}
function updateFilterCounts(c, i, u) {
  $('cAll').textContent = `(${N})`;
  $('cCorrect').textContent = `(${c})`;
  $('cIncorrect').textContent = `(${i})`;
  $('cSkipped').textContent = `(${u})`;
}
document.querySelectorAll('.fchip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.fchip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    curFilter = chip.dataset.filter;
    renderReview(curFilter, curSubject);
  });
});

function statusOf(i) {
  if (answers[i] === null) return 'skipped';
  return answers[i] === QUESTIONS[i].correctAnswer ? 'correct' : 'incorrect';
}

function renderReview(filter, subject) {
  const list = $('revList');
  const items = QUESTIONS.map((q, i) => ({ q, i, st: statusOf(i) }))
    .filter(x => (filter === 'all' || x.st === filter) && (subject === 'all' || x.q.subject === subject));

  if (!items.length) { list.innerHTML = `<div class="empty-note" style="padding:30px;text-align:center">No questions match this filter.</div>`; return; }

  list.innerHTML = items.map(({ q, i, st }) => {
    const yourAns = answers[i];
    const pill = st === 'correct' ? 'Correct' : st === 'incorrect' ? 'Incorrect' : 'Not answered';
    const opts = q.options.map((opt, idx) => {
      let cls = '', flag = '';
      if (idx === q.correctAnswer) { cls = 'correct'; flag = 'Correct answer'; }
      if (idx === yourAns && idx !== q.correctAnswer) { cls = 'wrong'; flag = 'Your answer'; }
      if (idx === yourAns && idx === q.correctAnswer) { flag = 'Your answer ✓'; }
      return `<div class="rev-opt ${cls}"><span class="ro-key">${'ABCD'[idx]}</span><span>${opt}</span>${flag ? `<span class="ro-flag">${flag}</span>` : ''}</div>`;
    }).join('');
    return `
      <div class="rev-card">
        <div class="rev-head">
          <span class="rev-qn ${st}">${i + 1}</span>
          <div class="rev-q">
            <div class="rq-tags">
              <span class="tag tag-subject">${q.subject}</span>
              <span class="tag tag-diff">${q.subtopic ? q.subtopic + ' · ' : ''}${q.difficulty}</span>
            </div>
            <div class="rq-text">${q.question}</div>
          </div>
          <span class="verdict-pill ${st}">${pill}</span>
        </div>
        <div class="rev-opts">${opts}</div>
        <div class="rev-expl">
          <div class="ex-h"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>Explanation</div>
          <div class="ex-b">${q.explanation}</div>
        </div>
      </div>`;
  }).join('');
}

/* ---------------- Results tabs ---------------- */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isAnalysis = tab.dataset.tab === 'analysis';
    $('panelAnalysis').hidden = !isAnalysis;
    $('panelAnswers').hidden = isAnalysis;
  });
});

/* ---------------- Retake ---------------- */
$('retakeBtn').addEventListener('click', () => {
  answers = new Array(N).fill(null);
  marked = new Array(N).fill(false);
  visited = new Array(N).fill(false);
  timeSpent = new Array(N).fill(0);
  current = 0; timeLeft = TEST_DURATION; submitted = false; qEnter = 0;
  resultScreen.hidden = true;
  document.querySelector('.tab[data-tab="analysis"]').click();
  startScreen.hidden = false;
  window.scrollTo(0, 0);
});

/* ---------------- Guard against accidental exit ---------------- */
window.addEventListener('beforeunload', e => {
  if (!submitted && !testScreen.hidden) { e.preventDefault(); e.returnValue = ''; }
});
