// api/admin-log.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { title, userId, amount, coins, method, upiId, date } = req.body;

  // आपका नया Bot Token और Channel ID
  const BOT_TOKEN = '8656552035:AAGNrF-04-VISuC_-RvCtMH2z9XfICvKV6g';
  const CHANNEL_ID = '-1004439980815';

  const messageText = `
🚨 <b>${title || 'NEW CASHOUT REQUEST!'}</b>

👤 <b>User:</b> ${userId || 'N/A'}
🆔 <b>User ID:</b> <code>${userId || 'N/A'}</code>
💰 <b>Amount:</b> ₹${amount || '0'} (${coins || '0'} Coins)
💳 <b>Method:</b> ${method || 'UPI'}
📱 <b>UPI / Account:</b> <code>${upiId || 'N/A'}</code>
⏰ <b>Time:</b> ${date || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
  `.trim();

  try {
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text: messageText,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return res.status(500).json({ success: false, error: data.description });
    }

    return res.status(200).json({ success: true, message: 'Log sent successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
