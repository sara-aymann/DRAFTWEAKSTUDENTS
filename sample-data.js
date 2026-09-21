/*
 * Sample data that pretends to come from the LMS.
 *
 * The OUTPUT of this file (window.SAMPLE_LMS_DATA) is the data contract the
 * backend engineer must match:
 *
 *   meta         { asOf }                       the "today" used for inactivity checks (ISO date)
 *   students     { id, name, group, lastActiveDate }
 *   assignments  { id, studentId, name, section, grade, maxGrade, submission, dueDate }
 *                  submission: "submitted" | "late" | "missing"   grade: number or null
 *   exams        { id, studentId, name, score, maxScore, date }   score: number or null (absent)
 *   attendance   { studentId, date, type, status }
 *                  type:   "live" | "school"
 *                  status: "present" | "late" | "absent"
 *   officeHours  { id, studentId, date, status }
 *                  status: "upcoming" | "attended" | "missed"
 *
 * Dates are ISO strings such as "2026-09-18".
 * The code below only builds those lists from a compact table so this file stays short.
 */
(function () {
  const AS_OF = '2026-09-21';
  const MAX = 10;

  const SECTIONS = [
    { name: 'Word', items: [['Word Homework 1', '2026-09-03'], ['Word Homework 2', '2026-09-10']] },
    { name: 'Excel', items: [['Excel Homework 1', '2026-09-08'], ['Excel Homework 2', '2026-09-15']] },
    { name: 'PowerPoint', items: [['PowerPoint Homework 1', '2026-09-12']] },
    { name: 'Theory Unit 1', items: [['Theory Unit 1 Quiz', '2026-09-05']] },
    { name: 'Theory Unit 2', items: [['Theory Unit 2 Quiz', '2026-09-17']] },
  ];

  const EXAMS = [['Exam 1', '2026-09-06'], ['Exam 2', '2026-09-17']];

  const LIVE_DAYS = ['2026-08-25', '2026-08-27', '2026-09-01', '2026-09-03', '2026-09-08', '2026-09-10', '2026-09-15', '2026-09-17'];
  const SCHOOL_DAYS = ['2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17'];

  // grades: one array per section, in the same order as SECTIONS (Word, Excel, PowerPoint, Theory 1, Theory 2).
  //   number = graded, null = missing, { grade, late: true } = submitted late
  // exams:   score out of 100 per exam
  // live / school: one letter per day. P present, L late, A absent
  // oh: office hours [date, status]
  const STUDENTS = [
    // ---- G1 ----
    { id: 'S1001', name: 'Ahmed Mohamed', group: 'G1', active: '2026-09-12',
      grades: [[8, 6], [7, null], [5], [8], [null]], exams: [50, 40],
      live: 'PPPPAPAA', school: 'PPAPPPPAPP',
      oh: [['2026-09-10', 'attended'], ['2026-09-15', 'missed'], ['2026-09-25', 'upcoming']] },
    { id: 'S1002', name: 'Sara Mohamed', group: 'G1', active: '2026-09-20',
      grades: [[9, 8], [5, 6], [9], [6], [4]], exams: [58, 62],
      live: 'PPPPPPAP', school: 'PPPPPPPPPP',
      oh: [['2026-09-15', 'missed'], ['2026-09-25', 'upcoming']] },
    { id: 'S1003', name: 'Omar Hassan', group: 'G1', active: '2026-09-19',
      grades: [[6, 7], [8, 9], [8], [9], [8]], exams: [72, 70],
      live: 'PPAAPAAP', school: 'PPAPPAPPAP',
      oh: [['2026-09-18', 'attended']] },
    { id: 'S1014', name: 'Jana Wael', group: 'G1', active: '2026-09-21',
      grades: [[9, 10], [9, 9], [10], [10], [9]], exams: [88, 92],
      live: 'PPPPPPPP', school: 'PPPPPPPPPP', oh: [] },
    { id: 'S1015', name: 'Ziad Osama', group: 'G1', active: '2026-09-19',
      grades: [[7, 8], [7, 6], [7], [7], [8]], exams: [68, 65],
      live: 'PPPPPPLP', school: 'PPPPPPPPAP', oh: [] },

    // ---- G2 ----
    { id: 'S1004', name: 'Mariam Ali', group: 'G2', active: '2026-09-18',
      grades: [[8, null], [null, null], [null], [8], [9]], exams: [60, 55],
      live: 'PPPPPPPP', school: 'PPPPPPPPPP',
      oh: [['2026-09-25', 'upcoming']] },
    { id: 'S1005', name: 'Youssef Tarek', group: 'G2', active: '2026-09-05',
      grades: [[7, null], [6, 5], [null], [7], [null]], exams: [45, 40],
      live: 'PAAPAAAA', school: 'PPAAPAPAAP', oh: [] },
    { id: 'S1006', name: 'Nour Khaled', group: 'G2', active: '2026-09-21',
      grades: [[10, 9], [8, 9], [9], [9], [10]], exams: [90, 94],
      live: 'PPPPPPPP', school: 'PPPPPPPPPP', oh: [] },
    { id: 'S1007', name: 'Karim Sameh', group: 'G2', active: '2026-09-14',
      grades: [[5, 4], [7, 6], [6], [8], [8]], exams: [50, 48],
      live: 'PAPAPAPA', school: 'PPAPAPPPAP',
      oh: [['2026-09-10', 'missed'], ['2026-09-15', 'missed']] },
    { id: 'S1008', name: 'Hana Mostafa', group: 'G2', active: '2026-09-20',
      grades: [[8, 8], [8, 7], [8], [9], [8]], exams: [78, 80],
      live: 'PPPPPLPP', school: 'PPPPPPPPPP',
      oh: [['2026-09-15', 'attended']] },

    // ---- G3 ----
    { id: 'S1009', name: 'Mahmoud Ibrahim', group: 'G3', active: '2026-09-20',
      grades: [[9, 9], [4, 5], [9], [8], [7]], exams: [65, 60],
      live: 'PPPPPPPA', school: 'PPPPPPPPPP', oh: [] },
    { id: 'S1010', name: 'Laila Hassan', group: 'G3', active: '2026-09-21',
      grades: [[9, 8], [9, 10], [10], [10], [9]], exams: [85, 88],
      live: 'PPPPPPPP', school: 'PPPPPPPPPP', oh: [] },
    { id: 'S1011', name: 'Tamer Adel', group: 'G3', active: '2026-09-17',
      grades: [[6, 6], [6, 7], [5], [5], [8]], exams: [58, 52],
      live: 'PPAPAPPA', school: 'PPPAPAPPPP',
      oh: [['2026-09-10', 'attended'], ['2026-09-25', 'upcoming']] },
    { id: 'S1012', name: 'Salma Nabil', group: 'G3', active: '2026-09-21',
      grades: [[9, 8], [8, 9], [9], [9], [{ grade: 8, late: true }]], exams: [80, 76],
      live: 'PPPPPPPP', school: 'PPPPPPPPPP', oh: [] },
    { id: 'S1013', name: 'Adam Fathy', group: 'G3', active: '2026-09-02',
      grades: [[9, 9], [8, 9], [9], [9], [8]], exams: [82, 80],
      live: 'PPPPPPPP', school: 'PPPPPPPPPP', oh: [] },
  ];

  const STATUS = { P: 'present', L: 'late', A: 'absent' };

  function build() {
    const data = {
      meta: { asOf: AS_OF },
      students: [], assignments: [], exams: [], attendance: [], officeHours: [],
    };

    STUDENTS.forEach((s) => {
      data.students.push({ id: s.id, name: s.name, group: s.group, lastActiveDate: s.active });

      SECTIONS.forEach((section, si) => {
        section.items.forEach(([name, dueDate], ai) => {
          const raw = s.grades[si][ai];
          let grade = null;
          let submission = 'missing';
          if (typeof raw === 'number') {
            grade = raw;
            submission = 'submitted';
          } else if (raw && typeof raw === 'object') {
            grade = raw.grade;
            submission = raw.late ? 'late' : 'submitted';
          }
          data.assignments.push({
            id: `${s.id}-A${si}${ai}`, studentId: s.id, name, section: section.name,
            grade, maxGrade: MAX, submission, dueDate,
          });
        });
      });

      EXAMS.forEach(([name, date], i) => {
        data.exams.push({ id: `${s.id}-E${i + 1}`, studentId: s.id, name, score: s.exams[i], maxScore: 100, date });
      });

      s.live.split('').forEach((letter, i) => {
        data.attendance.push({ studentId: s.id, date: LIVE_DAYS[i], type: 'live', status: STATUS[letter] });
      });
      s.school.split('').forEach((letter, i) => {
        data.attendance.push({ studentId: s.id, date: SCHOOL_DAYS[i], type: 'school', status: STATUS[letter] });
      });

      s.oh.forEach(([date, status], i) => {
        data.officeHours.push({ id: `OH-${s.id}-${i + 1}`, studentId: s.id, date, status });
      });
    });

    return data;
  }

  window.SAMPLE_LMS_DATA = build();
})();
