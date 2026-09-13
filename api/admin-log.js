// api/admin-log.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const BOT_TOKEN = '8656552035:AAGNrF-04-VISuC_-RvCtMH2z9XfICvKV6g';
  const CHANNEL_ID = '-1004439980815';

  const { type, payload } = req.body;

  try {
    // 1. विथड्रॉल (कैशआउट) अलर्ट
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

    // 2. स्क्रीनशॉट टास्क वेरिफिकेशन (YouTube / Telegram)
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

    // 3. रात 12:00 बजे की डेली समरी रिपोर्ट
    if (type === 'MIDNIGHT_REPORT') {
      const { totalActiveUsers, totalAdsWatched, totalQuizzesCompleted, totalPayoutsRequested, date } = payload;
      const text = `📊 <b>MIDNIGHT DAILY SUMMARY REPORT</b>\n\n` +
                   `📅 <b>Date:</b> ${date}\n` +
                   `👥 <b>Active Users:</b> ${totalActiveUsers || 0}\n` +
                   `📺 <b>Total Ads Watched:</b> ${totalAdsWatched || 0}\n` +
                   `🧠 <b>Quizzes Solved:</b> ${totalQuizzesCompleted || 0}\n` +
                   `💸 <b>Payout Requests:</b> ₹${totalPayoutsRequested || 0}\n\n` +
                   `✅ <i>Daily system counters reset completed.</i>`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHANNEL_ID, text, parse_mode: 'HTML' })
      });
      return res.status(200).json({ success: true, message: 'Midnight report sent' });
    }

    return res.status(400).json({ success: false, message: 'Invalid log type' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
