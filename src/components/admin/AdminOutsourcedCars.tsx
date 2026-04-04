import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Car } from '../../types';
import {
  Truck,
  Search,
  DollarSign,
  Car as CarIcon,
  Users,
  TrendingUp,
  Phone,
  Mail,
  Edit,
  Eye,
  ChevronDown,
  Loader2,
  Plus,
  X,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';

interface OutsourceOwner {
  name: string;
  phone: string;
  email: string;
  carCount: number;
  totalEarnings: number;
}

type TabId = 'overview' | 'cars' | 'owners' | 'financials';

export function AdminOutsourcedCars() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOutsourcedCars();
  }, []);

  const fetchOutsourcedCars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('is_outsourced', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching outsourced cars:', error);
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = cars.filter(car => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      `${car.make} ${car.model}`.toLowerCase().includes(q) ||
      car.license_plate?.toLowerCase().includes(q) ||
      car.outsource_owner_name?.toLowerCase().includes(q)
    );
  });

  // Derive owner stats
  const owners: OutsourceOwner[] = [];
  const ownerMap = new Map<string, OutsourceOwner>();
  cars.forEach(car => {
    const name = car.outsource_owner_name || 'Unknown';
    if (!ownerMap.has(name)) {
      ownerMap.set(name, {
        name,
        phone: car.outsource_owner_phone || '',
        email: car.outsource_owner_email || '',
        carCount: 0,
        totalEarnings: 0,
      });
    }
    const owner = ownerMap.get(name)!;
    owner.carCount++;
  });
  ownerMap.forEach(o => owners.push(o));

  const totalCommission = cars.reduce((sum, c) => {
    const rate = c.outsource_commission_rate || 15;
    return sum + (c.daily_rate * rate / 100);
  }, 0);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'cars', label: `Cars (${cars.length})` },
    { id: 'owners', label: `Owners (${owners.length})` },
    { id: 'financials', label: 'Financials' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Truck className="text-primary" size={28} />
            Outsourced Cars
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage vehicles from external companies and individuals
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={CarIcon} label="Total Vehicles" value={String(cars.length)} color="primary" />
                <StatCard icon={Users} label="Total Owners" value={String(owners.length)} color="blue" />
                <StatCard icon={DollarSign} label="Est. Daily Commission" value={`KES ${Math.round(totalCommission).toLocaleString()}`} color="green" />
                <StatCard icon={TrendingUp} label="Available" value={String(cars.filter(c => c.status === 'available').length)} color="amber" />
              </div>

              {cars.length === 0 && (
                <div className="text-center py-16 bg-card rounded-2xl border border-border">
                  <Truck className="mx-auto text-muted-foreground mb-4" size={48} />
                  <h3 className="text-lg font-bold mb-2">No Outsourced Cars Yet</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    To add outsourced cars, go to Cars Management and toggle the "Outsourced Vehicle" option when adding or editing a car.
                  </p>
                </div>
              )}

              {/* Recent outsourced cars */}
              {cars.length > 0 && (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 md:p-6 border-b border-border">
                    <h3 className="font-bold text-sm">Recent Outsourced Vehicles</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {cars.slice(0, 5).map(car => (
                      <div key={car.id} className="p-4 md:p-6 flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img
                            src={car.primary_image_url || `https://picsum.photos/seed/${car.id}/200/150`}
                            alt={`${car.make} ${car.model}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{car.make} {car.model} ({car.year})</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Owner: {car.outsource_owner_name || 'N/A'} | Commission: {car.outsource_commission_rate || 15}%
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary">KES {car.daily_rate?.toLocaleString()}/day</p>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                            car.status === 'available' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${car.status === 'available' ? 'bg-green-500' : 'bg-red-500'}`} />
                            {car.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cars Tab */}
          {activeTab === 'cars' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by car name, plate, or owner..."
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Table header - desktop */}
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 p-4 border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Vehicle</span>
                  <span>Owner</span>
                  <span>Rate/Day</span>
                  <span>Commission</span>
                  <span>Status</span>
                </div>

                <div className="divide-y divide-border">
                  {filteredCars.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      {searchQuery ? 'No cars match your search' : 'No outsourced cars found'}
                    </div>
                  ) : (
                    filteredCars.map(car => (
                      <div key={car.id} className="p-4 flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 md:gap-4 md:items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-lg overflow-hidden bg-muted shrink-0">
                            <img
                              src={car.primary_image_url || `https://picsum.photos/seed/${car.id}/100/75`}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{car.make} {car.model}</p>
                            <p className="text-[10px] text-muted-foreground">{car.license_plate} | {car.year}</p>
                          </div>
                        </div>
                        <div className="md:block">
                          <span className="md:hidden text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2">Owner:</span>
                          <span className="text-sm">{car.outsource_owner_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="md:hidden text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2">Rate:</span>
                          <span className="text-sm font-bold text-primary">KES {car.daily_rate?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="md:hidden text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2">Commission:</span>
                          <span className="text-sm">{car.outsource_commission_rate || 15}%</span>
                        </div>
                        <div>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            car.status === 'available' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${car.status === 'available' ? 'bg-green-500' : 'bg-red-500'}`} />
                            {car.status}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Owners Tab */}
          {activeTab === 'owners' && (
            <div className="space-y-4">
              {owners.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-border">
                  <Users className="mx-auto text-muted-foreground mb-4" size={48} />
                  <h3 className="text-lg font-bold mb-2">No Owners Found</h3>
                  <p className="text-muted-foreground text-sm">Owner data is derived from outsourced car records.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {owners.map(owner => (
                    <div key={owner.name} className="bg-card rounded-2xl border border-border p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {owner.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold">{owner.name}</p>
                          <p className="text-xs text-muted-foreground">{owner.carCount} vehicle{owner.carCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {owner.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone size={14} />
                            <span>{owner.phone}</span>
                          </div>
                        )}
                        {owner.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail size={14} />
                            <span>{owner.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Financials Tab */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-2xl border border-border p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Total Fleet Value (Daily)</p>
                  <p className="text-2xl font-bold text-foreground">
                    KES {cars.reduce((s, c) => s + c.daily_rate, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Est. Daily Commission</p>
                  <p className="text-2xl font-bold text-green-500">
                    KES {Math.round(totalCommission).toLocaleString()}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Avg. Commission Rate</p>
                  <p className="text-2xl font-bold text-primary">
                    {cars.length > 0
                      ? (cars.reduce((s, c) => s + (c.outsource_commission_rate || 15), 0) / cars.length).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="p-4 md:p-6 border-b border-border">
                  <h3 className="font-bold text-sm">Commission Breakdown by Vehicle</h3>
                </div>
                <div className="divide-y divide-border">
                  {cars.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">No data available</div>
                  ) : (
                    cars.map(car => {
                      const rate = car.outsource_commission_rate || 15;
                      const commission = car.daily_rate * rate / 100;
                      return (
                        <div key={car.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold">{car.make} {car.model}</p>
                            <p className="text-xs text-muted-foreground">{car.outsource_owner_name || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">KES {car.daily_rate?.toLocaleString()}/day</p>
                            <div className="flex items-center gap-2 justify-end mt-0.5">
                              <Percent size={10} className="text-primary" />
                              <span className="text-xs text-muted-foreground">{rate}%</span>
                              <span className="text-xs text-green-500 font-bold">= KES {Math.round(commission).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    amber: 'bg-amber-500/10 text-amber-500',
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
      <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg md:text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
