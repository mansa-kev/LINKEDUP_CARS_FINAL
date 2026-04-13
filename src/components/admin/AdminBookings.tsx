import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { supabase } from '../../lib/supabase';
import { AdminBookingDetail } from './AdminBookingDetail';
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
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null);
  
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

      {/* Booking Detail Modal — delegated to AdminBookingDetail */}
      {selectedBooking && (
        <AdminBookingDetail
          booking={selectedBooking as any}
          onClose={() => setSelectedBooking(null)}
          onRefresh={fetchBookings}
          onDelete={() => { setDeleteConfirm(selectedBooking); setSelectedBooking(null); }}
        />
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
