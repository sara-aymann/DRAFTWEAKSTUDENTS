/*
 * Mamdouh Student Monitor - screens.
 * Dashboard, Groups, Group page, Students, Student page.
 * Navigation uses the URL hash (#/, #/groups, #/students/S1001) so no server is needed.
 */
(function () {
  const RISK_LABEL = { high: 'High risk', watch: 'Watch', ok: 'On track' };
  const OFFICE_LABEL = { none: 'No booking', upcoming: 'Upcoming', attended: 'Attended', missed: 'Missed' };
  const SUBMISSION_LABEL = { submitted: 'Submitted', late: 'Late', missing: 'Missing' };
  const ATTENDANCE_LABEL = { present: 'Present', late: 'Late', absent: 'Absent' };

  const $ = (selector) => document.querySelector(selector);
  const view = $('#view');
  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (n) => (n === null || n === undefined ? '–' : Math.round(n) + '%');
  const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  let A = null; // the analysed data
  const ui = {
    dashGroup: 'all',
    stuGroup: 'all', stuStatus: 'all', stuWeak: 'all', stuSearch: '',
    secCurrent: null, secGroup: 'all', secShow: 'weak',
  };

  // ---------- small building blocks ----------

  const statusBadge = (risk) =>
    `<span class="status risk-${risk}"><span class="dot" aria-hidden="true"></span>${RISK_LABEL[risk]}</span>`;

  function scoreCell(s) {
    if (s.score === null) return '<span class="muted">–</span>';
    return `<span class="score">${pct(s.score)}</span>
            <span class="meter" aria-hidden="true"><span class="fill risk-${s.risk}" style="width:${Math.round(s.score)}%"></span></span>`;
  }

  function studentTable(list, { showGroup = true } = {}) {
    const rows = list
      .map(
        (s) => `
        <tr class="risk-${s.risk}" data-href="#/students/${encodeURIComponent(s.student.id)}">
          <th scope="row"><a class="student-link" href="#/students/${encodeURIComponent(s.student.id)}">${esc(s.student.name)}</a></th>
          ${showGroup ? `<td>${esc(s.student.group)}</td>` : ''}
          <td>${scoreCell(s)}</td>
          <td>${s.mainIssue ? esc(s.mainIssue) : '<span class="muted">No issues</span>'}</td>
          <td>${statusBadge(s.risk)}</td>
        </tr>`
      )
      .join('');

    return `
      <div class="table-wrap">
        <table class="roster">
          <thead>
            <tr>
              <th scope="col">Student</th>
              ${showGroup ? '<th scope="col">Group</th>' : ''}
              <th scope="col">Score</th>
              <th scope="col">Main issue</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function summaryPanel(list) {
    const count = (risk) => list.filter((s) => s.risk === risk).length;
    const scores = list.map((s) => s.score).filter((s) => s !== null);
    const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return `
      <div class="summary">
        <div><span class="summary-value">${list.length}</span><span class="summary-label">Students</span></div>
        <div><span class="summary-value">${pct(average)}</span><span class="summary-label">Average score</span></div>
        <div><span class="summary-value">${count('high')}</span><span class="summary-label">${statusBadge('high')}</span></div>
        <div><span class="summary-value">${count('watch')}</span><span class="summary-label">${statusBadge('watch')}</span></div>
        <div><span class="summary-value">${count('ok')}</span><span class="summary-label">${statusBadge('ok')}</span></div>
      </div>`;
  }

  const groupOptions = (selected, allLabel) =>
    `<option value="all">${allLabel}</option>` +
    A.groups
      .map((g) => `<option value="${esc(g.name)}"${g.name === selected ? ' selected' : ''}>${esc(g.name)}</option>`)
      .join('');

  const pageHeader = (title, subtitle) =>
    `<header class="page-head"><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</header>`;

  // ---------- Dashboard ----------

  function sectionCards(list) {
    const total = list.length;
    return `<div class="section-cards">${A.sections
      .map((name) => {
        const weak = list.filter((s) => s.assignments.weakSections.includes(name)).length;
        const width = total ? (weak / total) * 100 : 0;
        return `
          <a class="section-card" href="#/sections/${encodeURIComponent(name)}">
            <span class="section-name">${esc(name)}</span>
            <span class="section-count">${weak} weak <small>of ${total}</small></span>
            <span class="meter" aria-hidden="true"><span class="fill lvl-high" style="width:${width}%"></span></span>
          </a>`;
      })
      .join('')}</div>`;
  }

  function dashboardResults() {
    const list = ui.dashGroup === 'all' ? A.students : A.students.filter((s) => s.student.group === ui.dashGroup);
    const attention = window.Monitor.byWeakest(list.filter((s) => s.risk !== 'ok'));
    return `
      ${summaryPanel(list)}

      <h2 class="block-title">Weak by section</h2>
      <p class="hint">Pick a section to see exactly who is struggling in it.</p>
      ${sectionCards(list)}

      <h2 class="block-title">Students needing attention</h2>
      <p class="hint">Sorted automatically, weakest students first.</p>
      ${
        attention.length
          ? studentTable(attention, { showGroup: true })
          : '<p class="empty">No students need attention right now. Everyone is at or above target.</p>'
      }`;
  }

  function viewDashboard() {
    view.innerHTML = `
      <header class="page-head page-head-row">
        <div>
          <h1>Dashboard</h1>
          <p>Identify struggling students before they fall behind.</p>
        </div>
        <label class="field">Group
          <select id="dash-group">${groupOptions(ui.dashGroup, 'All groups')}</select>
        </label>
      </header>
      <div id="dash-results">${dashboardResults()}</div>`;
  }

  // ---------- Groups ----------

  function viewGroups() {
    const cards = A.groups
      .map(
        (g) => `
        <a class="group-card" href="#/groups/${encodeURIComponent(g.name)}">
          <span class="group-name">Group ${esc(g.name)}</span>
          <span class="group-avg">${pct(g.average)}<small>average score</small></span>
          <span class="group-counts">
            <span>${plural(g.members.length, 'student')}</span>
            ${g.high ? `<span class="status risk-high"><span class="dot" aria-hidden="true"></span>${g.high} high risk</span>` : ''}
            ${g.watch ? `<span class="status risk-watch"><span class="dot" aria-hidden="true"></span>${g.watch} watch</span>` : ''}
            <span class="status risk-ok"><span class="dot" aria-hidden="true"></span>${g.ok} on track</span>
          </span>
        </a>`
      )
      .join('');

    view.innerHTML = `
      ${pageHeader('Groups', 'Compare how each group is doing.')}
      <div class="group-grid">${cards}</div>`;
  }

  function viewGroup(name) {
    const group = A.groups.find((g) => g.name === name);
    if (!group) return notFound('That group does not exist.');
    view.innerHTML = `
      <a class="back" href="#/groups">Back to groups</a>
      ${pageHeader('Group ' + group.name, plural(group.members.length, 'student'))}
      ${summaryPanel(group.members)}
      ${studentTable(window.Monitor.byWeakest(group.members), { showGroup: false })}`;
  }

  // ---------- Students ----------

  function studentsResults() {
    let list = A.students;
    if (ui.stuGroup !== 'all') list = list.filter((s) => s.student.group === ui.stuGroup);
    if (ui.stuStatus !== 'all') list = list.filter((s) => s.risk === ui.stuStatus);
    if (ui.stuWeak === 'any') list = list.filter((s) => s.assignments.weakSections.length > 0);
    else if (ui.stuWeak !== 'all') list = list.filter((s) => s.assignments.weakSections.includes(ui.stuWeak));
    if (ui.stuSearch) {
      const q = ui.stuSearch.toLowerCase();
      list = list.filter((s) => s.student.name.toLowerCase().includes(q) || s.student.id.toLowerCase().includes(q));
    }
    return list.length
      ? studentTable(window.Monitor.byWeakest(list))
      : '<p class="empty">No students match these filters. Change the group or status, or clear the search.</p>';
  }

  function viewStudents() {
    const statusOptions = [['all', 'All statuses'], ['high', 'High risk'], ['watch', 'Watch'], ['ok', 'On track']]
      .map(([value, label]) => `<option value="${value}"${value === ui.stuStatus ? ' selected' : ''}>${label}</option>`)
      .join('');

    const weakOptions =
      [['all', 'All students'], ['any', 'Weak in any section'], ...A.sections.map((n) => [n, 'Weak in ' + n])]
        .map(([value, label]) => `<option value="${esc(value)}"${value === ui.stuWeak ? ' selected' : ''}>${esc(label)}</option>`)
        .join('');

    view.innerHTML = `
      ${pageHeader('Students', 'Everyone in one list, weakest first.')}
      <div class="filters">
        <label class="field">Group <select id="stu-group">${groupOptions(ui.stuGroup, 'All groups')}</select></label>
        <label class="field">Status <select id="stu-status">${statusOptions}</select></label>
        <label class="field">Show <select id="stu-weak">${weakOptions}</select></label>
        <label class="field">Search <input id="stu-search" type="search" placeholder="Name or student ID" value="${esc(ui.stuSearch)}" autocomplete="off"></label>
      </div>
      <div id="stu-results">${studentsResults()}</div>`;
  }

  // ---------- Sections ----------

  // "Word Homework 1" inside the Word section is shown as "Homework 1".
  const shortName = (assignment, section) =>
    assignment.startsWith(section + ' ') ? assignment.slice(section.length + 1) : assignment;

  function sectionStatus(sec) {
    if (sec.status === 'weak') return '<span class="status risk-high"><span class="dot" aria-hidden="true"></span>Weak</span>';
    if (sec.status === 'okay') return '<span class="status risk-ok"><span class="dot" aria-hidden="true"></span>Okay</span>';
    return '<span class="muted">No grades</span>';
  }

  function officePill(oh) {
    const cls = { none: 'nodata', upcoming: 'wait', attended: 'okay', missed: 'weak' }[oh.state];
    return `<span class="pill ${cls}">${OFFICE_LABEL[oh.state]}</span>`;
  }

  function sectionResults() {
    const name = ui.secCurrent;
    const list = ui.secGroup === 'all' ? A.students : A.students.filter((s) => s.student.group === ui.secGroup);
    const rows = list.map((s) => ({ s, sec: s.assignments.sections.find((x) => x.name === name) }));
    const weak = rows.filter((r) => r.sec.status === 'weak');
    const graded = rows.map((r) => r.sec.average).filter((v) => v !== null);
    const average = graded.length ? graded.reduce((a, b) => a + b, 0) / graded.length : null;

    const shown = (ui.secShow === 'weak' ? weak : rows).sort(
      (a, b) => (a.sec.average === null) - (b.sec.average === null) || a.sec.average - b.sec.average
    );

    const body = shown
      .map(({ s, sec }) => {
        const grades = sec.assignments
          .map((a) =>
            a.submission === 'missing'
              ? `<li class="bad">${esc(shortName(a.name, name))}: Missing</li>`
              : `<li>${esc(shortName(a.name, name))}: ${a.grade}/${a.maxGrade}${a.submission === 'late' ? ' (late)' : ''}</li>`
          )
          .join('');
        const meter =
          sec.average === null
            ? ''
            : `<span class="meter" aria-hidden="true"><span class="fill risk-${sec.status === 'weak' ? 'high' : 'ok'}" style="width:${Math.round(sec.average)}%"></span></span>`;
        return `
          <tr class="sec-${sec.status}" data-href="#/students/${encodeURIComponent(s.student.id)}">
            <th scope="row"><a class="student-link" href="#/students/${encodeURIComponent(s.student.id)}">${esc(s.student.name)}</a></th>
            <td>${esc(s.student.group)}</td>
            <td><span class="score">${pct(sec.average)}</span>${meter}</td>
            <td><ul class="grade-list">${grades}</ul></td>
            <td>${officePill(s.officeHours)}</td>
            <td>${sectionStatus(sec)}</td>
          </tr>`;
      })
      .join('');

    const table = shown.length
      ? `<div class="table-wrap">
           <table class="roster">
             <thead><tr>
               <th scope="col">Student</th><th scope="col">Group</th>
               <th scope="col">${esc(name)} average</th><th scope="col">Assignments</th>
               <th scope="col">Office hours</th><th scope="col">Status</th>
             </tr></thead>
             <tbody>${body}</tbody>
           </table>
         </div>`
      : `<p class="empty">${
          ui.secShow === 'weak'
            ? 'Nobody is weak in ' + esc(name) + ' in this group. Switch to Everyone to see all grades.'
            : 'No students in this group.'
        }</p>`;

    return `
      <p class="section-summary"><strong>${weak.length} of ${rows.length}</strong> students are weak in ${esc(name)}.
        <span class="muted">Section average: ${pct(average)}.</span></p>
      ${table}`;
  }

  function viewSections(requested) {
    if (!A.sections.length) return notFound('There are no sections yet.');
    ui.secCurrent = A.sections.includes(requested) ? requested : A.sections[0];

    const tabs = A.sections
      .map(
        (n) => `<a class="tab" href="#/sections/${encodeURIComponent(n)}"${n === ui.secCurrent ? ' aria-current="page"' : ''}>${esc(n)}</a>`
      )
      .join('');

    view.innerHTML = `
      ${pageHeader('Sections', 'See who is weak in each part of the course.')}
      <nav class="tabs" aria-label="Sections">${tabs}</nav>
      <div class="filters">
        <label class="field">Group <select id="sec-group">${groupOptions(ui.secGroup, 'All groups')}</select></label>
        <label class="field">Show
          <select id="sec-show">
            <option value="weak"${ui.secShow === 'weak' ? ' selected' : ''}>Weak students only</option>
            <option value="all"${ui.secShow === 'all' ? ' selected' : ''}>Everyone</option>
          </select>
        </label>
      </div>
      <div id="sec-results">${sectionResults()}</div>`;
  }

  // ---------- Student page ----------

  function metricCard(title, value, sub, level, width) {
    const w = width === null || width === undefined ? 0 : Math.max(0, Math.min(100, Math.round(width)));
    return `
      <article class="metric">
        <h3>${title}</h3>
        <p class="metric-value">${value}</p>
        <p class="metric-sub">${sub}</p>
        <span class="meter" aria-hidden="true"><span class="fill lvl-${level}" style="width:${w}%"></span></span>
      </article>`;
  }

  function reasonsBlock(s, first) {
    const list = s.reasons;
    if (s.risk !== 'ok') {
      return `
        <section class="panel" aria-labelledby="why-title">
          <h2 id="why-title">Why is ${esc(first)} at risk?</h2>
          <ul class="reasons">
            ${list
              .map(
                (r) => `<li><span class="dot lvl-${r.level}" aria-hidden="true"></span>
                        <span class="visually-hidden">${r.level === 'high' ? 'Serious concern: ' : 'Concern: '}</span>${esc(r.text)}</li>`
              )
              .join('')}
          </ul>
        </section>`;
    }
    if (list.length) {
      return `
        <section class="panel" aria-labelledby="why-title">
          <h2 id="why-title">Worth keeping an eye on</h2>
          <ul class="reasons">
            ${list.map((r) => `<li><span class="dot lvl-${r.level}" aria-hidden="true"></span>${esc(r.text)}</li>`).join('')}
          </ul>
        </section>`;
    }
    return `
      <section class="panel" aria-labelledby="why-title">
        <h2 id="why-title">How is ${esc(first)} doing?</h2>
        <p>No concerns. Everything is at or above target.</p>
      </section>`;
  }

  function attendanceChips(summary) {
    if (!summary.total) return '<p class="muted">Nothing recorded yet.</p>';
    return `<ul class="chips">${summary.records
      .map((r) => `<li class="chip ${r.status}">${fmtDate(r.date)}: ${ATTENDANCE_LABEL[r.status]}</li>`)
      .join('')}</ul>`;
  }

  function sectionPill(section) {
    if (section.status === 'weak') return `<span class="pill weak"><b>Weak</b> ${pct(section.average)}</span>`;
    if (section.status === 'okay') return `<span class="pill okay">Okay ${pct(section.average)}</span>`;
    return '<span class="pill nodata">No grades</span>';
  }

  function viewStudent(id) {
    const s = A.students.find((x) => x.student.id === id);
    if (!s) return notFound('That student does not exist.');
    const first = s.student.name.split(' ')[0];
    const oh = s.officeHours;

    const cards = [
      metricCard('Assignments', pct(s.assignments.average),
        s.assignments.missing ? `${s.assignments.missing} of ${s.assignments.total} missing` : 'All submitted',
        s.assignments.level, s.assignments.average),
      metricCard('Exams', pct(s.exams.average),
        s.exams.count ? plural(s.exams.count, 'exam') : 'No exams yet', s.exams.level, s.exams.average),
      metricCard('Live attendance', pct(s.live.rate),
        `${s.live.attended} of ${s.live.total} sessions`, s.live.level, s.live.rate),
      metricCard('School attendance', pct(s.school.rate),
        `${s.school.attended} of ${s.school.total} days`, s.school.level, s.school.rate),
      metricCard('Office hours', oh.total ? `${oh.attended}/${oh.total}` : 'None',
        oh.total ? `${oh.attended} attended, ${oh.missed} missed, ${oh.upcoming} upcoming` : 'No sessions booked',
        'none', oh.total ? (oh.attended / oh.total) * 100 : 0),
    ].join('');

    const sectionsHtml = s.assignments.sections
      .map(
        (section) => `
        <div class="sub-block">
          <h3>${esc(section.name)} ${sectionPill(section)}</h3>
          <table class="mini">
            <thead><tr><th scope="col">Assignment</th><th scope="col">Due</th><th scope="col">Grade</th><th scope="col">Submission</th></tr></thead>
            <tbody>
              ${section.assignments
                .map(
                  (a) => `<tr>
                    <td>${esc(a.name)}</td>
                    <td>${fmtDate(a.dueDate)}</td>
                    <td>${a.grade === null ? '–' : a.grade + ' / ' + a.maxGrade}</td>
                    <td class="${a.submission === 'missing' ? 'bad' : ''}">${SUBMISSION_LABEL[a.submission]}</td>
                  </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>`
      )
      .join('');

    const examsHtml = s.exams.list.length
      ? `<table class="mini">
           <thead><tr><th scope="col">Exam</th><th scope="col">Date</th><th scope="col">Score</th></tr></thead>
           <tbody>${s.exams.list
             .map(
               (e) => `<tr><td>${esc(e.name)}</td><td>${fmtDate(e.date)}</td>
                       <td>${e.score === null ? 'Absent' : e.score + ' / ' + e.maxScore}</td></tr>`
             )
             .join('')}</tbody>
         </table>`
      : '<p class="muted">No exams yet.</p>';

    const officeHtml = oh.sessions.length
      ? `<table class="mini">
           <thead><tr><th scope="col">Date</th><th scope="col">Status</th></tr></thead>
           <tbody>${oh.sessions.map((o) => `<tr><td>${fmtDate(o.date)}</td><td>${OFFICE_LABEL[o.status]}</td></tr>`).join('')}</tbody>
         </table>`
      : '<p class="muted">This student has not booked any office hours.</p>';

    view.innerHTML = `
      <a class="back" href="#/students">Back to students</a>
      <header class="student-head">
        <div>
          <h1>${esc(s.student.name)}</h1>
          <p class="muted">Group ${esc(s.student.group)}, ID ${esc(s.student.id)}</p>
        </div>
        <div class="overall risk-${s.risk}">
          <span class="overall-score">${pct(s.score)}</span>
          ${statusBadge(s.risk)}
        </div>
      </header>

      <div class="metrics">${cards}</div>

      ${reasonsBlock(s, first)}

      <section class="panel" aria-labelledby="assign-title">
        <h2 id="assign-title">Assignments</h2>
        ${sectionsHtml}
      </section>

      <section class="panel" aria-labelledby="exam-title">
        <h2 id="exam-title">Exams</h2>
        ${examsHtml}
      </section>

      <section class="panel" aria-labelledby="att-title">
        <h2 id="att-title">Attendance</h2>
        <div class="sub-block"><h3>Live sessions</h3>${attendanceChips(s.live)}</div>
        <div class="sub-block"><h3>School days</h3>${attendanceChips(s.school)}</div>
      </section>

      <section class="panel" aria-labelledby="oh-title">
        <h2 id="oh-title">Office hours</h2>
        ${officeHtml}
      </section>`;
  }

  function notFound(message) {
    view.innerHTML = `${pageHeader('Not found', message)}<a class="back" href="#/">Go to the dashboard</a>`;
  }

  // ---------- routing ----------

  function route() {
    if (!A) return;
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    const page = parts[0] || 'dashboard';

    document.querySelectorAll('[data-nav]').forEach((link) => {
      const current = link.dataset.nav === (page === 'dashboard' ? 'dashboard' : page);
      if (current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (page === 'groups') parts[1] ? viewGroup(parts[1]) : viewGroups();
    else if (page === 'sections') viewSections(parts[1]);
    else if (page === 'students') parts[1] ? viewStudent(parts[1]) : viewStudents();
    else viewDashboard();

    window.scrollTo(0, 0);
  }

  // ---------- events ----------

  view.addEventListener('change', (e) => {
    if (e.target.id === 'dash-group') {
      ui.dashGroup = e.target.value;
      $('#dash-results').innerHTML = dashboardResults();
    } else if (e.target.id === 'stu-group') {
      ui.stuGroup = e.target.value;
      $('#stu-results').innerHTML = studentsResults();
    } else if (e.target.id === 'stu-weak') {
      ui.stuWeak = e.target.value;
      $('#stu-results').innerHTML = studentsResults();
    } else if (e.target.id === 'sec-group') {
      ui.secGroup = e.target.value;
      $('#sec-results').innerHTML = sectionResults();
    } else if (e.target.id === 'sec-show') {
      ui.secShow = e.target.value;
      $('#sec-results').innerHTML = sectionResults();
    } else if (e.target.id === 'stu-status') {
      ui.stuStatus = e.target.value;
      $('#stu-results').innerHTML = studentsResults();
    }
  });

  view.addEventListener('input', (e) => {
    if (e.target.id === 'stu-search') {
      ui.stuSearch = e.target.value.trim();
      $('#stu-results').innerHTML = studentsResults();
    }
  });

  // Clicking anywhere on a row opens the student (the name is also a real link for keyboards).
  view.addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a')) location.hash = row.dataset.href;
  });

  window.addEventListener('hashchange', route);

  // ---------- start ----------

  if (window.DATA_SOURCE_IS_SAMPLE) $('#sample-notice').hidden = false;

  window
    .loadLmsData()
    .then((data) => {
      A = window.Monitor.analyse(data);
      route();
    })
    .catch(() => {
      view.innerHTML = `${pageHeader('Could not load student data', 'Check js/data-source.js and reload the page.')}`;
    });
})();
