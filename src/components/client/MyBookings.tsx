import React, { useEffect, useState } from 'react';
import { clientService } from '../../services/clientService';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Calendar, Car, ChevronRight, Clock, CheckCircle, XCircle, RefreshCw, FileText, CreditCard, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await clientService.getAllBookings(user.id);
        setBookings(data || []);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const matchesSearch = b.cars.make.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.cars.model.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">Confirmed</span>;
      case 'in_progress':
        return <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold">On Trip</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Completed</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">Cancelled</span>;
      default:
        return <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (loading) return <div className="p-8">Loading your bookings...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">My Bookings</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search car..." 
              className="pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">On Trip</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Car Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center overflow-hidden">
                      {booking.cars.primary_image_url ? (
                        <img src={booking.cars.primary_image_url} alt={booking.cars.model} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="text-muted-foreground" size={32} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{booking.cars.make} {booking.cars.model}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar size={14} /> {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Plate: {booking.cars.license_plate}</p>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="flex flex-col lg:items-end">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold text-primary">KES {booking.total_amount.toLocaleString()}</p>
                    <p className={`text-xs font-medium mt-1 ${booking.payment_status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                      Payment: {booking.payment_status?.toUpperCase() || 'N/A'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button className="flex-1 sm:flex-none px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                      <FileText size={16} /> Details
                    </button>
                    
                    {booking.status === 'confirmed' && (
                      <button className="flex-1 sm:flex-none px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                        <XCircle size={16} /> Cancel
                      </button>
                    )}

                    {booking.status === 'in_progress' && (
                      <>
                        <button className="flex-1 sm:flex-none px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                          <Clock size={16} /> Extend
                        </button>
                        <button className="flex-1 sm:flex-none px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                          <Phone size={16} /> Support
                        </button>
                      </>
                    )}

                    {booking.status === 'completed' && (
                      <button className="flex-1 sm:flex-none px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                        <RefreshCw size={16} /> Re-book
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer Links */}
              <div className="px-6 py-3 bg-muted/30 border-t border-border flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                <Link to="/client/glovebox" className="hover:text-primary flex items-center gap-1">
                  <FileText size={14} /> View Contract
                </Link>
                <Link to="/client/glovebox" className="hover:text-primary flex items-center gap-1">
                  <CreditCard size={14} /> View Receipt
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
            <Car className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground font-medium">No bookings found matching your criteria.</p>
            <button className="mt-4 text-primary font-bold hover:underline">Browse Cars</button>
          </div>
        )}
      </div>
    </div>
  );
}
