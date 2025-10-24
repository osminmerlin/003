const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const SUBS_FILE = path.resolve(__dirname, 'subscriptions.json');

// VAPID密钥（首次部署会在日志里输出，请保存后填入这里！）
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

webpush.setVapidDetails(
  'mailto:your@email.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let subscriptions = [];
  if (fs.existsSync(SUBS_FILE)) {
    subscriptions = JSON.parse(fs.readFileSync(SUBS_FILE));
  }
  const message = (req.body && req.body.message) || '吸烟时间到了，快去吸烟。';
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify({
        title: '吸烟提醒',
        body: message
      }));
    } catch (err) {
      // 删除失效订阅
      if (err.statusCode === 410) {
        subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
        fs.writeFileSync(SUBS_FILE, JSON.stringify(subscriptions));
      }
    }
  }
  res.status(200).end();
};