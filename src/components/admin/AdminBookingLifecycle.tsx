import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Car, MapPin, Clock, CheckCircle2, User, Loader2, Send, AlertTriangle, Gauge, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '../../utils/logger';

type Stage = 'pickup' | 'in_transit' | 'return_form' | 'completed';

interface Props {
  booking: any;
  onClose: () => void;
  onRefresh: () => void;
}

const PICKUP_CHECKS = [
  'Client ID verified',
  'Contract signed',
  'Deposit collected',
  'Fuel level checked',
  'No exterior damage',
  'Interior clean',
  'Keys handed over',
  'Odometer recorded',
];
const RETURN_CHECKS = [
  'Exterior inspected',
  'Interior inspected',
  'Keys returned',
  'Fuel level noted',
  'Any damage documented',
  'Odometer recorded',
];

function fmtDur(ms: number) {
  if (ms <= 0) return '0h 0m';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`;
}

function fmt(dt: string | null | undefined) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
}

// ── Reusable sub-components ───────────────────────────────────────────────
const SCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-muted/20 rounded-xl border border-border overflow-hidden">
    <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <p className="text-xs font-black uppercase tracking-widest text-foreground">{title}</p>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const F = ({ l, v }: { l: string; v: string }) => (
  <div>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{l}</p>
    <p className="text-sm font-semibold text-foreground">{v || '—'}</p>
  </div>
);

// ── Collapsed history card shown after a stage is done ────────────────────
function HistoryCard({ emoji, title, color, children, defaultOpen = false }: {
  emoji: string; title: string; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl border overflow-hidden ${color}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-xl">{emoji}</span>
        <p className="flex-1 text-sm font-black">{title}</p>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-white/10">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export function AdminBookingLifecycle({ booking: init, onClose, onRefresh }: Props) {
  const [booking, setBooking] = useState(init);

  const getStage = (b: any): Stage => {
    if (b.status === 'on_trip') return 'in_transit';
    if (b.status === 'returned' || b.status === 'completed') return 'completed';
    return 'pickup';
  };

  const [stage, setStage] = useState<Stage>(getStage(init));

  // Pickup form state
  const [pickupChecks, setPickupChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(PICKUP_CHECKS.map(i => [i, false]))
  );
  const [pickupLoc, setPickupLoc] = useState(init.actual_pickup_location || init.pickup_location || '');
  const [pickupDt, setPickupDt] = useState(new Date().toISOString().slice(0, 16));
  const [pickupOdo, setPickupOdo] = useState(init.pickup_odometer ? String(init.pickup_odometer) : '');

  // Return form state
  const [returnChecks, setReturnChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(RETURN_CHECKS.map(i => [i, false]))
  );
  const [returnDt, setReturnDt] = useState(new Date().toISOString().slice(0, 16));
  const [returnLoc, setReturnLoc] = useState(init.dropoff_location || '');
  const [returnOdo, setReturnOdo] = useState(init.return_odometer ? String(init.return_odometer) : '');
  const [returnCond, setReturnCond] = useState('good');
  const [fuelLevel, setFuelLevel] = useState('full');
  const [returnNotes, setReturnNotes] = useState('');

  // Shared
  const [saving, setSaving] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderMsg, setReminderMsg] = useState('');
  const [now, setNow] = useState(new Date());
  const alertedRef = useRef<{ warn24: boolean; warn2: boolean }>({ warn24: false, warn2: false });

  // Live clock — every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Auto-alert when return is due
  useEffect(() => {
    if (stage !== 'in_transit') return;
    const h24 = 86400000, h2 = 7200000;
    if (!alertedRef.current.warn24 && remainMs > 0 && remainMs <= h24) {
      alertedRef.current.warn24 = true;
      toast.warning(`⏰ Return due in ${fmtDur(remainMs)} — ${clientName} · ${carLine}`);
      if (booking.client_id) {
        supabase.from('notifications').insert({
          user_id: booking.client_id, type: 'booking_update',
          title: '⏰ Return Reminder',
          content: `Your ${carLine} is due back in ${fmtDur(remainMs)}. Please return on time.`,
          is_read: false,
        }).catch(() => {});
      }
    }
    if (!alertedRef.current.warn2 && remainMs > 0 && remainMs <= h2) {
      alertedRef.current.warn2 = true;
      toast.error(`🚨 2 hours until return — ${clientName} · ${carLine}`);
    }
  }, [now]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { onRefresh(); onClose(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Derived
  const meta = booking.metadata || {}, gi = meta.guest_info || {};
  const clientName  = booking.client?.full_name  || gi.full_name  || 'Client';
  const clientEmail = booking.client?.email       || gi.email      || '';
  const clientPhone = booking.client?.phone_number || gi.phone     || '';
  const waPhone = clientPhone.replace(/\D/g, '').replace(/^0/, '254');
  const carLine = `${booking.cars?.make || ''} ${booking.cars?.model || ''}`.trim() || 'Vehicle';
  const plate   = booking.cars?.license_plate || '';
  const ref     = booking.id.slice(0, 8).toUpperCase();

  const endDate   = new Date(booking.end_date);   endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(booking.start_date);
  const totalMs   = endDate.getTime() - startDate.getTime();
  const pickupTime = booking.pickup_confirmed_at ? new Date(booking.pickup_confirmed_at) : startDate;
  const elapsedMs = now.getTime() - pickupTime.getTime();
  const remainMs  = endDate.getTime() - now.getTime();
  const pct       = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  const isOverdue = remainMs < 0;
  const isWarn    = !isOverdue && remainMs < 86400000;
  const rentalDays = Math.max(1, Math.ceil(totalMs / 86400000));

  const retDtObj  = new Date(returnDt);
  const otMs      = Math.max(0, retDtObj.getTime() - endDate.getTime());
  const otHrs     = parseFloat((otMs / 3600000).toFixed(2));
  const otRate    = booking.cars?.overtime_rate || (booking.cars?.daily_rate ? booking.cars.daily_rate / 24 : 0);
  const otCharge  = parseFloat((otHrs * otRate).toFixed(2));

  const kmDriven  = (returnOdo && pickupOdo)
    ? Math.max(0, parseInt(returnOdo, 10) - parseInt(pickupOdo, 10))
    : null;

  const allPickup = Object.values(pickupChecks).every(Boolean);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleLogPickup = async () => {
    if (!allPickup) { toast.error('Complete the entire checklist first'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('bookings').update({
        status: 'on_trip',
        pickup_confirmed_at: new Date(pickupDt).toISOString(),
        pickup_confirmed_by: user?.id,
        actual_pickup_location: pickupLoc,
        ...(pickupOdo ? { pickup_odometer: parseInt(pickupOdo, 10) } : {}),
      }).eq('id', booking.id);
      if (error) { toast.error(`Failed to log pickup: ${error.message}`); return; }
      if (booking.client_id) {
        supabase.from('notifications').insert({
          user_id: booking.client_id, type: 'booking_update',
          title: 'Your rental has started 🚗',
          content: `Your ${carLine} rental (#${ref}) has started. Enjoy your drive!`,
          is_read: false, link: `/booking-confirmation/${booking.id}`,
        }).catch(() => {});
      }
      toast.success('Pickup logged — now In Transit');
      setBooking((p: any) => ({
        ...p, status: 'on_trip',
        pickup_confirmed_at: new Date(pickupDt).toISOString(),
        actual_pickup_location: pickupLoc,
        pickup_odometer: pickupOdo ? parseInt(pickupOdo, 10) : null,
      }));
      setStage('in_transit');
      onRefresh();
    } catch (e) { logger.error('Pickup error:', e); toast.error('Failed to log pickup'); }
    finally { setSaving(false); }
  };

  const handleSendReminder = async () => {
    setSaving(true);
    try {
      if (clientEmail) supabase.functions.invoke('send-email', { body: { to: clientEmail, subject: `Return Reminder — Booking #${ref}`, message: reminderMsg } }).catch(() => {});
      if (booking.client_id) supabase.from('notifications').insert({ user_id: booking.client_id, type: 'booking_update', title: 'Return Reminder', content: reminderMsg.slice(0, 200), is_read: false }).catch(() => {});
      toast.success('Reminder sent!');
      setShowReminder(false);
    } catch { toast.error('Failed to send reminder'); }
    finally { setSaving(false); }
  };

  const handleLogReturn = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('bookings').update({
        status: 'completed',
        return_confirmed_at: new Date(returnDt).toISOString(),
        return_confirmed_by: user?.id,
        return_condition: returnCond,
        return_notes: `Fuel:${fuelLevel}.${returnNotes ? ' ' + returnNotes : ''}`.trim(),
        overtime_hours: otHrs,
        overtime_charge: otCharge,
        ...(returnOdo ? { return_odometer: parseInt(returnOdo, 10) } : {}),
      }).eq('id', booking.id);
      if (error) { toast.error(`Failed to log return: ${error.message}`); return; }
      if (booking.client_id) {
        supabase.from('notifications').insert({
          user_id: booking.client_id, type: 'booking_update', title: 'Return Confirmed ✅',
          content: `Your ${carLine} return is confirmed. Rental #${ref} complete.${otCharge > 0 ? ` Overtime: KES ${otCharge.toLocaleString()}.` : ''}`,
          is_read: false,
        }).catch(() => {});
      }
      toast.success('Return logged — booking completed!');
      setBooking((p: any) => ({
        ...p, status: 'completed',
        return_confirmed_at: new Date(returnDt).toISOString(),
        return_condition: returnCond,
        overtime_hours: otHrs, overtime_charge: otCharge,
        return_odometer: returnOdo ? parseInt(returnOdo, 10) : null,
      }));
      setStage('completed');
      onRefresh();
    } catch (e) { logger.error('Return error:', e); toast.error('Failed to log return'); }
    finally { setSaving(false); }
  };

  const openReminder = () => {
    const msg = isOverdue
      ? `Dear ${clientName},\n\nYour ${carLine} rental (#${ref}) was due back ${fmtDur(Math.abs(remainMs))} ago.\n\nPlease return immediately or contact us.\n\nOvertime charges apply: KES ${otRate.toLocaleString()}/hr.\n\nLinkedUp Cars Team`
      : `Dear ${clientName},\n\nFriendly reminder — your ${carLine} rental (#${ref}) is due in ${fmtDur(remainMs)}.\n\nReturn by: ${endDate.toLocaleDateString()}\nReturn to: ${booking.dropoff_location || 'Contact us'}\n\nSafe travels!\nLinkedUp Cars Team`;
    setReminderMsg(msg);
    setShowReminder(true);
  };

  // ── Stage progress indicator ─────────────────────────────────────────────
  const stageOrder: Stage[] = ['pickup', 'in_transit', 'return_form', 'completed'];
  const stageLabels: Record<Stage, string> = { pickup: 'Pickup', in_transit: 'In Transit', return_form: 'Return', completed: 'Completed' };
  const currentIdx = stageOrder.indexOf(stage);

  // ── Pickup history summary (shown when stage > pickup) ───────────────────
  const pickupDone = stage === 'in_transit' || stage === 'return_form' || stage === 'completed';
  const transitDone = stage === 'return_form' || stage === 'completed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-background/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) { onRefresh(); onClose(); } }}
    >
      <div className="bg-card border border-border rounded-xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-foreground">Car Lifecycle</h2>
            <p className="text-xs text-muted-foreground">#{ref} · {carLine}{plate ? ` · ${plate}` : ''}</p>
          </div>
          {/* Stage breadcrumb */}
          <div className="hidden md:flex items-center gap-1 text-xs">
            {stageOrder.filter(s => s !== 'return_form').map((s, i, arr) => {
              const idx = stageOrder.indexOf(s);
              const done = currentIdx > idx;
              const active = stage === s || (s === 'in_transit' && stage === 'return_form');
              return (
                <React.Fragment key={s}>
                  <span className={`px-2 py-0.5 rounded-full font-bold border ${active ? 'bg-primary text-primary-foreground border-primary' : done ? 'bg-success/10 text-success border-success/20' : 'bg-muted/30 text-muted-foreground border-border'}`}>
                    {done ? '✓ ' : ''}{stageLabels[s]}
                  </span>
                  {i < arr.length - 1 && <span className="text-border">›</span>}
                </React.Fragment>
              );
            })}
          </div>
          <button onClick={() => { onRefresh(); onClose(); }} className="p-2 hover:bg-muted text-muted-foreground rounded-xl ml-2"><X size={16} /></button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">

          {/* ══ PICKUP HISTORY CARD (sticks once done) ══ */}
          {pickupDone && (
            <HistoryCard
              emoji="🔑"
              title={`Pickup — ${fmt(booking.pickup_confirmed_at)}`}
              color="bg-orange-500/5 border-orange-500/20 text-orange-500"
              defaultOpen={false}
            >
              <div className="grid grid-cols-2 gap-3 pt-3">
                <F l="Location" v={booking.actual_pickup_location || booking.pickup_location || '—'} />
                <F l="Time" v={fmt(booking.pickup_confirmed_at)} />
                <F l="Odometer Out" v={booking.pickup_odometer ? `${Number(booking.pickup_odometer).toLocaleString()} km` : '—'} />
                <F l="Client" v={clientName} />
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {PICKUP_CHECKS.map(c => (
                  <span key={c} className="text-[10px] px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-full">{c}</span>
                ))}
              </div>
            </HistoryCard>
          )}

          {/* ══ IN-TRANSIT HISTORY CARD (sticks once return is logged) ══ */}
          {transitDone && (
            <HistoryCard
              emoji="🚗"
              title={`In Transit — ${fmtDur(endDate.getTime() - startDate.getTime())} rental`}
              color="bg-blue-500/5 border-blue-500/20 text-blue-500"
              defaultOpen={false}
            >
              <div className="grid grid-cols-2 gap-3 pt-3">
                <F l="Started" v={fmt(booking.pickup_confirmed_at)} />
                <F l="Returned" v={fmt(booking.return_confirmed_at)} />
                <F l="Rental Days" v={`${rentalDays}`} />
                <F l="Overtime" v={otCharge > 0 ? `KES ${otCharge.toLocaleString()}` : 'None'} />
              </div>
            </HistoryCard>
          )}

          {/* ══ PICKUP STAGE (active) ══ */}
          {stage === 'pickup' && (
            <>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 flex gap-3">
                <span className="text-2xl">🔑</span>
                <div>
                  <p className="text-sm font-bold text-orange-500">Pending Collection</p>
                  <p className="text-xs text-muted-foreground">Complete checklist then log pickup to start the rental timer.</p>
                </div>
              </div>

              <SCard title="Client & Vehicle" icon={<User size={14} />}>
                <div className="grid grid-cols-2 gap-3">
                  <F l="Client" v={clientName} /><F l="Phone" v={clientPhone || 'N/A'} />
                  <F l="Vehicle" v={carLine} /><F l="Plate" v={plate || 'N/A'} />
                  <F l="Start" v={new Date(booking.start_date).toLocaleDateString()} /><F l="End" v={new Date(booking.end_date).toLocaleDateString()} />
                  <F l="Days" v={`${rentalDays}`} /><F l="Total" v={`KES ${Number(booking.total_amount).toLocaleString()}`} />
                </div>
              </SCard>

              <SCard title="Pre-Departure Checklist" icon={<CheckCircle2 size={14} />}>
                <div className="space-y-2">
                  {PICKUP_CHECKS.map(item => (
                    <label key={item} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={pickupChecks[item] || false} onChange={e => setPickupChecks(p => ({ ...p, [item]: e.target.checked }))} className="w-4 h-4 accent-primary" />
                      <span className={`text-sm ${pickupChecks[item] ? 'text-success line-through' : 'text-foreground'}`}>{item}</span>
                    </label>
                  ))}
                </div>
                {!allPickup && <p className="text-xs text-warning mt-3">Complete all items before logging pickup</p>}
              </SCard>

              <SCard title="Pickup Details" icon={<MapPin size={14} />}>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Pickup Location</label>
                    <input value={pickupLoc} onChange={e => setPickupLoc(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Enter actual pickup location" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Pickup Date & Time</label>
                    <input type="datetime-local" value={pickupDt} onChange={e => setPickupDt(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Odometer Reading (km)</label>
                    <div className="relative">
                      <Gauge size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="number" min={0} value={pickupOdo} onChange={e => setPickupOdo(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. 45230" />
                    </div>
                  </div>
                </div>
              </SCard>

              <button onClick={handleLogPickup} disabled={saving || !allPickup} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Car size={16} />}
                Log Car Collected — Start Rental
              </button>
            </>
          )}

          {/* ══ IN-TRANSIT STAGE (active) ══ */}
          {stage === 'in_transit' && (
            <>
              <div className={`border rounded-xl px-4 py-3 flex gap-3 ${isOverdue ? 'bg-error/10 border-error/20' : isWarn ? 'bg-warning/10 border-warning/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                <span className="text-2xl">{isOverdue ? '🚨' : isWarn ? '⏰' : '🚗'}</span>
                <div>
                  <p className={`text-sm font-bold ${isOverdue ? 'text-error' : isWarn ? 'text-warning' : 'text-blue-500'}`}>
                    {isOverdue ? `OVERDUE by ${fmtDur(Math.abs(remainMs))}` : isWarn ? `Due in ${fmtDur(remainMs)}` : `In Transit — ${fmtDur(remainMs)} remaining`}
                  </p>
                  <p className="text-xs text-muted-foreground">Return by {endDate.toLocaleDateString()} · {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Elapsed: {fmtDur(elapsedMs)}</span>
                  <span>{Math.round(pct)}%</span>
                  <span>{isOverdue ? 'Overdue' : 'Remaining: ' + fmtDur(remainMs)}</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isOverdue ? 'bg-error' : isWarn ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>

              <SCard title="Client Contact" icon={<User size={14} />}>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-foreground">{clientName}</p>
                  {clientPhone && <a href={`tel:${clientPhone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-bold hover:bg-success/20 transition-colors">📞 Call</a>}
                  {clientPhone && <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold hover:bg-green-500/20 transition-colors">💬 WhatsApp</a>}
                  {clientEmail && <a href={`mailto:${clientEmail}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition-colors">✉ Email</a>}
                </div>
              </SCard>

              {!showReminder && (
                <button onClick={openReminder} className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-colors ${isOverdue || isWarn ? 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20' : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'}`}>
                  <Send size={14} /> Send Return Reminder
                </button>
              )}
              {showReminder && (
                <SCard title="Return Reminder Message" icon={<Send size={14} />}>
                  <textarea value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} rows={7} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3" />
                  <div className="flex gap-2">
                    {clientEmail && <button onClick={handleSendReminder} disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}Send Email</button>}
                    {clientPhone && <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent(reminderMsg)}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2">💬 WhatsApp</a>}
                    <button onClick={() => setShowReminder(false)} className="px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted"><X size={14} /></button>
                  </div>
                </SCard>
              )}

              <button onClick={() => setStage('return_form')} className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors">
                <CheckCircle2 size={16} /> Log Car Returned
              </button>
            </>
          )}

          {/* ══ RETURN FORM STAGE (active) ══ */}
          {stage === 'return_form' && (
            <>
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl px-4 py-3 flex gap-3">
                <span className="text-2xl">🏁</span>
                <div>
                  <p className="text-sm font-bold text-teal-500">Log Vehicle Return</p>
                  <p className="text-xs text-muted-foreground">Complete the return inspection and finalise the rental.</p>
                </div>
              </div>

              {otHrs > 0 && (
                <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3">
                  <p className="text-sm font-bold text-error">⚠ Overtime Detected</p>
                  <p className="text-xs text-muted-foreground mt-1">{otHrs.toFixed(1)} hrs × KES {otRate.toLocaleString()}/hr = <span className="font-bold text-error">KES {otCharge.toLocaleString()}</span></p>
                </div>
              )}

              <SCard title="Return Checklist" icon={<CheckCircle2 size={14} />}>
                <div className="space-y-2">
                  {RETURN_CHECKS.map(item => (
                    <label key={item} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={returnChecks[item] || false} onChange={e => setReturnChecks(p => ({ ...p, [item]: e.target.checked }))} className="w-4 h-4 accent-primary" />
                      <span className={`text-sm ${returnChecks[item] ? 'text-success line-through' : 'text-foreground'}`}>{item}</span>
                    </label>
                  ))}
                </div>
              </SCard>

              <SCard title="Return Details" icon={<MapPin size={14} />}>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Return Date & Time</label>
                    <input type="datetime-local" value={returnDt} onChange={e => setReturnDt(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Return Location</label>
                    <input value={returnLoc} onChange={e => setReturnLoc(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Odometer Reading (km)</label>
                    <div className="relative">
                      <Gauge size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="number" min={0} value={returnOdo} onChange={e => setReturnOdo(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. 45780" />
                    </div>
                    {kmDriven !== null && (
                      <p className="text-xs text-primary font-bold mt-1">↳ {kmDriven.toLocaleString()} km driven this rental</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Vehicle Condition</label>
                      <select value={returnCond} onChange={e => setReturnCond(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none">
                        <option value="good">Good</option>
                        <option value="minor_damage">Minor Damage</option>
                        <option value="major_damage">Major Damage</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Fuel Level</label>
                      <select value={fuelLevel} onChange={e => setFuelLevel(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none">
                        <option value="full">Full</option>
                        <option value="3/4">3/4</option>
                        <option value="1/2">1/2</option>
                        <option value="1/4">1/4</option>
                        <option value="empty">Empty</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Notes</label>
                    <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)} rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Any notes on the return..." />
                  </div>
                </div>
              </SCard>

              <SCard title="Return Summary" icon={<AlertTriangle size={14} />}>
                <div className="grid grid-cols-2 gap-3">
                  <F l="Rental Days" v={`${rentalDays}`} />
                  <F l="Base Amount" v={`KES ${Number(booking.total_amount).toLocaleString()}`} />
                  {kmDriven !== null && <F l="KM Driven" v={`${kmDriven.toLocaleString()} km`} />}
                  <F l="Overtime Hours" v={otHrs > 0 ? `${otHrs.toFixed(1)} hrs` : 'None'} />
                  <F l="Overtime Charge" v={otCharge > 0 ? `KES ${otCharge.toLocaleString()}` : 'None'} />
                  <F l="Condition" v={returnCond.replace('_', ' ')} />
                  <F l="Fuel on Return" v={fuelLevel} />
                </div>
              </SCard>

              <div className="flex gap-3">
                <button onClick={() => setStage('in_transit')} className="px-4 py-3 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">← Back</button>
                <button onClick={handleLogReturn} disabled={saving} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Finalise Return
                </button>
              </div>
            </>
          )}

          {/* ══ COMPLETED STAGE ══ */}
          {stage === 'completed' && (
            <>
              <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-5 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-lg font-black text-success">Rental Complete</p>
                <p className="text-xs text-muted-foreground mt-1">Booking #{ref} has been successfully closed</p>
              </div>

              <SCard title="Full Rental Summary" icon={<Clock size={14} />}>
                <div className="grid grid-cols-2 gap-3">
                  <F l="Vehicle" v={carLine} />
                  <F l="Client" v={clientName} />
                  <F l="Rental Days" v={`${rentalDays}`} />
                  <F l="Base Amount" v={`KES ${Number(booking.total_amount).toLocaleString()}`} />
                  <F l="Pickup" v={fmt(booking.pickup_confirmed_at)} />
                  <F l="Return" v={fmt(booking.return_confirmed_at)} />
                  <F l="Odometer Out" v={booking.pickup_odometer ? `${Number(booking.pickup_odometer).toLocaleString()} km` : '—'} />
                  <F l="Odometer In" v={booking.return_odometer ? `${Number(booking.return_odometer).toLocaleString()} km` : '—'} />
                  {booking.pickup_odometer && booking.return_odometer && (
                    <F l="KM Driven" v={`${(booking.return_odometer - booking.pickup_odometer).toLocaleString()} km`} />
                  )}
                  <F l="Condition" v={(booking.return_condition || 'good').replace('_', ' ')} />
                  <F l="Overtime" v={(booking.overtime_charge || 0) > 0 ? `KES ${Number(booking.overtime_charge).toLocaleString()}` : 'None'} />
                </div>
              </SCard>

              <button onClick={() => { onRefresh(); onClose(); }} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold">Close</button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
