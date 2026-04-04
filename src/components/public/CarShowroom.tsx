import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

interface Filters {
  category: string;
  priceMin: number;
  priceMax: number;
  transmission: string;
  fuelType: string;
  minSeats: number;
  sortBy: string;
}

export function CarShowroom() {
  const [searchParamsURL] = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView();

  const [searchParams, setSearchParams] = useState({
    location: searchParamsURL.get('location') || '',
    pickupDate: searchParamsURL.get('pickup') || '',
    dropoffDate: searchParamsURL.get('return') || ''
  });

  const [filters, setFilters] = useState<Filters>({
    category: searchParamsURL.get('category') || '',
    priceMin: 0,
    priceMax: 50000,
    transmission: '',
    fuelType: '',
    minSeats: 0,
    sortBy: 'recommended',
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
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCars();
  }, [searchParams]);

  // Apply filters whenever cars or filters change
  useEffect(() => {
    let result = [...cars];

    // Filter by category
    if (filters.category) {
      result = result.filter(c => c.category?.toLowerCase() === filters.category);
    }

    // Filter by price
    if (filters.priceMin > 0) {
      result = result.filter(c => c.daily_rate >= filters.priceMin);
    }
    if (filters.priceMax < 50000) {
      result = result.filter(c => c.daily_rate <= filters.priceMax);
    }

    // Filter by transmission
    if (filters.transmission) {
      result = result.filter(c => c.transmission?.toLowerCase() === filters.transmission);
    }

    // Filter by fuel type
    if (filters.fuelType) {
      result = result.filter(c => c.fuel_type?.toLowerCase() === filters.fuelType);
    }

    // Filter by seats
    if (filters.minSeats > 0) {
      result = result.filter(c => c.seats >= filters.minSeats);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.daily_rate - b.daily_rate);
        break;
      case 'price_desc':
        result.sort((a, b) => b.daily_rate - a.daily_rate);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'name_asc':
        result.sort((a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`));
        break;
    }

    setFilteredCars(result);
  }, [cars, filters]);

  return (
    <div className="min-h-screen bg-background">
      <SearchControls onSearch={setSearchParams} initialParams={searchParams} />

      <section className="py-8 md:py-20 px-4 md:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-8">
          <FilterPanel onFilterChange={setFilters} />

          <div className="flex-1">
            {/* Results count */}
            {!loading && (
              <div className="mb-4 md:mb-6 flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {filteredCars.length} {filteredCars.length === 1 ? 'vehicle' : 'vehicles'} found
                </p>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[16/10] rounded-[24px] md:rounded-[40px] bg-card animate-pulse border border-white/5" />
                ))}
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg font-bold text-white/60 mb-2">No vehicles match your criteria</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredCars.map((car, i) => (
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
                        <div className="relative aspect-[16/10] rounded-[24px] md:rounded-[40px] overflow-hidden mb-4 md:mb-6 bg-card border border-white/5">
                          <img
                            src={car.primary_image_url || car.photos?.[0] || `https://picsum.photos/seed/${car.id}/800/500`}
                            alt={`${car.make} ${car.model}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src = `https://picsum.photos/seed/showroom-${car.id}/800/500`;
                            }}
                          />
                          <div className="absolute top-4 right-4 md:top-6 md:right-6 px-3 py-1.5 md:px-4 md:py-2 glass rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white">
                            {car.category}
                          </div>
                        </div>

                        <div className="px-2 md:px-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg md:text-2xl font-serif font-black tracking-tight italic group-hover:text-primary transition-colors truncate">
                                {car.make} {car.model} ({car.year})
                              </h3>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <div className="flex items-center gap-1 text-amber-500">
                                  <Star size={12} fill="currentColor" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">4.9</span>
                                </div>
                                {car.transmission && (
                                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                                    <Settings size={10} /> {car.transmission}
                                  </span>
                                )}
                                {car.fuel_type && (
                                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                                    <Fuel size={10} /> {car.fuel_type}
                                  </span>
                                )}
                                {car.seats > 0 && (
                                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                                    <Users size={10} /> {car.seats}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <span className="text-primary font-black text-xl md:text-2xl tracking-tighter">KES {car.daily_rate?.toLocaleString()}</span>
                              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">/day</span>
                            </div>
                          </div>

                          <div className="mt-4 md:mt-8 flex items-center justify-between">
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
