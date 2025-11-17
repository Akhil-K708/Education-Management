export interface MenuItem {
  label: string;
  iconName: string; 
  path: string;
}

export const adminMenu: MenuItem[] = [
  { label: 'Dashboard', iconName: 'apps-outline', path: '/(app)' },
  { label: 'Student Mgmt', iconName: 'people-outline', path: '/(app)/student-mgmt' },
  { label: 'Class Sections', iconName: 'layers-outline', path: '/(app)/class-sections' },
  { label: 'Subjects', iconName: 'book-outline', path: '/(app)/subjects' },
  { label: 'Examination', iconName: 'clipboard-outline', path: '/(app)/examination' },
];

export const teacherMenu: MenuItem[] = [
  { label: 'Dashboard', iconName: 'apps-outline', path: '/(app)' },
  { label: 'Attendance', iconName: 'calendar-outline', path: '/(app)/attendance' },
  { label: 'Assignments', iconName: 'document-text-outline', path: '/(app)/assignments' },
];

export const studentMenu: MenuItem[] = [
  { label: 'Dashboard', iconName: 'apps-outline', path: '/(app)' },
  { label: 'My Timetable', iconName: 'time-outline', path: '/(app)/timetable' },
  { label: 'My Results', iconName: 'ribbon-outline', path: '/(app)/results' },
];