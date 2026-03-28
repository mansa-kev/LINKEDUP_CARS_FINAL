import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  MessageSquare,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function AdminPaymentApprovals() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingPayments();
      setPayments(data || []);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
      toast.error('Failed to fetch pending payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (payment: any) => {
    setProcessing(true);
    const promise = (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await adminService.verifyPayment(
        payment.id, 
        'verified', 
        user?.id || '', 
        payment.booking_id, 
        payment.amount,
        payment.client_id,
        payment.transaction_code
      );
      setSelectedPayment(null);
      fetchPayments();
    })();

    toast.promise(promise, {
      loading: 'Approving payment...',
      success: 'Payment approved successfully',
      error: 'Failed to approve payment'
    });
    
    try {
      await promise;
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (payment: any) => {
    setProcessing(true);
    const promise = (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await adminService.verifyPayment(
        payment.id, 
        'rejected', 
        user?.id || '', 
        payment.booking_id
      );
      setSelectedPayment(null);
      fetchPayments();
    })();

    toast.promise(promise, {
      loading: 'Rejecting payment...',
      success: 'Payment rejected successfully',
      error: 'Failed to reject payment'
    });

    try {
      await promise;
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.transaction_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.booking_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading && payments.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Payment Approval Queue</h2>
          <p className="text-sm text-muted-foreground">Verify and manage manual M-Pesa transactions.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Search by Code, Booking ID, or Client..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs w-72 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Pending</option>
                <option value="verified">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Booking ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">M-Pesa Code</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-muted-foreground truncate block w-24" title={payment.booking_id}>
                      {payment.booking_id?.split('-')[0]}...
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold">{payment.client?.full_name || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {payment.transaction_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold">KES {Number(payment.amount).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{new Date(payment.submitted_at).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      payment.status === 'verified' ? 'bg-success/10 text-success border-success/20' :
                      payment.status === 'rejected' ? 'bg-error/10 text-error border-error/20' :
                      'bg-warning/10 text-warning border-warning/20'
                    }`}>
                      {payment.status === 'submitted' ? 'Pending' : payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedPayment(payment)}
                      className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No payment submissions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl bg-card rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="font-bold text-lg">Review Payment Submission</h3>
              <button 
                onClick={() => setSelectedPayment(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Booking Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Booking Summary</h4>
                <div className="bg-muted/30 p-4 rounded-xl border border-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Booking ID</p>
                    <p className="text-sm font-mono font-bold">{selectedPayment.booking_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount Due</p>
                    <p className="text-sm font-bold">KES {Number(selectedPayment.bookings?.total_amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Dates</p>
                    <p className="text-sm font-bold">
                      {new Date(selectedPayment.bookings?.start_date).toLocaleDateString()} - {new Date(selectedPayment.bookings?.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Client Information</h4>
                <div className="bg-muted/30 p-4 rounded-xl border border-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-bold">{selectedPayment.client?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="text-sm font-bold">{selectedPayment.client?.phone_number || selectedPayment.client?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Submitted Payment Details</h4>
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">M-Pesa Code</p>
                    <p className="text-lg font-mono font-bold text-primary">{selectedPayment.transaction_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Claimed</p>
                    <p className="text-lg font-bold">KES {Number(selectedPayment.amount).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Submission Date</p>
                    <p className="text-sm font-bold">{new Date(selectedPayment.submitted_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {selectedPayment.status === 'submitted' && (
                <div className="bg-warning/10 p-4 rounded-xl border border-warning/20 flex gap-3">
                  <AlertCircle className="text-warning shrink-0" size={20} />
                  <p className="text-sm text-warning font-medium">
                    Please verify this M-Pesa code against your official statements before approving. Approving will automatically confirm the booking.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-muted/10 flex flex-wrap gap-3 justify-end">
              <a 
                href={`mailto:${selectedPayment.client?.email}?subject=Regarding your M-Pesa Payment for Booking ${selectedPayment.booking_id}`}
                className="px-4 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
              >
                <MessageSquare size={16} />
                Contact Client
              </a>
              
              {selectedPayment.status === 'submitted' && (
                <>
                  <button 
                    onClick={() => handleReject(selectedPayment)}
                    disabled={processing}
                    className="px-4 py-2 bg-error/10 text-error hover:bg-error hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Reject Payment
                  </button>
                  <button 
                    onClick={() => handleApprove(selectedPayment)}
                    disabled={processing}
                    className="px-6 py-2 bg-success text-white hover:bg-success/90 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-success/20 disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    Approve Payment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
