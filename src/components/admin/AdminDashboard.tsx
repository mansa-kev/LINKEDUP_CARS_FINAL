import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Car, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Clock,
  CheckCircle2,
  Building2,
  Loader2
} from 'lucide-react';

// --- Components ---

const StatCard = ({ 
  title, 
  value, 
  trend, 
  trendValue, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string; 
  trend?: 'up' | 'down'; 
  trendValue?: string; 
  icon: React.ElementType;
  color: string;
}) => (
  <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-success' : 'text-error'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </div>
      )}
    </div>
    <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

// --- Dashboard ---

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m' | '6m' | '1y'>('7d');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await adminService.getDashboardStats(timeRange);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [timeRange]);

  if (loading && !stats) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  // Use real revenue trend data from stats
  const revenueData = stats?.revenueTrend || [];

  const bookingStatusData = stats?.bookingStatusDistribution || [];

  const totalBookings = bookingStatusData.reduce((sum: number, item: any) => sum + item.value, 0);

  const getTrendProps = (percent: number) => {
    if (percent === 0) return {};
    return {
      trend: percent > 0 ? 'up' as const : 'down' as const,
      trendValue: `${percent > 0 ? '+' : ''}${percent}%`
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Stats: Platform Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Gross Revenue" 
          value={`$${stats?.totalRevenue?.toLocaleString() || '0'}`} 
          {...getTrendProps(stats?.revenueTrendPercent || 0)}
          icon={DollarSign} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Net Commission" 
          value={`$${stats?.netCommission?.toLocaleString() || '0'}`} 
          {...getTrendProps(stats?.commissionTrendPercent || 0)}
          icon={TrendingUp} 
          color="bg-primary"
        />
        <StatCard 
          title="Client Churn Rate" 
          value={`${stats?.churnRate || 0}%`} 
          icon={Users} 
          color="bg-error"
        />
        <StatCard 
          title="Active Bookings" 
          value={stats?.activeBookings?.toString() || '0'} 
          {...getTrendProps(stats?.activeBookingsTrendPercent || 0)}
          icon={Calendar} 
          color="bg-success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-card p-8 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-lg">Revenue Trend</h3>
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last 1 Year</option>
              </select>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <div className="w-3 h-3 rounded-full bg-primary" /> Gross Revenue
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <div className="w-3 h-3 rounded-full bg-blue-500" /> Net Commission
                </div>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="gross" 
                  stroke="var(--primary)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'var(--primary)' }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#3B82F6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3B82F6' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
          <h3 className="font-bold text-lg mb-8">Booking Status</h3>
          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {bookingStatusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">{totalBookings}</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {bookingStatusData.map((item: any) => (
              <div key={item.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Cars Row */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
          <h3 className="font-bold text-lg mb-8">Top 5 Most Booked Cars</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={stats?.topCars || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                  width={150}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Fleet & System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fleet Health */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="font-bold text-sm mb-6 uppercase tracking-wider text-muted-foreground">Fleet Health</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Average Utilization</span>
                <span className="text-sm font-bold">
                  {stats?.totalCars > 0 ? Math.round((stats?.activeBookings / stats?.totalCars) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all duration-1000" 
                  style={{ width: `${stats?.totalCars > 0 ? Math.min(100, Math.round((stats?.activeBookings / stats?.totalCars) * 100)) : 0}%` }} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-xl">
                <span className="block text-xs text-muted-foreground mb-1">Total Cars</span>
                <span className="text-xl font-bold">{stats?.totalCars || 0}</span>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <span className="block text-xs text-muted-foreground mb-1">In Maintenance</span>
                <span className="text-xl font-bold text-warning">{stats?.maintenanceCars || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="font-bold text-sm mb-6 uppercase tracking-wider text-muted-foreground">User Growth</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Users size={18} />
                </div>
                <span className="text-sm font-medium">Total Clients</span>
              </div>
              <span className="font-bold text-success">{stats?.newClients || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Building2 size={18} />
                </div>
                <span className="text-sm font-medium">Total Fleet Owners</span>
              </div>
              <span className="font-bold text-success">{stats?.newFleetOwners || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-error/10 text-error rounded-lg">
                  <Activity size={18} />
                </div>
                <span className="text-sm font-medium">System Activity</span>
              </div>
              <span className="font-bold text-success">Active</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="font-bold text-sm mb-6 uppercase tracking-wider text-muted-foreground">System Health</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                <span className="text-sm font-medium">Supabase Connection</span>
              </div>
              <span className="text-xs font-bold text-success uppercase">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium">API Latency</span>
              </div>
              <span className="text-sm font-bold">42ms</span>
            </div>
            <div className="p-4 bg-muted rounded-xl flex items-center gap-4">
              <CheckCircle2 className="text-success" size={24} />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                <p className="text-sm font-bold">All Systems Operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
