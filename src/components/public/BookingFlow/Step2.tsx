import React, { useState, useCallback } from 'react';
import { Car } from '../../../types';
import { Upload, ArrowRight, ArrowLeft, User, Mail, Phone, FileText, CheckCircle2, Loader2, Camera, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { bookingService } from '../../../services/bookingService';
import { toast } from 'sonner';
import { validateFile } from '../../../utils/fileValidation';
import { CameraCapture } from './CameraCapture';

interface Step2Props {
  car: Car;
  onNext: (data: any) => void;
  onPrev: () => void;
}

type DocType = 'facePhoto' | 'licenseFront' | 'licenseBack' | 'idFront' | 'idBack';

const DOC_LABELS: Record<DocType, string> = {
  facePhoto: 'Face Photo',
  licenseFront: 'License Front',
  licenseBack: 'License Back',
  idFront: 'ID Front',
  idBack: 'ID Back'
};

export function Step2({ car, onNext, onPrev }: Step2Props) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<DocType | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    license: '',
    facePhotoUrl: '',
    licenseFrontUrl: '',
    licenseBackUrl: '',
    idFrontUrl: '',
    idBackUrl: ''
  });

  const uploadFile = useCallback(async (file: File, type: DocType) => {
    setUploading(type);
    try {
      const validation = await validateFile(file);
      if (!validation.isValid) {
        toast.error(`File validation failed: ${validation.error}`);
        return;
      }
      const url = await bookingService.uploadDocument(file, type, `temp_${Date.now()}`);
      setFormData(prev => ({ ...prev, [`${type}Url`]: url }));
      toast.success(`${DOC_LABELS[type]} uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(null);
    }
  }, []);

  const handleCameraCapture = (file: File) => {
    if (showCamera) {
      uploadFile(file, showCamera);
    }
    setShowCamera(null);
  };

  const DocumentSlot = ({ type }: { type: DocType }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => { if (files[0]) uploadFile(files[0], type); },
      accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
      maxFiles: 1,
      multiple: false,
      noClick: true
    } as any);

    const urlKey = `${type}Url` as keyof typeof formData;
    const isUploaded = !!formData[urlKey];
    const isThisUploading = uploading === type;

    return (
      <div className="space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/50 text-center">{DOC_LABELS[type]}</p>
        <div
          {...getRootProps()}
          className={`relative p-4 border-2 border-dashed rounded-[16px] md:rounded-[20px] text-center transition-all ${
            isUploaded ? 'border-green-500/50 bg-green-500/5'
            : isDragActive ? 'border-primary bg-primary/5'
            : 'border-white/10 hover:border-white/20'
          }`}
        >
          <input {...getInputProps()} />
          <AnimatePresence mode="wait">
            {isThisUploading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1 py-2">
                <Loader2 className="animate-spin text-primary" size={20} />
                <p className="text-[9px] font-black uppercase tracking-widest text-primary">Uploading...</p>
              </motion.div>
            ) : isUploaded ? (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1 py-2">
                <CheckCircle2 className="text-green-500" size={20} />
                <p className="text-[9px] font-black uppercase tracking-widest text-green-500">Done</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 py-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCamera(type)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 rounded-xl text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Camera size={14} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Camera</span>
                  </button>
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl text-white/50 hover:bg-white/10 transition-colors cursor-pointer">
                    <Image size={14} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">File</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(file, type);
                      }}
                    />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required: DocType[] = ['facePhoto', 'licenseFront', 'licenseBack', 'idFront', 'idBack'];
    const missing = required.filter(type => !formData[`${type}Url` as keyof typeof formData]);
    if (missing.length > 0) {
      toast.error(`Please upload: ${missing.map(t => DOC_LABELS[t]).join(', ')}`);
      return;
    }
    onNext(formData);
  };

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(null)}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h3 className="text-2xl md:text-3xl font-serif font-black italic text-white">Your Details</h3>
          <p className="text-muted-foreground text-sm">Provide your information and verification documents.</p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text" placeholder="Full Name" required
                value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[18px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-white/10"
              />
            </div>
            <div className="group relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="email" placeholder="Email Address" required
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[18px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="tel" placeholder="Phone Number" required
                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[18px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-white/10"
              />
            </div>
            <div className="group relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text" placeholder="Driver's License No." required
                value={formData.license} onChange={(e) => setFormData({...formData, license: e.target.value})}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[18px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-white/10"
              />
            </div>
          </div>

          {/* Face Photo */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3 block">Face Photo / Passport Photo</label>
            <div className="max-w-xs mx-auto">
              <DocumentSlot type="facePhoto" />
            </div>
          </div>

          {/* License Documents */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3 block">Driver's License</label>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <DocumentSlot type="licenseFront" />
              <DocumentSlot type="licenseBack" />
            </div>
          </div>

          {/* ID Documents */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3 block">National ID / Passport</label>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <DocumentSlot type="idFront" />
              <DocumentSlot type="idBack" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 md:gap-4">
          <button
            type="button" onClick={onPrev}
            className="w-1/4 py-4 md:py-5 bg-white/5 rounded-[20px] md:rounded-[24px] text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="submit"
            className="w-3/4 py-4 md:py-5 bg-primary rounded-[20px] md:rounded-[24px] text-black font-black uppercase tracking-[0.2em] text-xs md:text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 group"
          >
            Review Booking
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </>
  );
}
