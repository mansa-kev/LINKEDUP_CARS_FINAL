import React, { useState, useEffect } from 'react';
import { Car } from '../../../types';
import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';
import { motion, AnimatePresence } from 'motion/react';
import { useBookingSession } from '../../../hooks/useBookingSession';

interface BookingFlowProps {
  car: Car;
}

export function BookingFlow({ car }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<any>({});
  const { session, saveSession, clearSession, isSessionValid } = useBookingSession();

  // Restore session if valid
  useEffect(() => {
    if (isSessionValid && session && session.bookingData) {
      setBookingData(session.bookingData);
      setStep(session.currentStep);
    }
  }, [isSessionValid, session]);

  const nextStep = (data: any) => {
    const newBookingData = { ...bookingData, ...data };
    const newStep = step + 1;
    setBookingData(newBookingData);
    setStep(newStep);
    saveSession(newBookingData, newStep);
  };

  const prevStep = () => {
    const newStep = step - 1;
    setStep(newStep);
    saveSession(bookingData, newStep);
  };

  const completeBooking = () => {
    clearSession();
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 car={car} onNext={nextStep} />;
      case 2: return <Step2 car={car} onNext={nextStep} onPrev={prevStep} />;
      case 3: return <Step3 car={car} bookingData={bookingData} onNext={nextStep} onPrev={prevStep} />;
      case 4: return <Step4 car={car} bookingData={bookingData} onPrev={prevStep} onComplete={completeBooking} />;
      default: return null;
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-8 rounded-[12px] sm:rounded-[24px] md:rounded-[40px] bg-card border border-border relative overflow-hidden">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 sm:mb-2">
          <span>Step {step} of 4</span>
          <span>{Math.round((step / 4) * 100)}%</span>
        </div>
        <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
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
