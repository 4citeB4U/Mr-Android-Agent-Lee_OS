// LEEWAY HYBRID CLOUD — REMOTE GATEWAY v2.0
// Central hub for remote MCP agents: insforge, docs-rag, planner

import { createClient } from 'npm:@insforge/sdk';

export default async function(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-neural-handshake'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
    anonKey: Deno.env.get('ANON_KEY')
  });

  // 1. Handshake Validation (Sovereign DB fallback)
  const { data: configData } = await client.database
    .from('system_config')
    .select('value')
    .eq('key', 'NEURAL_HANDSHAKE')
    .single();

  const expectedHandshake = configData?.value;
  const handshake = req.headers.get('x-neural-handshake');

  if (!handshake || handshake !== expectedHandshake) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Neural Handshake Invalid',
      summary: 'Cloud node authentication failed. Gateway access denied.'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { agent, intent, prompt } = await req.json();
    console.log(`[GATEWAY] Agent: ${agent} | Intent: ${intent}`);

    let agentResponse: any = {
      status: 'success',
      detail: `Processed by Gateway v2.0`
    };

    // 2. Multi-Agent Routing Logic
    switch (agent) {
      case 'insforge-agent-mcp':
        agentResponse.detail = `InsForge operation "${intent}" executed on cloud edge.`;
        break;
      case 'docs-rag-agent-mcp':
        agentResponse.detail = `Documentation RAG search for "${prompt}" initiated on cloud node.`;
        // In a real scenario, we'd trigger Vectorize or semantic search here.
        break;
      case 'planner-agent-mcp':
        agentResponse.detail = `Planning workflow "${intent}" started in distributed mode.`;
        break;
      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Agent ${agent} not supported by this gateway.`,
          summary: 'The gateway does not recognize this agent signature.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 3. Normalized Response Contract
    return new Response(JSON.stringify({
      success: true,
      agent: agent,
      intent: intent,
      data: agentResponse,
      summary: `I've successfully routed your ${agent} request through my remote gateway. ${agentResponse.detail}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message,
      summary: 'Remote Gateway internal error.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
