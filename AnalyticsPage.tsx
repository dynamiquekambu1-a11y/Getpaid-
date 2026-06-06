import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getClients } from '../lib/clients';
import type { Client } from '../lib/types';
import { ArrowLeft, DollarSign, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClients().then(data => setClients(data)).finally(() => setLoading(false));
  }, []);

  const paid = clients.filter(c => c.status === 'paid');
  const pending = clients.filter(c => c.status === 'pending');
  const revenue = paid.reduce((s, c) => s + c.amount_due, 0);
  const pendingTotal = pending.reduce((s, c) => s + c.amount_due, 0);
  const collectionRate = clients.length > 0 ? (paid.length / clients.length) * 100 : 0;

  const overdue = pending.filter(c => new Date(c.due_date) < new Date());
  const overdueTotal = overdue.reduce((s, c) => s + c.amount_due, 0);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#/dashboard" className="text-gray-400 hover:text-gray-600 transition"><ArrowLeft className="w-5 h-5" /></a>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${profile?.plan === 'FREE' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
              {profile?.plan || 'FREE'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Key metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Revenue Collected</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${revenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${pendingTotal.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm text-gray-500">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${overdueTotal.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{overdue.length} overdue invoice{overdue.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Collection Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{collectionRate.toFixed(0)}%</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800">Paid ({paid.length})</h3>
            </div>
            {paid.length === 0 ? (
              <p className="text-sm text-gray-400">No paid invoices yet</p>
            ) : (
              <div className="space-y-2">
                {paid.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{c.name}</span>
                    <span className="text-green-600 font-medium">${c.amount_due.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Pending ({pending.length})</h3>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-400">No pending invoices</p>
            ) : (
              <div className="space-y-2">
                {pending.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{c.name}</span>
                    <span className="text-orange-600 font-medium">${c.amount_due.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Collection Progress</h3>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{paid.length} collected</span>
            <span>{clients.length} total</span>
          </div>
        </div>
      </main>
    </div>
  );
}
