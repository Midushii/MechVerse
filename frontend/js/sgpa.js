// Grading scale — unchanged from before. Used to auto-detect grade from marks.
const GRADE_SCALE = [
  { min: 93, max: 100, range: "93 – 100", grade: "A+", points: 10 },
  { min: 85, max: 92,  range: "85 – 92",  grade: "A",  points: 9 },
  { min: 77, max: 84,  range: "77 – 84",  grade: "B+", points: 8 },
  { min: 69, max: 76,  range: "69 – 76",  grade: "B",  points: 7 },
  { min: 61, max: 68,  range: "61 – 68",  grade: "C+", points: 6 },
  { min: 53, max: 60,  range: "53 – 60",  grade: "C",  points: 5 },
  { min: 45, max: 52,  range: "45 – 52",  grade: "D",  points: 4 },
  { min: 0,  max: 44,  range: "Under 45", grade: "F",  points: 0 },
];

// Fixed subject list per semester, each with its default credit value.
const SUBJECTS_BY_SEMESTER = {
  "1": [
    { name: "Applied Mathematics", credits: 4 },
    { name: "Applied Physics", credits: 4 },
    { name: "Elements of Mechanical Engineering", credits: 4 },
    { name: "Programming Fundamentals", credits: 3 },
    { name: "Workshop Practice", credits: 3 },
    { name: "Communication Skills", credits: 3 },
  ],
  "2": [
    { name: "Probability and Statistics", credits: 4 },
    { name: "Environmental Sciences", credits: 4 },
    { name: "Engineering Mechanics", credits: 4 },
    { name: "Introduction to Data Science", credits: 3 },
    { name: "Engineering Graphics and CAD Modelling", credits: 3 },
    { name: "Soft Skills and Personality Development", credits: 3 },
  ],
};

const CREDIT_OPTIONS = [1, 2, 3, 4];

let rowCount = 0;

function gradeForMarks(marks) {
  return GRADE_SCALE.find(g => marks >= g.min && marks <= g.max) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

function currentSemester() {
  return document.getElementById('semesterSelect').value;
}

// Which subjects are already picked in OTHER rows (for duplicate prevention).
function pickedSubjects(excludeRowId) {
  const picked = [];
  document.querySelectorAll('[data-row]').forEach(row => {
    const id = row.dataset.row;
    if (String(id) === String(excludeRowId)) return;
    const val = row.querySelector(`[data-subject-select="${id}"]`).value;
    if (val) picked.push(val);
  });
  return picked;
}

function initSgpaCalculator() {
  document.getElementById('semesterSelect').onchange = onSemesterChange;
  document.getElementById('addRowBtn').onclick = () => addSubjectRow();
  document.getElementById('calcBtn').onclick = calculateSgpa;
  renderGradeTable();
  initSgpaCollapsibles();
  setError('');
  document.getElementById('subjectRows').innerHTML = '';
  document.getElementById('addRowBtn').disabled = true;
}

// Grading Regulation and SGPA Formula sections start open every time the
// page is visited. Each has its own fold/unfold button; the main
// calculator card above has no toggle and always stays open.
function initSgpaCollapsibles() {
  setupSgpaToggle('gradeToggleBtn', 'gradeCardWrap');
  setupSgpaToggle('formulaToggleBtn', 'formulaCardWrap');
}

function setupSgpaToggle(btnId, wrapId) {
  const btn = document.getElementById(btnId);
  const wrap = document.getElementById(wrapId);
  if (!btn || !wrap) return;
  btn.addEventListener('click', () => {
    const collapsed = wrap.classList.toggle('sgpa-collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
  });
}

function onSemesterChange() {
  // Changing semester clears existing rows, since subjects differ per semester.
  document.getElementById('subjectRows').innerHTML = '';
  setError('');
  document.getElementById('resultCard').classList.add('hidden');
  const sem = currentSemester();
  document.getElementById('addRowBtn').disabled = !sem;
  if (sem) {
    addSubjectRow();
    addSubjectRow();
  }
}

function subjectOptionsHtml(rowId, selectedValue) {
  const sem = currentSemester();
  const subjects = SUBJECTS_BY_SEMESTER[sem] || [];
  const already = pickedSubjects(rowId);
  let html = `<option value="">Select subject</option>`;
  subjects.forEach(s => {
    const disabled = already.includes(s.name) && s.name !== selectedValue;
    const selected = s.name === selectedValue ? 'selected' : '';
    html += `<option value="${s.name}" ${disabled ? 'disabled' : ''} ${selected}>${s.name}${disabled ? ' (already added)' : ''}</option>`;
  });
  return html;
}

// After any row's subject changes, refresh every row's dropdown options so
// duplicates get disabled everywhere (not just in the row that just changed).
function refreshAllSubjectDropdowns() {
  document.querySelectorAll('[data-row]').forEach(row => {
    const id = row.dataset.row;
    const select = row.querySelector(`[data-subject-select="${id}"]`);
    const current = select.value;
    select.innerHTML = subjectOptionsHtml(id, current);
  });
}

function addSubjectRow() {
  rowCount++;
  const id = rowCount;
  const row = document.createElement('tr');
  row.dataset.row = id;
  row.innerHTML = `
    <td>
      <select data-subject-select="${id}" class="sgpa-select">${subjectOptionsHtml(id, '')}</select>
    </td>
    <td><input type="number" min="0" max="100" class="mono sgpa-marks-input" placeholder="0 - 100" data-subject-marks="${id}" /></td>
    <td>
      <select data-subject-credits="${id}" class="sgpa-credits-select">
        ${CREDIT_OPTIONS.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
    </td>
    <td class="mono sgpa-grade-cell" data-grade-cell="${id}">–</td>
    <td class="mono sgpa-point-cell" data-point-cell="${id}">–</td>
    <td><button class="sgpa-remove-btn" type="button" data-remove-row="${id}">✕</button></td>`;
  document.getElementById('subjectRows').appendChild(row);

  const subjectSelect = row.querySelector(`[data-subject-select="${id}"]`);
  const creditsSelect = row.querySelector(`[data-subject-credits="${id}"]`);
  const marksInput = row.querySelector(`[data-subject-marks="${id}"]`);
  const gradeCell = row.querySelector(`[data-grade-cell="${id}"]`);
  const pointCell = row.querySelector(`[data-point-cell="${id}"]`);

  // Selecting a subject auto-fills its default credits, and refreshes
  // every row's dropdown so the picked subject is disabled elsewhere.
  subjectSelect.addEventListener('change', () => {
    const sem = currentSemester();
    const subj = (SUBJECTS_BY_SEMESTER[sem] || []).find(s => s.name === subjectSelect.value);
    if (subj) creditsSelect.value = String(subj.credits);
    refreshAllSubjectDropdowns();
    setError('');
  });

  // Live grade/grade-point on every keystroke, plus marks validation.
  marksInput.addEventListener('input', () => {
    const raw = marksInput.value;
    if (raw === '') {
      gradeCell.textContent = '–';
      pointCell.textContent = '–';
      setError('');
      return;
    }
    const marks = Number(raw);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      gradeCell.textContent = '–';
      pointCell.textContent = '–';
      setError('Marks must be a number between 0 and 100.');
      return;
    }
    setError('');
    const g = gradeForMarks(marks);
    gradeCell.textContent = g.grade;
    pointCell.textContent = g.points;
  });

  row.querySelector(`[data-remove-row="${id}"]`).onclick = () => {
    row.remove();
    refreshAllSubjectDropdowns();
  };
}

function setError(msg) {
  const box = document.getElementById('errorBox');
  if (!msg) {
    box.classList.add('hidden');
    box.textContent = '';
  } else {
    box.classList.remove('hidden');
    box.textContent = msg;
  }
}

function calculateSgpa() {
  if (!currentSemester()) {
    setError('Please select a semester first.');
    return;
  }

  let totalCredits = 0;
  let totalPoints = 0;
  let hasInvalid = false;
  let hasAny = false;

  document.querySelectorAll('[data-row]').forEach(row => {
    const id = row.dataset.row;
    const subject = row.querySelector(`[data-subject-select="${id}"]`).value;
    const marksVal = row.querySelector(`[data-subject-marks="${id}"]`).value;
    const credits = Number(row.querySelector(`[data-subject-credits="${id}"]`).value) || 0;

    if (marksVal === '' && !subject) return; // fully empty row, skip silently

    const marks = Number(marksVal);
    if (marksVal === '' || isNaN(marks) || marks < 0 || marks > 100) {
      hasInvalid = true;
      return;
    }
    hasAny = true;
    const points = gradeForMarks(marks).points;
    totalCredits += credits;
    totalPoints += credits * points;
  });

  if (hasInvalid) {
    setError('Please fix invalid marks (must be between 0 and 100) before calculating.');
    return;
  }
  if (!hasAny || totalCredits === 0) {
    setError('Please enter marks for at least one subject.');
    return;
  }

  setError('');
  const resultCard = document.getElementById('resultCard');
  document.getElementById('sgpaResult').textContent = (totalPoints / totalCredits).toFixed(2);
  resultCard.classList.remove('hidden');
}

function renderGradeTable() {
  const card = document.getElementById('gradeTableCard');
  card.innerHTML = `
    <table class="sgpa-grade-table">
      <thead>
        <tr><th>Marks Range</th><th>Letter Grade</th><th>Grade Point</th></tr>
      </thead>
      <tbody>
        ${GRADE_SCALE.map(g => `
          <tr>
            <td class="mono">${g.range}</td>
            <td><span class="sgpa-grade-pill">${g.grade}</span></td>
            <td class="mono">${g.points}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}