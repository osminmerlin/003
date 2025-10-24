const fs = require('fs');
const path = require('path');
const SUBS_FILE = path.resolve(__dirname, 'subscriptions.json');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let subscriptions = [];
  if (fs.existsSync(SUBS_FILE)) {
    subscriptions = JSON.parse(fs.readFileSync(SUBS_FILE));
  }
  const endpoint = req.body.endpoint;
  subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subscriptions));
  res.status(201).end();
};