export interface MenuItem {
  label: string;
  iconName: string;
  path: string;
}

export const adminMenu: MenuItem[] = [
  { label: 'Dashboard', iconName: 'apps-outline', path: '/(app)' },
  { label: 'Students', iconName: 'people-outline', path: '/(app)/students' },
  { label: 'Teachers', iconName: 'person-outline', path: '/(app)/teachers' },
  { label: 'Classes', iconName: 'layers-outline', path: '/(app)/class' }, // Updated Label
  { label: 'Subjects', iconName: 'book-outline', path: '/(app)/subjects' }, // New Item
  { label: 'Timetable', iconName: 'time-outline', path: '/(app)/timetable' }, 
  { label: 'Schedule Exam', iconName: 'calendar-number-outline', path: '/(app)/examschedule' }, 
  { label: 'Results', iconName: 'ribbon-outline', path: '/(app)/results' },
  { label: 'Transport', iconName: 'bus-outline', path: '/(app)/transport' },
  { label: 'Notice', iconName: 'megaphone-outline', path: '/(app)/notice' },
  { label: 'Accounts', iconName: 'wallet-outline', path: '/(app)/account' },
];

export const teacherMenu: MenuItem[] = [
  { label: 'Dashboard', iconName: 'apps-outline', path: '/(app)' },
  { label: 'My Schedule', iconName: 'time-outline', path: '/(app)/timetable' }, 
  { label: 'Attendance', iconName: 'calendar-outline', path: '/(app)/attendance' },
  { label: 'Assignments', iconName: 'document-text-outline', path: '/(app)/assignments' },
  { label: 'Exam Timetable', iconName: 'calendar-number-outline', path: '/(app)/examschedule' },
  { label: 'Assign Marks', iconName: 'ribbon-outline', path: '/(app)/results' }, 
];

export const studentMenu: MenuItem[] = [
  { label: 'Dashboard', iconName: 'apps-outline', path: '/(app)' },
  { label: 'My Profile', iconName: 'person-circle-outline', path: '/(app)/profile' }, 
  { label: 'Timetable', iconName: 'time-outline', path: '/(app)/timetable' },
  { label: 'Attendance', iconName: 'calendar-outline', path: '/(app)/attendance' },
  { label: 'Assignments', iconName: 'document-text-outline', path: '/(app)/assignments' }, 
  { label: 'Exam Timetable', iconName: 'calendar-number-outline', path: '/(app)/examschedule' }, 
  { label: 'Transport', iconName: 'bus-outline', path: '/(app)/transport' }, 
  { label: 'Fee Details', iconName: 'wallet-outline', path: '/(app)/fees' }, 
  { label: 'My Results', iconName: 'ribbon-outline', path: '/(app)/results' },
];