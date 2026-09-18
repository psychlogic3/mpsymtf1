# PsychLogic — Foundational Mock 1

An interactive, timed mock-test web app for **NIMHANS, CIP, IHBAS & Other M.Psy (RCI)**
clinical-psychology entrance preparation. Pure static site — no backend, no build step.
Deploys as-is on GitHub Pages.

**Where Psychology Meets Strategy**

---

## What it does
- Access gate: student enters **name + access code** (40 codes included) before the test opens.
- **100 questions · 120 minutes**, timer starts on Start and auto-submits at zero.
- **Marking:** +1 for each correct answer, **−0.25 for each wrong answer**, 0 for unanswered.
- Question palette, mark-for-review, previous/next, manual submit — mobile & desktop.
- Results with two tabs: **Result Analysis** (marks, donut breakdown, subject-wise accuracy,
  strong/weak areas, personalised tips) and **Answers** (every question with your choice, the
  correct answer, and a detailed explanation; filterable).

## File structure
```
index.html              Page markup + script/style includes
css/style.css           All styling (light theme)
js/app.js               Test engine (timer, scoring, analysis, review)
data/questions.js       The 100 questions  ← edit questions here
data/access-codes.js    The 40 access codes ← edit codes here
assets/logo-full.png    Full PsychLogic logo (gate)
assets/logo-mark.png    Emblem (headers / favicon)
```

## Deploy on GitHub Pages
1. Create a new GitHub repository.
2. Upload **all files, keeping the folder structure** (`css/`, `js/`, `data/`, `assets/`).
3. Repo **Settings → Pages → Build and deployment → Source: “Deploy from a branch”**,
   pick `main` and `/ (root)`, Save.
4. Wait ~1 minute, then open the URL GitHub shows (e.g. `https://<user>.github.io/<repo>/`).
   The mock runs with no server.

## Editing content
- **Questions:** open `data/questions.js`. Each item:
  ```js
  { id, question, options: [a,b,c,d], correctAnswer: 0|1|2|3,
    subject, subtopic, explanation, difficulty }
  ```
  `correctAnswer` is the 0-based index (0 = first option). `question` may contain HTML
  (used for the match-the-column tables).
- **Access codes:** open `data/access-codes.js` and replace the list with your own.
- **Timer / marking:** top of `js/app.js` — `TEST_DURATION`, `POS_MARK`, `NEG_MARK`.

## Note on access codes (important)
This is a **static** site, so the codes live in the page and a determined visitor can read
them in the browser's source. They work well as a **sharing deterrent / enrolment key**, but
they are **not** server-enforced security and cannot enforce single-use or single-device on
their own. For true enforcement (one-time codes, device locking, anti-sharing) a small backend
is required — ask and it can be added.

---
© PsychLogic · Where Psychology Meets Strategy
