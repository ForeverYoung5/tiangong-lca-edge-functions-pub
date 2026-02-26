import '@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';

import { authenticateRequest, AuthMethod } from '../_shared/auth.ts';
import { supabaseClient } from '../_shared/supabase_client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authResult = await authenticateRequest(req, {
    supabase: supabaseClient,
    allowedMethods: [AuthMethod.JWT],
  });

  if (!authResult.isAuthenticated) {
    return authResult.response!;
  }

  const user = authResult.user;

  const { userId, data } = await req.json();
  if (!user || !user.id) {
    return new Response('Unauthorized Request', { status: 401 });
  }

  const updateResult = await supabaseClient.from('users').update(data).eq('id', userId);

  return new Response(JSON.stringify(updateResult), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update_contact' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
