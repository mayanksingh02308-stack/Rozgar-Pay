// api/admin-log.js

export default async function handler(req, res) {
  const BOT_TOKEN = '8656552035:AAGNrF-04-VISuC_-RvCtMH2z9XfICvKV6g';
  const CHANNEL_ID = '-1004439980815';

  // ऑटोमैटिक वेबहुक सेटअप (अगर सेट नहीं है तो खुद कनेक्ट कर लेगा)
  const host = req.headers['host'];
  if (host && !host.includes('localhost')) {
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://${host}/api/admin-log`).catch(() => {});
  }

  // 1. Vercel Cron Job (रात 12:00 बजे IST ऑटोमैटिक रिपोर्ट)
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
      return res.status(200).json({ success: true, message: 'Cron report sent' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const body = req.body;

  // 2. जब आप टेलीग्राम चैनल में APPROVE या REJECT बटन दबाते हैं
  if (body.callback_query) {
    const query = body.callback_query;
    const data = query.data;
    const message = query.message;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    let alertText = "";
    let statusLabel = "";

    if (data.startsWith('approve_ss_')) {
      alertText = "✅ Screenshot Approved! +50 Coins Added.";
      statusLabel = "\n\n🟢 <b>STATUS: APPROVED BY ADMIN (+50 COINS)</b>";
    } else if (data.startsWith('reject_ss_')) {
      alertText = "❌ Screenshot Rejected!";
      statusLabel = "\n\n🔴 <b>STATUS: REJECTED BY ADMIN</b>";
    } else if (data.startsWith('approve_cashout_')) {
      alertText = "✅ Payout Approved & Sent!";
      statusLabel = "\n\n🟢 <b>STATUS: PAYOUT APPROVED & PAID</b>";
    } else if (data.startsWith('reject_cashout_')) {
      alertText = "❌ Payout Rejected!";
      statusLabel = "\n\n🔴 <b>STATUS: PAYOUT REJECTED</b>";
    }

    try {
      // टेलीग्राम स्क्रीन पर पॉपअप अलर्ट दिखाएँ
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: query.id,
          text: alertText,
          show_alert: true
        })
      });

      // मैसेज से बटन हटाकर स्टेटस अपडेट करें
      if (message.caption) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageCaption`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            caption: message.caption + statusLabel,
            parse_mode: 'HTML'
          })
        });
      } else if (message.text) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: message.text + statusLabel,
            parse_mode: 'HTML'
          })
        });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. ऐप से आने वाले नए रिक्वेस्ट्स (CASHOUT और SCREENSHOT_PROOF)
  const { type, payload } = body;

  try {
    // कैशआउट रिक्वेस्ट (यूज़र हिस्ट्री व बटन्स के साथ)
    if (type === 'CASHOUT') {
      const { name, userId, amount, coins, method, details, historySummary, date } = payload;
      const text = `🚨 <b>NEW CASHOUT REQUEST!</b>\n\n` +
                   `👤 <b>User:</b> ${name} (<code>${userId}</code>)\n` +
                   `💰 <b>Amount:</b> ₹${amount} (${coins} Coins)\n` +
                   `💳 <b>Method:</b> ${method}\n` +
                   `📌 <b>Details:</b>\n<code>${details}</code>\n\n` +
                   `📊 <b>User Daily Activity & History:</b>\n` +
                   `• Ads Watched Today: ${historySummary?.ads || 0}\n` +
                   `• Spins Done: ${historySummary?.spins || 0}\n` +
                   `• Quizzes Solved: ${historySummary?.quizzes || 0}\n` +
                   `• Total Lifetime Cashouts: ${historySummary?.totalCashouts || 0}\n\n` +
                   `⏰ <b>Time:</b> ${date}`;

      const reply_markup = {
        inline_keyboard: [
          [
            { text: '✅ APPROVE PAYOUT', callback_data: `approve_cashout_${userId}_${amount}` },
            { text: '❌ REJECT', callback_data: `reject_cashout_${userId}_${amount}` }
          ]
        ]
      };

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHANNEL_ID, text, parse_mode: 'HTML', reply_markup })
      });
      return res.status(200).json({ success: true, message: 'Cashout logged' });
    }

    // स्क्रीनशॉट टास्क (Approve/Reject बटन्स के साथ)
    if (type === 'SCREENSHOT_PROOF') {
      const { name, userId, taskName, photoBase64, date } = payload;
      const caption = `📸 <b>NEW SCREENSHOT SUBMISSION!</b>\n\n` +
                      `👤 <b>User:</b> ${name} (<code>${userId}</code>)\n` +
                      `🎯 <b>Task:</b> ${taskName}\n` +
                      `⏰ <b>Time:</b> ${date}\n\n` +
                      `👉 <i>Verify and click below to reward 50 Coins:</i>`;

      const reply_markup = JSON.stringify({
        inline_keyboard: [
          [
            { text: '✅ APPROVE (+50 Coins)', callback_data: `approve_ss_${userId}` },
            { text: '❌ REJECT', callback_data: `reject_ss_${userId}` }
          ]
        ]
      });

      if (photoBase64) {
        const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('chat_id', CHANNEL_ID);
        formData.append('photo', blob, 'screenshot.jpg');
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');
        formData.append('reply_markup', reply_markup);

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
      } else {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHANNEL_ID,
            text: caption,
            parse_mode: 'HTML',
            reply_markup: JSON.parse(reply_markup)
          })
        });
      }
      return res.status(200).json({ success: true, message: 'Screenshot logged' });
    }

    return res.status(400).json({ success: false, message: 'Invalid payload' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
