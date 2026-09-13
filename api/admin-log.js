// api/admin-log.js

export default async function handler(req, res) {
  const BOT_TOKEN = '8656552035:AAGNrF-04-VISuC_-RvCtMH2z9XfICvKV6g';
  const CHANNEL_ID = '-1004439980815';

  // 1. Vercel Cron Job (रात 12:00 बजे IST ऑटोमैटिक ट्रिगर)
  if (req.method === 'GET') {
    const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const text = `📊 <b>MIDNIGHT DAILY SUMMARY REPORT</b>\n\n` +
                 `📅 <b>Date:</b> ${today}\n` +
                 `⏰ <b>Trigger:</b> Scheduled 12:00 AM Auto-Report\n` +
                 `👥 <b>Status:</b> All daily limits (Ads, Spins, Streak) reset for users.\n\n` +
                 `✅ <i>System running successfully.</i>`;

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHANNEL_ID, text, parse_mode: 'HTML' })
      });
      return res.status(200).json({ success: true, message: 'Cron report sent successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. सिर्फ POST रिक्वेस्ट बाकी टास्क्स के लिए
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { type, payload } = req.body;

  try {
    // विथड्रॉल (कैशआउट) अलर्ट
    if (type === 'CASHOUT') {
      const { name, userId, amount, coins, method, account, date } = payload;
      const text = `🚨 <b>NEW CASHOUT REQUEST!</b>\n\n` +
                   `👤 <b>User:</b> ${name}\n` +
                   `🆔 <b>User ID:</b> <code>${userId}</code>\n` +
                   `💰 <b>Amount:</b> ₹${amount} (${coins} Coins)\n` +
                   `💳 <b>Method:</b> ${method}\n` +
                   `📱 <b>Account/UPI:</b> <code>${account}</code>\n` +
                   `⏰ <b>Time:</b> ${date}`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHANNEL_ID, text, parse_mode: 'HTML' })
      });
      return res.status(200).json({ success: true, message: 'Cashout logged' });
    }

    // स्क्रीनशॉट टास्क वेरिफिकेशन
    if (type === 'SCREENSHOT_PROOF') {
      const { name, userId, taskName, photoBase64, date } = payload;
      const caption = `📸 <b>NEW SCREENSHOT SUBMISSION!</b>\n\n` +
                      `👤 <b>User:</b> ${name} (<code>${userId}</code>)\n` +
                      `🎯 <b>Task:</b> ${taskName}\n` +
                      `⏰ <b>Time:</b> ${date}\n\n` +
                      `⚠️ <i>Verify manually and reward 50 Coins.</i>`;

      if (photoBase64) {
        const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('chat_id', CHANNEL_ID);
        formData.append('photo', blob, 'screenshot.jpg');
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
      } else {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHANNEL_ID, text: caption, parse_mode: 'HTML' })
        });
      }
      return res.status(200).json({ success: true, message: 'Screenshot logged' });
    }

    return res.status(400).json({ success: false, message: 'Invalid log type' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
