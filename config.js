/*
 * Mamdouh Student Monitor - settings
 * Change these numbers to change how students are scored and flagged.
 */
window.MONITOR_CONFIG = {
  // How much each part counts toward the overall score (they should add up to 100).
  weights: {
    assignments: 35,
    exams: 35,
    liveAttendance: 15,
    schoolAttendance: 15,
  },

  // Overall score -> status
  highRiskBelow: 60, // below this = High risk (red)
  watchBelow: 70,    // below this = Watch (amber), otherwise On track (green)

  // Grades (assignments and exams), in percent
  gradeTarget: 70,     // below target = a concern (amber)
  gradeHighBelow: 55,  // below this = a serious concern (red)

  // Attendance (live and school), in percent
  attendanceTarget: 75,
  attendanceHighBelow: 60,

  // A section (Word, Excel...) is "weak" when the student's average in it is below this
  weakSectionBelowPercent: 75,

  // How many missing assignments count as a serious concern
  missingAssignmentsHighAt: 3,

  // No activity in the LMS for this many days
  inactiveAfterDays: 7,      // amber
  inactiveHighAfterDays: 14, // red

  // Live attendance is "declining" when the last 3 sessions are this many points
  // worse than the sessions before them
  decliningAttendanceDrop: 20,

  // true  = a missing assignment counts as 0 in the average
  // false = a missing assignment is ignored
  missingSubmissionCountsAsZero: true,
};
