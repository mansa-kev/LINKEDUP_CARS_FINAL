import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { fleetService } from '../../services/fleetService';
import { Car } from '../../types';
import { BookingFlow } from './BookingFlow/BookingFlow';

export function CarDetails() {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showBooking, setShowBooking] = useState(false);

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
      } catch (error) {
        console.error('Error fetching car details:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCar();
  }, [id]);

  if (loading || !car) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;

  // Debug image data
  console.log('Car photos:', car.photos);
  console.log('Car primary_image_url:', car.primary_image_url);
  console.log('Car images array:', car.images);

  // Handle multiple image field possibilities
  const images = [];
  
  // Try photos array first
  if (car.photos && Array.isArray(car.photos) && car.photos.length > 0) {
    images.push(...car.photos);
  }
  
  // Try images array as fallback
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    images.push(...car.images);
  }
  
  // Add primary image as fallback
  if (car.primary_image_url) {
    images.push(car.primary_image_url);
  }
  
  // Final fallback to placeholder
  if (images.length === 0) {
    images.push(`https://picsum.photos/seed/${car.id}/1200/800`);
  }

  console.log('Final images array:', images);

  return (
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
      <div className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Hero Image Gallery */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="relative aspect-[16/10] rounded-[60px] overflow-hidden border border-white/10 bg-card/50 backdrop-blur-xl group">
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
                <h1 className="text-6xl font-serif font-black italic text-white mb-4 tracking-tight">
                  {car.make} <span className="text-primary">{car.model}</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{car.description}</p>
                <p className="text-4xl font-black mb-8 text-white">
                  <span className="text-primary">KES {car.daily_rate}</span>
                  <span className="text-sm text-muted-foreground font-bold">/day</span>
                </p>
                
                <div className="grid grid-cols-3 gap-4 mb-12">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="p-5 bg-card/50 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-primary/30 transition-all flex items-center gap-3"
                  >
                    <Users className="text-primary" size={20} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Seats</p>
                      <span className="text-sm font-bold text-white">{car.seats}</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="p-5 bg-card/50 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-primary/30 transition-all flex items-center gap-3"
                  >
                    <Fuel className="text-primary" size={20} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Fuel</p>
                      <span className="text-sm font-bold text-white">{car.fuel_type}</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="p-5 bg-card/50 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-primary/30 transition-all flex items-center gap-3"
                  >
                    <Settings className="text-primary" size={20} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Trans</p>
                      <span className="text-sm font-bold text-white">{car.transmission}</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowBooking(!showBooking)}
                  className="flex-1 py-6 bg-primary rounded-[24px] text-black font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                >
                  {showBooking ? 'Close' : 'Book Now'} <ArrowRight className="inline ml-2" size={20} />
                </motion.button>
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
                className="mt-12 relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-orange-500/10 to-primary/20 rounded-[48px] blur-2xl" />
                <div className="relative p-12 bg-card/50 backdrop-blur-xl rounded-[48px] border border-primary/20">
                  <button 
                    onClick={() => setShowBooking(false)}
                    className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"
                  >
                    <X size={24} className="text-white" />
                  </button>
                  <BookingFlow car={car} />
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
  );
}
