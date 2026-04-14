import { supabase, handleSupabaseErrorWrapper as handleSupabaseError } from '../lib/supabase';
import { reservationService } from './reservationService';

const DEFAULT_COMMISSION_RATE = 0.15; // 15% platform commission

export const bookingService = {
  createBooking: async (bookingData: any) => {
    try {
      // 1. Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Check availability first
      const availability = await reservationService.checkAvailability(
        bookingData.carId,
        bookingData.startDate,
        bookingData.endDate
      );

      if (!availability.available) {
        throw new Error('Selected dates are not available. The car is either booked or reserved for these dates.');
      }

      // 3. Look up the car to get fleet_owner_id
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('fleet_owner_id')
        .eq('id', bookingData.carId)
        .single();

      if (carError || !car) {
        throw new Error('Could not find the selected car. Please try again.');
      }

      // 4. Calculate platform commission
      const totalAmount = bookingData.totalAmount;
      const platformCommission = Math.round(totalAmount * DEFAULT_COMMISSION_RATE * 100) / 100;

      // 5. Prepare the booking record
      const payload = {
        car_id: bookingData.carId,
        client_id: user?.id || null,
        fleet_owner_id: car.fleet_owner_id,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        pickup_location: bookingData.pickupLocation || bookingData.location,
        dropoff_location: bookingData.dropoffLocation || bookingData.pickupLocation || bookingData.location,
        total_amount: totalAmount,
        platform_commission: platformCommission,
        status: bookingData.paymentMethod === 'mpesa' ? 'pending_payment_verification' : 'confirmed',
        payment_status: bookingData.paymentMethod === 'mpesa' ? 'pending' : 'paid',
        payment_method: bookingData.paymentMethod,
        metadata: {
          guest_info: !user ? {
            full_name: bookingData.fullName,
            email: bookingData.email,
            phone: bookingData.phone,
            license_number: bookingData.license,
            id_number: bookingData.idNumber || null,
          } : null,
          signature_url: bookingData.signatureUrl,
          documents: bookingData.documents ?? {
            facePhotoUrl:    bookingData.facePhotoUrl    || null,
            licenseFrontUrl: bookingData.licenseFrontUrl || null,
            licenseBackUrl:  bookingData.licenseBackUrl  || null,
            idFrontUrl:      bookingData.idFrontUrl      || null,
            idBackUrl:       bookingData.idBackUrl       || null,
          }
        }
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // 6. If M-Pesa, save transaction code directly on the booking
      if (bookingData.paymentMethod === 'mpesa' && bookingData.mpesaCode) {
        await supabase
          .from('bookings')
          .update({ transaction_code: bookingData.mpesaCode })
          .eq('id', data.id);
        data.transaction_code = bookingData.mpesaCode;
      }

      return data;
    } catch (error) {
      return handleSupabaseError(error, 'createBooking');
    }
  },

  getBookingById: async (id: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, cars(*)')
      .eq('id', id)
      .single();
    if (error) return handleSupabaseError(error, 'getBookingById');
    return data;
  },

  uploadDocument: async (file: File, type: string, bookingId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${bookingId}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `booking-docs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('public_assets')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }
};
