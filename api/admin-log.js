// api/admin-log.js

export default async function handler(req, res) {
  const BOT_TOKEN = '8656552035:AAGNrF-04-VISuC_-RvCtMH2z9XfICvKV6g';
  const CHANNEL_ID = '-1004439980815';

  const host = req.headers['host'];
  if (host && !host.includes('localhost')) {
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://${host}/api/admin-log`).catch(() => {});
  }

  // 1. Vercel Cron Job (12:00 AM IST Midnight Summary)
  if (req.method === 'GET') {
    const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' });
    const text = `📊 <b>SYSTEM AUDIT REPORT | DAILY SUMMARY</b>\n\n` +
                 `📅 <b>Date:</b> <code>${today}</code>\n` +
                 `⏰ <b>Execution Cycle:</b> 12:00 AM Midnight Trigger\n` +
                 `🔄 <b>Quota Refresh:</b> Daily engagement limits, ads, and streaks refreshed.\n\n` +
                 `✅ <i>System operational. Integrity checks normal.</i>`;

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHANNEL_ID, text, parse_mode: 'HTML' })
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const body = req.body;

  // 2. Telegram Inline Callback Actions (Approve / Reject)
  if (body.callback_query) {
    const query = body.callback_query;
    const data = query.data;
    const message = query.message;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    let alertText = "";
    let statusLabel = "";

    // Screenshot Proof Verification
    if (data.startsWith('approve_ss_')) {
      const targetUserId = data.replace('approve_ss_', '');
      alertText = "Verification successful. Reward notification dispatched.";
      statusLabel = "\n\n🟢 <b>STATUS: VERIFIED & REWARD ISSUED (+50 COINS)</b>";

      // Professional User Notification (English)
      const claimUrl = `https://t.me/QuickToolBoxBot/RozgarPay?startapp=bonus_50`;
      const userMsg = `🎖️ <b>Task Verification Successful</b>\n\n` +
                      `Dear Member,\n` +
                      `Your submitted social task proof has been authenticated by our administration team.\n\n` +
                      `💰 <b>Credited Reward:</b> <code>+50 Coins</code>\n` +
                      `📌 <b>Status:</b> Approved\n\n` +
                      `Tap the secure link below to synchronize and deposit your reward balance:`;

      const userKeyboard = {
        inline_keyboard: [
          [{ text: '🎁 Claim +50 Coins to Balance', url: claimUrl }]
        ]
      };

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetUserId,
          text: userMsg,
          parse_mode: 'HTML',
          reply_markup: userKeyboard
        })
      }).catch(() => {});

    } else if (data.startsWith('reject_ss_')) {
      const targetUserId = data.replace('reject_ss_', '');
      alertText = "Proof rejected. User informed.";
      statusLabel = "\n\n🔴 <b>STATUS: REJECTED | NON-COMPLIANT SUBMISSION</b>";

      const rejectMsg = `⚠️ <b>Verification Notification | Submission Rejected</b>\n\n` +
                        `Dear Member,\n` +
                        `Your recent task submission did not satisfy the validation criteria.\n\n` +
                        `ℹ️ <i>Reason: Incomplete engagement or unverified proof of subscription. Please re-execute the task following the official requirements.</i>`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: targetUserId, text: rejectMsg, parse_mode: 'HTML' })
      }).catch(() => {});

    } else if (data.startsWith('approve_cashout_')) {
      alertText = "Payout marked as dispatched.";
      statusLabel = "\n\n🟢 <b>PAYOUT DISPATCHED | SETTLEMENT COMPLETE</b>";
    } else if (data.startsWith('reject_cashout_')) {
      alertText = "Cashout request rejected.";
      statusLabel = "\n\n🔴 <b>PAYOUT DECLINED | IRREGULAR ACTIVITY</b>";
    }

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: query.id, text: alertText, show_alert: true })
      });

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

  // 3. Incoming Requests (Cashouts & Screenshot Submissions)
  const { type, payload } = body;
  try {
    if (type === 'CASHOUT') {
      const { name, userId, amount, coins, method, details, historySummary, date } = payload;
      const text = `🏦 <b>SETTLEMENT AUDIT: CASHOUT REQUEST</b>\n\n` +
                   `👤 <b>Beneficiary:</b> ${name}\n` +
                   `🆔 <b>User ID:</b> <code>${userId}</code>\n` +
                   `💵 <b>Redemption Value:</b> ₹${amount} (<code>${coins} Coins</code>)\n` +
                   `💳 <b>Transfer Route:</b> ${method}\n` +
                   `📌 <b>Account Coordinates:</b>\n<code>${details}</code>\n\n` +
                   `📋 <b>Engagement Audit (Fraud Check):</b>\n` +
                   `• Ads Logged: ${historySummary?.ads || 0}\n` +
                   `• Spins Executed: ${historySummary?.spins || 0}\n` +
                   `• Quizzes Completed: ${historySummary?.quizzes || 0}\n` +
                   `• Historical Cashouts: ${historySummary?.totalCashouts || 0}\n\n` +
                   `⏰ <b>Timestamp:</b> ${date}`;

      const reply_markup = {
        inline_keyboard: [
          [
            { text: '✅ APPROVE & DISPATCH', callback_data: `approve_cashout_${userId}_${amount}` },
            { text: '❌ DECLINE PAYOUT', callback_data: `reject_cashout_${userId}_${amount}` }
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

    if (type === 'SCREENSHOT_PROOF') {
      const { name, userId, taskName, photoBase64, date } = payload;
      const caption = `📋 <b>COMPLIANCE REVIEW: SOCIAL TASK PROOF</b>\n\n` +
                      `👤 <b>Member:</b> ${name} (<code>${userId}</code>)\n` +
                      `🎯 <b>Target Task:</b> ${taskName}\n` +
                      `⏰ <b>Timestamp:</b> ${date}\n\n` +
                      `<i>Verify alignment with channel subscription policies:</i>`;

      const reply_markup = JSON.stringify({
        inline_keyboard: [
          [
            { text: '✅ APPROVE (+50 Coins)', callback_data: `approve_ss_${userId}` },
            { text: '❌ DECLINE SUBMISSION', callback_data: `reject_ss_${userId}` }
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

