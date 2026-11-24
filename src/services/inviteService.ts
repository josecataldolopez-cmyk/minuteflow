import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { UserRole } from '../types';

export type InviteRole = Extract<UserRole, 'admin' | 'editor' | 'reader'>;

export interface OrganizationInvite {
  id: string;
  email: string | null;
  role: InviteRole;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface CreatedInvite {
  id: string;
  invitation_code: string;
  expires_at: string;
}

function requireClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Configura Supabase para administrar invitaciones.');
  }
  const client = getSupabase();
  if (!client) throw new Error('No se pudo conectar con Supabase.');
  return client;
}

export async function listOrganizationInvites(): Promise<OrganizationInvite[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('organization_invites')
    .select('id,email,role,expires_at,accepted_at,created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as OrganizationInvite[];
}

export async function createOrganizationInvite(
  email: string,
  role: InviteRole,
  expiresInDays: number
): Promise<CreatedInvite> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc('create_organization_invite', {
    invitee_email: email.trim() || null,
    invitee_role: role,
    expires_in_days: expiresInDays
  });
  if (error) throw new Error(error.message);
  const invite = Array.isArray(data) ? data[0] : data;
  if (!invite?.invitation_code) throw new Error('Supabase no devolvió el código de invitación.');
  return invite as CreatedInvite;
}
