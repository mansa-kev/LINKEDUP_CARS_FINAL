import React, { useEffect, useState } from 'react';
import { clientService } from '../../services/clientService';
import { supabase } from '../../lib/supabase';
import { FileText, Download, Eye, CreditCard } from 'lucide-react';

export function DigitalGlovebox() {
  const [data, setData] = useState<any>({ documents: [], contracts: [], transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [documents, contracts, transactions] = await Promise.all([
          clientService.getClientDocuments(user.id),
          clientService.getSignedContracts(user.id),
          clientService.getTransactions(user.id)
        ]);
        setData({ documents, contracts, transactions });
      }
    } catch (err) {
      console.error("Error fetching glovebox data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Digital Glovebox...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Digital Glovebox</h2>

      {/* My Documents */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">My Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.documents.map((doc: any) => (
            <div key={doc.id} className="p-4 border border-border rounded-xl flex justify-between items-center">
              <div>
                <p className="font-semibold capitalize">{doc.document_type}</p>
                <p className={`text-xs ${doc.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}`}>{doc.status}</p>
              </div>
              <button className="px-4 py-2 bg-muted rounded-xl text-sm font-bold">Update</button>
            </div>
          ))}
        </div>
      </div>

      {/* Past Contracts Vault */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Past Contracts Vault</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2">Booking ID</th>
                <th className="p-2">Car</th>
                <th className="p-2">Dates</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.contracts.map((c: any) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-2">{c.booking_id.slice(0, 8)}</td>
                  <td className="p-2">{c.bookings.cars.make} {c.bookings.cars.model}</td>
                  <td className="p-2">{new Date(c.signed_at).toLocaleDateString()}</td>
                  <td className="p-2 flex gap-2">
                    <button className="p-2 bg-muted rounded-lg"><Eye size={16} /></button>
                    <button className="p-2 bg-muted rounded-lg"><Download size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Payment History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2">Date</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
                <th className="p-2">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t: any) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-2">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="p-2">{t.amount} {t.currency}</td>
                  <td className="p-2 capitalize">{t.status}</td>
                  <td className="p-2"><button className="p-2 bg-muted rounded-lg"><CreditCard size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
