// api/send-email.ts
// Vercel Serverless Function to send emails via Resend API
// This runs on the server, not in the browser, so it avoids CORS issues

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get Resend API key from environment variable (server-side, no VITE_ prefix)
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not found in environment variables');
    return res.status(500).json({ error: 'Resend API key not configured' });
  }

  try {
    // Get email data from request body
    const { to, subject, html } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    console.log('Sending email to:', to);

    // Call Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Best Holiday Plan <noreply@best-travel-plan.cloud>',
        to: [to],
        subject,
        html,
      }),
    });

    // Check if Resend API call was successful
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
