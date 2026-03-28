import React, { useRef, useState, useEffect } from 'react';
import { Car } from '../../../types';
import SignatureCanvas from 'react-signature-canvas';
import { ArrowRight, ArrowLeft, FileText, CheckCircle2, Eraser, Info, ShieldCheck, Download, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { contractService } from '../../../services/contractService';

interface Step3Props {
  car: Car;
  bookingData: any;
  onNext: (data: any) => void;
  onPrev: () => void;
}

export function Step3({ car, bookingData, onNext, onPrev }: Step3Props) {
  const sigPad = useRef<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [loadingContract, setLoadingContract] = useState(true);

  useEffect(() => {
    async function fetchContract() {
      try {
        const masterContract = await contractService.getMasterContract();
        setContract(masterContract);
      } catch (error) {
        console.error('Error loading contract:', error);
        toast.error('Failed to load rental contract');
      } finally {
        setLoadingContract(false);
      }
    }
    fetchContract();
  }, []);

  const clear = () => {
    sigPad.current?.clear();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sigPad.current?.isEmpty()) {
      toast.error('Please provide your digital signature');
      return;
    }
    if (!agreed) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    onNext({ signatureUrl: sigPad.current?.getTrimmedCanvas().toDataURL('image/png') });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h3 className="text-3xl font-serif font-black italic text-white">Review & Sign</h3>
        <p className="text-muted-foreground text-sm">Review your rental agreement and provide your digital signature.</p>
      </div>

      <div className="space-y-6">
        {/* Summary Card */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Vehicle</p>
            <p className="text-sm font-bold text-white">{car.make} {car.model}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Duration</p>
            <p className="text-sm font-bold text-white">{bookingData.days} Days</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Dates</p>
            <p className="text-xs font-bold text-white/80">{bookingData.startDate} to {bookingData.endDate}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total Amount</p>
            <p className="text-lg font-black text-primary">${bookingData.totalAmount?.toLocaleString()}</p>
          </div>
        </div>

        {/* Contract Display */}
        {loadingContract ? (
          <div className="p-8 bg-white/5 rounded-[24px] border border-white/10 text-center flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="animate-spin text-primary" size={20} />
            <span className="text-sm font-bold">Loading contract...</span>
          </div>
        ) : contract ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Rental Agreement</label>
            <div className="p-6 bg-white/5 rounded-[24px] border border-white/10 space-y-4">
              <div>
                <p className="text-sm font-bold text-white mb-2">{contract.contract_title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{contract.terms_summary}</p>
              </div>
              <a 
                href={contract.contract_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                <Download size={12} /> View Full Contract (PDF)
              </a>
            </div>
          </motion.div>
        ) : null}

        {/* Signature Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block">Digital Signature</label>
            <button 
              type="button" 
              onClick={clear}
              className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary flex items-center gap-2 transition-colors"
            >
              <Eraser size={12} /> Clear
            </button>
          </div>
          <div className="relative h-[200px] bg-white/5 border border-white/10 rounded-[24px] overflow-hidden group hover:border-primary/30 transition-colors">
            <SignatureCanvas 
              ref={sigPad}
              penColor='#D4AF37'
              canvasProps={{
                className: 'w-full h-full cursor-crosshair',
                style: { width: '100%', height: '100%' }
              }} 
            />
            <div className="absolute bottom-4 right-4 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
              <FileText size={40} className="text-white" />
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-1">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer sr-only" 
              />
              <div className="w-5 h-5 border-2 border-white/20 rounded-md bg-white/5 peer-checked:bg-primary peer-checked:border-primary transition-all" />
              <CheckCircle2 size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed group-hover:text-white/80 transition-colors">
              I have read and agree to the <span className="text-primary underline cursor-pointer">Rental Terms and Conditions</span>, including insurance policies and vehicle usage guidelines.
            </span>
          </label>
          
          <div className="p-4 bg-primary/5 rounded-[20px] flex gap-3 items-start border border-primary/10">
            <ShieldCheck className="text-primary shrink-0" size={16} />
            <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest leading-normal">
              Your data is encrypted and stored securely in accordance with our privacy policy.
            </p>
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
          Proceed to Payment 
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </form>
  );
}
