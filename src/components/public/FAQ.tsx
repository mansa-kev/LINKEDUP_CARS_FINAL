import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How do I book a car?',
    answer:
      'Browse our available cars, select your preferred dates and pickup location, complete the booking form, and pay via M-Pesa or cash on pickup. You will receive an instant confirmation once your booking is submitted.',
  },
  {
    question: 'What documents do I need?',
    answer:
      'You will need a valid driver\'s license, a national ID or passport, and proof of residence. International visitors should present a valid international driving permit alongside their passport.',
  },
  {
    question: 'Can I extend my rental?',
    answer:
      'Yes, you can request an extension through your account dashboard before the return date. Extensions are subject to vehicle availability and will be billed at the current daily rate.',
  },
  {
    question: 'What is the cancellation policy?',
    answer:
      'Cancellations made 48 or more hours before the scheduled pickup are fully refundable. Cancellations within 48 hours of pickup incur a 20% cancellation fee deducted from your refund.',
  },
  {
    question: 'Is insurance included?',
    answer:
      'Yes, all rentals include basic comprehensive insurance coverage at no additional cost. You may opt for premium cover with a reduced excess for an additional daily fee.',
  },
  {
    question: 'Do you offer chauffeur services?',
    answer:
      'Yes, professional chauffeur services are available for an additional fee. Our drivers are experienced, vetted, and knowledgeable about Nairobi and its surroundings.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'We primarily serve Nairobi and surrounding areas including JKIA, Westlands, CBD, Karen, Kiambu, and Thika. Airport pickup and drop-off services are available on request.',
  },
  {
    question: 'How do I pay?',
    answer:
      'We accept M-Pesa (Paybill) and cash on pickup. Payment details and our Paybill number are provided during the booking process and in your confirmation email.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="pt-32 pb-20">
      {/* Hero */}
      <section className="px-6 mb-32">
        <div className="max-w-7xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-6 block"
          >
            Support
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-serif font-black tracking-tighter italic text-white leading-tight mb-12"
          >
            Frequently Asked <span className="text-primary">Questions</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Everything you need to know about renting with LinkedUp Cars. Can't find your answer? Reach out to our support team.
          </motion.p>
        </div>
      </section>

      {/* Accordion */}
      <section className="px-6 mb-32">
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-[24px] bg-card border border-white/5 overflow-hidden"
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between gap-6 p-8 text-left group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-lg font-serif font-black tracking-tight italic text-white group-hover:text-primary transition-colors">
                      {faq.question}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-primary" />
                    ) : (
                      <Plus className="w-4 h-4 text-white" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 pl-[5.25rem]">
                        <p className="text-muted-foreground font-medium leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Still have questions */}
      <section className="px-6 py-32 bg-primary/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-serif font-black tracking-tight italic text-white mb-6 leading-tight">
            Still Have Questions?
          </h2>
          <p className="text-xl text-muted-foreground font-medium mb-10">
            Our team is available 24/7 to assist you.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-4 px-12 py-6 bg-primary rounded-2xl text-black font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
          >
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
}
