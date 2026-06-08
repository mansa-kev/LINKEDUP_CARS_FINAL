import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Check if the user making the request is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized request')
    }

    // Verify the requesting user is actually an admin
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminError || adminCheck.role !== 'admin') {
      throw new Error('Forbidden: Only admins can create users')
    }

    // Parse request body
    const { email, password, role, fullName, phoneNumber, companyName, commissionRate, licenseNumber } = await req.json()
    if (!email || !role || !fullName || !phoneNumber) {
      throw new Error('Missing required fields: email, role, fullName, or phoneNumber')
    }

    // Initialize an admin client with service_role key to bypass RLS and create users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create the user in Auth
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || Math.random().toString(36).substring(2, 10) + 'A1!',
      email_confirm: true,
      user_metadata: {
        role,
        full_name: fullName
      }
    })

    if (createError) {
      throw createError
    }

    const userId = userData.user.id

    try {
      // Upsert the profile into user_profiles
      const profileData: any = {
        id: userId,
        email,
        full_name: fullName,
        phone_number: phoneNumber,
        role,
        status: 'active',
        updated_at: new Date().toISOString()
      }

      if (licenseNumber) {
        profileData.license_number = licenseNumber
      }

      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert(profileData)

      if (profileError) {
        throw profileError
      }

      // Role-specific settings
      if (role === 'fleet_owner') {
        const { error: settingsError } = await supabaseAdmin
          .from('fleet_owner_settings')
          .upsert({
            id: userId,
            company_name: companyName || null,
            commission_rate: commissionRate !== undefined && commissionRate !== null ? Number(commissionRate) : 0.15,
            status: 'active',
            updated_at: new Date().toISOString()
          })

        if (settingsError) {
          throw settingsError
        }
      } else if (role === 'driver') {
        const { error: driverError } = await supabaseAdmin
          .from('driver_profiles')
          .upsert({
            id: userId,
            license_number: licenseNumber || null,
            license_status: 'verified',
            id_status: 'verified',
            status: 'active',
            updated_at: new Date().toISOString()
          })

        if (driverError) {
          throw driverError
        }
      }

      return new Response(
        JSON.stringify({ success: true, userId, message: 'User created successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (upsertError) {
      // Rollback auth user creation if profile / settings upsert fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw upsertError
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
