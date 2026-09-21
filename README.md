# Mamdouh Student Monitor

Identify struggling students before they fall behind.

A teacher dashboard with four pages in the sidebar:

- **Dashboard**: "Weak by section" cards (click one to jump to that section) and "Students needing attention", sorted automatically with the weakest first.
- **Groups**: one card per group, click for that group's students.
- **Sections**: one tab per section (Word, Excel, PowerPoint, Theory Unit 1...). Shows who is weak in that section, with their average, each assignment grade, and office-hour status. Filter by group, or switch to Everyone.
- **Students**: everyone in one list, with filters (group, status, weak in a section) and search. Click a student for their page.

The student page shows the overall score and risk level, five cards (Assignments, Exams, Live attendance, School attendance, Office hours), and a "Why is this student at risk?" list.

It currently runs on sample data. The backend engineer connects the real LMS later.

## Run it

Open the `student-monitor` folder in VS Code and open `index.html` in a browser (double-click it in File Explorer, or use the Live Server extension). No install or build step.

## Project structure

```
student-monitor/
  index.html          page shell (sidebar + main area)
  css/styles.css      look and feel
  js/config.js        the rules: weights, targets, risk cutoffs
  js/sample-data.js   fake LMS data (also the data contract, see below)
  js/data-source.js   the ONE place where data is loaded
  js/logic.js         score, risk level, reasons, main issue
  js/app.js           the screens and navigation
```

## How a student is scored

Overall score = weighted average of four parts (weights are in `js/config.js`):

| Part | Weight | Comes from |
|---|---|---|
| Assignments | 35% | average of assignment grades (a missing assignment counts as 0) |
| Exams | 35% | average of exam scores |
| Live attendance | 15% | % of live sessions attended (late counts as attended) |
| School attendance | 15% | % of school days attended |

Status:

- **High risk**: score below 60%
- **Watch**: score below 70%, or any serious red flag even with a good score (for example 3 missing assignments, or no activity for 14+ days)
- **On track**: everything else

Office hours are shown but do not change the score. They are used as a reason ("Has not booked any office hours") for students who already have a concern.

"Main issue" is the top two different kinds of problem, for example "Missing assignments + Low exam scores".

## How a section is judged

For each student and section, the dashboard averages that section's assignment grades. Below `weakSectionBelowPercent` (default 75 in `js/config.js`) the student is **Weak** in that section. Example: Word Homework 1 = 8/10 and Word Homework 2 = 6/10 gives 70%, so Weak in Word.

Sections are not hard-coded. Whatever section names the LMS sends in `assignments[].section` become the tabs and cards automatically.

## Data needed from the LMS (for the backend engineer)

`loadLmsData()` in `js/data-source.js` must return one object with these lists:

| List | Fields | Notes |
|---|---|---|
| `meta` | `asOf` | today's date, used for the "no recent activity" check |
| `students` | `id`, `name`, `group`, `lastActiveDate` | `lastActiveDate` = last time the student did anything in the LMS |
| `assignments` | `id`, `studentId`, `name`, `section`, `grade`, `maxGrade`, `submission`, `dueDate` | `submission` is `submitted`, `late` or `missing`. `grade` is a number or `null` |
| `exams` | `id`, `studentId`, `name`, `score`, `maxScore`, `date` | `score` is `null` if the student was absent |
| `attendance` | `studentId`, `date`, `type`, `status` | `type` is `live` or `school`. `status` is `present`, `late` or `absent` |
| `officeHours` | `id`, `studentId`, `date`, `status` | `status` is `upcoming`, `attended` or `missed` |

Dates are ISO strings such as `2026-09-18`. See `js/sample-data.js` for a working example.

To connect the real LMS, replace the body of `loadLmsData()` with a `fetch` call and set `window.DATA_SOURCE_IS_SAMPLE = false`.
