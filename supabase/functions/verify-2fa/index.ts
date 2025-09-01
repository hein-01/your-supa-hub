import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Verify2FARequest {
  secret: string;
  token: string;
}

// Simple TOTP verification function
function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  const time = Math.floor(Date.now() / 1000);
  const timeStep = 30; // TOTP uses 30-second time steps
  
  // Check current time slot and adjacent slots within window
  for (let i = -window; i <= window; i++) {
    const timeSlot = Math.floor((time + i * timeStep) / timeStep);
    const expectedToken = generateTOTP(secret, timeSlot);
    
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
}

// Simple TOTP generation (basic implementation)
function generateTOTP(secret: string, timeSlot: number): string {
  // This is a simplified implementation
  // In production, use a proper HMAC-SHA1 implementation
  const hash = simple_hmac_sha1(secret, timeSlot.toString());
  const offset = parseInt(hash.slice(-1), 16);
  const truncated = hash.slice(offset * 2, (offset + 4) * 2);
  const code = (parseInt(truncated, 16) & 0x7FFFFFFF) % 1000000;
  return code.toString().padStart(6, '0');
}

// Simplified HMAC-SHA1 (for demo purposes only)
function simple_hmac_sha1(key: string, message: string): string {
  // This is a very basic implementation - use proper crypto library in production
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const messageBytes = encoder.encode(message);
  
  // Simple hash combination (not real HMAC-SHA1)
  let hash = 0;
  for (let i = 0; i < keyBytes.length + messageBytes.length; i++) {
    const byte = i < keyBytes.length ? keyBytes[i] : messageBytes[i - keyBytes.length];
    hash = ((hash << 5) - hash + byte) & 0xffffffff;
  }
  
  return Math.abs(hash).toString(16).padStart(8, '0');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secret, token }: Verify2FARequest = await req.json();

    if (!secret || !token) {
      return new Response(
        JSON.stringify({ error: "Missing secret or token" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify the TOTP token
    const isValid = verifyTOTP(secret, token);

    return new Response(
      JSON.stringify({ valid: isValid }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-2fa function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);