import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { 
  Search, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  MoreHorizontal,
  FileText,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---

type DriverStatus = 'active' | 'suspended' | 'pending_verification';
type VerificationStatus = 'verified' | 'pending' | 'rejected' | 'not_submitted';

interface DriverItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: DriverStatus;
  licenseStatus: VerificationStatus;
  idStatus: VerificationStatus;
  joinedDate: string;
  rating: number;
  totalTrips: number;
}

// --- Components ---

const StatusBadge = ({ status }: { status: DriverStatus }) => {
  const styles = {
    active: 'bg-success/10 text-success border-success/20',
    suspended: 'bg-error/10 text-error border-error/20',
    pending_verification: 'bg-warning/10 text-warning border-warning/20',
  };

  const labels = {
    active: 'Active',
    suspended: 'Suspended',
    pending_verification: 'Pending Verification',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const VerificationIcon = ({ status }: { status: VerificationStatus }) => {
  const icons = {
    verified: <CheckCircle2 size={14} className="text-success" />,
    pending: <Clock size={14} className="text-warning" />,
    rejected: <XCircle size={14} className="text-error" />,
    not_submitted: <AlertCircle size={14} className="text-muted-foreground" />,
  };

  return (
    <div className="flex items-center gap-1.5">
      {icons[status]}
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {status.replace('_', ' ')}
      </span>
    </div>
  );
};

export function AdminDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDrivers();
      setDrivers(data || []);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleUpdateStatus = async (id: string, status: DriverStatus) => {
    const action = status === 'suspended' ? 'suspend' : 'activate';
    const promise = (async () => {
      await adminService.updateDriverStatus(id, status);
      fetchDrivers();
    })();

    toast.promise(promise, {
      loading: `${action === 'suspend' ? 'Suspending' : 'Activating'} driver...`,
      success: `Driver ${action === 'suspend' ? 'suspended' : 'activated'} successfully`,
      error: `Failed to ${action} driver`
    });
  };

  const filteredDrivers = drivers.map(d => ({
    id: d.id,
    name: d.full_name || 'No Name',
    email: d.email || 'No Email',
    phone: d.phone_number || 'No Phone',
    status: d.driver_profiles?.status || 'pending_verification',
    licenseStatus: d.driver_profiles?.license_status || 'pending',
    idStatus: d.driver_profiles?.id_status || 'pending',
    joinedDate: new Date(d.created_at).toLocaleDateString(),
    rating: d.driver_profiles?.rating || 0,
    totalTrips: d.driver_profiles?.total_trips || 0
  })).filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && drivers.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <div className="animate-spin text-primary">
          <Clock size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search drivers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm w-full md:w-80 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-card border border-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <button 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
          onClick={() => setIsAddModalOpen(true)}
        >
          Add New Driver
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Driver</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Rating / Trips</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Joined Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-none">{driver.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{driver.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <VerificationIcon status={driver.licenseStatus} />
                      <VerificationIcon status={driver.idStatus} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={driver.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-foreground">{driver.rating}</span>
                        <span className="text-xs text-warning">★</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{driver.totalTrips} Trips</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground font-medium">{driver.joinedDate}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedDriver(driver)}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors" title="View Profile">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors" title="View Documents">
                        <FileText size={18} />
                      </button>
                      {driver.status === 'active' ? (
                        <button 
                          onClick={() => handleUpdateStatus(driver.id, 'suspended')}
                          className="p-2 hover:bg-error/10 rounded-lg text-muted-foreground hover:text-error transition-colors" 
                          title="Suspend Driver"
                        >
                          <UserX size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateStatus(driver.id, 'active')}
                          className="p-2 hover:bg-success/10 rounded-lg text-muted-foreground hover:text-success transition-colors" 
                          title="Activate Driver"
                        >
                          <UserCheck size={18} />
                        </button>
                      )}
                      <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDrivers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No drivers found matching your criteria.</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/10">
          <span className="text-xs text-muted-foreground font-medium">Showing {filteredDrivers.length} of {drivers.length} entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-border rounded-md text-xs font-bold disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-border rounded-md text-xs font-bold disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
      {/* Add Driver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">Add New Driver</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const driver = {
                full_name: formData.get('full_name'),
                email: formData.get('email'),
                phone_number: formData.get('phone_number'),
                license_number: formData.get('license_number'),
              };
              try {
                const promise = adminService.addDriver(driver);
                toast.promise(promise, {
                  loading: 'Adding driver...',
                  success: 'Driver added successfully',
                  error: 'Failed to add driver'
                });
                await promise;
                setIsAddModalOpen(false);
                fetchDrivers();
              } catch (error) {
                // Error handled by toast.promise
              }
            }} className="space-y-4">
              <input name="full_name" placeholder="Full Name" className="w-full p-2 border border-border rounded-lg" required />
              <input name="email" type="email" placeholder="Email" className="w-full p-2 border border-border rounded-lg" required />
              <input name="phone_number" placeholder="Phone Number" className="w-full p-2 border border-border rounded-lg" required />
              <input name="license_number" placeholder="License Number" className="w-full p-2 border border-border rounded-lg" required />
              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 bg-muted rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl font-bold">Add Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Driver Profile Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-bold text-xl">Driver Profile: {selectedDriver.name}</h3>
              <button onClick={() => setSelectedDriver(null)} className="text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-muted-foreground uppercase">Personal Details</h4>
                <p><strong>Email:</strong> {selectedDriver.email}</p>
                <p><strong>Phone:</strong> {selectedDriver.phone}</p>
                <p><strong>Joined:</strong> {selectedDriver.joinedDate}</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-muted-foreground uppercase">Performance</h4>
                <p><strong>Rating:</strong> {selectedDriver.rating} ★</p>
                <p><strong>Total Trips:</strong> {selectedDriver.totalTrips}</p>
                <p><strong>Status:</strong> {selectedDriver.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
