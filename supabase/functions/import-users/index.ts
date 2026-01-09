import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportUserData {
  email: string;
  name: string;
  phone?: string;
  external_id: string;
  agency_id: string;
  team_id?: string;
  role: string;
  is_active: boolean;
}

interface ImportUserRequest {
  users: ImportUserData[];
  agency_id: string;
}

interface ImportUserResult {
  email: string;
  external_id: string;
  user_id?: string;
  action: 'created' | 'updated' | 'error';
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is authorized (has valid JWT)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT and get the user
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    console.log('Verifying user authorization...');
    const { data: { user: callingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !callingUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`Authenticated user: ${callingUser.email} (${callingUser.id})`);

    // Check if calling user is a global admin (diretor_geral)
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin.rpc('is_global_admin', { _user_id: callingUser.id });
    console.log(`Admin check for ${callingUser.email}: isAdmin=${isAdmin}, error=${adminCheckError?.message || 'none'}`);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only global admins can import users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { users, agency_id }: ImportUserRequest = await req.json();
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No users provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!agency_id) {
      return new Response(
        JSON.stringify({ error: 'Agency ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${users.length} users for agency ${agency_id}`);
    
    const results: ImportUserResult[] = [];
    
    for (const userData of users) {
      try {
        // Check if user already exists by email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(
          u => u.email?.toLowerCase() === userData.email.toLowerCase()
        );
        
        let userId: string;
        
        if (existingUser) {
          // User exists in Auth, use their ID
          userId = existingUser.id;
          console.log(`User ${userData.email} already exists with ID ${userId}`);
          
          // Update profile data
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              name: userData.name,
              phone: userData.phone,
              is_active: userData.is_active,
            })
            .eq('id', userId);
          
          if (profileError) {
            console.error(`Error updating profile for ${userData.email}:`, profileError);
          }
          
          results.push({
            email: userData.email,
            external_id: userData.external_id,
            user_id: userId,
            action: 'updated',
          });
        } else {
          // Create new user in Auth (inactive - no email confirmation sent)
          const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: userData.email.toLowerCase(),
            email_confirm: false, // User needs to confirm email to activate
            user_metadata: {
              name: userData.name,
              phone: userData.phone,
            },
          });
          
          if (createError) {
            console.error(`Error creating user ${userData.email}:`, createError);
            results.push({
              email: userData.email,
              external_id: userData.external_id,
              action: 'error',
              error: createError.message,
            });
            continue;
          }
          
          userId = newAuthUser.user.id;
          console.log(`Created user ${userData.email} with ID ${userId}`);
          
          // The handle_new_user trigger should create the profile automatically
          // But we need to wait a moment and ensure it has the correct data
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Update the profile with additional data (phone might not be in trigger)
          const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update({
              phone: userData.phone,
              is_active: userData.is_active,
            })
            .eq('id', userId);
          
          if (updateProfileError) {
            console.log(`Profile update warning for ${userData.email}:`, updateProfileError.message);
          }
          
          results.push({
            email: userData.email,
            external_id: userData.external_id,
            user_id: userId,
            action: 'created',
          });
        }
        
        // Create or update user_agencies record
        const { data: existingAgency } = await supabaseAdmin
          .from('user_agencies')
          .select('id')
          .eq('user_id', userId)
          .eq('agency_id', agency_id)
          .maybeSingle();
        
        if (existingAgency) {
          // Update existing association
          await supabaseAdmin
            .from('user_agencies')
            .update({
              external_id: userData.external_id,
              team_id: userData.team_id || null,
              is_active: userData.is_active,
              is_synced: true,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', existingAgency.id);
        } else {
          // Create new association
          await supabaseAdmin
            .from('user_agencies')
            .insert({
              user_id: userId,
              agency_id: agency_id,
              external_id: userData.external_id,
              team_id: userData.team_id || null,
              is_active: userData.is_active,
              is_synced: true,
              last_synced_at: new Date().toISOString(),
            });
        }
        
        // Create or update user_roles record
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id, role')
          .eq('user_id', userId)
          .eq('agency_id', agency_id)
          .maybeSingle();
        
        if (existingRole) {
          // Update if role changed
          if (existingRole.role !== userData.role) {
            await supabaseAdmin
              .from('user_roles')
              .update({ role: userData.role })
              .eq('id', existingRole.id);
          }
        } else {
          // Create new role
          await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId,
              agency_id: agency_id,
              role: userData.role,
            });
        }
        
      } catch (error: any) {
        console.error(`Error processing user ${userData.email}:`, error);
        results.push({
          email: userData.email,
          external_id: userData.external_id,
          action: 'error',
          error: error.message || 'Unknown error',
        });
      }
    }
    
    const created = results.filter(r => r.action === 'created').length;
    const updated = results.filter(r => r.action === 'updated').length;
    const errors = results.filter(r => r.action === 'error').length;
    
    console.log(`Import complete: ${created} created, ${updated} updated, ${errors} errors`);
    
    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: { created, updated, errors },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error in import-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
