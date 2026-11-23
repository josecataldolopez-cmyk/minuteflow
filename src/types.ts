export type CanonicalMinuteStatus = 'Borrador' | 'Aprobada' | 'Pendiente de firma' | 'Finalizada';

export type MinuteStatus =
  | CanonicalMinuteStatus
  | 'Draft'
  | 'Approved'
  | 'Pending Sig'
  | 'Finished';

/**
 * Normaliza cualquier variante lingüística o heredada del estado a su forma canónica en español
 */
export function normalizeMinuteStatus(status?: string): CanonicalMinuteStatus {
  if (!status) return 'Borrador';
  const clean = status.trim().toLowerCase();
  if (clean === 'aprobada' || clean === 'approved') return 'Aprobada';
  if (clean === 'pendiente de firma' || clean === 'pending sig' || clean === 'pendiente') return 'Pendiente de firma';
  if (clean === 'finalizada' || clean === 'finished') return 'Finalizada';
  return 'Borrador';
}

export type UserRole = 'superadmin' | 'admin' | 'editor' | 'reader';

export interface Organization {
  id: string;
  name: string;
  code: string;
  taxId?: string; // RUT o NIT del establecimiento/empresa
  domain?: string;
  driveAccount?: string;
  driveWebhookUrl?: string;
  logoUrl?: string;
  plan?: string;
  createdAt?: string;
  primaryColor?: string; // Color hexadecimal principal de la institución
  secondaryColor?: string;
  slogan?: string;
  headerText?: string; // Membrete oficial de actas
  address?: string;
  phone?: string;
}

export interface Attendee {
  id: string;
  name: string;
  role?: string;
  email: string;
  avatarUrl: string;
  organizationId?: string;
  isCustom?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  systemRole?: UserRole;
  email: string;
  department?: string;
  avatarUrl: string;
  plan?: string;
  organizationId: string;
  organizationName?: string;
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
  organizationId?: string;
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
  organizationId?: string;
  recordingUrl?: string;
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
  organizationId?: string;
}

export interface DirectoryItem {
  id: string;
  name: string;
  count: number;
  icon?: string;
  organizationId?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
}

export type ViewMode = 'dashboard' | 'library' | 'editor' | 'projects' | 'settings';
