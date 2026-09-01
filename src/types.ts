export type MinuteStatus =
  | 'Borrador'
  | 'Aprobada'
  | 'Pendiente de firma'
  | 'Finalizada'
  | 'Draft'
  | 'Approved'
  | 'Pending Sig'
  | 'Finished';

export interface Attendee {
  id: string;
  name: string;
  role?: string;
  email: string;
  avatarUrl: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  department?: string;
  avatarUrl: string;
  plan?: string;
}

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  dueLabel?: string;
  assignedTo?: Attendee;
  priority?: 'Low' | 'Medium' | 'High';
  sourceMinuteTitle?: string;
  sourceMinuteId?: string;
}

export interface MeetingMinute {
  id: string;
  title: string;
  directory: string;
  date: string;
  formattedDate: string;
  time?: string;
  status: MinuteStatus;
  location?: string;
  objectives?: string;
  pointsTreated: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
  attendees: Attendee[];
  nextSessionDate?: string;
  syncCalendar?: boolean;
  folderPath?: string;
  lastEdited?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  ampm: 'AM' | 'PM';
  title: string;
  participants: string;
  platform: string;
  link?: string;
  date?: string;
}

export interface DirectoryItem {
  id: string;
  name: string;
  count: number;
  icon?: string;
}

export type ViewMode = 'dashboard' | 'library' | 'editor' | 'projects' | 'settings';
