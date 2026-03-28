import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Fuel, 
  Settings, 
  ArrowRight,
  Star,
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { fleetService } from '../../services/fleetService';
import { Car } from '../../types';
import { SearchControls } from './SearchControls';
import { FilterPanel } from './FilterPanel';

export function CarShowroom() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  const [searchParams, setSearchParams] = useState({
    location: '',
    pickupDate: '',
    dropoffDate: ''
  });

  useEffect(() => {
    async function fetchCars() {
      setLoading(true);
      try {
        let result;
        if (searchParams.pickupDate && searchParams.dropoffDate) {
          result = await fleetService.getAvailableCars(searchParams.pickupDate, searchParams.dropoffDate);
        } else {
          result = await fleetService.getAllCars();
        }
        
        if (result && 'data' in result) {
          setCars(result.data || []);
        } else if (Array.isArray(result)) {
          setCars(result);
        }
        setHasMore(false); // Simplified for now
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCars();
  }, [searchParams]);

  // Infinite scroll logic
  useEffect(() => {
    if (inView && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [inView, hasMore]);

  return (
    <div className="min-h-screen bg-background">
      <SearchControls onSearch={setSearchParams} />
      
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
          <FilterPanel onFilterChange={() => {}} />
          
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[16/10] rounded-[40px] bg-card animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                  {cars.map((car, i) => (
                    <motion.div 
                      key={car.id}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.05 }}
                      className="group cursor-pointer"
                    >
                      <Link to={`/cars/${car.id}`}>
                        <div className="relative aspect-[16/10] rounded-[40px] overflow-hidden mb-6 bg-card border border-white/5">
                          <img 
                            src={car.primary_image_url || `https://picsum.photos/seed/${car.id}/800/500`} 
                            alt={`${car.make} ${car.model}`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-6 right-6 px-4 py-2 glass rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                            {car.category}
                          </div>
                        </div>
                        
                        <div className="px-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-2xl font-serif font-black tracking-tight italic group-hover:text-primary transition-colors">
                                {car.make} {car.model} ({car.year})
                              </h3>
                              <div className="flex items-center gap-1 text-amber-500 mt-1">
                                <Star size={12} fill="currentColor" />
                                <span className="text-[10px] font-black uppercase tracking-widest">4.9 (120+)</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-primary font-black text-2xl tracking-tighter">${car.daily_rate}</span>
                              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">/day</span>
                            </div>
                          </div>
                          
                          <div className="mt-8 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${car.status === 'available' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{car.status}</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary group-hover:translate-x-2 transition-transform">
                              <span className="text-[10px] font-black uppercase tracking-widest">View Details</span>
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={ref} className="h-10" />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
