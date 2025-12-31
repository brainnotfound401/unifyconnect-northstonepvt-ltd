import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OtpEmailRequest {
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: OtpEmailRequest = await req.json();

    console.log(`Sending OTP email to: ${email}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Unify <onboarding@resend.dev>",
        to: [email],
        subject: "Your Verification Code",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 40px 20px;">
            <div style="max-width: 400px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #333333; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                Your Verification Code
              </h1>
              <p style="color: #666666; font-size: 16px; margin: 0 0 32px 0; text-align: center;">
                Enter this code to verify your email address:
              </p>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
                <span style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">
                  ${otp}
                </span>
              </div>
              <p style="color: #999999; font-size: 14px; margin: 0; text-align: center;">
                This code will expire in 10 minutes.
              </p>
              <p style="color: #999999; font-size: 14px; margin: 16px 0 0 0; text-align: center;">
                If you didn't request this code, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 32px 0;">
              <p style="color: #cccccc; font-size: 12px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} Unify. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${errorData}`);
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
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
