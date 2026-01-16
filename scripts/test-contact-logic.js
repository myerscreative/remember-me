const { getBirthdayInfo, getRelationshipStatus } = require('./contact-utils');
const { format, addDays, subDays } = require('date-fns');

function runTests() {
  console.log('--- Running Contact Utility Tests (JS) ---\n');

  const today = new Date();
  
  // Test 1: Birthday Today
  const birthdayToday = format(today, 'yyyy-MM-dd');
  const bdayTodayInfo = getBirthdayInfo(birthdayToday);
  console.log('Test: Birthday Today');
  console.log('Expected: type: today, label: 🎂 Today!');
  console.log('Actual:  ', bdayTodayInfo?.type, bdayTodayInfo?.label);
  console.log(bdayTodayInfo?.type === 'today' ? '✅ PASS' : '❌ FAIL', '\n');

  // Test 2: Birthday in 15 days
  const in15Days = addDays(today, 15);
  const birthdaySoon = format(in15Days, 'yyyy-MM-dd');
  const bdaySoonInfo = getBirthdayInfo(birthdaySoon);
  console.log('Test: Birthday Soon (15 days)');
  console.log('Expected: type: upcoming');
  console.log('Actual:  ', bdaySoonInfo?.type, bdaySoonInfo?.label);
  console.log(bdaySoonInfo?.type === 'upcoming' ? '✅ PASS' : '❌ FAIL', '\n');

  // Test 3: Status Overdue
  const overdueDate = format(subDays(today, 40), 'yyyy-MM-dd');
  const overdueStatus = getRelationshipStatus(overdueDate, 'monthly');
  console.log('Test: Status Overdue (Monthly, last contact 40 days ago)');
  console.log('Expected: status: overdue');
  console.log('Actual:  ', overdueStatus.status, overdueStatus.label);
  console.log(overdueStatus.status === 'overdue' ? '✅ PASS' : '❌ FAIL', '\n');
}

try {
    runTests();
} catch (e) {
    console.error(e);
}
