// 轻打卡系统 - v2.0
// 固定提醒内容，提醒间隔1-360分钟

const LS_KEY = 'habitCheckInData';
const DEFAULT_CONFIG = {
  habitName: '吸烟',
  notifyTitle: '吸烟时间到了，快去吸烟。',
  remindInterval: 60 // 分钟
};
let config = {...DEFAULT_CONFIG};
let records = [];
let remindTimer = null;

// 初始化加载
function loadData() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    const data = JSON.parse(raw);
    records = data.records || [];
    config = {...DEFAULT_CONFIG, ...data.config};
  }
}
function saveData() {
  localStorage.setItem(LS_KEY, JSON.stringify({records, config}));
}
function updateUI() {
  document.getElementById('habit-name').textContent = config.habitName;
  const todayRecs = getTodayRecords();
  document.getElementById('today-count').textContent = `今日打卡次数：${todayRecs.length}`;
  document.getElementById('avg-interval').textContent = `平均间隔：${calcAvgInterval(todayRecs)} 分钟`;
  updateRecentRecords();
}
function updateRecentRecords() {
  const ul = document.getElementById('record-list');
  ul.innerHTML = '';
  if (records.length === 0) {
    document.getElementById('no-record-tip').style.display = '';
    return;
  }
  document.getElementById('no-record-tip').style.display = 'none';
  records.slice(-5).reverse().forEach(rec => {
    const li = document.createElement('li');
    li.textContent = formatRecord(rec);
    ul.appendChild(li);
  });
}
function formatRecord(rec) {
  const d = new Date(rec.timestamp);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}
function getTodayRecords() {
  const now = new Date();
  return records.filter(rec => {
    const d = new Date(rec.timestamp);
    return d.toLocaleDateString() === now.toLocaleDateString();
  });
}
function calcAvgInterval(recs) {
  if (recs.length < 2) return '--';
  let total = 0;
  for (let i = 1; i < recs.length; i++) {
    total += (recs[i].timestamp - recs[i-1].timestamp) / 60000;
  }
  return Math.round(total / (recs.length-1));
}

// 打卡功能
document.getElementById('checkin-btn').onclick = () => {
  const ts = Date.now();
  records.push({timestamp: ts, localDate: new Date(ts).toLocaleDateString()});
  saveData();
  updateUI();
  showFloatingNotice('打卡成功');
  sendBrowserNotify(DEFAULT_CONFIG.notifyTitle);
};
function showFloatingNotice(msg) {
  const bar = document.getElementById('floating-notice');
  bar.textContent = msg;
  bar.style.display = '';
  setTimeout(()=>{bar.style.display='none'}, 2000);
}

// 浏览器通知
function sendBrowserNotify(msg) {
  if (Notification.permission === 'granted') {
    new Notification(msg);
  }
}
function askNotificationPermission() {
  if (Notification && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

// 智能提醒系统
function startRemindTimer() {
  clearRemindTimer();
  remindTimer = setInterval(()=>{
    sendBrowserNotify(DEFAULT_CONFIG.notifyTitle);
    showFloatingNotice('提醒：' + DEFAULT_CONFIG.notifyTitle);
  }, config.remindInterval * 60000);
}
function clearRemindTimer() {
  if (remindTimer) clearInterval(remindTimer);
}

// 设置模态框
document.getElementById('settings-btn').onclick = () => {
  showModal('settings-modal');
  document.getElementById('input-habit-name').value = config.habitName;
  document.getElementById('input-notify-title').value = DEFAULT_CONFIG.notifyTitle;
  document.getElementById('input-notify-title').setAttribute('readonly', 'readonly');
  document.getElementById('input-remind-interval').value = config.remindInterval;
  document.getElementById('input-remind-interval').setAttribute('min', '1');
  document.getElementById('input-remind-interval').setAttribute('max', '360');
};
document.getElementById('close-settings').onclick = () => closeModal('settings-modal');
document.getElementById('save-settings').onclick = () => {
  config.habitName = document.getElementById('input-habit-name').value || DEFAULT_CONFIG.habitName;
  config.notifyTitle = DEFAULT_CONFIG.notifyTitle;
  const interval = Number(document.getElementById('input-remind-interval').value);
  config.remindInterval = Math.min(Math.max(interval,1),360) || DEFAULT_CONFIG.remindInterval;
  saveData();
  closeModal('settings-modal');
  updateUI();
  startRemindTimer();
  askNotificationPermission();
  showFloatingNotice('设置已保存');
};

// 报告模态框
document.getElementById('report-btn').onclick = () => {
  showModal('report-modal');
  showReportTab('day');
  renderCharts();
};
document.getElementById('close-report').onclick = () => closeModal('report-modal');
document.querySelectorAll('#tab-btns button').forEach(btn=>{
  btn.onclick = ()=>{ showReportTab(btn.dataset.tab); };
});
function showReportTab(tab) {
  ['day','month','year'].forEach(t=>{
    document.getElementById(`${t}-chart`).style.display = (t===tab?'':'none');
  });
  document.getElementById('report-stats').innerHTML = calcReportStats(tab);
}
function calcReportStats(tab) {
  if (records.length === 0) return '<div>暂无数据</div>';
  if (tab==='day') {
    const todayRecs = getTodayRecords();
    const hours = todayRecs.map(r=>new Date(r.timestamp).getHours());
    const peakHour = hours.length ? mode(hours) : '--';
    return `<div>今日峰值时段：${peakHour}点</div>
      <div>今日平均频率：${calcAvgInterval(todayRecs)}分钟/次</div>
      <div>累计打卡天数：${countActiveDays()}天</div>`;
  }
  if (tab==='month') {
    return `<div>本月累计打卡：${countRecordsMonth()}次</div>
      <div>打卡天数：${countActiveDays('month')}天</div>`;
  }
  if (tab==='year') {
    return `<div>本年累计打卡：${countRecordsYear()}次</div>
      <div>打卡天数：${countActiveDays('year')}天</div>`;
  }
  return '';
}
function mode(arr) {
  return arr.sort((a,b)=>
    arr.filter(v=>v===a).length - arr.filter(v=>v===b).length
  ).pop();
}
function countActiveDays(scope) {
  const days = new Set();
  const now = new Date();
  records.forEach(r=>{
    const d = new Date(r.timestamp);
    if (scope==='month' && d.getMonth()!==now.getMonth()) return;
    if (scope==='year' && d.getFullYear()!==now.getFullYear()) return;
    days.add(d.toLocaleDateString());
  });
  return days.size;
}
function countRecordsMonth() {
  const now = new Date();
  return records.filter(r=>new Date(r.timestamp).getMonth()===now.getMonth()).length;
}
function countRecordsYear() {
  const now = new Date();
  return records.filter(r=>new Date(r.timestamp).getFullYear()===now.getFullYear()).length;
}
function renderCharts() {
  const todayRecs = getTodayRecords();
  const hours = Array(24).fill(0);
  todayRecs.forEach(r=>{
    hours[new Date(r.timestamp).getHours()]++;
  });
  drawBarChart('day-chart', Array.from({length:24},(_,i)=>i+'点'), hours, '每小时打卡分布');

  const now = new Date();
  const days = Array(30).fill(0);
  records.forEach(r=>{
    const d = new Date(r.timestamp);
    if (d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear()) {
      days[d.getDate()-1]++;
    }
  });
  drawLineChart('month-chart', Array.from({length:30},(_,i)=>`${i+1}日`), days, '每月打卡趋势');

  const months = Array(12).fill(0);
  records.forEach(r=>{
    const d = new Date(r.timestamp);
    if (d.getFullYear()===now.getFullYear()) {
      months[d.getMonth()]++;
    }
  });
  drawBarChart('year-chart', Array.from({length:12},(_,i)=>`${i+1}月`), months, '每年打卡分布');
}
let chartInstances = {};
function drawBarChart(canvasId, labels, data, title) {
  if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
  chartInstances[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {labels, datasets:[{label:title, data, backgroundColor:'#007aff'}]},
    options: {responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
  });
}
function drawLineChart(canvasId, labels, data, title) {
  if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
  chartInstances[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {labels, datasets:[{label:title, data, borderColor:'#007aff', fill:false}]},
    options: {responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
  });
}

// 模态框
function showModal(id) {
  document.getElementById(id).style.display = 'block';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
function setTheme() {
  document.body.className = 'ios-theme';
}

// 启动
loadData();
setTheme();
updateUI();
askNotificationPermission();
startRemindTimer();