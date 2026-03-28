import React, { useState } from 'react';
import { Car } from '../../../types';
import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';
import { motion, AnimatePresence } from 'motion/react';

interface BookingFlowProps {
  car: Car;
}

export function BookingFlow({ car }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<any>({});

  const nextStep = (data: any) => {
    setBookingData({ ...bookingData, ...data });
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 car={car} onNext={nextStep} />;
      case 2: return <Step2 car={car} onNext={nextStep} onPrev={prevStep} />;
      case 3: return <Step3 car={car} onNext={nextStep} onPrev={prevStep} />;
      case 4: return <Step4 car={car} onPrev={prevStep} />;
      default: return null;
    }
  };

  return (
    <div className="p-8 rounded-[40px] bg-card border border-white/5 relative overflow-hidden">
      <div className="mb-8">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          <span>Step {step} of 4</span>
          <span>{Math.round((step / 4) * 100)}% Complete</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
