import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userEmail, tripData, tripItems } = req.body;

    if (!userEmail || !tripData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format trip details for email
    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };

    // Parse trip data
    const details = JSON.parse(tripData.details || '{}');
    const plan = JSON.parse(tripData.plan || '{}');

    // Build HTML email content
    let emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Trip Itinerary</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
      border-left: 4px solid #2563eb;
      padding-left: 15px;
    }
    h3 {
      color: #1e3a8a;
      margin-top: 20px;
    }
    .section {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8fafc;
      border-radius: 6px;
    }
    .item {
      margin: 15px 0;
      padding: 12px;
      background-color: white;
      border-left: 3px solid #60a5fa;
      border-radius: 4px;
    }
    .cost {
      font-weight: bold;
      color: #059669;
    }
    .total {
      font-size: 1.3em;
      font-weight: bold;
      color: #2563eb;
      margin-top: 20px;
      padding: 15px;
      background-color: #eff6ff;
      border-radius: 6px;
      text-align: right;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 0.9em;
    }
    .highlight {
      background-color: #fef3c7;
      padding: 2px 6px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌍 Your Trip Itinerary</h1>
    
    <div class="section">
      <h2>📍 Trip Overview</h2>
      <p><strong>Destination:</strong> ${details.destination || 'N/A'}</p>
      <p><strong>Dates:</strong> ${formatDate(details.startDate)} - ${formatDate(details.endDate)}</p>
      <p><strong>Passengers:</strong> 
        ${details.passengers?.adults || 0} Adult(s), 
        ${details.passengers?.children || 0} Child(ren), 
        ${details.passengers?.infants || 0} Infant(s)
      </p>
    </div>
`;

    // Add Flights
    if (plan.outboundFlight?.included) {
      emailHTML += `
    <div class="section">
      <h2>✈️ Outbound Flight</h2>
      <div class="item">
        <p><strong>${plan.outboundFlight.from} → ${plan.outboundFlight.to}</strong></p>
        <p>🛫 Departure: ${plan.outboundFlight.departureTime || 'N/A'}</p>
        <p>🛬 Arrival: ${plan.outboundFlight.arrivalTime || 'N/A'}</p>
        <p>Duration: ${plan.outboundFlight.duration || 'N/A'}</p>
        <p>Airline: ${plan.outboundFlight.airline || 'N/A'} - Flight ${plan.outboundFlight.flightNumber || 'N/A'}</p>
        <p class="cost">Cost: ${formatCurrency(plan.outboundFlight.pricePerPerson * ((details.passengers?.adults || 0) + (details.passengers?.children || 0) + (details.passengers?.infants || 0)))}</p>
      </div>
    </div>
`;
    }

    if (plan.returnFlight?.included) {
      emailHTML += `
    <div class="section">
      <h2>✈️ Return Flight</h2>
      <div class="item">
        <p><strong>${plan.returnFlight.from} → ${plan.returnFlight.to}</strong></p>
        <p>🛫 Departure: ${plan.returnFlight.departureTime || 'N/A'}</p>
        <p>🛬 Arrival: ${plan.returnFlight.arrivalTime || 'N/A'}</p>
        <p>Duration: ${plan.returnFlight.duration || 'N/A'}</p>
        <p>Airline: ${plan.returnFlight.airline || 'N/A'} - Flight ${plan.returnFlight.flightNumber || 'N/A'}</p>
        <p class="cost">Cost: ${formatCurrency(plan.returnFlight.pricePerPerson * ((details.passengers?.adults || 0) + (details.passengers?.children || 0) + (details.passengers?.infants || 0)))}</p>
      </div>
    </div>
`;
    }

    // Add Accommodation
    if (plan.hotel?.included) {
      emailHTML += `
    <div class="section">
      <h2>🏨 Accommodation</h2>
      <div class="item">
        <p><strong>${plan.hotel.name || 'Hotel'}</strong></p>
        <p>📍 ${plan.hotel.address || 'N/A'}</p>
        <p>⭐ Rating: ${plan.hotel.rating || 'N/A'}/5</p>
        <p>Check-in: ${formatDate(plan.hotel.checkIn)}</p>
        <p>Check-out: ${formatDate(plan.hotel.checkOut)}</p>
        <p class="cost">Cost: ${formatCurrency(plan.hotel.totalPrice || 0)}</p>
      </div>
    </div>
`;
    }

    // Add Car Rental
    if (plan.carRental?.included) {
      emailHTML += `
    <div class="section">
      <h2>🚗 Car Rental</h2>
      <div class="item">
        <p><strong>${plan.carRental.type || 'Car'}</strong></p>
        <p>Company: ${plan.carRental.company || 'N/A'}</p>
        <p>Pickup: ${plan.carRental.pickupLocation || 'N/A'} - ${plan.carRental.pickupTime || 'N/A'}</p>
        <p>Dropoff: ${plan.carRental.dropoffLocation || 'N/A'} - ${plan.carRental.dropoffTime || 'N/A'}</p>
        <p class="cost">Cost: ${formatCurrency(plan.carRental.totalPrice || 0)}</p>
      </div>
    </div>
`;
    }

    // Add Daily Itinerary
    if (plan.itinerary && Array.isArray(plan.itinerary)) {
      emailHTML += `
    <div class="section">
      <h2>📅 Daily Itinerary</h2>
`;
      
      plan.itinerary.forEach((day: any) => {
        emailHTML += `
      <h3>Day ${day.day}${day.date ? ` - ${formatDate(day.date)}` : ''}</h3>
`;
        
        if (day.items && Array.isArray(day.items)) {
          day.items.forEach((item: any) => {
            if (item.included) {
              const icon = item.type === 'meal' ? '🍽️' : 
                          item.type === 'attraction' ? '🎯' : 
                          item.type === 'activity' ? '🎨' : '📍';
              
              emailHTML += `
      <div class="item">
        <p><strong>${icon} ${item.time || ''} - ${item.name || 'Activity'}</strong></p>
        ${item.description ? `<p>${item.description}</p>` : ''}
        ${item.address ? `<p>📍 ${item.address}</p>` : ''}
        ${item.duration ? `<p>⏱️ Duration: ${item.duration}</p>` : ''}
        ${item.cost ? `<p class="cost">Cost: ${formatCurrency(item.cost)}</p>` : ''}
      </div>
`;
            }
          });
        }
      });
      
      emailHTML += `
    </div>
`;
    }

    // Add Total Cost
    emailHTML += `
    <div class="total">
      Total Estimated Cost: ${formatCurrency(tripData.total_cost || 0)}
    </div>
    
    <div class="footer">
      <p>🌟 Have a wonderful trip! 🌟</p>
      <p>This itinerary was generated by <strong>Trip Weaver</strong></p>
      <p><a href="https://best-travel-plan.cloud">best-travel-plan.cloud</a></p>
    </div>
  </div>
</body>
</html>
`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Trip Weaver <noreply@best-travel-plan.cloud>',
      to: [userEmail],
      subject: `Your Trip Itinerary: ${details.destination || 'Your Destination'}`,
      html: emailHTML,
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      emailId: data?.id 
    });

  } catch (error: any) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
