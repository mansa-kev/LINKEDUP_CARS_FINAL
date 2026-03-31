import { supabase, handleSupabaseError } from '../lib/supabase';

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
  // Get active master contract template
  getMasterContract: async () => {
    console.log('🔍 Enhanced Contract Service: Fetching master contract...');
    
    try {
      const { data, error } = await supabase
        .from('contracts_master')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('📊 Database response:', { data, error });

      if (error) {
        console.log('❌ Database error:', error);
        
        // If no contract found, create a test one for demonstration
        if (error.code === 'PGRST116') {
          console.log('🔧 No contract found, creating test contract...');
          await enhancedContractService.createTestContract();
          // Try again after creating
          const { data: retryData, error: retryError } = await supabase
            .from('contracts_master')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          console.log('🔄 Retry response:', { retryData, retryError });
          
          if (retryError) throw retryError;
          return retryData;
        }
        throw error;
      }
      
      console.log('✅ Contract found successfully:', data);
      return data;
    } catch (error) {
      console.error('💥 Error in getMasterContract:', error);
      return null;
    }
  },

  // Create test contract for demonstration
  createTestContract: async () => {
    try {
      const testContract = {
        version: '1.0.0',
        contract_title: 'Standard Rental Agreement',
        terms_summary: 'This is a standard rental agreement template for vehicle rentals.',
        pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        is_active: true,
        uploaded_by: 'system-demo'
      };

      const { data, error } = await supabase
        .from('contracts_master')
        .insert([testContract])
        .select()
        .single();

      if (error) {
        console.error('Error creating test contract:', error);
        return;
      }

      console.log('✅ Test contract created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating test contract:', error);
    }
  },

  // Generate dynamic contract with booking data overlay
  generateDynamicContract: async (contractData: ContractData): Promise<string> => {
    try {
      const masterContract = await enhancedContractService.getMasterContract();
      if (!masterContract) {
        throw new Error('No active master contract found');
      }

      // In a real implementation, you would use a PDF library like jsPDF or PDFKit
      // For now, we'll simulate dynamic data replacement
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

      // Store the generated contract data (gracefully handle if table doesn't exist)
      try {
        const { data, error } = await supabase
          .from('signed_contracts')
          .insert([contractContent])
          .select()
          .single();

        if (error) {
          console.warn('Could not store generated contract (table may not exist):', error);
        }
      } catch (insertError) {
        console.warn('Contract storage skipped - table may not exist:', insertError);
      }

      // Return the master contract URL (in real implementation, this would be the generated PDF URL)
      return masterContract.pdf_url || masterContract.contract_url || '';
    } catch (error) {
      console.error('Error generating dynamic contract:', error);
      throw error;
    }
  },

  // Save signed contract with digital signature
  saveSignedContract: async (
    bookingId: string,
    signatureData: string,
    contractData: ContractData
  ): Promise<SignedContract> => {
    try {
      // Generate the dynamic contract
      const contractUrl = await enhancedContractService.generateDynamicContract(contractData);

      // Save the signed contract
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

      // Update booking status to reflect signed contract
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

  // Get signed contracts for a user
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

  // Update contract status
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

  // Trigger payment authorization hold
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

      // In a real implementation, this would integrate with payment processor
      // to place an actual hold on the payment method
      console.log(`Payment authorization hold triggered for contract ${contractId}`);
    } catch (error) {
      console.error('Error triggering payment hold:', error);
      throw error;
    }
  },

  // Release payment hold
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

      console.log(`Payment hold released for contract ${contractId}`);
    } catch (error) {
      console.error('Error releasing payment hold:', error);
      throw error;
    }
  },

  // Get contract by booking ID
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
