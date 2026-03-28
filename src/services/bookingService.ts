import { supabase, handleSupabaseError } from '../lib/supabase';

export const bookingService = {
  createBooking: async (bookingData: any) => {
    try {
      // 1. Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      // 2. Prepare the booking record
      const payload = {
        car_id: bookingData.carId,
        client_id: user?.id || null, // Allow guest bookings
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        pickup_location: bookingData.location,
        total_amount: bookingData.totalAmount,
        status: bookingData.paymentMethod === 'mpesa' ? 'pending_verification' : 'confirmed',
        payment_status: bookingData.paymentMethod === 'mpesa' ? 'pending' : 'paid',
        payment_method: bookingData.paymentMethod,
        // Store guest details in a JSONB field or separate guest_profiles table if needed
        // For now, we'll use metadata or comments for guest info if not logged in
        metadata: {
          guest_info: !user ? {
            full_name: bookingData.fullName,
            email: bookingData.email,
            phone: bookingData.phone,
            license_number: bookingData.license
          } : null,
          signature_url: bookingData.signatureUrl,
          documents: bookingData.documents
        }
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // 3. If M-Pesa, also log to pending_payments
      if (bookingData.paymentMethod === 'mpesa' && bookingData.mpesaCode) {
        await supabase.from('pending_payments').insert([{
          booking_id: data.id,
          amount: bookingData.totalAmount,
          transaction_code: bookingData.mpesaCode,
          method: 'mpesa',
          status: 'pending'
        }]);
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
