import { supabase, handleSupabaseErrorWrapper as handleSupabaseError } from '../lib/supabase';

export interface ContractData {
  client_name: string;
  car_make: string;
  car_model: string;
  pickup_date: string;
  dropoff_date: string;
  total_amount: number;
  booking_id: string;
  client_email: string;
  client_phone: string;
  license_plate: string;
  daily_rate: number;
  security_deposit: number;
}

export interface SignedContract {
  id: string;
  booking_id: string;
  contract_url: string;
  signed_at: string;
  signature_data: string;
  agreement_status: 'pending' | 'signed' | 'rejected';
  payment_hold_status: 'pending' | 'authorized' | 'released';
  created_at: string;
}

export const enhancedContractService = {
  getMasterContract: async () => {
    try {
      const { data, error } = await supabase
        .from('contracts_master')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active contract found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getMasterContract:', error);
      return null;
    }
  },

  generateDynamicContract: async (contractData: ContractData): Promise<string> => {
    try {
      const masterContract = await enhancedContractService.getMasterContract();
      if (!masterContract) {
        throw new Error('No active master contract found');
      }

      const contractContent = {
        ...masterContract,
        dynamic_data: {
          client_name: contractData.client_name,
          car_details: `${contractData.car_make} ${contractData.car_model}`,
          rental_period: `${contractData.pickup_date} to ${contractData.dropoff_date}`,
          total_amount: contractData.total_amount,
          booking_id: contractData.booking_id,
          client_contact: `${contractData.client_email} | ${contractData.client_phone}`,
          vehicle_details: `${contractData.license_plate} | KES ${contractData.daily_rate}/day`,
          deposit_amount: contractData.security_deposit
        }
      };

      try {
        await supabase
          .from('signed_contracts')
          .insert([contractContent])
          .select()
          .single();
      } catch (insertError) {
        // Gracefully handle if signed_contracts table doesn't exist yet
      }

      return masterContract.pdf_url || masterContract.contract_url || '';
    } catch (error) {
      console.error('Error generating dynamic contract:', error);
      throw error;
    }
  },

  saveSignedContract: async (
    bookingId: string,
    signatureData: string,
    contractData: ContractData
  ): Promise<SignedContract> => {
    try {
      const contractUrl = await enhancedContractService.generateDynamicContract(contractData);

      const { data, error } = await supabase
        .from('signed_contracts')
        .insert([{
          booking_id: bookingId,
          contract_url: contractUrl,
          signature_data: signatureData,
          agreement_status: 'signed',
          payment_hold_status: 'pending',
          client_data: contractData
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('bookings')
        .update({
          contract_signed: true,
          contract_id: data.id,
          status: 'contract_signed'
        })
        .eq('id', bookingId);

      return data;
    } catch (error) {
      console.error('Error saving signed contract:', error);
      throw error;
    }
  },

  getSignedContracts: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('signed_contracts')
        .select(`
          *,
          bookings!inner(
            *,
            cars!inner(*)
          )
        `)
        .eq('bookings.client_id', userId)
        .order('signed_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching signed contracts:', error);
      return [];
    }
  },

  updateContractStatus: async (
    contractId: string,
    status: 'pending' | 'signed' | 'rejected'
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('signed_contracts')
        .update({ agreement_status: status })
        .eq('id', contractId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating contract status:', error);
      throw error;
    }
  },

  triggerPaymentHold: async (contractId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('signed_contracts')
        .update({
          payment_hold_status: 'authorized',
          payment_hold_triggered_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;
    } catch (error) {
      console.error('Error triggering payment hold:', error);
      throw error;
    }
  },

  releasePaymentHold: async (contractId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('signed_contracts')
        .update({
          payment_hold_status: 'released',
          payment_hold_released_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;
    } catch (error) {
      console.error('Error releasing payment hold:', error);
      throw error;
    }
  },

  getContractByBooking: async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('signed_contracts')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching contract by booking:', error);
      return null;
    }
  }
};
