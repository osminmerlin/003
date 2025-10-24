const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const fs = require('fs');
const cors = require('cors');

const VAPID_PUBLIC_KEY = '你的公钥';
const VAPID_PRIVATE_KEY = '你的私钥';

webpush.setVapidDetails(
  'mailto:your@email.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

let subscriptions = [];
const SUBS_FILE = 'subscriptions.json';

// 加载订阅
if (fs.existsSync(SUBS_FILE)) {
  subscriptions = JSON.parse(fs.readFileSync(SUBS_FILE));
}

// 保存订阅
app.post('/api/save-subscription', (req, res) => {
  const sub = req.body;
  if (!subscriptions.find(s => s.endpoint === sub.endpoint)) {
    subscriptions.push(sub);
    fs.writeFileSync(SUBS_FILE, JSON.stringify(subscriptions));
  }
  res.sendStatus(201);
});

// 取消订阅
app.post('/api/remove-subscription', (req, res) => {
  const endpoint = req.body.endpoint;
  subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subscriptions));
  res.sendStatus(201);
});

// 手动推送接口（你可以用定时任务代替）
app.post('/api/send-push', async (req, res) => {
  const message = req.body.message || '吸烟时间到了，快去吸烟。';
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
  res.sendStatus(200);
});

app.listen(3000, () => console.log('Server running on port 3000'));