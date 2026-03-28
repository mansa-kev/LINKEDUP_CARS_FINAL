import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Loader2, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export function AdminPayoutEngine() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      // Need to implement getPayouts in adminService
      const data = await adminService.getPayouts();
      setPayouts(data || []);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
      toast.error('Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleApproveBatch = async () => {
    if (selectedPayouts.length === 0) return;
    
    const promise = adminService.approvePayouts(selectedPayouts);
    
    toast.promise(promise, {
      loading: 'Approving payouts...',
      success: () => {
        setSelectedPayouts([]);
        fetchPayouts();
        return `${selectedPayouts.length} payouts approved successfully`;
      },
      error: 'Failed to approve payouts'
    });
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8">
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">Pending Payouts</h3>
          <button 
            onClick={handleApproveBatch}
            disabled={selectedPayouts.length === 0}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50"
          >
            Approve Selected ({selectedPayouts.length})
          </button>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4"><input type="checkbox" onChange={(e) => setSelectedPayouts(e.target.checked ? payouts.filter(p => p.status === 'pending').map(p => p.id) : [])} /></th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Fleet Owner</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Amount</th>
              <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {payouts.filter(p => p.status === 'pending').map(p => (
              <tr key={p.id} className="border-b border-border">
                <td className="p-4"><input type="checkbox" checked={selectedPayouts.includes(p.id)} onChange={(e) => setSelectedPayouts(e.target.checked ? [...selectedPayouts, p.id] : selectedPayouts.filter(id => id !== p.id))} /></td>
                <td className="p-4 font-bold">{p.fleet_owner?.full_name || 'Unknown'}</td>
                <td className="p-4">Ksh {Number(p.amount).toLocaleString()}</td>
                <td className="p-4"><span className="px-2 py-1 bg-warning/10 text-warning rounded-full text-xs font-bold">Pending</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
