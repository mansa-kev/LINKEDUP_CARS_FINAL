import { supabase, handleSupabaseErrorWrapper as handleSupabaseError } from '../lib/supabase';

export interface ReservationData {
  carId: string;
  startDate: string;
  endDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
}

export const reservationService = {
  // Get current reservation fee from settings
  getReservationFee: async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'reservation_fee')
        .single();
      
      if (error) throw error;
      return data?.value || 500; // Default to 500 if not found
    } catch (error) {
      console.error('Error fetching reservation fee:', error);
      return 500; // Default fallback
    }
  },

  // Create a car reservation
  createReservation: async (data: ReservationData) => {
    try {
      // Get car details and calculate fees
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('fleet_owner_id, daily_rate')
        .eq('id', data.carId)
        .single();

      if (carError || !car) {
        throw new Error('Car not found');
      }

      // Calculate days and total amount
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const reservationFee = await reservationService.getReservationFee();
      const rentalAmount = car.daily_rate * days;
      const totalAmount = reservationFee + rentalAmount;

      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      const reservationData = {
        car_id: data.carId,
        client_id: user?.id || null,
        fleet_owner_id: car.fleet_owner_id,
        start_date: data.startDate,
        end_date: data.endDate,
        reservation_fee: reservationFee,
        total_amount: totalAmount,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        notes: data.notes || null,
        status: 'reserved',
        payment_status: 'pending',
        payment_method: null,
        transaction_code: null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

      const { data: reservation, error } = await supabase
        .from('car_reservations')
        .insert([reservationData])
        .select()
        .single();

      if (error) throw error;

      return reservation;
    } catch (error) {
      return handleSupabaseError(error, 'createReservation');
    }
  },

  // Get user's reservations
  getUserReservations: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('car_reservations')
        .select(`
          *,
          cars!inner(*),
          user_profiles!inner(full_name, email)
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      return [];
    }
  },

  // Get all reservations for admin
  getAllReservations: async (page: number = 1, pageSize: number = 20) => {
    try {
      // Check if car_reservations table exists
      try {
        await supabase
          .from('car_reservations')
          .select('id')
          .limit(1);
      } catch (tableCheckError: any) {
        // Check if it's a "relation does not exist" error (PostgreSQL code 42P01)
        if (tableCheckError?.code === '42P01' || tableCheckError?.message?.includes('relation "car_reservations" does not exist')) {
          console.warn(
            "â ï¸ Table 'car_reservations' does not exist in Supabase. Please create it with these columns: " +
            "id, car_id, client_id, fleet_owner_id, start_date, end_date, reservation_fee, total_amount, " +
            "status, payment_status, payment_method, transaction_code, contact_name, contact_email, " +
            "contact_phone, notes, expires_at, created_at, updated_at"
          );
          return { data: [], count: 0 };
        }
        // If it's a different error, re-throw it
        throw tableCheckError;
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('car_reservations')
        .select(`
          *,
          cars!inner(*),
          client:user_profiles!inner(full_name, email),
          fleet_owner:user_profiles!inner(full_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0
      };
    } catch (error) {
      console.error('Error fetching all reservations:', error);
      return { data: [], count: 0 };
    }
  },

  // Convert reservation to booking
  convertToBooking: async (reservationId: string, bookingData: any) => {
    try {
      // Get reservation details
      const { data: reservation, error: resError } = await supabase
        .from('car_reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (resError || !reservation) {
        throw new Error('Reservation not found');
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          car_id: reservation.car_id,
          client_id: reservation.client_id,
          fleet_owner_id: reservation.fleet_owner_id,
          start_date: reservation.start_date,
          end_date: reservation.end_date,
          total_amount: reservation.total_amount - reservation.reservation_fee, // Subtract reservation fee
          platform_commission: 0, // Already handled in reservation
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: bookingData.paymentMethod || 'mpesa',
          pickup_location: bookingData.location || 'TBD',
          metadata: bookingData.metadata || {}
        }])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update reservation status
      await supabase
        .from('car_reservations')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: bookingData.paymentMethod || 'mpesa',
          transaction_code: bookingData.mpesaCode
        })
        .eq('id', reservationId);

      // Record reservation revenue
      try {
        await supabase.from('reservation_revenue').insert({
          reservation_id: reservation.id,
          car_id: reservation.car_id,
          fleet_owner_id: reservation.fleet_owner_id,
          client_id: reservation.client_id,
          reservation_fee: reservation.reservation_fee,
          total_reservation_value: reservation.total_amount,
          payment_method: bookingData.paymentMethod || 'mpesa',
          transaction_code: bookingData.mpesaCode,
          recorded_at: new Date().toISOString(),
          status: 'collected'
        });
      } catch (revenueError: any) {
        // Graceful table-missing check
        if (revenueError?.code === '42P01' || revenueError?.message?.includes('relation "reservation_revenue" does not exist')) {
          console.warn(
            "⚠️ reservation_revenue table missing. Please create it in Supabase with columns: " +
            "id (uuid), reservation_id, car_id, fleet_owner_id, client_id, reservation_fee (numeric), " +
            "total_reservation_value (numeric), payment_method (text), transaction_code (text), " +
            "recorded_at (timestamptz), status (text)"
          );
        } else {
          console.error('Error recording reservation revenue:', revenueError);
        }
        // Continue without crashing
      }

      return booking;
    } catch (error) {
      return handleSupabaseError(error, 'convertToBooking');
    }
  },

  // Check if car is available for dates
  checkAvailability: async (carId: string, startDate: string, endDate: string) => {
    try {
      // Check existing bookings
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('start_date, end_date, status')
        .eq('car_id', carId)
        .in('status', ['confirmed', 'on_trip']);

      // Check existing reservations
      const { data: reservations, error: resError } = await supabase
        .from('car_reservations')
        .select('start_date, end_date, status')
        .eq('car_id', carId)
        .eq('status', 'reserved');

      if (bookingError || resError) throw bookingError || resError;

      const checkOverlap = (existingStart: string, existingEnd: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const existingStartDate = new Date(existingStart);
        const existingEndDate = new Date(existingEnd);

        return (
          (start >= existingStartDate && start <= existingEndDate) ||
          (end >= existingStartDate && end <= existingEndDate) ||
          (start <= existingStartDate && end >= existingEndDate)
        );
      };

      // Check for overlaps
      const hasBookingOverlap = bookings?.some(b => checkOverlap(b.start_date, b.end_date)) || false;
      const hasReservationOverlap = reservations?.some(r => checkOverlap(r.start_date, r.end_date)) || false;

      return {
        available: !(hasBookingOverlap || hasReservationOverlap),
        conflicts: [...(bookings || []), ...(reservations || [])].filter(item => 
          checkOverlap(item.start_date, item.end_date)
        )
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { available: false, conflicts: [] };
    }
  }
};
