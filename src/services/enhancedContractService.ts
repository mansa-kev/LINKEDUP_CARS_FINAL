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
  po_box?: string;
  id_number?: string;
  color?: string;
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

  generateDynamicContract: async (contractData: ContractData, signatureData?: string): Promise<string> => {
    try {
      const masterContract = await enhancedContractService.getMasterContract();
      if (!masterContract || (!masterContract.pdf_url && !masterContract.contract_url)) {
        throw new Error('No active master contract found');
      }

      const pdfUrl = masterContract.pdf_url || masterContract.contract_url;
      
      // Fetch the actual PDF bytes
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      
      // Load pdf-lib dynamically to avoid breaking SSR if any
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const lastPage = pages[pages.length - 1];
      const { width, height } = firstPage.getSize();

      // Fetch company settings
      let companyPoBox = '';
      let companySigUrl = '';
      try {
        const { data: settings } = await supabase.from('app_settings').select('*').in('key', ['company_po_box', 'company_signature_url']);
        if (settings) {
          settings.forEach((s: any) => {
            if (s.key === 'company_po_box') companyPoBox = s.value;
            if (s.key === 'company_signature_url') companySigUrl = s.value;
          });
        }
      } catch (e) {
        console.error('Failed to load company settings', e);
      }

      // --- PAGE 1 INSCRIPTION ---
      const drawSettings = { font: helveticaBold, size: 11, color: rgb(0, 0, 0) };
      
      // Note: Coordinates (x, y) originate from the bottom-left corner of the page
      // These are estimated coordinates and will need adjustment to align perfectly with the specific PDF template
      
      // Date
      const date = new Date(contractData.pickup_date);
      firstPage.drawText(date.getDate().toString(), { x: 300, y: 565, ...drawSettings });
      firstPage.drawText(date.toLocaleString('default', { month: 'long' }), { x: 380, y: 565, ...drawSettings });
      
      // Company P.O. Box
      if (companyPoBox) {
        firstPage.drawText(companyPoBox, { x: 420, y: 545, ...drawSettings });
      }

      // Client Details
      firstPage.drawText(contractData.client_name, { x: 150, y: 525, ...drawSettings });
      firstPage.drawText(contractData.id_number || 'N/A', { x: 180, y: 505, ...drawSettings });
      firstPage.drawText(contractData.client_phone, { x: 180, y: 485, ...drawSettings });
      if (contractData.po_box) {
        firstPage.drawText(contractData.po_box, { x: 420, y: 485, ...drawSettings });
      }

      // Vehicle Details
      firstPage.drawText(contractData.car_make + ' ' + contractData.car_model, { x: 180, y: 420, ...drawSettings });
      firstPage.drawText(contractData.license_plate, { x: 400, y: 420, ...drawSettings });
      firstPage.drawText(contractData.color || 'N/A', { x: 480, y: 420, ...drawSettings });
      
      // Mileage
      firstPage.drawText('(to be confirmed on pickup day)', { x: 180, y: 400, ...drawSettings, size: 10, font: helveticaFont });

      // --- LAST PAGE SIGNATURES ---
      // Draw Company Signature (Left side)
      if (companySigUrl) {
        try {
          const sigBytes = await fetch(companySigUrl).then(res => res.arrayBuffer());
          const sigImage = await pdfDoc.embedPng(sigBytes).catch(() => pdfDoc.embedJpg(sigBytes));
          const sigDims = sigImage.scale(0.3);
          lastPage.drawImage(sigImage, {
            x: 80,
            y: 100, // Bottom left
            width: sigDims.width,
            height: sigDims.height,
          });
        } catch (e) {
          console.error('Failed to embed company signature', e);
        }
      }

      // Draw Client Signature (Right side)
      if (signatureData) {
        try {
          // Signature data is usually a base64 data URI: data:image/png;base64,...
          const base64Data = signatureData.split(',')[1] || signatureData;
          const sigBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const sigDims = sigImage.scale(0.3);
          lastPage.drawImage(sigImage, {
            x: 400,
            y: 100, // Bottom right
            width: sigDims.width,
            height: sigDims.height,
          });
        } catch (e) {
          console.error('Failed to embed client signature', e);
        }
      }

      const pdfBytes = await pdfDoc.save();
      const fileName = `signed-contract-${contractData.booking_id}-${Date.now()}.pdf`;
      const filePath = `signed_contracts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public_assets')
        .upload(filePath, pdfBytes, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public_assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error generating dynamic contract:', error);
      throw error;
    }
  },

  previewDynamicContract: async (contractData: ContractData): Promise<string> => {
    try {
      const masterContract = await enhancedContractService.getMasterContract();
      if (!masterContract) throw new Error('No active master contract found');

      const { data: masterPdfData, error: downloadError } = await supabase.storage
        .from('public_assets')
        .download(masterContract.template_url.replace(/.*public_assets\//, ''));
        
      if (downloadError) throw downloadError;

      const pdfArrayBuffer = await masterPdfData.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const drawSettings = { size: 12, font: helveticaBold, color: rgb(0, 0, 0.8) };

      const { company_po_box } = await adminService.getAppSettings();

      firstPage.drawText(contractData.pickup_date, { x: 390, y: 550, ...drawSettings });
      firstPage.drawText(company_po_box || '', { x: 390, y: 510, ...drawSettings });
      firstPage.drawText(contractData.client_name, { x: 100, y: 470, ...drawSettings });
      firstPage.drawText(contractData.id_number || '', { x: 390, y: 470, ...drawSettings });
      firstPage.drawText(contractData.client_phone || '', { x: 100, y: 450, ...drawSettings });
      firstPage.drawText(contractData.po_box || '', { x: 390, y: 450, ...drawSettings });

      firstPage.drawText(contractData.car_make + ' ' + contractData.car_model, { x: 180, y: 420, ...drawSettings });
      firstPage.drawText(contractData.license_plate, { x: 400, y: 420, ...drawSettings });
      firstPage.drawText(contractData.color || 'N/A', { x: 480, y: 420, ...drawSettings });
      
      firstPage.drawText('(to be confirmed on pickup day)', { x: 180, y: 400, ...drawSettings, size: 10, font: helveticaFont });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error previewing dynamic contract:', error);
      throw error;
    }
  },

  saveSignedContract: async (
    bookingId: string,
    signatureData: string,
    contractData: ContractData,
    contractPdfBase64?: string | null
  ): Promise<SignedContract> => {
    try {
      let contractUrl = '';

      if (contractPdfBase64) {
        // Upload the generated PDF from html2pdf
        const base64Data = contractPdfBase64.split(',')[1] || contractPdfBase64;
        const pdfBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const fileName = `signed-contract-${bookingId}-${Date.now()}.pdf`;
        const filePath = `signed_contracts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public_assets')
          .upload(filePath, pdfBytes, { contentType: 'application/pdf' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public_assets')
          .getPublicUrl(filePath);

        contractUrl = publicUrl;
      } else {
        // Fallback to old pdf-lib generation for legacy templates
        contractUrl = await enhancedContractService.generateDynamicContract(contractData, signatureData);
      }

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
