import { supabase } from './supabase';
import type { Client } from './types';

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addClient(client: {
  name: string;
  email: string;
  amount_due: number;
  due_date: string;
}): Promise<Client> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...client, user_id: user.id, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markPaid(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ status: 'paid' })
    .eq('id', clientId);
  if (error) throw error;
}

export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);
  if (error) throw error;
}
