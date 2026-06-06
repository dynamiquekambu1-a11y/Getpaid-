import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getClients, addClient, markPaid, deleteClient } from '../lib/clients';
import { signOut, MAX_FREE_CLIENTS } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Client } from '../lib/types';
import {
  Plus, DollarSign, Clock, CheckCircle, Trash2, BarChart3,
  LogOut, AlertCircle, X, Send, Users
} from 'lucide-react';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', amount: '', due_date: '' });
  const [error, setError] = useState('');

  const loadClients = useCallback(async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const pendingClients = clients.filter(c => c.status === 'pending');
  const paidClients = clients.filter(c => c.status === 'paid');
  const totalPending = pendingClients.reduce((s, c) => s + c.amount_due, 0);
  const totalPaid = paidClients.reduce((s, c) => s + c.amount_due, 0);
  const isFree = profile?.plan === 'FREE';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isFree && clients.length >= MAX_FREE_CLIENTS) {
      setError(`Free plan limited to ${MAX_FREE_CLIENTS} clients. Upgrade to PRO!`);
      return;
    }
    try {
      await addClient({
        name: form.name,
        email: form.email,
        amount_due: parseFloat(form.amount),
        due_date: new Date(form.due_date).toISOString(),
      });
      setForm({ name: '', email: '', amount: '', due_date: '' });
      setShowAdd(false);
      loadClients();
    } catch (err: any) {
      setError(err.message || 'Failed to add client');
    }
  };

  const handlePaid = async (id: string) => {
    try {
      await markPaid(id);
      loadClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    try {
      await deleteClient(id);
      loadClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReminder = async (client: Client) => {
    setSending(client.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ client_id: client.id }),
      });
      if (!res.ok) throw new Error('Failed to send');
      alert(`Reminder sent to ${client.name}!`);
    } catch {
      alert('Failed to send reminder');
    } finally {
      setSending(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">GETPAID</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${isFree ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
              {profile?.plan || 'FREE'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#/analytics" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium transition">
              <BarChart3 className="w-4 h-4" /> Analytics
            </a>
            <button onClick={() => signOut()} className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 text-sm transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${totalPending.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{pendingClients.length} invoice{pendingClients.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Collected</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${totalPaid.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{paidClients.length} paid</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total clients</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            {isFree && (
              <p className="text-xs text-gray-400 mt-1">{MAX_FREE_CLIENTS - clients.length} slots left on FREE</p>
            )}
          </div>
        </div>

        {/* Add button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Clients</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>

        {/* Add form modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 px-4">
            <form onSubmit={handleAdd} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 relative">
              <button type="button" onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-gray-800">Add new client</h3>
              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>}
              <input
                type="text" placeholder="Client name" value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" required
              />
              <input
                type="email" placeholder="Client email" value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" required
              />
              <input
                type="number" step="0.01" min="0" placeholder="Amount due" value={form.amount}
                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" required
              />
              <input
                type="date" value={form.due_date}
                onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" required
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition">
                Add Client
              </button>
            </form>
          </div>
        )}

        {/* Client list */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No clients yet. Add your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map(c => (
              <div key={c.id} className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4 transition hover:shadow-sm ${c.status === 'paid' ? 'opacity-70' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{c.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{c.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Due: {formatDate(c.due_date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-900">${c.amount_due.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleSendReminder(c)}
                        disabled={sending === c.id}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                        title="Send reminder"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePaid(c.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Mark as paid"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
