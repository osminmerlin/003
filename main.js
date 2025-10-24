const VAPID_PUBLIC_KEY = '你的VAPID公钥'; // 部署后会在Vercel日志输出

// ...原有打卡代码不变...

// 推送订阅
async function subscribePush() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  // 发送到后端保存
  await fetch('/api/save-subscription', {
    method: 'POST',
    body: JSON.stringify(sub),
    headers: {'Content-Type': 'application/json'}
  });
  document.getElementById('subscribe-push').style.display = 'none';
  document.getElementById('unsubscribe-push').style.display = '';
}

async function unsubscribePush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await fetch('/api/remove-subscription', {
      method: 'POST',
      body: JSON.stringify(sub),
      headers: {'Content-Type': 'application/json'}
    });
    await sub.unsubscribe();
  }
  document.getElementById('subscribe-push').style.display = '';
  document.getElementById('unsubscribe-push').style.display = 'none';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

document.getElementById('subscribe-push').onclick = subscribePush;
document.getElementById('unsubscribe-push').onclick = unsubscribePush;

// ...原有启动代码...