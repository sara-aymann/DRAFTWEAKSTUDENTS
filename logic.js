/*
 * Mamdouh Student Monitor - logic (no HTML in here).
 * Turns the raw LMS lists into one summary object per student:
 * score, risk level, the reasons behind it, and the main issue.
 */
(function () {
  const cfg = window.MONITOR_CONFIG;

  const avg = (list) => (list.length ? list.reduce((s, x) => s + x, 0) / list.length : null);
  const byDate = (a, b) => a.date.localeCompare(b.date);
  const round = (n) => Math.round(n);
  const dayDiff = (fromIso, toIso) =>
    Math.round((new Date(toIso + 'T00:00:00') - new Date(fromIso + 'T00:00:00')) / 86400000);

  // 'high' (red) | 'watch' (amber) | 'ok' (green) | 'none' (no data)
  function levelFor(value, target, highBelow) {
    if (value === null || value === undefined) return 'none';
    if (value < highBelow) return 'high';
    if (value < target) return 'watch';
    return 'ok';
  }

  // ---------- assignments ----------

  function assignmentScore(a) {
    if (a.submission === 'missing') return cfg.missingSubmissionCountsAsZero ? 0 : null;
    if (a.grade === null || a.grade === undefined || !a.maxGrade) return null;
    return (a.grade / a.maxGrade) * 100;
  }

  function analyseSection(name, assignments) {
    const scores = assignments.map(assignmentScore).filter((s) => s !== null);
    if (!scores.length) return { name, assignments, average: null, status: 'nodata' };
    const average = avg(scores);
    return { name, assignments, average, status: average < cfg.weakSectionBelowPercent ? 'weak' : 'okay' };
  }

  // ---------- attendance ----------

  const attendedShare = (records) =>
    records.length ? (records.filter((r) => r.status !== 'absent').length / records.length) * 100 : null;

  function attendanceSummary(records) {
    const sorted = [...records].sort(byDate);
    const total = sorted.length;
    const attended = sorted.filter((r) => r.status !== 'absent').length; // late still counts as attending

    let declining = false;
    let recent = null;
    if (total >= 6) {
      const last = sorted.slice(-3);
      const earlier = sorted.slice(0, -3);
      recent = { attended: last.filter((r) => r.status !== 'absent').length, total: last.length };
      declining = attendedShare(earlier) - attendedShare(last) >= cfg.decliningAttendanceDrop;
    }

    return { records: sorted, total, attended, rate: total ? (attended / total) * 100 : null, declining, recent };
  }

  // ---------- office hours ----------

  function officeHoursSummary(sessions) {
    const sorted = [...sessions].sort(byDate);
    const count = (status) => sorted.filter((s) => s.status === status).length;
    const past = sorted.filter((s) => s.status !== 'upcoming');
    const lastPast = past[past.length - 1] || null;

    // none | upcoming | attended | missed  (where the student stands right now)
    let state = 'none';
    if (sorted.length) state = count('upcoming') ? 'upcoming' : lastPast.status;

    return {
      sessions: sorted,
      total: sorted.length,
      attended: count('attended'),
      missed: count('missed'),
      upcoming: count('upcoming'),
      lastSessionDate: lastPast ? lastPast.date : null,
      state,
    };
  }

  // ---------- one student ----------

  function analyseStudent(student, data, sectionNames, asOf) {
    const mine = data.assignments.filter((a) => a.studentId === student.id);
    const sections = sectionNames.map((name) =>
      analyseSection(name, mine.filter((a) => a.section === name))
    );
    const weakSections = sections.filter((s) => s.status === 'weak').map((s) => s.name);
    const assignmentAvg = avg(mine.map(assignmentScore).filter((s) => s !== null));
    const missing = mine.filter((a) => a.submission === 'missing').length;

    const examList = (data.exams || []).filter((e) => e.studentId === student.id);
    const examAvg = avg(
      examList.filter((e) => e.score !== null && e.score !== undefined).map((e) => (e.score / e.maxScore) * 100)
    );

    const records = data.attendance.filter((r) => r.studentId === student.id);
    const live = attendanceSummary(records.filter((r) => r.type === 'live'));
    const school = attendanceSummary(records.filter((r) => r.type === 'school'));
    const officeHours = officeHoursSummary(data.officeHours.filter((o) => o.studentId === student.id));
    const daysInactive = student.lastActiveDate ? dayDiff(student.lastActiveDate, asOf) : null;

    // Overall score: weighted average of the parts that have data.
    const parts = [
      [assignmentAvg, cfg.weights.assignments],
      [examAvg, cfg.weights.exams],
      [live.rate, cfg.weights.liveAttendance],
      [school.rate, cfg.weights.schoolAttendance],
    ].filter(([value]) => value !== null);
    const weightSum = parts.reduce((s, [, w]) => s + w, 0);
    const score = weightSum ? parts.reduce((s, [v, w]) => s + v * w, 0) / weightSum : null;

    const levels = {
      assignments: levelFor(assignmentAvg, cfg.gradeTarget, cfg.gradeHighBelow),
      exams: levelFor(examAvg, cfg.gradeTarget, cfg.gradeHighBelow),
      live: levelFor(live.rate, cfg.attendanceTarget, cfg.attendanceHighBelow),
      school: levelFor(school.rate, cfg.attendanceTarget, cfg.attendanceHighBelow),
    };

    // ----- reasons: "Why is this student at risk?" -----
    // topic is used so the Main Issue column never repeats the same kind of problem twice.
    const reasons = [];
    const add = (level, topic, short, text, support = false) => reasons.push({ level, topic, short, text, support });

    if (missing > 0) {
      add(missing >= cfg.missingAssignmentsHighAt ? 'high' : 'watch', 'assignments', 'Missing assignments',
        `${missing} assignment${missing === 1 ? '' : 's'} missing`);
    }
    if (levels.assignments === 'high' || levels.assignments === 'watch') {
      add(levels.assignments, 'assignments', 'Low assignment grades',
        `Assignment average is ${round(assignmentAvg)}%, below the ${cfg.gradeTarget}% target`);
    }
    if (levels.exams === 'high' || levels.exams === 'watch') {
      add(levels.exams, 'exams', 'Low exam scores',
        `Exam average is ${round(examAvg)}%, below the ${cfg.gradeTarget}% target`);
    }
    if (levels.live === 'high' || levels.live === 'watch') {
      add(levels.live, 'attendance', 'Low live attendance',
        `Live attendance is ${round(live.rate)}%, below the ${cfg.attendanceTarget}% target`);
    }
    if (levels.school === 'high' || levels.school === 'watch') {
      add(levels.school, 'attendance', 'Low school attendance',
        `School attendance is ${round(school.rate)}%, below the ${cfg.attendanceTarget}% target`);
    }
    if (live.declining) {
      add('watch', 'attendance', 'Declining attendance',
        `Live attendance is declining: ${live.recent.attended} of the last ${live.recent.total} sessions attended`);
    }
    if (weakSections.length && (levels.assignments === 'ok' || levels.assignments === 'none')) {
      add('watch', 'sections', `Weak in ${weakSections.join(', ')}`, `Weak in ${weakSections.join(', ')}`);
    }
    if (daysInactive !== null && daysInactive >= cfg.inactiveAfterDays) {
      add(daysInactive >= cfg.inactiveHighAfterDays ? 'high' : 'watch', 'activity', 'No recent activity',
        `No activity in the LMS for ${daysInactive} days`);
    }

    // ----- status -----
    let risk = 'ok';
    if (score !== null) risk = score < cfg.highRiskBelow ? 'high' : score < cfg.watchBelow ? 'watch' : 'ok';
    if (risk === 'ok' && reasons.some((r) => r.level === 'high')) risk = 'watch'; // one serious red flag is enough

    // Help-seeking is only worth mentioning when there is already a concern.
    if (risk !== 'ok' || reasons.length) {
      if (officeHours.state === 'none') {
        add('watch', 'support', 'No office hours', 'Has not booked any office hours', true);
      } else if (officeHours.state === 'missed') {
        add('watch', 'support', 'Missed office hours', 'Missed the last office hour and has nothing booked', true);
      }
    }

    // Serious concerns first, keep the original order inside each level.
    const order = { high: 0, watch: 1 };
    reasons.sort((a, b) => order[a.level] - order[b.level]);

    // Main issue: the top two different kinds of problem.
    const topics = [];
    const shorts = [];
    reasons
      .filter((r) => !r.support)
      .forEach((r) => {
        if (shorts.length < 2 && !topics.includes(r.topic)) {
          topics.push(r.topic);
          shorts.push(r.short);
        }
      });

    return {
      student,
      score,
      risk,
      reasons,
      mainIssue: shorts.length ? shorts.join(' + ') : '',
      assignments: { average: assignmentAvg, missing, total: mine.length, sections, weakSections, level: levels.assignments, list: mine },
      exams: { average: examAvg, count: examList.length, list: examList, level: levels.exams },
      live: { ...live, level: levels.live },
      school: { ...school, level: levels.school },
      officeHours,
      daysInactive,
    };
  }

  // ---------- everything ----------

  // Weakest first (lowest score), students without a score last.
  function byWeakest(list) {
    return [...list].sort((a, b) => {
      if (a.score === null && b.score === null) return a.student.name.localeCompare(b.student.name);
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return a.score - b.score;
    });
  }

  function analyse(data) {
    const asOf = (data.meta && data.meta.asOf) || new Date().toISOString().slice(0, 10);

    const sectionNames = [];
    data.assignments.forEach((a) => {
      if (!sectionNames.includes(a.section)) sectionNames.push(a.section);
    });

    const students = data.students.map((s) => analyseStudent(s, data, sectionNames, asOf));

    const groupNames = [...new Set(students.map((s) => s.student.group))].sort();
    const groups = groupNames.map((name) => {
      const members = students.filter((s) => s.student.group === name);
      const scores = members.map((s) => s.score).filter((s) => s !== null);
      return {
        name,
        members,
        average: avg(scores),
        high: members.filter((s) => s.risk === 'high').length,
        watch: members.filter((s) => s.risk === 'watch').length,
        ok: members.filter((s) => s.risk === 'ok').length,
      };
    });

    return { asOf, sections: sectionNames, students, groups };
  }

  window.Monitor = { analyse, byWeakest };
})();
