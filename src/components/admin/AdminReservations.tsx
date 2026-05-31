import React, { useState, useEffect } from 'react';
import { reservationService } from '../../services/reservationService';
import { reservationPaymentService } from '../../services/reservationPaymentService';
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
  ChevronDown,
  Hash,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---

type ReservationStatus = 'pending_payment' | 'reserved' | 'confirmed' | 'cancelled' | 'expired';

interface Reservation {
  id: string;
  car_id: string;
  client_id: string;
  fleet_owner_id: string;
  start_date: string;
  end_date: string;
  reservation_fee: number;
  total_amount: number;
  status: ReservationStatus;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_method?: string | null;
  payment_provider?: string | null;
  transaction_code?: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  notes?: string;
  expires_at: string;
  created_at: string;
  linked_booking_id?: string | null;
  booking_completion_token?: string | null;
  latest_payment_request?: any;
  cars?: any;
  user_profiles?: any;
}

// --- Components ---

const StatusBadge = ({ status }: { status: ReservationStatus }) => {
  const styles: Record<ReservationStatus, string> = {
    pending_payment: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    reserved: 'bg-warning/10 text-warning border-warning/20',
    confirmed: 'bg-success/10 text-success border-success/20',
    cancelled: 'bg-error/10 text-error border-error/20',
    expired: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    paid: 'bg-success/10 text-success border-success/20',
    refunded: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    failed: 'bg-error/10 text-error border-error/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
};

export function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReservationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterClient, setFilterClient] = useState('');
  const [filterCar, setFilterCar] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [syncingReservationId, setSyncingReservationId] = useState<string | null>(null);
  const [preparingBookingId, setPreparingBookingId] = useState<string | null>(null);

  // Modal State
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Mobile State
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const result = await reservationService.getAllReservations(page, pageSize);
      if (result) {
        setReservations(result.data || []);
        setTotalCount(result.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
      toast.error('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [page]);

  const canSyncPayment = (reservation: Reservation) => {
    return reservation.payment_status !== 'paid' && Boolean(reservation.latest_payment_request?.id);
  };

  const canContinueToBooking = (reservation: Reservation) => {
    return reservation.payment_status === 'paid' && ['reserved', 'confirmed'].includes(reservation.status);
  };

  const canConfirmReservation = (reservation: Reservation) => {
    return reservation.status === 'reserved';
  };

  const canCancelReservation = (reservation: Reservation) => {
    return ['pending_payment', 'reserved', 'confirmed'].includes(reservation.status);
  };

  const handleUpdateStatus = async (id: string, status: ReservationStatus) => {
    try {
      // Get the reservation details first to get the car_id
      const { data: reservation, error: fetchError } = await supabase
        .from('car_reservations')
        .select('car_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update reservation status
      const { error } = await supabase
        .from('car_reservations')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // If reservation is being cancelled or deleted, unfreeze the car
      if (status === 'cancelled' || status === 'expired') {
        const { error: carUpdateError } = await supabase
          .from('cars')
          .update({
            status: 'available',
            updated_at: new Date().toISOString()
          })
          .eq('id', reservation.car_id);

        if (carUpdateError) {
          console.warn('Failed to update car status:', carUpdateError);
        } else {
          console.log(`Car ${reservation.car_id} unfrozen and set to available`);
        }
      }

      toast.success(`Reservation ${status} successfully`);
      fetchReservations();
    } catch (error) {
      console.error('Failed to update reservation status:', error);
      toast.error('Failed to update reservation status');
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!confirm(`Delete reservation ${id.split('-')[0]}? This will unfreeze the car.`)) return;

    try {
      // Get the reservation details first to get the car_id
      const { data: reservation, error: fetchError } = await supabase
        .from('car_reservations')
        .select('car_id, client_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete the reservation
      const { error } = await supabase
        .from('car_reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Unfreeze the car when reservation is deleted
      const { error: carUpdateError } = await supabase
        .from('cars')
        .update({
          status: 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.car_id);

      if (carUpdateError) {
        console.warn('Failed to update car status:', carUpdateError);
      } else {
        console.log(`Car ${reservation.car_id} unfrozen and set to available after reservation deletion`);
      }

      // Insert notification to client about reservation deletion
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: reservation.client_id,
          type: 'reservation_deleted',
          message: `Your reservation #${id} has been deleted. The car is now available for booking.`,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.warn('Notification insertion failed:', notificationError);
      }

      toast.success('Reservation deleted successfully and car is now available!');
      fetchReservations();
      setSelectedReservation(null);
    } catch (error) {
      console.error('Failed to delete reservation:', error);
      toast.error('Failed to delete reservation');
    }
  };

  const handleSyncPayment = async (reservation: Reservation) => {
    try {
      setSyncingReservationId(reservation.id);

      const status = await reservationPaymentService.getPaymentStatus(reservation.id);
      const paymentRequest = reservation.latest_payment_request || status.paymentRequest;

      if (status.paid) {
        toast.success('Reservation payment is already confirmed.');
        await fetchReservations();
        return;
      }

      if (!paymentRequest?.id) {
        throw new Error('No reservation payment request was found for this reservation.');
      }

      const result = await reservationPaymentService.querySTKStatus(paymentRequest.id);

      if (result.paid) {
        toast.success('Reservation payment synced successfully.');
      } else if (result.failed) {
        toast.error(result.description || result.error || 'Reservation payment failed.');
      } else {
        toast.message(result.description || 'Reservation payment is still pending.');
      }

      fetchReservations();
    } catch (error) {
      console.error('Failed to sync reservation payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync reservation payment');
    } finally {
      setSyncingReservationId(null);
    }
  };

  const handleConvertToBooking = async (reservation: Reservation) => {
    try {
      setPreparingBookingId(reservation.id);

      const result = await reservationService.prepareBookingContinuation(reservation.id, 'admin', true);

      if (!result?.link) {
        throw new Error('Booking continuation link could not be prepared');
      }

      try {
        await navigator.clipboard.writeText(result.link);
      } catch {
      }

      window.open(result.link, '_blank', 'noopener,noreferrer');
      toast.success('Booking continuation is ready. The link was copied and opened in a new tab.');
      fetchReservations();
    } catch (error) {
      console.error('Failed to prepare booking continuation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to prepare booking continuation');
    } finally {
      setPreparingBookingId(null);
    }
  };

  const filteredReservations = reservations.filter(r => {
    const matchesTab = activeTab === 'all' || r.status === activeTab;
    const clientName = r.user_profiles?.full_name || r.contact_name || 'Unknown';
    const carModel = `${r.cars?.make} ${r.cars?.model}` || 'Unknown Car';

    const matchesSearch = clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          carModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.contact_email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClientFilter = filterClient === '' || clientName.toLowerCase().includes(filterClient.toLowerCase());
    const matchesCarFilter = filterCar === '' || carModel.toLowerCase().includes(filterCar.toLowerCase());

    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const rStart = new Date(r.start_date);
      const filterStart = new Date(dateRange.start);
      const filterEnd = new Date(dateRange.end);
      matchesDate = rStart >= filterStart && rStart <= filterEnd;
    }

    return matchesTab && matchesSearch && matchesClientFilter && matchesCarFilter && matchesDate;
  });

  if (loading && reservations.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['all', 'pending_payment', 'reserved', 'confirmed', 'cancelled', 'expired'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-warning text-white shadow-lg shadow-warning/20'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab ? (tab.charAt(0).toUpperCase() + tab.slice(1)) : ''}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search reservations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-warning/20 transition-all outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-colors ${showFilters ? 'bg-warning/10 border-warning text-warning' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Client Name</label>
            <input
              type="text"
              placeholder="Filter by client..."
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Car Model</label>
            <input
              type="text"
              placeholder="Filter by car..."
              value={filterCar}
              onChange={(e) => setFilterCar(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50"
            />
          </div>
        </div>
      )}

      {/* Desktop Table */}
      {!isMobile && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Hash size={16} />
                      ID
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Client</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Car</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Dates</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-foreground truncate block w-24" title={reservation.id}>
                        {reservation.id.split('-')[0]}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{reservation.user_profiles?.full_name || reservation.contact_name}</p>
                          <p className="text-xs text-muted-foreground">{reservation.contact_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Car size={16} className="text-muted-foreground" />
                        <span className="text-sm text-foreground">{reservation.cars?.make} {reservation.cars?.model}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{reservation.start_date}</span>
                        <span className="text-xs text-muted-foreground">to {reservation.end_date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">KES {reservation.total_amount?.toLocaleString()}</span>
                        <span className="text-[10px] text-warning font-bold">Fee: KES {reservation.reservation_fee?.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={reservation.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PaymentStatusBadge status={reservation.payment_status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity">
                        <button
                          onClick={() => setSelectedReservation(reservation)}
                          className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-warning transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {canContinueToBooking(reservation) && (
                          <>
                            <button
                              onClick={() => handleConvertToBooking(reservation)}
                              className="p-2 hover:bg-success/10 rounded-lg text-muted-foreground hover:text-success transition-colors"
                              title="Continue to Booking"
                            >
                              {preparingBookingId === reservation.id ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                            </button>
                          </>
                        )}
                        {canSyncPayment(reservation) && (
                          <>
                            <button
                              onClick={() => handleSyncPayment(reservation)}
                              className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                              title="Sync Payment"
                            >
                              {syncingReservationId === reservation.id ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                            </button>
                          </>
                        )}
                        {canConfirmReservation(reservation) && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(reservation.id, 'confirmed')}
                              className="p-2 hover:bg-success/10 rounded-lg text-muted-foreground hover:text-success transition-colors"
                              title="Confirm"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          </>
                        )}
                        {canCancelReservation(reservation) && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(reservation.id, 'cancelled')}
                              className="p-2 hover:bg-error/10 rounded-lg text-muted-foreground hover:text-error transition-colors"
                              title="Cancel"
                            >
                              <XCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteReservation(reservation.id)}
                              className="p-2 hover:bg-error/10 rounded-lg text-muted-foreground hover:text-error transition-colors"
                              title="Delete Reservation"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
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
        <div className="space-y-3">
          {filteredReservations.map((reservation) => (
            <div key={reservation.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* Summary Row */}
              <div
                className="flex justify-between items-center px-4 py-3 bg-card border border-border rounded-xl cursor-pointer select-none hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedRowId(expandedRowId === reservation.id ? null : reservation.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                    <User size={18} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{reservation.user_profiles?.full_name || reservation.contact_name}</p>
                    <p className="text-xs text-muted-foreground">ID: {reservation.id.split('-')[0]}...</p>
                  </div>
                </div>
                <ChevronRight
                  size={20}
                  className={`text-muted-foreground transition-transform duration-200 ${
                    expandedRowId === reservation.id ? 'rotate-90' : ''
                  }`}
                />
              </div>

              {/* Expanded Content */}
              {expandedRowId === reservation.id && (
                <div className="px-4 py-4 space-y-4 border-t border-border bg-muted/10">
                  {/* Car Details */}
                  <div className="flex items-center gap-3">
                    <Car size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{reservation.cars?.make} {reservation.cars?.model}</p>
                      <p className="text-xs text-muted-foreground">{reservation.start_date} to {reservation.end_date}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Amount</p>
                      <p className="font-bold text-foreground">KES {reservation.total_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Reservation Fee</p>
                      <p className="font-bold text-warning">KES {reservation.reservation_fee?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                      <div className="mt-1">
                        <StatusBadge status={reservation.status} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Payment</p>
                      <div className="mt-1">
                        <PaymentStatusBadge status={reservation.payment_status} />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Contact Information</p>
                    <p className="text-sm text-foreground">{reservation.contact_email}</p>
                    <p className="text-sm text-muted-foreground">{reservation.contact_phone}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
                    <button
                      onClick={() => setSelectedReservation(reservation)}
                      className="px-3 py-1.5 bg-warning text-black rounded-lg text-xs font-bold hover:bg-warning/90 transition-colors flex items-center gap-2"
                    >
                      <Eye size={12} />
                      View Details
                    </button>
                    {canContinueToBooking(reservation) && (
                      <>
                        <button
                          onClick={() => handleConvertToBooking(reservation)}
                          className="px-3 py-1.5 bg-success text-white rounded-lg text-xs font-bold hover:bg-success/90 transition-colors flex items-center gap-2"
                        >
                          {preparingBookingId === reservation.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          Continue to Booking
                        </button>
                      </>
                    )}
                    {canSyncPayment(reservation) && (
                      <>
                        <button
                          onClick={() => handleSyncPayment(reservation)}
                          className="px-3 py-1.5 bg-primary text-black rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                          {syncingReservationId === reservation.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          Sync Payment
                        </button>
                      </>
                    )}
                    {canConfirmReservation(reservation) && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(reservation.id, 'confirmed')}
                          className="px-3 py-1.5 bg-success text-white rounded-lg text-xs font-bold hover:bg-success/90 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle2 size={12} />
                          Confirm Reservation
                        </button>
                      </>
                    )}
                    {canCancelReservation(reservation) && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(reservation.id, 'cancelled')}
                          className="px-3 py-1.5 bg-error text-white rounded-lg text-xs font-bold hover:bg-error/90 transition-colors flex items-center gap-2"
                        >
                          <XCircle size={12} />
                          Cancel Reservation
                        </button>
                        <button
                          onClick={() => handleDeleteReservation(reservation.id)}
                          className="px-3 py-1.5 bg-error/90 text-white rounded-lg text-xs font-bold hover:bg-error transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={12} />
                          Delete Reservation
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredReservations.length === 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
          <p className="text-muted-foreground">No reservations found matching your criteria.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/10">
        <span className="text-xs text-muted-foreground font-medium">
          Showing {reservations.length} of {totalCount} entries
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-border rounded-md text-xs font-bold disabled:opacity-50 hover:bg-muted transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold px-2">Page {page}</span>
          </div>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={reservations.length < pageSize}
              className="px-3 py-1 border border-border rounded-md text-xs font-bold disabled:opacity-50 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        </div>

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold">Reservation Details</h2>
                <p className="text-sm text-muted-foreground mt-1">ID: {selectedReservation.id}</p>
              </div>
              <button
                onClick={() => setSelectedReservation(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column */}
                <div className="space-y-8">
                  {/* Reservation Summary */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Calendar size={16} /> Reservation Summary
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <StatusBadge status={selectedReservation.status} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Car</span>
                        <span className="text-sm font-bold">{selectedReservation.cars?.make} {selectedReservation.cars?.model} ({selectedReservation.cars?.year})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Pickup</span>
                        <span className="text-sm font-medium">{new Date(selectedReservation.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Return</span>
                        <span className="text-sm font-medium">{new Date(selectedReservation.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Expires</span>
                        <span className="text-sm font-medium text-warning">
                          {new Date(selectedReservation.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Reservation Fee</span>
                          <span className="text-sm font-bold text-warning">KES {selectedReservation.reservation_fee?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold mt-4">
                          <span>Total Amount</span>
                          <span className="text-warning">KES {selectedReservation.total_amount?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Payment Details */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <CreditCard size={16} /> Payment Details
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <PaymentStatusBadge status={selectedReservation.payment_status} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Provider</span>
                        <span className="text-sm font-mono">{selectedReservation.payment_provider || 'ncba'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Method</span>
                        <span className="text-sm font-mono">{selectedReservation.payment_method || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Reference</span>
                        <span className="text-sm font-mono">{selectedReservation.transaction_code || selectedReservation.latest_payment_request?.provider_transaction_id || 'Pending'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Request Status</span>
                        <span className="text-sm font-medium">{selectedReservation.latest_payment_request?.status || 'No request'}</span>
                      </div>
                      {selectedReservation.latest_payment_request?.status_description && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Gateway Message</p>
                          <p className="text-sm">{selectedReservation.latest_payment_request.status_description}</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Client Information */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <User size={16} /> Client Information
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning font-bold">
                          {selectedReservation.user_profiles?.full_name?.charAt(0) || selectedReservation.contact_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="font-bold">{selectedReservation.user_profiles?.full_name || selectedReservation.contact_name || 'Unknown Client'}</p>
                          <p className="text-xs text-muted-foreground">{selectedReservation.contact_email}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Phone</span>
                        <span className="text-sm font-medium">{selectedReservation.contact_phone || 'N/A'}</span>
                      </div>
                      {selectedReservation.notes && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm">{selectedReservation.notes}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Timeline */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Clock size={16} /> Timeline
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="text-sm font-medium">{new Date(selectedReservation.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Expires</span>
                        <span className="text-sm font-medium text-warning">
                          {new Date(selectedReservation.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Linked Booking</span>
                        <span className="text-sm font-medium">{selectedReservation.linked_booking_id ? selectedReservation.linked_booking_id.split('-')[0] : 'Not started'}</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/10 flex flex-wrap gap-3 justify-end">
              {canContinueToBooking(selectedReservation) && (
                <>
                  <button
                    onClick={() => handleConvertToBooking(selectedReservation)}
                    className="px-4 py-2 rounded-lg font-bold border border-warning text-warning hover:bg-warning/10 transition-colors flex items-center gap-2"
                  >
                    {preparingBookingId === selectedReservation.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Continue to Booking
                  </button>
                </>
              )}
              {canSyncPayment(selectedReservation) && (
                <>
                  <button
                    onClick={() => handleSyncPayment(selectedReservation)}
                    className="px-4 py-2 rounded-lg font-bold border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                  >
                    {syncingReservationId === selectedReservation.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sync Payment
                  </button>
                </>
              )}
              {canConfirmReservation(selectedReservation) && (
                <>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReservation.id, 'confirmed');
                      setSelectedReservation(null);
                    }}
                    className="px-4 py-2 rounded-lg font-bold bg-success text-white hover:bg-success/90 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Confirm Reservation
                  </button>
                </>
              )}
              {canCancelReservation(selectedReservation) && (
                <>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReservation.id, 'cancelled');
                      setSelectedReservation(null);
                    }}
                    className="px-4 py-2 rounded-lg font-bold bg-error text-white hover:bg-error/90 transition-colors flex items-center gap-2"
                  >
                    <XCircle size={16} /> Cancel Reservation
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </>
);
}
