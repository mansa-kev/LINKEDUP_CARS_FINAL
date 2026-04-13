import { supabase, handleSupabaseErrorWrapper as handleSupabaseError } from '../lib/supabase';

export const clientService = {
  getDashboardData: async (clientId: string) => {
    try {
      // Fetch active rental
      const { data: activeBooking, error: aError } = await supabase
        .from('bookings')
        .select('*, cars(*)')
        .eq('client_id', clientId)
        .eq('status', 'in_progress')
        .single();
      
      // Fetch upcoming bookings
      const { data: upcomingBookings, error: uError } = await supabase
        .from('bookings')
        .select('*, cars(*)')
        .eq('client_id', clientId)
        .eq('status', 'confirmed')
        .order('start_date', { ascending: true });

      // Fetch profile for completion status
      const { data: profile, error: pError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', clientId)
        .single();

      // Fetch recommendations (mocked logic based on past bookings)
      const { data: pastBookings, error: bError } = await supabase
        .from('bookings')
        .select('*, cars(*)')
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .order('end_date', { ascending: false });

      if (uError || pError || bError) throw uError || pError || bError;

      // Simple recommendation logic: suggest cars of similar category to last booking
      const lastBooking = pastBookings?.[0];
      let recommendations: any[] = [];
      if (lastBooking) {
        const { data: recs, error: rError } = await supabase
          .from('cars')
          .select('*')
          .eq('category', lastBooking.cars.category)
          .neq('id', lastBooking.car_id)
          .limit(3);
        if (!rError) recommendations = recs || [];
      }

      return { 
        activeBooking, 
        upcomingBookings: upcomingBookings || [], 
        profile,
        recommendations 
      };
    } catch (error) {
      return handleSupabaseError(error, 'getDashboardData');
    }
  },

  getClientDocuments: async (clientId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, document_status, admin_notes, metadata, start_date, end_date, cars(make, model)')
      .eq('client_id', clientId)
      .not('metadata->documents', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data;
  },

  getGloveboxData: async (clientId: string) => {
    const [bookingsRes, paymentsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, document_status, admin_notes, metadata, start_date, end_date, cars(make, model)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('pending_payments')
        .select('*, bookings(id, start_date, end_date, cars(make, model))')
        .eq('client_id', clientId)
        .order('submitted_at', { ascending: false }),
    ]);

    const bookings = bookingsRes.data || [];
    const payments = paymentsRes.data || [];

    // Most recent booking that has documents
    const docBooking = bookings.find((b: any) => b.metadata?.documents);
    const docs = docBooking?.metadata?.documents || {};
    const idNumber = docBooking?.metadata?.guest_info?.idNumber || docBooking?.metadata?.idNumber || null;

    // Contracts vault: bookings that have a contract or signature URL
    const contracts = bookings
      .filter((b: any) => b.metadata?.contract_url || b.metadata?.signature_url)
      .map((b: any) => ({
        id: b.id,
        car: b.cars ? `${b.cars.make} ${b.cars.model}` : 'Unknown Car',
        start_date: b.start_date,
        end_date: b.end_date,
        contract_url: b.metadata?.contract_url || null,
        signature_url: b.metadata?.signature_url || null,
      }));

    return {
      docBooking,
      documents: {
        facePhotoUrl:    docs.facePhotoUrl    || null,
        licenseFrontUrl: docs.licenseFrontUrl || null,
        licenseBackUrl:  docs.licenseBackUrl  || null,
        idFrontUrl:      docs.idFrontUrl      || null,
        idBackUrl:       docs.idBackUrl       || null,
        idNumber,
        status:     docBooking?.document_status || null,
        bookingId:  docBooking?.id || null,
      },
      contracts,
      payments,
    };
  },

  getSignedContracts: async (clientId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, start_date, end_date, metadata, cars(make, model)')
      .eq('client_id', clientId)
      .not('metadata->contract_url', 'is', null);
    if (error) return [];
    return data || [];
  },

  getTransactions: async (clientId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, bookings(id, cars(make, model))')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  getAllBookings: async (clientId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, cars(*)')
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });
    if (error) return handleSupabaseError(error, 'getAllBookings');
    return data;
  },

  updateProfile: async (clientId: string, updates: any) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', clientId);
    if (error) return handleSupabaseError(error, 'updateProfile');
    return data;
  },

  getPreferences: async (clientId: string) => {
    const { data, error } = await supabase
      .from('client_preferences')
      .select('*')
      .eq('id', clientId)
      .single();
    if (error && error.code !== 'PGRST116') return handleSupabaseError(error, 'getPreferences');
    return data;
  },

  updatePreferences: async (clientId: string, updates: any) => {
    const { data, error } = await supabase
      .from('client_preferences')
      .upsert({ id: clientId, ...updates });
    if (error) return handleSupabaseError(error, 'updatePreferences');
    return data;
  },

  getWishlist: async (clientId: string) => {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*, cars(*)')
      .eq('client_id', clientId);
    if (error) return handleSupabaseError(error, 'getWishlist');
    return data;
  },

  addToWishlist: async (clientId: string, carId: string) => {
    const { data, error } = await supabase
      .from('wishlist')
      .insert({ client_id: clientId, car_id: carId });
    if (error) return handleSupabaseError(error, 'addToWishlist');
    return data;
  },

  removeFromWishlist: async (clientId: string, carId: string) => {
    const { data, error } = await supabase
      .from('wishlist')
      .delete()
      .eq('client_id', clientId)
      .eq('car_id', carId);
    if (error) return handleSupabaseError(error, 'removeFromWishlist');
    return data;
  },

  getMessages: async (clientId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:user_profiles!sender_id(full_name, role), receiver:user_profiles!receiver_id(full_name, role)')
      .or(`sender_id.eq.${clientId},receiver_id.eq.${clientId}`)
      .order('created_at', { ascending: false });
    if (error) return handleSupabaseError(error, 'getMessages');
    return data;
  },

  sendMessage: async (message: any) => {
    const { data, error } = await supabase
      .from('messages')
      .insert(message);
    if (error) return handleSupabaseError(error, 'sendMessage');
    return data;
  },

  submitExtensionRequest: async (request: any) => {
    const { data, error } = await supabase
      .from('extension_requests')
      .insert(request);
    if (error) return handleSupabaseError(error, 'submitExtensionRequest');
    return data;
  },

  getExtensionRequests: async (clientId: string) => {
    const { data, error } = await supabase
      .from('extension_requests')
      .select('*, bookings(cars(make, model))')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (error) return handleSupabaseError(error, 'getExtensionRequests');
    return data;
  },

  getLoyaltyStatus: async (clientId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('loyalty_tier, referral_credits')
      .eq('id', clientId)
      .single();
    if (error) return handleSupabaseError(error, 'getLoyaltyStatus');

    // Get number of completed bookings to calculate progress
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'completed');
    
    if (countError) return handleSupabaseError(countError, 'getLoyaltyStatusCount');

    return {
      ...data,
      completed_bookings: count || 0
    };
  },

  getPromoCodes: async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('status', 'active')
      .gte('expiry_date', new Date().toISOString());
    if (error) return handleSupabaseError(error, 'getPromoCodes');
    return data;
  },

  getExclusiveOffers: async () => {
    const { data, error } = await supabase
      .from('exclusive_offers')
      .select('*')
      .eq('status', 'active');
    if (error) return handleSupabaseError(error, 'getExclusiveOffers');
    return data;
  }
};
