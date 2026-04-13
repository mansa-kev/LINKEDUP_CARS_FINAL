import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { supabase } from '../../lib/supabase';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  User, 
  Car,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  X,
  FileText,
  CreditCard,
  Mail,
  Clock,
  Trash2,
  Phone,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '../../utils/logger';

// --- Types ---

type BookingStatus = 'pending' | 'confirmed' | 'on_trip' | 'completed' | 'cancelled' | 'pending_payment_verification';

interface Booking {
  id: string;
  client_id: string;
  car_id: string;
  driver_id?: string;
  fleet_owner_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  platform_commission: number;
  status: BookingStatus;
  payment_status: 'paid' | 'pending' | 'failed';
  document_status?: 'pending' | 'approved' | 'rejected' | 'resubmission_required' | 'resubmitted';
  admin_notes?: string;
  created_at: string;
  client?: any;
  fleet_owner?: any;
  cars?: any;
  metadata?: any;
}

// --- Components ---

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const styles: Record<BookingStatus, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    confirmed: 'bg-success/10 text-success border-success/20',
    on_trip: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    cancelled: 'bg-error/10 text-error border-error/20',
    pending_payment_verification: 'bg-muted/10 text-muted-foreground border-muted/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterClient, setFilterClient] = useState('');
  const [filterCar, setFilterCar] = useState('');
  const [filterFleetOwner, setFilterFleetOwner] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [isExtending, setIsExtending] = useState(false);
  const [extendDays, setExtendDays] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectionSelector, setShowRejectionSelector] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  
  // Mobile expandable row state
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const result = await adminService.getBookings(page, pageSize);
      if (result && 'data' in result) {
        setBookings(result.data || []);
        setTotalCount(result.count || 0);
      }
      
      // Also fetch pending payments
      const { data: payments } = await supabase
        .from('pending_payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      setPendingPayments(payments || []);
    } catch (error) {
      logger.error('Failed to fetch bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page]);

  // Mobile detection with resize listener
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    try {
      await adminService.updateBookingStatus(id, status);
      toast.success(`Booking status updated to ${status}`);

      // Send cancellation notification to client when admin cancels via dropdown
      if (status === 'cancelled') {
        const booking = bookings.find(b => b.id === id);
        if (booking?.client_id) {
          await supabase.from('notifications').insert({
            user_id: booking.client_id,
            type: 'booking_cancelled',
            title: 'Booking Cancelled',
            content: `Your booking #${id} has been cancelled. Please contact support if you believe this is an error or to request a refund.`,
            link: `/booking-confirmation/${id}`,
            is_read: false,
            created_at: new Date().toISOString(),
          });

          const clientEmail = booking.client?.email || booking.metadata?.guest_info?.email;
          if (clientEmail) {
            supabase.functions.invoke('send-email', {
              body: {
                to: clientEmail,
                subject: 'Booking Cancelled - LinkedUp Cars',
                message: `Dear ${booking.client?.full_name || 'Valued Customer'},\n\nYour booking #${id} has been cancelled.\n\nIf you believe this is an error or would like to request a refund, please contact our support team.\n\nThank you,\nLinkedUp Cars Team`,
              },
            }).catch(() => {});
          }
        }
      }

      fetchBookings();
    } catch (error) {
      logger.error('Error updating status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const handleVerifyPayment = async (bookingId: string, verificationStatus: 'verified' | 'rejected') => {
    try {
      // Find the pending payment for this booking
      const pendingPayment = pendingPayments.find(p => p.booking_id === bookingId);
      
      if (!pendingPayment) {
        toast.error('No pending payment found for this booking');
        return;
      }

      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Admin authentication required');
        return;
      }

      // Verify the payment
      const result = await adminService.verifyPayment(
        pendingPayment.id,
        verificationStatus,
        user.id,
        bookingId,
        pendingPayment.amount,
        pendingPayment.client_id,
        pendingPayment.transaction_code
      );

      if (result) {
        if (verificationStatus === 'verified') {
          toast.success('Payment verified ✓ — now review and approve the documents.');
          // Update local state so step indicator and buttons re-render immediately
          setSelectedBooking(prev => prev ? { ...prev, payment_status: 'paid' } : prev);
          setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, payment_status: 'paid' } : b));
          // Also update pendingPayments list
          setPendingPayments(prev => prev.map(p =>
            p.booking_id === bookingId ? { ...p, status: 'verified' } : p
          ));
        } else {
          toast.success('Payment rejected. Booking remains pending.');
          fetchBookings();
          setSelectedBooking(null);
        }
      }
    } catch (error) {
      logger.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    }
  };

  const handleDeleteBooking = async (booking: Booking) => {
    try {
      const result = await adminService.deleteBooking(booking.id);
      logger.log('Delete result:', result);
      
      if (result) {
        toast.success('Booking deleted successfully');
        fetchBookings();
        setDeleteConfirm(null);
        setSelectedBooking(null);
      } else {
        toast.error('Failed to delete booking');
      }
    } catch (error) {
      logger.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  const handleConfirmBooking = async (booking: Booking) => {
    try {
      // Update booking status to confirmed and payment_status to paid
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed', 
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Insert notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.client_id,
          type: 'booking_confirmed',
          message: `Your booking #${booking.id} has been confirmed. Welcome aboard!`,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        logger.warn('Notification insertion failed:', notificationError);
      }

      // Send email if client has email
      if (booking.client?.email) {
        try {
          const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
              to: booking.client.email,
              subject: 'Booking Confirmed - LinkedUp Cars',
              message: `Dear ${booking.client.full_name},\n\nYour booking #${booking.id} has been confirmed!\n\nBooking Details:\n- Car: ${booking.cars?.make} ${booking.cars?.model}\n- Dates: ${booking.start_date} to ${booking.end_date}\n- Total: KES ${booking.total_amount}\n\nThank you for choosing LinkedUp Cars!`
            }
          });

          if (error) {
            logger.warn('Email sending failed:', error);
          }
        } catch (emailError) {
          logger.warn('Email function error:', emailError);
        }
      }

      toast.success('Booking confirmed and notification sent!');
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      logger.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking');
    }
  };

  const handleApproveDocuments = async (booking: Booking) => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ document_status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', booking.id);
      if (updateError) throw updateError;

      // Refresh local state immediately so buttons re-render
      setSelectedBooking(prev => prev ? { ...prev, document_status: 'approved' } : prev);
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, document_status: 'approved' } : b));
      toast.success('Documents approved — you can now confirm the booking.');
    } catch (error) {
      logger.error('Error approving documents:', error);
      toast.error('Failed to approve documents');
    }
  };

  const handleRejectDocuments = async (booking: Booking, reason: string) => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          document_status: 'resubmission_required',
          admin_notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      const clientEmail = booking.client?.email || booking.metadata?.guest_info?.email;
      const clientName  = booking.client?.full_name || booking.metadata?.guest_info?.full_name || 'Client';

      if (clientEmail) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: clientEmail,
              subject: 'Action Required: Resubmit Documents - LinkedUp Cars',
              message: `Dear ${clientName},\n\nYour booking #${booking.id} documents require resubmission.\n\nReason: ${reason}\n\nIMPORTANT: Your payment has already been verified — you do NOT need to pay again.\n\nPlease log into your client portal → My Bookings → click "Resubmit Documents" to upload new documents.\n\nThank you,\nLinkedUp Cars Team`
            }
          });
        } catch (emailError) {
          logger.warn('Email error:', emailError);
        }
      }

      toast.success('Client notified to resubmit documents. Payment remains valid.');
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      logger.error('Error rejecting documents:', error);
      toast.error('Failed to reject documents');
    }
  };

  const handleRejectBooking = async (booking: Booking, reason: string) => {
    try {
      // Update booking status to rejected
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Insert notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.client_id,
          type: 'booking_rejected',
          message: `Your booking #${booking.id} was rejected: ${reason}. Please re-submit with correct documents.`,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        logger.warn('Notification insertion failed:', notificationError);
      }

      // Send email if client has email
      if (booking.client?.email) {
        try {
          const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
              to: booking.client.email,
              subject: 'Booking Rejected - LinkedUp Cars',
              message: `Dear ${booking.client.full_name},\n\nYour booking #${booking.id} was rejected.\n\nReason: ${reason}\n\nPlease re-submit your booking with the correct documents or contact support for assistance.\n\nThank you,\nLinkedUp Cars Team`
            }
          });

          if (error) {
            logger.warn('Email sending failed:', error);
          }
        } catch (emailError) {
          logger.warn('Email function error:', emailError);
        }
      }

      toast.success('Booking rejected and notification sent!');
      fetchBookings();
      setSelectedBooking(null);
      setShowRejectionSelector(false);
      setRejectionReason('');
    } catch (error) {
      logger.error('Error rejecting booking:', error);
      toast.error('Failed to reject booking');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.client?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading && bookings.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Bookings Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all car rental bookings</p>
        </div>
      </div>

      {/* Table - Desktop View */}
      {!isMobile && (
        <div className="bg-card rounded-xl md:rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 md:px-6 py-2 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Booking ID
                  </th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Client
                  </th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Car
                  </th>
                  <th className="hidden lg:table-cell px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Fleet Owner
                  </th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Dates
                  </th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Submitted
                  </th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-3 md:px-6 py-2 md:py-4">
                      <span className="text-xs md:text-sm font-mono">{booking.id.split('-')[0]}...</span>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User size={12} />
                        </div>
                        <span className="text-xs md:text-sm font-medium">{booking.client?.full_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <Car size={12} className="text-muted-foreground" />
                        <span className="text-xs md:text-sm">{booking.cars?.make} {booking.cars?.model}</span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4">
                      <span className="text-xs text-muted-foreground">{booking.fleet_owner?.full_name || 'Platform Owned'}</span>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4">
                      <div className="text-xs md:text-sm">
                        <div>{new Date(booking.start_date).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">to {new Date(booking.end_date).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4">
                      <span className="text-xs md:text-sm font-bold">KES {booking.total_amount.toLocaleString()}</span>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="text-xs text-muted-foreground">
                        <div>{new Date(booking.created_at).toLocaleDateString()}</div>
                        <div>{new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedBooking(booking)}
                          className="p-1.5 md:p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" 
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(booking)}
                          className="p-1.5 md:p-2 hover:bg-error/10 rounded-lg text-muted-foreground hover:text-error transition-colors" 
                          title="Delete Booking"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Expandable Rows */}
      {isMobile && (
        <div className="space-y-2">
          {filteredBookings.map((booking) => (
            <div key={booking.id}>
              {/* Summary Row */}
              <div 
                className="flex justify-between items-center px-4 py-3 bg-card border border-border rounded-xl cursor-pointer select-none hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedRowId(expandedRowId === booking.id ? null : booking.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User size={12} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{booking.id.split('-')[0]}...</p>
                    <p className="text-xs text-muted-foreground">{booking.client?.full_name || 'Unknown'}</p>
                  </div>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-200 ${expandedRowId === booking.id ? 'rotate-180' : ''}`}
                />
              </div>

              {/* Expanded Card */}
              {expandedRowId === booking.id && (
                <div className="bg-card border border-border rounded-xl p-4 mb-3 max-h-[65vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <span className="text-xs text-muted uppercase tracking-wide">Booking ID</span>
                      <p className="text-sm text-white font-medium break-all">{booking.id}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted uppercase tracking-wide">Client</span>
                      <p className="text-sm text-white font-medium">{booking.client?.full_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted uppercase tracking-wide">Car</span>
                      <p className="text-sm text-white font-medium">{booking.cars?.make} {booking.cars?.model}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted uppercase tracking-wide">Fleet Owner</span>
                      <p className="text-sm text-white font-medium">{booking.fleet_owner?.full_name || 'Platform Owned'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted uppercase tracking-wide">Submitted At</span>
                      <p className="text-sm text-white font-medium">
                        {new Date(booking.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted uppercase tracking-wide">Dates</span>
                      <p className="text-sm text-white font-medium">
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted uppercase tracking-wide">Amount</span>
                      <p className="text-sm text-white font-medium">KES {booking.total_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted uppercase tracking-wide">Status</span>
                      <div className="mt-1">
                        <StatusBadge status={booking.status} />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
                    <button 
                      onClick={() => setSelectedBooking(booking)}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Eye size={12} />
                      View Details
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(booking)}
                      className="px-3 py-1.5 bg-error text-white rounded-lg text-xs font-bold hover:bg-error/90 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl md:rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
              <div>
                <h2 className="text-lg md:text-xl font-bold">Booking Details</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">ID: {selectedBooking.id}</p>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                
                {/* Section 1: Booking Identity (full width) */}
                <div className="md:col-span-2">
                  <div className="bg-muted/30 p-4 rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                      {/* Client Profile Photo */}
                      <img 
                        src={selectedBooking.client?.avatar_url || `https://ui-avatars.com/api/?name=${selectedBooking.client?.full_name || 'Unknown'}&background=ff6b00&color=fff`}
                        alt="Client Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold">Booking {selectedBooking.id}</h3>
                          <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${
                            selectedBooking.status === 'confirmed' ? 'bg-success/10 text-success' :
                            selectedBooking.status === 'cancelled' ? 'bg-error/10 text-error' :
                            selectedBooking.status === 'pending' ? 'bg-warning/10 text-warning' :
                            'bg-muted/10 text-muted-foreground'
                          }`}>
                            {selectedBooking.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <div>
                            <span className="text-xs text-muted uppercase tracking-wider">Date Range</span>
                            <p className="text-sm text-white font-medium">{selectedBooking.start_date} - {selectedBooking.end_date}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted uppercase tracking-wider">Pickup Location</span>
                            <p className="text-sm text-white font-medium">Nairobi Office</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted uppercase tracking-wider">Car Details</span>
                            <p className="text-sm text-white font-medium">{selectedBooking.cars?.make} {selectedBooking.cars?.model}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted uppercase tracking-wider">Total Amount</span>
                        <p className="text-xl font-bold text-primary">KES {selectedBooking.total_amount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Personal Details */}
                <div className="bg-muted/30 p-4 rounded-xl">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                    <User size={14} /> Personal Details
                  </h4>
                  {(() => {
                    const g = (selectedBooking as any).metadata?.guest_info;
                    const c = selectedBooking.client;
                    const name  = c?.full_name   || g?.full_name  || 'N/A';
                    const email = c?.email        || g?.email      || 'N/A';
                    const phone = c?.phone_number || c?.phone || g?.phone || 'N/A';
                    const faceUrl = (selectedBooking as any).metadata?.documents?.facePhotoUrl;
                    return (
                      <div className="space-y-3">
                        {faceUrl && (
                          <div className="flex items-center gap-4 mb-3">
                            <button onClick={() => setLightboxUrl(faceUrl)} className="shrink-0 focus:outline-none">
                              <img src={faceUrl} alt="Face Photo" className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 hover:border-primary transition-all cursor-zoom-in" />
                            </button>
                            <div>
                              <p className="text-xs text-muted uppercase tracking-wider mb-0.5">Passport / Face Photo</p>
                              <button onClick={() => setLightboxUrl(faceUrl)} className="text-xs text-primary hover:underline">Click to enlarge</button>
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-muted uppercase tracking-wider">Full Name</span>
                          <p className="text-sm text-white font-medium">{name}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted uppercase tracking-wider">Email</span>
                          <p className="text-sm text-white font-medium">{email}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted uppercase tracking-wider">Phone Number</span>
                          <p className="text-sm text-white font-medium">{phone}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted uppercase tracking-wider">Submitted At</span>
                          <p className="text-sm text-white font-medium">
                            {new Date(selectedBooking.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Section 3: ID Document */}
                <div className="bg-muted/30 p-4 rounded-xl">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                    <ShieldCheck size={14} /> ID Document
                  </h4>
                  {(() => {
                    const docs = (selectedBooking as any).metadata?.documents || {};
                    const g    = (selectedBooking as any).metadata?.guest_info;
                    const idNumber = selectedBooking.client?.id_number || g?.id_number || 'N/A';
                    const idFront  = docs.idFrontUrl;
                    const idBack   = docs.idBackUrl;
                    return (
                      <>
                        <div className="mb-3">
                          <span className="text-xs text-muted uppercase tracking-wider">ID Number</span>
                          <p className="text-sm text-white font-medium">{idNumber}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <button
                              onClick={() => idFront && setLightboxUrl(idFront)}
                              disabled={!idFront}
                              className="w-full rounded-xl overflow-hidden border border-border h-32 bg-muted/50 flex items-center justify-center hover:border-primary/50 transition-all disabled:cursor-default cursor-zoom-in"
                            >
                              {idFront ? (
                                <img src={idFront} alt="ID Front" className="w-full h-full object-cover" />
                              ) : (
                                <FileText size={24} className="text-muted" />
                              )}
                            </button>
                            <p className="text-xs text-muted mt-1 text-center">Front {idFront && <span className="text-primary">· tap to zoom</span>}</p>
                          </div>
                          <div>
                            <button
                              onClick={() => idBack && setLightboxUrl(idBack)}
                              disabled={!idBack}
                              className="w-full rounded-xl overflow-hidden border border-border h-32 bg-muted/50 flex items-center justify-center hover:border-primary/50 transition-all disabled:cursor-default cursor-zoom-in"
                            >
                              {idBack ? (
                                <img src={idBack} alt="ID Back" className="w-full h-full object-cover" />
                              ) : (
                                <FileText size={24} className="text-muted" />
                              )}
                            </button>
                            <p className="text-xs text-muted mt-1 text-center">Back {idBack && <span className="text-primary">· tap to zoom</span>}</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Section 4: Driver's License */}
                <div className="bg-muted/30 p-4 rounded-xl">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                    <CreditCard size={14} /> Driver's License
                  </h4>
                  {(() => {
                    const docs = (selectedBooking as any).metadata?.documents || {};
                    const g    = (selectedBooking as any).metadata?.guest_info;
                    const licenseNum   = selectedBooking.client?.license_number || g?.license_number || g?.license || 'N/A';
                    const licenseFront = docs.licenseFrontUrl;
                    const licenseBack  = docs.licenseBackUrl;
                    return (
                      <>
                        <div className="mb-3">
                          <span className="text-xs text-muted uppercase tracking-wider">License Number</span>
                          <p className="text-sm text-white font-medium">{licenseNum}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <button
                              onClick={() => licenseFront && setLightboxUrl(licenseFront)}
                              disabled={!licenseFront}
                              className="w-full rounded-xl overflow-hidden border border-border h-32 bg-muted/50 flex items-center justify-center hover:border-primary/50 transition-all disabled:cursor-default cursor-zoom-in"
                            >
                              {licenseFront ? (
                                <img src={licenseFront} alt="License Front" className="w-full h-full object-cover" />
                              ) : (
                                <FileText size={24} className="text-muted" />
                              )}
                            </button>
                            <p className="text-xs text-muted mt-1 text-center">Front {licenseFront && <span className="text-primary">· tap to zoom</span>}</p>
                          </div>
                          <div>
                            <button
                              onClick={() => licenseBack && setLightboxUrl(licenseBack)}
                              disabled={!licenseBack}
                              className="w-full rounded-xl overflow-hidden border border-border h-32 bg-muted/50 flex items-center justify-center hover:border-primary/50 transition-all disabled:cursor-default cursor-zoom-in"
                            >
                              {licenseBack ? (
                                <img src={licenseBack} alt="License Back" className="w-full h-full object-cover" />
                              ) : (
                                <FileText size={24} className="text-muted" />
                              )}
                            </button>
                            <p className="text-xs text-muted mt-1 text-center">Back {licenseBack && <span className="text-primary">· tap to zoom</span>}</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Section 5: Payment (full width) */}
                <div className="md:col-span-2">
                  <div className="bg-muted/30 p-4 rounded-xl">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                      <CreditCard size={14} /> Payment Information
                    </h4>
                    {(() => {
                      const pp = pendingPayments.find(p => p.booking_id === selectedBooking.id);
                      const isPaid = selectedBooking.payment_status === 'paid';
                      const isSubmitted = pp?.status === 'submitted';
                      return (
                        <>
                          {/* Transaction code banner */}
                          <div className="mb-4 p-3 bg-card rounded-xl border border-border">
                            <p className="text-xs text-muted uppercase tracking-wider mb-1">M-Pesa Transaction Code</p>
                            {pp?.transaction_code ? (
                              <p className="text-2xl font-mono text-warning font-bold tracking-widest">{pp.transaction_code}</p>
                            ) : (
                              <p className="text-sm text-muted italic">No transaction code submitted</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <span className="text-xs text-muted uppercase tracking-wider">Amount</span>
                              <p className="text-sm text-white font-bold">KES {selectedBooking.total_amount?.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted uppercase tracking-wider">Method</span>
                              <p className="text-sm text-white font-medium">M-Pesa</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted uppercase tracking-wider">Submitted</span>
                              <p className="text-sm text-white font-medium">{pp ? new Date(pp.created_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted uppercase tracking-wider">Payment Status</span>
                              <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md inline-block mt-1 ${
                                isPaid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                              }`}>
                                {isPaid ? 'Verified ✓' : (pp?.status || 'Pending')}
                              </span>
                            </div>
                          </div>

                          {/* Inline payment action */}
                          {isPaid ? (
                            <div className="p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-success" />
                              <p className="text-xs text-success font-bold">Payment verified — booking can now be confirmed</p>
                            </div>
                          ) : isSubmitted ? (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                              <p className="text-xs text-amber-500 font-bold flex items-center gap-2 mb-3">
                                <AlertTriangle size={12} />
                                Verify that M-Pesa code <span className="font-mono">{pp?.transaction_code}</span> matches a real transaction
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleVerifyPayment(selectedBooking.id, 'verified')}
                                  className="px-3 py-1.5 bg-success text-white rounded-lg text-xs font-bold hover:bg-success/90 transition-colors flex items-center gap-1.5"
                                >
                                  <CheckCircle2 size={12} /> Confirm Payment
                                </button>
                                <button
                                  onClick={() => handleVerifyPayment(selectedBooking.id, 'rejected')}
                                  className="px-3 py-1.5 bg-error text-white rounded-lg text-xs font-bold hover:bg-error/90 transition-colors flex items-center gap-1.5"
                                >
                                  <XCircle size={12} /> Reject Payment
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-muted/30 border border-border rounded-lg">
                              <p className="text-xs text-muted-foreground">No payment has been submitted for this booking yet.</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 md:p-6 border-t border-border bg-muted/10">
              {/* Rejection Reason Selector */}
              {showRejectionSelector && (
                <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
                  <p className="text-xs text-error font-medium mb-2">Select rejection reason:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Document mismatch', 'Incomplete documents', 'Payment not verified', 'Other'].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setRejectionReason(reason)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          rejectionReason === reason
                            ? 'bg-error text-white'
                            : 'bg-error/20 text-error hover:bg-error/30'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectBooking(selectedBooking, rejectionReason)}
                      disabled={!rejectionReason}
                      className="px-3 py-1.5 bg-error text-white rounded-lg text-xs font-bold hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectionSelector(false);
                        setRejectionReason('');
                      }}
                      className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-bold hover:bg-muted/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── 3-Step Sequential Admin Workflow ── */}
              {(['pending', 'pending_payment_verification'] as BookingStatus[]).includes(selectedBooking.status) && (() => {
                const isPaid    = selectedBooking.payment_status === 'paid';
                const docStatus = selectedBooking.document_status;
                const docsOk    = docStatus === 'approved';
                const canConfirm = isPaid && docsOk;

                return (
                  <div className="w-full space-y-3">
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={`flex items-center gap-1 font-bold ${ isPaid ? 'text-success' : 'text-warning' }`}>
                        {isPaid ? <CheckCircle2 size={12}/> : <Clock size={12}/>} 1. Payment
                      </span>
                      <span className="text-border">›</span>
                      <span className={`flex items-center gap-1 font-bold ${ docsOk ? 'text-success' : isPaid ? 'text-warning' : 'text-muted-foreground/40' }`}>
                        {docsOk ? <CheckCircle2 size={12}/> : <Clock size={12}/>} 2. Documents
                      </span>
                      <span className="text-border">›</span>
                      <span className={`flex items-center gap-1 font-bold ${ canConfirm ? 'text-warning' : 'text-muted-foreground/40' }`}>
                        <CheckCircle2 size={12}/> 3. Confirm
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 md:gap-3 justify-end">

                      {/* STEP 2 — Approve / Reject Documents (only after payment verified) */}
                      {isPaid && !docsOk && docStatus !== 'resubmission_required' && (
                        <>
                          <button
                            onClick={() => handleApproveDocuments(selectedBooking)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <ShieldCheck size={16} /> APPROVE DOCS
                          </button>
                          <button
                            onClick={() => {
                              const reason = window.prompt('Rejection reason (sent to client):');
                              if (reason) handleRejectDocuments(selectedBooking, reason);
                            }}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors flex items-center gap-2 text-sm"
                          >
                            <AlertTriangle size={16} /> REJECT DOCS
                          </button>
                        </>
                      )}

                      {/* Doc resubmission states */}
                      {docStatus === 'resubmission_required' && (
                        <span className="px-3 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-2">
                          <Clock size={12} /> Awaiting resubmission from client
                        </span>
                      )}
                      {docStatus === 'resubmitted' && isPaid && (
                        <>
                          <span className="px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 size={12} /> New docs uploaded — review &amp; approve above
                          </span>
                          <button
                            onClick={() => handleApproveDocuments(selectedBooking)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <ShieldCheck size={16} /> APPROVE DOCS
                          </button>
                        </>
                      )}

                      {/* STEP 3 — Confirm Booking (requires both payment + docs approved) */}
                      <button
                        onClick={() => handleConfirmBooking(selectedBooking)}
                        disabled={!canConfirm}
                        title={!isPaid ? 'Verify payment first' : !docsOk ? 'Approve documents first' : ''}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm ${
                          canConfirm
                            ? 'bg-success text-white hover:bg-success/90'
                            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-40'
                        }`}
                      >
                        <CheckCircle2 size={16} />
                        CONFIRM BOOKING
                        {!canConfirm && (
                          <span className="text-[10px]">
                            ({!isPaid ? 'awaiting payment' : 'approve docs first'})
                          </span>
                        )}
                      </button>

                      {/* Reject entire booking */}
                      <button
                        onClick={() => setShowRejectionSelector(true)}
                        className="px-4 py-2 bg-error text-white rounded-lg font-bold hover:bg-error/90 transition-colors flex items-center gap-2 text-sm"
                      >
                        <XCircle size={16} /> REJECT BOOKING
                      </button>

                      {/* Delete booking (always visible) */}
                      <button
                        onClick={() => setDeleteConfirm(selectedBooking)}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold bg-muted text-error hover:bg-error/10 hover:text-error border border-error/20 transition-colors flex items-center gap-2 text-xs md:text-sm"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Delete button shown even for non-pending bookings */}
              {!(['pending', 'pending_payment_verification'] as BookingStatus[]).includes(selectedBooking.status) && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setDeleteConfirm(selectedBooking)}
                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold bg-muted text-error hover:bg-error/10 hover:text-error border border-error/20 transition-colors flex items-center gap-2 text-xs md:text-sm"
                  >
                    <Trash2 size={14} /> Delete Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt="Document"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl md:rounded-2xl shadow-xl w-full max-w-md max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-error/10">
                <AlertCircle className="w-6 h-6 text-error" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Delete Booking</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Are you sure you want to delete this booking? This action cannot be undone and all related data will be permanently lost, including:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 mb-6 pl-4">
                <li>· Booking record</li>
                <li>· Payment transactions</li>
                <li>· Pending payments</li>
                <li>· Associated contracts</li>
              </ul>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-lg font-bold border border-border bg-card hover:bg-muted transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteBooking(deleteConfirm)}
                  className="flex-1 px-4 py-2 rounded-lg font-bold bg-error text-white hover:bg-error/90 transition-colors text-sm"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
