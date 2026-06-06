export interface Profile {
  id: string;
  email: string;
  plan: 'FREE' | 'PRO';
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  amount_due: number;
  due_date: string;
  status: 'pending' | 'paid';
  created_at: string;
}

export interface EmailLog {
  id: string;
  user_id: string;
  client_id: string;
  type: 'soft' | 'medium' | 'final';
  sent_at: string;
}
