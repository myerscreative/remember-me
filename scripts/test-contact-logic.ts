import { getBirthdayInfo, getRelationshipStatus, Contact } from '../lib/contacts/contact-utils';
import { format, addDays, subDays } from 'date-fns';

function runTests() {
  console.log('--- Running Contact Utility Tests ---\n');

  // Test 1: Birthday Today
  const today = new Date();
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
  console.log('Expected: type: upcoming, label matches date');
  console.log('Actual:  ', bdaySoonInfo?.type, bdaySoonInfo?.label);
  console.log(bdaySoonInfo?.type === 'upcoming' ? '✅ PASS' : '❌ FAIL', '\n');

  // Test 3: Birthday in 40 days
  const in40Days = addDays(today, 40);
  const birthdayFuture = format(in40Days, 'yyyy-MM-dd');
  const bdayFutureInfo = getBirthdayInfo(birthdayFuture);
  console.log('Test: Birthday Future (40 days)');
  console.log('Expected: type: distant');
  console.log('Actual:  ', bdayFutureInfo?.type, bdayFutureInfo?.label);
  console.log(bdayFutureInfo?.type === 'distant' ? '✅ PASS' : '❌ FAIL', '\n');

  // Test 4: Status Overdue
  const overdueDate = format(subDays(today, 40), 'yyyy-MM-dd');
  const overdueStatus = getRelationshipStatus(overdueDate, 'monthly');
  console.log('Test: Status Overdue (Monthly, last contact 40 days ago)');
  console.log('Expected: status: overdue');
  console.log('Actual:  ', overdueStatus.status, overdueStatus.label);
  console.log(overdueStatus.status === 'overdue' ? '✅ PASS' : '❌ FAIL', '\n');

  // Test 5: Status On Track
  const recentDate = format(subDays(today, 5), 'yyyy-MM-dd');
  const trackStatus = getRelationshipStatus(recentDate, 'monthly');
  console.log('Test: Status On Track (Monthly, last contact 5 days ago)');
  console.log('Expected: status: on-track');
  console.log('Actual:  ', trackStatus.status, trackStatus.label);
  console.log(trackStatus.status === 'on-track' ? '✅ PASS' : '❌ FAIL', '\n');

  // Test 6: Status Due Soon
  const dueSoonDate = format(subDays(today, 25), 'yyyy-MM-dd');
  const dueSoonStatus = getRelationshipStatus(dueSoonDate, 'monthly');
  console.log('Test: Status Due Soon (Monthly, last contact 25 days ago)');
  console.log('Expected: status: due-soon');
  console.log('Actual:  ', dueSoonStatus.status, dueSoonStatus.label);
  console.log(dueSoonStatus.status === 'due-soon' ? '✅ PASS' : '❌ FAIL', '\n');
}

runTests();
