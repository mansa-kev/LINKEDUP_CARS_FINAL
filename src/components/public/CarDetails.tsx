import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Fuel, 
  Settings, 
  Briefcase, 
  ShieldCheck, 
  Calendar,
  Star,
  ArrowRight,
  Heart,
  X,
  Clock,
  CheckCircle
} from 'lucide-react';
import { fleetService } from '../../services/fleetService';
import { reservationService } from '../../services/reservationService';
import { Car } from '../../types';
import { BookingFlow } from './BookingFlow/BookingFlow';
import { ReservationFlow } from './BookingFlow/ReservationFlow';
import { Logo } from '../shared/Logo';
import { LogoLoader } from '../shared/LogoLoader';

export function CarDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [car, setCar] = useState<Car | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'booked' | 'reserved'>('available');

  useEffect(() => {
    async function fetchCar() {
      if (!id) return;
      try {
        const [carData, reviewsData] = await Promise.all([
          fleetService.getCarById(id),
          fleetService.getReviews(id)
        ]);
        console.log('Car data received:', carData); // Debug log
        setCar(carData);
        setReviews(reviewsData || []);
        
        // Check availability based on car status
        if (carData.status === 'rented') {
          setAvailabilityStatus('booked');
        } else {
          // Check for active reservations
          const today = new Date().toISOString().split('T')[0];
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          const futureDateStr = futureDate.toISOString().split('T')[0];
          
          const availability = await reservationService.checkAvailability(
            carData.id,
            today,
            futureDateStr
          );
          
          if (!availability.available) {
            setAvailabilityStatus('reserved');
          }
        }
      } catch (error) {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchCar();
  }, [id]);

  // Check for booking parameter to open booking flow automatically
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('booking') === 'true' && car && availabilityStatus === 'available') {
      setShowBooking(true);
    }
  }, [location.search, car, availabilityStatus]);

  if (loading || !car) return <LogoLoader fullScreen message="Loading vehicle details..." />;

  const carTitle = `${car.make} ${car.model} ${car.year} | Hire in Nairobi — LinkedUp Cars`;
  const carDesc = `Hire the ${car.make} ${car.model} (${car.year}) in Nairobi from KES ${car.daily_rate?.toLocaleString()}/day. ${car.seats} seats, ${car.transmission}. Instant booking — chauffeur or self-drive available.`;
  const carImage = car.primary_image_url || (Array.isArray(car.photos) && car.photos[0]) || 'https://linkedupcarsrentals.com/logo.png';

  // Build valid image list — filter out blob: URLs (browser-local, always expire)
  const isValidUrl = (url: string) =>
    url && !url.startsWith('blob:') && (url.startsWith('http') || url.startsWith('/'));

  const rawImages: string[] = [
    ...(Array.isArray(car.photos) ? car.photos : []),
    ...(Array.isArray(car.images) ? car.images : []),
    ...(car.primary_image_url ? [car.primary_image_url] : []),
  ].filter(isValidUrl);

  // Deduplicate
  const images = [...new Set(rawImages)];

  // Final fallback to placeholder if nothing valid
  if (images.length === 0) {
    images.push(`https://picsum.photos/seed/${car.id}/1200/800`);
  }

  return (
    <>
      <Helmet>
        <title>{carTitle}</title>
        <meta name="description" content={carDesc} />
        <link rel="canonical" href={`https://linkedupcarsrentals.com/cars/${car.id}`} />
        <meta property="og:title" content={carTitle} />
        <meta property="og:description" content={carDesc} />
        <meta property="og:image" content={carImage as string} />
        <meta property="og:url" content={`https://linkedupcarsrentals.com/cars/${car.id}`} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={carTitle} />
        <meta name="twitter:image" content={carImage as string} />
      </Helmet>
    <div className="relative bg-background min-h-screen overflow-hidden">
      {/* Immersive Background with Gradient Overlay */}
      <div className="fixed inset-0 z-0">
        <img 
          src={images[activeImage]} 
          alt="Background"
          className="w-full h-full object-cover blur-3xl opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-transparent to-orange-900/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-20 md:pt-32 pb-12 md:pb-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* Back Buttons */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white group transition-colors"
            >
              <span className="text-lg group-hover:-translate-x-1 transition-transform inline-block">â</span>
              <span className="font-semibold">Back to Home</span>
            </button>
            <button
              onClick={() => navigate('/browse-cars')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white group transition-colors"
            >
              <span className="font-semibold">Browse Cars</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform inline-block">â</span>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20">
            {/* Hero Image Gallery */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="relative aspect-[16/10] rounded-[20px] md:rounded-[60px] overflow-hidden border border-white/10 bg-card/50 backdrop-blur-xl group">
                <img 
                  src={images[activeImage]} 
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    console.log('Image failed to load:', images[activeImage]);
                    // Fallback to placeholder
                    e.currentTarget.src = `https://picsum.photos/seed/fallback-${car.id}/1200/800`;
                  }}
                />
                <button className="absolute top-6 right-6 p-4 glass rounded-full text-white hover:text-primary hover:scale-110 transition-all">
                  <Heart size={24} />
                </button>
              </div>
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <motion.button 
                      key={idx} 
                      onClick={() => setActiveImage(idx)} 
                      whileHover={{ scale: 1.05 }}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${activeImage === idx ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/10'}`}
                    >
                      <img 
                        src={img} 
                        alt="thumbnail" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          console.log('Thumbnail failed to load:', img);
                          e.currentTarget.src = `https://picsum.photos/seed/thumb-${car.id}-${idx}/80/80`;
                        }}
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Car Overview & Booking */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col justify-between"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif font-black italic text-white mb-2 sm:mb-4 tracking-tight">
                  {car.make} <span className="text-primary">{car.model}</span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 sm:mb-8 leading-relaxed">{car.description}</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 sm:mb-8 text-white">
                  <span className="text-primary">KES {car.daily_rate?.toLocaleString()}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground font-bold">/day</span>
                </p>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-12">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="p-2.5 sm:p-4 md:p-5 bg-card/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 hover:border-primary/30 transition-all flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3"
                  >
                    <Users className="text-primary" size={16} />
                    <div className="text-center sm:text-left">
                      <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">Seats</p>
                      <span className="text-xs sm:text-sm font-bold text-white">{car.seats}</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="p-2.5 sm:p-4 md:p-5 bg-card/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 hover:border-primary/30 transition-all flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3"
                  >
                    <Fuel className="text-primary" size={16} />
                    <div className="text-center sm:text-left">
                      <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">Fuel</p>
                      <span className="text-xs sm:text-sm font-bold text-white">{car.fuel_type}</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="p-2.5 sm:p-4 md:p-5 bg-card/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 hover:border-primary/30 transition-all flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3"
                  >
                    <Settings className="text-primary" size={16} />
                    <div className="text-center sm:text-left">
                      <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">Trans</p>
                      <span className="text-xs sm:text-sm font-bold text-white">{car.transmission}</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Availability Status */}
              <div className="mb-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                  availabilityStatus === 'available' 
                    ? 'bg-success/10 text-success' 
                    : availabilityStatus === 'booked'
                    ? 'bg-error/10 text-error'
                    : 'bg-warning/10 text-warning'
                }`}>
                  {availabilityStatus === 'available' && <CheckCircle size={16} />}
                  {availabilityStatus === 'booked' && <X size={16} />}
                  {availabilityStatus === 'reserved' && <Clock size={16} />}
                  {availabilityStatus === 'available' ? 'Available' : availabilityStatus === 'booked' ? 'Booked' : 'Reserved'}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                {availabilityStatus === 'available' ? (
                  <>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowBooking(!showBooking)}
                      className="flex-1 py-3.5 sm:py-5 bg-primary rounded-[14px] sm:rounded-[24px] text-black font-black uppercase tracking-[0.15em] text-xs sm:text-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                    >
                      {showBooking ? 'Close' : 'Book Now'} <ArrowRight className="inline ml-2" size={18} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowReservation(!showReservation)}
                      className="flex-1 py-3.5 sm:py-5 bg-white/5 border border-white/10 rounded-[14px] sm:rounded-[24px] text-white font-black uppercase tracking-[0.15em] text-xs sm:text-sm hover:bg-white/10 transition-all"
                    >
                      {showReservation ? 'Close' : 'Reserve'} <Clock className="inline ml-2" size={18} />
                    </motion.button>
                  </>
                ) : (
                  <motion.button 
                    disabled
                    className="flex-1 py-3.5 sm:py-5 bg-muted/20 border border-muted/30 rounded-[14px] sm:rounded-[24px] text-muted-foreground font-black uppercase tracking-[0.15em] text-xs sm:text-sm cursor-not-allowed"
                  >
                    {availabilityStatus === 'booked' ? 'Currently Booked' : 'Reserved'} 
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Booking Flow Modal */}
          <AnimatePresence>
            {showBooking && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-6 md:mt-12 relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-orange-500/10 to-primary/20 rounded-[16px] sm:rounded-[32px] md:rounded-[48px] blur-2xl" />
                <div className="relative p-2 sm:p-5 md:p-10 bg-card/50 backdrop-blur-xl rounded-[16px] sm:rounded-[32px] md:rounded-[48px] border border-primary/20">
                  <button 
                    onClick={() => setShowBooking(false)}
                    className="absolute top-3 right-3 md:top-6 md:right-6 p-2 hover:bg-white/10 rounded-full transition-all z-10"
                  >
                    <X size={24} className="text-white" />
                  </button>
                  <BookingFlow car={car} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reservation Flow Modal */}
          <AnimatePresence>
            {showReservation && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-6 md:mt-12 relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-warning/20 via-orange-500/10 to-warning/20 rounded-[16px] sm:rounded-[32px] md:rounded-[48px] blur-2xl" />
                <div className="relative p-2 sm:p-5 md:p-10 bg-card/50 backdrop-blur-xl rounded-[16px] sm:rounded-[32px] md:rounded-[48px] border border-warning/20">
                  <button 
                    onClick={() => setShowReservation(false)}
                    className="absolute top-3 right-3 md:top-6 md:right-6 p-2 hover:bg-white/10 rounded-full transition-all z-10"
                  >
                    <X size={24} className="text-white" />
                  </button>
                  <ReservationFlow car={car} onClose={() => setShowReservation(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detailed Specifications */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mt-20"
          >
            <h2 className="text-3xl font-serif font-black italic text-white mb-8">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-card/50 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-primary/20 transition-all">
                <h4 className="font-black text-white mb-4 uppercase tracking-widest text-sm">Features</h4>
                <ul className="grid grid-cols-2 gap-3">
                  {car.features.map((feature, idx) => (
                    <li key={idx} className="text-muted-foreground text-sm flex items-center gap-2">
                      <ShieldCheck size={14} className="text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 bg-card/50 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-primary/20 transition-all">
                <h4 className="font-black text-white mb-4 uppercase tracking-widest text-sm">Vehicle Details</h4>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">License Plate: <span className="text-white font-bold">{car.license_plate}</span></p>
                  <p className="text-muted-foreground">Category: <span className="text-white font-bold">{car.category}</span></p>
                  <p className="text-muted-foreground">Year: <span className="text-white font-bold">{car.year}</span></p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="mt-20"
            >
              <h2 className="text-3xl font-serif font-black italic text-white mb-8">Customer Reviews</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {reviews.map((review) => (
                  <motion.div 
                    key={review.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-8 bg-card/50 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          size={16} 
                          className={i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-white/20'}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm italic">"{review.comment}"</p>
                    <p className="text-xs font-bold text-primary mt-4">- {review.user_profiles?.full_name}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
