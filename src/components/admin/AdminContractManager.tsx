import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Edit2, 
  Loader2,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Upload,
  History,
  AlertCircle,
  X,
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../../lib/supabase';

export function AdminContractManager() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    version: '',
    pdf_url: '',
    is_active: false
  });

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const data = await adminService.getContracts();
      setContracts(data || []);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `contract-v${formData.version || Date.now()}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('public_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public_assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, pdf_url: publicUrl }));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  }, [formData.version]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    multiple: false
  } as any);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pdf_url) {
      toast.error('Please upload a PDF first');
      return;
    }

    const promise = (async () => {
      // If activating this contract, deactivate others
      if (formData.is_active) {
        await supabase
          .from('contracts_master')
          .update({ is_active: false })
          .eq('is_active', true);
      }

      await adminService.createContract({
        ...formData,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      });
      
      setIsAdding(false);
      setFormData({ version: '', pdf_url: '', is_active: false });
      fetchContracts();
    })();

    toast.promise(promise, {
      loading: 'Saving contract version...',
      success: 'Contract version saved successfully',
      error: 'Failed to save contract'
    });
  };

  const handleDelete = async (id: string) => {
    const promise = (async () => {
      await adminService.deleteContract(id);
      fetchContracts();
    })();

    toast.promise(promise, {
      loading: 'Deleting contract version...',
      success: 'Contract version deleted successfully',
      error: 'Failed to delete contract'
    });
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const promise = (async () => {
      // If activating, deactivate others first
      if (!currentStatus) {
        await supabase
          .from('contracts_master')
          .update({ is_active: false })
          .eq('is_active', true);
      }

      await supabase
        .from('contracts_master')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      fetchContracts();
    })();

    toast.promise(promise, {
      loading: 'Updating status...',
      success: 'Status updated successfully',
      error: 'Failed to update status'
    });
  };

  const filteredContracts = contracts.filter(c => 
    c.version.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && contracts.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Contract Manager</h2>
          <p className="text-muted-foreground">Manage master rental agreements and legal document versions.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          Upload New Version
        </button>
      </div>

      {isAdding && (
        <div className="bg-card p-8 rounded-2xl border border-border shadow-xl animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Upload Master Contract</h3>
            <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-sm font-bold">Uploading PDF...</p>
                  </div>
                ) : formData.pdf_url ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-success/10 text-success rounded-2xl">
                      <FileText size={32} />
                    </div>
                    <div>
                      <p className="font-bold text-success">PDF Uploaded Successfully</p>
                      <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                      <Upload size={32} />
                    </div>
                    <div>
                      <p className="font-bold">Drag & drop Master Contract PDF</p>
                      <p className="text-xs text-muted-foreground mt-1">Only PDF files are accepted</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border flex gap-3">
                <AlertCircle className="text-primary shrink-0" size={20} />
                <div className="space-y-1">
                  <p className="text-xs font-bold">Dynamic Data Overlay</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    The system will automatically overlay dynamic data (Client Name, Car Model, Dates) 
                    using placeholders like <code className="bg-muted px-1 rounded">{"{{CLIENT_NAME}}"}</code> in your PDF.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Version Number</label>
                <input 
                  type="text"
                  required
                  value={formData.version}
                  onChange={e => setFormData({...formData, version: e.target.value})}
                  placeholder="e.g. 2.4.0"
                  className="w-full px-4 py-2 bg-muted border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Initial Status</label>
                <div className="flex items-center gap-4 h-10">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      formData.is_active ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {formData.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {formData.is_active ? 'Set as Active Version' : 'Keep as Draft'}
                  </button>
                </div>
                {formData.is_active && (
                  <p className="text-[10px] text-warning font-bold italic">
                    * Activating this version will automatically deactivate the current active contract.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={uploading || !formData.pdf_url || !formData.version}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Save Contract Version
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-8 py-3 bg-muted text-foreground rounded-xl font-bold hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <History className="text-primary" size={20} />
            <h3 className="font-bold text-lg">Version History</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search versions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-muted border-none rounded-xl text-xs w-64 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Version</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Upload Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <FileText size={18} />
                      </div>
                      <span className="font-bold text-sm">v{contract.version}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{new Date(contract.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(contract.id, contract.is_active)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                        contract.is_active 
                          ? 'bg-success/10 text-success border-success/20 hover:bg-success/20' 
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                      }`}
                    >
                      {contract.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setPreviewUrl(contract.pdf_url)}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors" 
                        title="Preview PDF"
                      >
                        <Eye size={18} />
                      </button>
                      <a 
                        href={contract.pdf_url} 
                        download 
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
                        title="Download"
                      >
                        <FileDown size={18} />
                      </a>
                      <button 
                        onClick={() => handleDelete(contract.id)}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-error transition-colors"
                        title="Delete Version"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No contract versions found. Upload your first Master Contract to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl h-[90vh] bg-card rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="font-bold">Contract Preview</h3>
              <button 
                onClick={() => setPreviewUrl(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <iframe 
              src={previewUrl} 
              className="flex-1 w-full border-none"
              title="Contract Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
