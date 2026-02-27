import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const ALLOWED_ORIGINS = [
  'https://libertycrm.lovable.app',
  'https://id-preview--9161e7b6-71c1-4c1f-9df7-8a68f44ce40f.lovable.app',
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace(/\/$/, '')))
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

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
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

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

    const { data: { user: callingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !callingUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if calling user is a global admin (diretor_geral)
    const { data: isAdmin } = await supabaseAdmin.rpc('is_global_admin', { _user_id: callingUser.id });
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
          userId = existingUser.id;
          
          // Update profile data
          await supabaseAdmin
            .from('profiles')
            .update({
              name: userData.name,
              phone: userData.phone,
              is_active: userData.is_active,
            })
            .eq('id', userId);
          
          results.push({
            email: userData.email,
            external_id: userData.external_id,
            user_id: userId,
            action: 'updated',
          });
        } else {
          // Create new user in Auth
          const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: userData.email.toLowerCase(),
            email_confirm: false,
            user_metadata: {
              name: userData.name,
              phone: userData.phone,
            },
          });
          
          if (createError) {
            results.push({
              email: userData.email,
              external_id: userData.external_id,
              action: 'error',
              error: createError.message,
            });
            continue;
          }
          
          userId = newAuthUser.user.id;
          
          // Wait for trigger to create profile
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Update the profile with additional data
          await supabaseAdmin
            .from('profiles')
            .update({
              phone: userData.phone,
              is_active: userData.is_active,
            })
            .eq('id', userId);
          
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
          if (existingRole.role !== userData.role) {
            await supabaseAdmin
              .from('user_roles')
              .update({ role: userData.role })
              .eq('id', existingRole.id);
          }
        } else {
          await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId,
              agency_id: agency_id,
              role: userData.role,
            });
        }
        
      } catch (error: any) {
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
    
    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: { created, updated, errors },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    );
  }
});
