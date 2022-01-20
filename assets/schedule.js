dayjs().format();


function docs(id) {
  return 'assign.html?//docs.google.com/document/d/' + id + '/pub';
}

function lectureURL(googId) {
 return 'https://docs.google.com/a/berkeley.edu/presentation/d/' +
         googId +  '/edit?usp=sharing';
}


// Monday of the first week of classes
const SKIPPED_ITEM = 'SKIPPED';
const COUNTER = {
  lecture: 1,
  homework: 0,
  discussion: 1,
  lab: 1,
}
// TODO: Use a class?
const CS10_SCHEDULE = {
};

function addToSchedule(date, item) {
  if (!CS10_SCHEDULE[date]) {
    CS10_SCHEDULE[date] = {}
  }
  if (CS10_SCHEDULE[date][item.type]) {
    CS10_SCHEDULE[date][item.type].push(item);
  } else {
    CS10_SCHEDULE[date][item.type] = [item];
  }
  if (item.title == SKIPPED_ITEM) {
    CS10_SCHEDULE[date][item.type] = SKIPPED_ITEM;
  }
}

function Lecture(title, release_date, url, additional) {
  if (title == 'No Class') {
    return { type: 'lecture', title: 'No Class', date: release_date, classes: 'no-class'};
  }
  let lecture = {
    title: `${COUNTER.lecture}. ${title}`,
    date: release_date, url, additional, type: 'lecture'
  }
  COUNTER.lecture += 1;
  addToSchedule(release_date, lecture);
  return lecture;
}

function Assignment(title, release_date, spec_url, due_date, submission_url, additional, type) {
  let days = due_date.diff(release_date, 'day');
  let assignment = {
    title: `${COUNTER.homework}: ${title}`,
    date: release_date, url: spec_url, due_date, additional, days, submission_url, type
  }
  COUNTER.homework += 1;
  addToSchedule(release_date, assignment);
  return assignment;
}

function Homework(title, release_date, url, due_date, submission_url, additional) {
  return Assignment(title, release_date, url, due_date, submission_url, additional, 'homework');
}

function Project(title, release_date, url, due_date, submission_url, additional) {
  return Assignment(title, release_date, url, due_date, submission_url, additional, 'project');
}

// TODO: Add link to check off questions
// TODO: Add link to bCourses?
function Lab(title, release_date, url, due_date, additional) {
  if (title == 'No Lab') {
    return { type: 'lab', title: 'No Lab', date: release_date, classes: 'no-class'};
  }
  if (!due_date) {
    due_date = release_date.add(7, 'days');
  }
  let days = due_date.diff(release_date, 'day');
  let lab = {
    title: `${COUNTER.lab}. ${title}`,
    date: release_date, url, due_date, additional, days, type: 'lab'
  }
  COUNTER.lab += 1;
  addToSchedule(release_date, lab);
  return lab;
}

function Reading(readings, release_date, additional) {
  readings.forEach(reading => {
    if (!reading.status) {
      reading.status = 'required';
    }
  })
  function renderReadings(readings) {
    return `<ul>
      <li>${reading.map(renderReading).join('</li><li>')}</li>
    </ul>`;
  }
  function renderReading({ title, url, status }) {
    return `<a href="${url}" class="reading-${status}" target=_blank>${title}</a>`;
  }
  let reading = {
    content: renderReadings(readings), date: release_date, additional, type: 'reading'
  }
  addToSchedule(release_date, reading);
  return reading;
}

function Discussion(title, release_date, url, additional) {
  let discussion = {
    title: `${COUNTER.discussion}: ${title}`,
    url, release_date, additional, type: 'discussion'
  }
  addToSchedule(release_date, discussion);
  return discussion;
}

function GenerateDateIncrementor(start_date, skip_days) {
  // Return a function that returns the next date after start_date
  // incremented by skip_days, where skip_days is an array.
  // at the end of the array, the days cycle.
  // e.g. a Monday-Wednesdy schedule has skip_days = [2, 5]
  // Returns start_date the first time the function is called.
  let skip_days_index = 0;
  let next_date = start_date;
  return function() {
    let current_date = next_date;
    next_date = current_date.add(skip_days[skip_days_index], 'day');
    skip_days_index = (skip_days_index + 1) % skip_days.length;
    return current_date;
  }
}

function weekNumber(date, startDate) {
  // Return the number of weeks of firstWeek - date of the course in range [1, 17] else -1
  return Math.abs(startDate.week() - date.week()) + 1;
}

function renderIndividualItem(item) {
  if (item.content) {
    return item.content;
  }

  let base = `<a href="${item.url}" target=_blank>${item.url}</a>"`;
  if (item.due_date) {
    base += `<br><strong>Due: <time>${item.due_date}</time>`;
  }
  if (item.submision_url) {
    base += `(<a class="submission-link" aria-label="Submit ${item.title}" href="${item.submission_url}">Submit</a>)`
  }
  if (item.additional) {
    item += additional;
  }
  return base;
}


function render(item) {
  if (item.length > 1) {
    return `
      <ul>
        <li>${item.map(renderIndividualItem).join('</li><li>')}</li>
      </ul>
    `;
  }
  return renderIndividualItem(item[0]);
}

const MONDAY = 1;
const SUNDAY = 0;
const SATURDAY = 6;
const TYPE_ORDER = [
  'lecture',
  'reading',
  'lab',
  'discussion',
  'homework'
]
function renderSchedule(schedule, startDate, numWeeks, target) {
  dayjs.extend(dayjs_plugin_weekOfYear)
  // TODO: Assert startDate is a SUNDAY
  let scheduleTable = $(target);
  let week = 1;
  let currentDate = startDate;
  let now = dayjs();
  let row;
  while (week < numWeeks) {
    let dayOfWeek = currentDate.day();
    if (dayOfWeek == SATURDAY || dayOfWeek == SUNDAY) {
      continue;
    }
    let current = schedule[currentDate];
    week = weekNumber(currentDate, startDate);
    let rowClasses = week % 2 == 0 ? 'even' : 'odd';
    if (currentDate.isSame(now, 'day')) {
      rowClasses += ' today'
    }
    row = $(`<tr class="${rowClasses}">`);
    console.log(row);
    if (dayOfWeek == MONDAY) {
      row.append(`<td rowspan=5 clas="">${week}</td>`);
    }
    row.append(`<td>${currentDate.format('dd M/D')}</td>`);
    TYPE_ORDER.forEach(type => {
      if (!current && !current[type]) {
        row.append(`<td></td>`);
      } else {
        row.append(`<td class="schedule-${type}">${render(current[type])}</td>`);
      }
    });
    scheduleTable.append(row);
    console.log(row)
    currentDate = currentDate.add(1, 'day');
    console.log(currentDate)
  }
}

//////////////////////////////////////////////////
// Monday of the first week of classes
const FIRST_DAY = dayjs('2022-01-16');
const firstLecture = FIRST_DAY.add(1, 'day');
const firstLab = FIRST_DAY.add(2, 'days');
const firstDiscussion = FIRST_DAY.add(5, 'days');
const firstReading = firstLab;

const nextLecture = GenerateDateIncrementor(firstLecture, [2, 7]);
const nextLab = GenerateDateIncrementor(firstLab, [2, 7]);
const nextDiscussion = GenerateDateIncrementor(firstDiscussion, [7]);
const nextReading = GenerateDateIncrementor(firstReading, [7]);

// Monday 1/17
Lecture('No Class', nextLecture());
Lab('No Lab', nextLab());
Lecture('Welcome to CS10!', nextLecture(), 'https://TODO');
Lab('Intro to Snap!', nextLab(), 'https://cs10.org/bjc-r/...');
Discussion('Welcome to CS10', nextDiscussion());
Homework('Introduce Yourself', dayjs('2022-01-19'), 'https://gradesope.com', dayjs('2022-01-22'))

renderSchedule(CS10_SCHEDULE, FIRST_DAY, 17);
