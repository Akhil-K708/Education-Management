export interface MenuItem {
  label: string;
  iconName: string;
  path: string;
}

export const adminMenu: MenuItem[] = [
  { label: 'Dashboard', iconName: 'apps-outline', path: '/(app)' },
  { label: 'Students', iconName: 'people-outline', path: '/(app)/students' },
  { label: 'Teachers', iconName: 'person-outline', path: '/(app)/teachers' },
  { label: 'Account', iconName: 'card-outline', path: '/(app)/account' },
  { label: 'Class', iconName: 'layers-outline', path: '/(app)/class' },
  { label: 'Exam', iconName: 'clipboard-outline', path: '/(app)/exam' },
  { label: 'Transport', iconName: 'bus-outline', path: '/(app)/transport' },
  { label: 'Notice', iconName: 'megaphone-outline', path: '/(app)/notice' },
  { label: 'Settings', iconName: 'settings-outline', path: '/(app)/settings' },
];

export const teacherMenu: MenuItem[] = [
  { label: 'Dashboard', iconName: 'apps-outline', path: '/(app)' },
  { label: 'Attendance', iconName: 'calendar-outline', path: '/(app)/attendance' },
  { label: 'Assignments', iconName: 'document-text-outline', path: '/(app)/assignments' },
  { label: 'Settings', iconName: 'settings-outline', path: '/(app)/settings' },
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