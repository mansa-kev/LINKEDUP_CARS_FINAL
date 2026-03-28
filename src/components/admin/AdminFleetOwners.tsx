import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { 
  Search, 
  Building2, 
  Car, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  MoreHorizontal, 
  Eye, 
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Loader2,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Filter,
  MessageSquare,
  Ban,
  CheckCircle
} from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-success/10 text-success border-success/20',
    pending_verification: 'bg-warning/10 text-warning border-warning/20',
    suspended: 'bg-error/10 text-error border-error/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.pending_verification}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export function AdminFleetOwners() {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [commissionFilter, setCommissionFilter] = useState('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any | null>(null);
  const [editingOwner, setEditingOwner] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    id: '',
    company_name: '',
    contact_name: '',
    email: '',
    phone_number: '',
    password: '',
    commission_rate: 0.15,
    status: 'pending_verification'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const ownersData = await adminService.getFleetOwnersWithStats();
      setOwners(ownersData || []);
    } catch (error) {
      console.error('Failed to fetch fleet owners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOwner) {
        await adminService.updateFleetOwner(editingOwner.id, {
          company_name: formData.company_name,
          commission_rate: formData.commission_rate,
          status: formData.status
        });
      } else {
        await adminService.createFleetOwnerAccount(formData);
      }
      setIsModalOpen(false);
      setEditingOwner(null);
      fetchData();
    } catch (error: any) {
      alert(`Failed to save fleet owner: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this fleet owner? Their role will be reverted to client.')) return;
    try {
      await adminService.deleteFleetOwner(id);
      fetchData();
    } catch (error) {
      alert('Failed to delete fleet owner');
    }
  };

  const openAddModal = () => {
    setEditingOwner(null);
    setFormData({
      id: '',
      company_name: '',
      contact_name: '',
      email: '',
      phone_number: '',
      password: Math.random().toString(36).slice(-8),
      commission_rate: 0.15,
      status: 'pending_verification'
    });
    setIsModalOpen(true);
  };

  const handleResetPassword = async (email: string) => {
    if (!window.confirm(`Are you sure you want to send a password reset email to ${email}?`)) return;
    try {
      await adminService.resetFleetOwnerPassword(email);
      alert('Password reset email sent successfully.');
    } catch (error: any) {
      alert(`Failed to send password reset email: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await adminService.updateFleetOwnerSettings(id, { status: newStatus });
      fetchData();
      if (selectedOwner && selectedOwner.id === id) {
        setSelectedOwner({
          ...selectedOwner,
          fleet_owner_settings: [{ ...selectedOwner.fleet_owner_settings[0], status: newStatus }]
        });
      }
    } catch (error: any) {
      alert(`Failed to update status: ${error.message || 'Unknown error'}`);
    }
  };

  const openEditModal = (owner: any) => {
    const settings = owner.fleet_owner_settings?.[0] || {};
    setEditingOwner(owner);
    setFormData({
      id: owner.id,
      company_name: settings.company_name || '',
      commission_rate: settings.commission_rate || 0.15,
      status: settings.status || 'pending_verification'
    });
    setIsModalOpen(true);
  };

  const filteredOwners = owners.filter(o => {
    const settings = o.fleet_owner_settings?.[0] || {};
    const companyName = settings.company_name || 'No Company Name';
    const contactName = o.full_name || 'Unknown Contact';
    
    const matchesSearch = companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.id.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesStatus = statusFilter === 'all' || settings.status === statusFilter;
    
    let matchesCommission = true;
    if (commissionFilter === 'high') matchesCommission = settings.commission_rate >= 0.20;
    if (commissionFilter === 'medium') matchesCommission = settings.commission_rate >= 0.10 && settings.commission_rate < 0.20;
    if (commissionFilter === 'low') matchesCommission = settings.commission_rate < 0.10;

    return matchesSearch && matchesStatus && matchesCommission;
  });

  if (loading && owners.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fleet Owners</h2>
          <p className="text-muted-foreground">Manage fleet owners, monitor performance, and handle payouts.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-primary/20"
        >
          <Plus size={18} /> Add Fleet Owner
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search by company or contact name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-muted border-none rounded-xl text-sm w-full focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-muted border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_verification">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={commissionFilter}
              onChange={(e) => setCommissionFilter(e.target.value)}
              className="px-4 py-2 bg-muted border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Commissions</option>
              <option value="high">High (≥ 20%)</option>
              <option value="medium">Medium (10% - 19%)</option>
              <option value="low">Low (&lt; 10%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fleet Owner List Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Owner ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Company & Contact</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Commission</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Cars</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Earnings</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOwners.map((owner) => {
                const settings = owner.fleet_owner_settings?.[0] || {};
                return (
                  <tr key={owner.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{owner.id.split('-')[0]}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{settings.company_name || 'No Company Name'}</p>
                          <p className="text-xs text-muted-foreground">{owner.full_name} • {owner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold">{(settings.commission_rate * 100).toFixed(0)}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={settings.status || 'pending_verification'} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold">{owner.total_cars || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold">${(owner.total_earnings || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedOwner(owner)}
                          className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors" 
                          title="View Profile"
                        >
                          <Eye size={18} />
                        </button>
                        {settings.status === 'active' ? (
                          <button 
                            onClick={() => handleStatusChange(owner.id, 'suspended')}
                            className="p-2 hover:bg-error/10 rounded-lg text-muted-foreground hover:text-error transition-colors" 
                            title="Suspend"
                          >
                            <Ban size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStatusChange(owner.id, 'active')}
                            className="p-2 hover:bg-success/10 rounded-lg text-muted-foreground hover:text-success transition-colors" 
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => openEditModal(owner)}
                          className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" 
                          title="Adjust Commission"
                        >
                          <TrendingUp size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOwners.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No fleet owners found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-4xl rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedOwner.fleet_owner_settings?.[0]?.company_name || 'Fleet Owner Profile'}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedOwner.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOwner(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Company & Contact Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Building2 size={16} /> Company & Contact
                  </h4>
                  <div className="bg-muted/30 rounded-xl p-5 border border-border space-y-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Contact Person</p>
                      <p className="text-sm font-medium">{selectedOwner.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Email Address</p>
                      <p className="text-sm font-medium">{selectedOwner.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Phone Number</p>
                      <p className="text-sm font-medium">{selectedOwner.phone_number || 'Not provided'}</p>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <button 
                        onClick={() => handleResetPassword(selectedOwner.email)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Send Password Reset Email
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status & Commission */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ShieldCheck size={16} /> Status & Preferences
                  </h4>
                  <div className="bg-muted/30 rounded-xl p-5 border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Account Status</p>
                        <StatusBadge status={selectedOwner.fleet_owner_settings?.[0]?.status || 'pending_verification'} />
                      </div>
                      <select 
                        value={selectedOwner.fleet_owner_settings?.[0]?.status || 'pending_verification'}
                        onChange={(e) => handleStatusChange(selectedOwner.id, e.target.value)}
                        className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      >
                        <option value="active">Active</option>
                        <option value="pending_verification">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Commission Rate</p>
                        <p className="text-lg font-bold">{(selectedOwner.fleet_owner_settings?.[0]?.commission_rate * 100).toFixed(0)}%</p>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedOwner(null);
                          openEditModal(selectedOwner);
                        }}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Adjust Rate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary & Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Financial Summary */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <DollarSign size={16} /> Financial Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-xl p-4 border border-border">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Earnings</p>
                      <p className="text-2xl font-bold">${(selectedOwner.total_earnings || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-4 border border-border">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Pending Payouts</p>
                      <p className="text-2xl font-bold text-warning">${(selectedOwner.pending_payouts || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  {/* Payout History Preview */}
                  <div className="bg-muted/30 rounded-xl p-4 border border-border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3">Recent Payouts</p>
                    <div className="space-y-2">
                      {selectedOwner.payout_history?.slice(0, 3).map((payout: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{new Date(payout.created_at).toLocaleDateString()}</span>
                          <span className="font-bold text-success">+${payout.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      {(!selectedOwner.payout_history || selectedOwner.payout_history.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">No payout history.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <TrendingUp size={16} /> Performance Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-xl p-4 border border-border">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Avg. Utilization</p>
                      <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold">{selectedOwner.avg_utilization}%</p>
                        <TrendingUp size={16} className="text-success mb-1" />
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-4 border border-border">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Client Rating</p>
                      <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold">{selectedOwner.avg_rating}</p>
                        <span className="text-warning text-sm mb-1">★</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Associated Cars</p>
                      <p className="text-2xl font-bold">{selectedOwner.total_cars}</p>
                    </div>
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors">
                      View Cars <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="p-6 border-t border-border bg-muted/10 flex flex-wrap gap-3 justify-end shrink-0">
              <button className="px-4 py-2 bg-card border border-border hover:bg-muted rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                <MessageSquare size={16} /> Send Message
              </button>
              {selectedOwner.fleet_owner_settings?.[0]?.status === 'active' && (
                <button 
                  onClick={() => handleStatusChange(selectedOwner.id, 'suspended')}
                  className="px-4 py-2 bg-error/10 text-error hover:bg-error hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <Ban size={16} /> Suspend Account
                </button>
              )}
              <button className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                <DollarSign size={16} /> Initiate Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-xl font-bold">{editingOwner ? 'Edit Fleet Owner' : 'Add Fleet Owner'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {!editingOwner && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Name</label>
                      <input 
                        type="text" required
                        value={formData.contact_name}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        className="w-full px-4 py-2 bg-muted border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                      <input 
                        type="tel" required
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        className="w-full px-4 py-2 bg-muted border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                      <input 
                        type="email" required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-muted border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Temporary Password</label>
                      <input 
                        type="text" required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 bg-muted border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company Name</label>
                <input 
                  type="text" required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-2 bg-muted border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Commission Rate (0-1)</label>
                  <input 
                    type="number" step="0.01" min="0" max="1" required
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-muted border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-muted border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20">
                  <Save size={18} /> {editingOwner ? 'Update Owner' : 'Add Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
