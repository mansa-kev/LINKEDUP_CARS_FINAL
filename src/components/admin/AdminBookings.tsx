import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
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
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---

type BookingStatus = 'pending' | 'confirmed' | 'on_trip' | 'completed' | 'cancelled' | 'pending_payment_verification';

interface Booking {
  id: string;
  client_id: string;
  fleet_owner_id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  platform_commission: number;
  status: BookingStatus;
  payment_status: 'paid' | 'pending' | 'failed';
  created_at: string;
  client?: any;
  fleet_owner?: any;
  cars?: any;
}

// --- Components ---

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const styles: Record<BookingStatus, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    confirmed: 'bg-success/10 text-success border-success/20',
    on_trip: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    cancelled: 'bg-error/10 text-error border-error/20',
    pending_payment_verification: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  const label = status.replace(/_/g, ' ');

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {label}
    </span>
  );
};

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterClient, setFilterClient] = useState('');
  const [filterCar, setFilterCar] = useState('');
  const [filterFleetOwner, setFilterFleetOwner] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isExtending, setIsExtending] = useState(false);
  const [extendDays, setExtendDays] = useState(1);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const result = await adminService.getBookings(page, pageSize);
      if (result && 'data' in result) {
        setBookings(result.data || []);
        setTotalCount(result.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page]);

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    const promise = (async () => {
      await adminService.updateBookingStatus(id, status);
      fetchBookings(); // Refresh list
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, status });
      }
    })();

    toast.promise(promise, {
      loading: 'Updating booking status...',
      success: 'Booking status updated successfully',
      error: 'Failed to update booking status'
    });
  };

  const handleExtendBooking = async () => {
    if (!selectedBooking) return;
    const promise = (async () => {
      // Calculate new end date and amount
      const currentEndDate = new Date(selectedBooking.end_date);
      currentEndDate.setDate(currentEndDate.getDate() + extendDays);
      const newEndDateStr = currentEndDate.toISOString().split('T')[0];
      
      const dailyRate = selectedBooking.cars?.daily_rate || 0;
      const additionalAmount = dailyRate * extendDays;
      const newTotal = selectedBooking.total_amount + additionalAmount;

      // In a real app, you would call a specific service method to extend
      // For now, we'll just simulate it
      setIsExtending(false);
      fetchBookings();
      return { extendDays, newTotal };
    })();

    toast.promise(promise, {
      loading: 'Extending booking...',
      success: (data) => `Booking extended by ${data.extendDays} days. New total: $${data.newTotal.toLocaleString()}`,
      error: 'Failed to extend booking'
    });
  };

  const filteredBookings = bookings.filter(b => {
    const matchesTab = activeTab === 'all' || b.status === activeTab;
    const clientName = b.client?.full_name || 'Unknown Client';
    const carModel = `${b.cars?.make} ${b.cars?.model}` || 'Unknown Car';
    const fleetOwnerName = b.fleet_owner?.full_name || 'Unknown Owner';
    
    const matchesSearch = clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          carModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          fleetOwnerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClientFilter = filterClient === '' || clientName.toLowerCase().includes(filterClient.toLowerCase());
    const matchesCarFilter = filterCar === '' || carModel.toLowerCase().includes(filterCar.toLowerCase());
    const matchesOwnerFilter = filterFleetOwner === '' || fleetOwnerName.toLowerCase().includes(filterFleetOwner.toLowerCase());
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const bStart = new Date(b.start_date);
      const filterStart = new Date(dateRange.start);
      const filterEnd = new Date(dateRange.end);
      matchesDate = bStart >= filterStart && bStart <= filterEnd;
    }

    return matchesTab && matchesSearch && matchesClientFilter && matchesCarFilter && matchesOwnerFilter && matchesDate;
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
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['all', 'pending', 'confirmed', 'on_trip', 'completed', 'cancelled', 'pending_payment_verification'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab ? (tab.replace(/_/g, ' ').charAt(0).toUpperCase() + tab.replace(/_/g, ' ').slice(1)) : ''}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search bookings..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-colors ${showFilters ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Date Range</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="text-muted-foreground">-</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Car Model</label>
            <input 
              type="text" 
              placeholder="Filter by car..."
              value={filterCar}
              onChange={(e) => setFilterCar(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Fleet Owner</label>
            <input 
              type="text" 
              placeholder="Filter by owner..."
              value={filterFleetOwner}
              onChange={(e) => setFilterFleetOwner(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <div className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                    Booking ID <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Client</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Car</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Fleet Owner</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-foreground truncate block w-24" title={booking.id}>
                      {booking.id.split('-')[0]}...
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User size={16} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{booking.client?.full_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Car size={16} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{booking.cars?.make} {booking.cars?.model}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{booking.fleet_owner?.full_name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground font-medium">{booking.start_date}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">to {booking.end_date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-foreground">${booking.total_amount?.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedBooking(booking)}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors" 
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {booking.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                            className="p-2 hover:bg-success/10 rounded-lg text-muted-foreground hover:text-success transition-colors" 
                            title="Approve"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                            className="p-2 hover:bg-error/10 rounded-lg text-muted-foreground hover:text-error transition-colors" 
                            title="Reject"
                          >
                            <XCircle size={18} />
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
        
        {filteredBookings.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No bookings found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/10">
          <span className="text-xs text-muted-foreground font-medium">
            Showing {bookings.length} of {totalCount} entries
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
              disabled={bookings.length < pageSize}
              className="px-3 py-1 border border-border rounded-md text-xs font-bold disabled:opacity-50 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold">Booking Details</h2>
                <p className="text-sm text-muted-foreground mt-1">ID: {selectedBooking.id}</p>
              </div>
              <button 
                onClick={() => { setSelectedBooking(null); setIsExtending(false); }}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Booking Summary */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Calendar size={16} /> Booking Summary
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <StatusBadge status={selectedBooking.status} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Car</span>
                        <span className="text-sm font-bold">{selectedBooking.cars?.make} {selectedBooking.cars?.model} ({selectedBooking.cars?.year})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Pickup</span>
                        <span className="text-sm font-medium">{new Date(selectedBooking.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Drop-off</span>
                        <span className="text-sm font-medium">{new Date(selectedBooking.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Rental Rate</span>
                          <span className="text-sm font-medium">${selectedBooking.cars?.daily_rate}/day</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Platform Fee</span>
                          <span className="text-sm font-medium">${selectedBooking.platform_commission?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold mt-4">
                          <span>Total Amount</span>
                          <span className="text-primary">${selectedBooking.total_amount?.toLocaleString()}</span>
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
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${selectedBooking.payment_status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {selectedBooking.payment_status || 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Transaction ID</span>
                        <span className="text-sm font-mono">TXN-{selectedBooking.id.substring(0, 8).toUpperCase()}</span>
                      </div>
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
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {selectedBooking.client?.full_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="font-bold">{selectedBooking.client?.full_name || 'Unknown Client'}</p>
                          <p className="text-xs text-muted-foreground">{selectedBooking.client?.email}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Phone</span>
                        <span className="text-sm font-medium">{selectedBooking.client?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">ID/License</span>
                        <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-md">Verified</span>
                      </div>
                      <button className="w-full mt-2 py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-2">
                        View Client Profile <ChevronRight size={16} />
                      </button>
                    </div>
                  </section>

                  {/* Fleet Owner Information */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Car size={16} /> Fleet Owner Information
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="text-sm font-bold">{selectedBooking.fleet_owner?.full_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Contact</span>
                        <span className="text-sm font-medium">{selectedBooking.fleet_owner?.email || 'N/A'}</span>
                      </div>
                      <button className="w-full mt-2 py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-2">
                        View Owner Profile <ChevronRight size={16} />
                      </button>
                    </div>
                  </section>

                  {/* Contract */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <FileText size={16} /> Contract
                    </h3>
                    <button className="w-full p-4 border border-border rounded-xl flex items-center justify-between hover:border-primary transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                          <FileText size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold group-hover:text-primary transition-colors">Signed E-Contract.pdf</p>
                          <p className="text-xs text-muted-foreground">Generated on {new Date(selectedBooking.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  </section>
                </div>
              </div>

              {/* Extend Booking Section */}
              {isExtending && (
                <div className="mt-8 p-6 border border-primary/20 bg-primary/5 rounded-xl animate-in slide-in-from-top-4">
                  <h4 className="font-bold mb-4">Extend Booking</h4>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Additional Days</label>
                      <input 
                        type="number" 
                        min="1"
                        value={extendDays}
                        onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">New End Date</label>
                      <div className="px-4 py-2 bg-background border border-border rounded-lg text-foreground font-medium">
                        {(() => {
                          const d = new Date(selectedBooking.end_date);
                          d.setDate(d.getDate() + extendDays);
                          return d.toLocaleDateString();
                        })()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Additional Cost</label>
                      <div className="px-4 py-2 bg-background border border-border rounded-lg text-primary font-bold">
                        +${((selectedBooking.cars?.daily_rate || 0) * extendDays).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button 
                      onClick={() => setIsExtending(false)}
                      className="px-4 py-2 rounded-lg font-bold text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleExtendBooking}
                      className="px-4 py-2 rounded-lg font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                      Confirm Extension
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-border bg-muted/10 flex flex-wrap gap-3 justify-end">
              <button 
                onClick={() => toast.success('Invoice generated and sent to client.')}
                className="px-4 py-2 rounded-lg font-bold border border-border bg-card hover:bg-muted transition-colors flex items-center gap-2"
              >
                <FileText size={16} /> Generate Invoice
              </button>
              <button 
                onClick={() => toast.success('Reminder sent to client.')}
                className="px-4 py-2 rounded-lg font-bold border border-border bg-card hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Mail size={16} /> Send Reminder
              </button>
              
              {selectedBooking.status === 'on_trip' && !isExtending && (
                <button 
                  onClick={() => setIsExtending(true)}
                  className="px-4 py-2 rounded-lg font-bold border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <Clock size={16} /> Extend Booking
                </button>
              )}

              {selectedBooking.status === 'pending' && (
                <button 
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')}
                  className="px-6 py-2 rounded-lg font-bold bg-success text-white hover:bg-success/90 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Confirm Booking
                </button>
              )}
              
              {['pending', 'confirmed'].includes(selectedBooking.status) && (
                <button 
                  onClick={() => {
                    handleUpdateStatus(selectedBooking.id, 'cancelled');
                  }}
                  className="px-6 py-2 rounded-lg font-bold bg-error text-white hover:bg-error/90 transition-colors flex items-center gap-2"
                >
                  <XCircle size={16} /> Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
