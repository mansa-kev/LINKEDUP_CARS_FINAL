import React, { useState, useCallback } from 'react';
import { Car } from '../../../types';
import { Upload, ArrowRight, ArrowLeft, User, Mail, Phone, MapPin, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { bookingService } from '../../../services/bookingService';
import { toast } from 'sonner';

interface Step2Props {
  car: Car;
  onNext: (data: any) => void;
  onPrev: () => void;
}

export function Step2({ car, onNext, onPrev }: Step2Props) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    license: '',
    licenseFrontUrl: '',
    licenseBackUrl: '',
    idDocumentUrl: ''
  });

  const onDrop = useCallback(async (acceptedFiles: File[], type: 'licenseFront' | 'licenseBack' | 'idDocument') => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(type);
    try {
      const url = await bookingService.uploadDocument(file, type, `temp_${Date.now()}`);
      setFormData(prev => ({ ...prev, [`${type}Url`]: url }));
      toast.success(`${type.replace(/([A-Z])/g, ' $1')} uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(null);
    }
  }, []);

  const createDropzone = (type: 'licenseFront' | 'licenseBack' | 'idDocument', label: string) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => onDrop(files, type),
      accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
      maxFiles: 1,
      multiple: false
    } as any);

    const isUploaded = !!(formData as any)[`${type}Url`];
    const isThisUploading = uploading === type;

    return (
      <div 
        {...getRootProps()} 
        className={`relative p-6 border-2 border-dashed rounded-[24px] text-center transition-all cursor-pointer group ${
          isUploaded ? 'border-success/50 bg-success/5' : 
          isDragActive ? 'border-primary bg-primary/5' : 
          'border-white/10 hover:border-white/20 hover:bg-white/5'
        }`}
      >
        <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {isThisUploading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-primary" size={24} />
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Uploading...</p>
            </motion.div>
          ) : isUploaded ? (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
              <CheckCircle2 className="text-success" size={24} />
              <p className="text-[10px] font-black uppercase tracking-widest text-success">Uploaded</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
              <Upload className="text-white/20 group-hover:text-primary transition-colors" size={24} />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60">{label}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.licenseFrontUrl || !formData.licenseBackUrl || !formData.idDocumentUrl) {
      toast.error('Please upload all required documents');
      return;
    }
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h3 className="text-3xl font-serif font-black italic text-white">Guest Details</h3>
        <p className="text-muted-foreground text-sm">Provide your information for the rental agreement.</p>
      </div>

      <div className="space-y-6">
        {/* Personal Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" placeholder="Full Name" required
              value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-white/10"
            />
          </div>
          <div className="group relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="email" placeholder="Email Address" required
              value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-white/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group relative">
            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="tel" placeholder="Phone Number" required
              value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-white/10"
            />
          </div>
          <div className="group relative">
            <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" placeholder="Driver's License No." required
              value={formData.license} onChange={(e) => setFormData({...formData, license: e.target.value})}
              className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-white/10"
            />
          </div>
        </div>

        {/* Document Uploads */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Verification Documents</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {createDropzone('licenseFront', 'License Front')}
            {createDropzone('licenseBack', 'License Back')}
            {createDropzone('idDocument', 'ID / Passport')}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          type="button" onClick={onPrev}
          className="w-1/4 py-5 bg-white/5 rounded-[24px] text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
        <button 
          type="submit"
          className="w-3/4 py-5 bg-primary rounded-[24px] text-black font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 group"
        >
          Review Booking 
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </form>
  );
}
