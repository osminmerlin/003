// 烟迹终结者 - 主要JavaScript文件

// 数据管理类
class SmokeTracker {
    constructor() {
        this.data = this.loadData();
        this.settings = this.loadSettings();
        this.init();
    }

    // 初始化应用
    init() {
        this.bindEvents();
        this.updateUI();
        this.initCharts();
    }

    // 绑定事件监听器
    bindEvents() {
        // 主页事件
        if (document.getElementById('recordSmokeBtn')) {
            document.getElementById('recordSmokeBtn').addEventListener('click', () => this.showRecordModal());
            document.getElementById('cancelRecord').addEventListener('click', () => this.hideRecordModal());
            document.getElementById('saveRecord').addEventListener('click', () => this.saveSmokeRecord());
            
            // 心情滑块
            const moodSlider = document.getElementById('moodSlider');
            if (moodSlider) {
                moodSlider.addEventListener('input', (e) => {
                    document.getElementById('moodValue').textContent = e.target.value;
                });
            }

            // 触发因素按钮
            document.querySelectorAll('.trigger-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const trigger = e.target.dataset.trigger;
                    document.getElementById('triggerSelect').value = trigger;
                });
            });
        }

        // 设置页面事件
        if (document.getElementById('saveSettings')) {
            document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
            document.getElementById('exportData').addEventListener('click', () => this.exportData());
            document.getElementById('importData').addEventListener('click', () => this.importData());
            document.getElementById('clearData').addEventListener('click', () => this.confirmClearData());
            
            // 切换开关
            document.querySelectorAll('.toggle-switch').forEach(toggle => {
                toggle.addEventListener('click', () => {
                    toggle.classList.toggle('active');
                    if (toggle.id === 'dailyReminder') {
                        const section = document.getElementById('reminderTimeSection');
                        if (toggle.classList.contains('active')) {
                            section.classList.remove('hidden');
                        } else {
                            section.classList.add('hidden');
                        }
                    }
                });
            });

            // 主题颜色选择
            document.querySelectorAll('.theme-color').forEach(color => {
                color.addEventListener('click', (e) => {
                    document.querySelectorAll('.theme-color').forEach(c => {
                        c.classList.remove('border-gray-800');
                        c.classList.add('border-transparent');
                    });
                    e.target.classList.remove('border-transparent');
                    e.target.classList.add('border-gray-800');
                });
            });
        }

        // 统计页面事件
        if (document.getElementById('dailyView')) {
            document.getElementById('dailyView').addEventListener('click', () => this.switchView('daily'));
            document.getElementById('weeklyView').addEventListener('click', () => this.switchView('weekly'));
            document.getElementById('monthlyView').addEventListener('click', () => this.switchView('monthly'));
        }

        // 确认对话框
        if (document.getElementById('confirmModal')) {
            document.getElementById('confirmCancel').addEventListener('click', () => this.hideConfirmModal());
        }
    }

    // 加载数据
    loadData() {
        const saved = localStorage.getItem('smokeTrackerData');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            quitDate: null,
            records: [],
            achievements: []
        };
    }

    // 加载设置
    loadSettings() {
        const saved = localStorage.getItem('smokeTrackerSettings');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            dailySmokes: 20,
            cigarettePrice: 25,
            cigarettesPerPack: 20,
            targetDate: null,
            targetDailySmokes: 5,
            targetSavings: 1000,
            notifications: {
                dailyReminder: true,
                milestoneReminder: true,
                recordReminder: false
            },
            theme: 'emerald'
        };
    }

    // 保存数据
    saveData() {
        localStorage.setItem('smokeTrackerData', JSON.stringify(this.data));
    }

    // 保存设置
    saveSettingsData() {
        localStorage.setItem('smokeTrackerSettings', JSON.stringify(this.settings));
    }

    // 显示记录弹窗
    showRecordModal() {
        document.getElementById('recordModal').classList.remove('hidden');
        document.getElementById('recordModal').classList.add('flex');
    }

    // 隐藏记录弹窗
    hideRecordModal() {
        document.getElementById('recordModal').classList.add('hidden');
        document.getElementById('recordModal').classList.remove('flex');
        // 清空表单
        document.getElementById('triggerSelect').value = '';
        document.getElementById('moodSlider').value = '5';
        document.getElementById('moodValue').textContent = '5';
        document.getElementById('noteInput').value = '';
    }

    // 保存吸烟记录
    saveSmokeRecord() {
        const trigger = document.getElementById('triggerSelect').value;
        const mood = parseInt(document.getElementById('moodSlider').value);
        const note = document.getElementById('noteInput').value;
        
        if (!trigger) {
            alert('请选择触发因素');
            return;
        }

        const record = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            trigger: trigger,
            mood: mood,
            note: note
        };

        this.data.records.push(record);
        this.saveData();
        this.hideRecordModal();
        this.updateUI();
        this.showSuccessToast('记录已保存');
    }

    // 更新UI
    updateUI() {
        this.updateMainPage();
        this.updateStatsPage();
        this.updateSettingsPage();
    }

    // 更新主页面
    updateMainPage() {
        if (!document.getElementById('quitDays')) return;

        const quitDate = this.data.quitDate ? new Date(this.data.quitDate) : new Date();
        const today = new Date();
        const days = Math.floor((today - quitDate) / (1000 * 60 * 60 * 24));
        
        // 更新戒烟天数
        this.animateNumber('quitDays', days);
        
        // 获取今日记录
        const todayRecords = this.getTodayRecords();
        const todaySmokes = todayRecords.length;
        
        // 更新今日吸烟数
        document.getElementById('todaySmokes').textContent = todaySmokes;
        
        // 计算进度百分比
        const targetSmokes = this.settings.targetDailySmokes;
        const progress = targetSmokes > 0 ? Math.max(0, (targetSmokes - todaySmokes) / targetSmokes * 100) : 100;
        
        // 更新进度环
        this.updateProgressRing(progress);
        document.getElementById('progressPercent').textContent = Math.round(progress) + '%';
        
        // 计算节省金额
        const totalRecords = this.data.records.length;
        const expectedSmokes = days * this.settings.dailySmokes;
        const savedSmokes = Math.max(0, expectedSmokes - totalRecords);
        const savedMoney = savedSmokes * (this.settings.cigarettePrice / this.settings.cigarettesPerPack);
        
        document.getElementById('savedMoney').textContent = '¥' + Math.round(savedMoney);
        
        // 计算健康指数
        const healthIndex = Math.min(100, days * 2 + savedSmokes * 0.5);
        document.getElementById('healthIndex').textContent = Math.round(healthIndex) + '%';
        
        // 更新健康改善
        this.updateHealthProgress(days);
        
        // 更新成就
        this.updateAchievements();
        
        // 更新激励语句
        this.updateMotivationText();
    }

    // 数字动画
    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const startValue = parseInt(element.textContent) || 0;
        
        anime({
            targets: { value: startValue },
            value: targetValue,
            duration: 1000,
            easing: 'easeOutQuart',
            update: function(anim) {
                element.textContent = Math.round(anim.animatables[0].target.value);
            }
        });
    }

    // 更新进度环
    updateProgressRing(percentage) {
        const circle = document.getElementById('progressCircle');
        const circumference = 2 * Math.PI * 50;
        const offset = circumference - (percentage / 100) * circumference;
        
        anime({
            targets: circle,
            strokeDashoffset: offset,
            duration: 1000,
            easing: 'easeOutQuart'
        });
    }

    // 更新健康进度
    updateHealthProgress(days) {
        const lungProgress = Math.min(100, days * 0.5);
        const heartProgress = Math.min(100, days * 0.3);
        const mentalProgress = Math.min(100, days * 0.8);
        
        this.animateNumber('lungProgress', lungProgress);
        this.animateNumber('heartProgress', heartProgress);
        this.animateNumber('mentalProgress', mentalProgress);
    }

    // 更新成就
    updateAchievements() {
        const achievementsList = document.getElementById('achievementsList');
        if (!achievementsList) return;

        const achievements = this.calculateAchievements();
        achievementsList.innerHTML = '';
        
        achievements.forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';
            achievementEl.innerHTML = `
                <div class="text-2xl">${achievement.icon}</div>
                <div class="flex-1">
                    <div class="text-sm font-medium text-gray-800">${achievement.title}</div>
                    <div class="text-xs text-gray-500">${achievement.description}</div>
                </div>
                <div class="text-sm font-semibold ${achievement.completed ? 'text-green-600' : 'text-gray-400'}">
                    ${achievement.completed ? '已完成' : '进行中'}
                </div>
            `;
            achievementsList.appendChild(achievementEl);
        });
    }

    // 计算成就
    calculateAchievements() {
        const quitDate = this.data.quitDate ? new Date(this.data.quitDate) : new Date();
        const today = new Date();
        const days = Math.floor((today - quitDate) / (1000 * 60 * 60 * 24));
        const totalRecords = this.data.records.length;
        const expectedSmokes = days * this.settings.dailySmokes;
        const savedSmokes = Math.max(0, expectedSmokes - totalRecords);
        const savedMoney = savedSmokes * (this.settings.cigarettePrice / this.settings.cigarettesPerPack);

        return [
            {
                title: '初次尝试',
                description: '坚持戒烟1天',
                icon: '🌱',
                completed: days >= 1
            },
            {
                title: '一周勇士',
                description: '坚持戒烟7天',
                icon: '🏆',
                completed: days >= 7
            },
            {
                title: '月度挑战',
                description: '坚持戒烟30天',
                icon: '💪',
                completed: days >= 30
            },
            {
                title: '省钱达人',
                description: '节省100元',
                icon: '💰',
                completed: savedMoney >= 100
            },
            {
                title: '健康先锋',
                description: '减少吸烟100支',
                icon: '🫁',
                completed: savedSmokes >= 100
            }
        ];
    }

    // 更新激励语句
    updateMotivationText() {
        const motivationText = document.getElementById('motivationText');
        if (!motivationText) return;

        const quitDate = this.data.quitDate ? new Date(this.data.quitDate) : new Date();
        const today = new Date();
        const days = Math.floor((today - quitDate) / (1000 * 60 * 60 * 24));
        
        const messages = [
            '每一次拒绝都是向健康迈进的一步！',
            '坚持就是胜利，你做得很好！',
            '你的肺部正在感谢你！',
            '省钱又健康，何乐而不为？',
            '每一天都是新的开始！',
            '你已经走了这么远，不要放弃！'
        ];
        
        const messageIndex = days % messages.length;
        motivationText.textContent = messages[messageIndex];
    }

    // 获取今日记录
    getTodayRecords() {
        const today = new Date().toDateString();
        return this.data.records.filter(record => {
            const recordDate = new Date(record.timestamp).toDateString();
            return recordDate === today;
        });
    }

    // 初始化图表
    initCharts() {
        if (!document.getElementById('trendChart')) return;

        // 吸烟趋势图
        const trendChart = echarts.init(document.getElementById('trendChart'));
        const trendData = this.getTrendData();
        
        trendChart.setOption({
            title: {
                text: '每日吸烟次数',
                textStyle: { fontSize: 14, color: '#374151' }
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: trendData.dates
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: trendData.counts,
                type: 'line',
                smooth: true,
                itemStyle: { color: '#10B981' },
                areaStyle: { color: 'rgba(16, 185, 129, 0.1)' }
            }]
        });

        // 触发因素图
        const triggerChart = echarts.init(document.getElementById('triggerChart'));
        const triggerData = this.getTriggerData();
        
        triggerChart.setOption({
            title: {
                text: '触发因素分布',
                textStyle: { fontSize: 14, color: '#374151' }
            },
            tooltip: {
                trigger: 'item'
            },
            series: [{
                type: 'pie',
                radius: '70%',
                data: triggerData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        });

        // 心情分布图
        const moodChart = echarts.init(document.getElementById('moodChart'));
        const moodData = this.getMoodData();
        
        moodChart.setOption({
            title: {
                text: '心情评分分布',
                textStyle: { fontSize: 14, color: '#374151' }
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: ['1分', '2分', '3分', '4分', '5分', '6分', '7分', '8分', '9分', '10分']
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: moodData,
                type: 'bar',
                itemStyle: { color: '#0EA5E9' }
            }]
        });
    }

    // 获取趋势数据
    getTrendData() {
        const last7Days = [];
        const counts = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            const shortDate = `${date.getMonth() + 1}/${date.getDate()}`;
            
            last7Days.push(shortDate);
            
            const dayRecords = this.data.records.filter(record => {
                const recordDate = new Date(record.timestamp).toDateString();
                return recordDate === dateString;
            });
            
            counts.push(dayRecords.length);
        }
        
        return { dates: last7Days, counts: counts };
    }

    // 获取触发因素数据
    getTriggerData() {
        const triggers = {};
        const colors = ['#10B981', '#0EA5E9', '#F59E0B', '#EF4444', '#8B5CF6'];
        
        this.data.records.forEach(record => {
            triggers[record.trigger] = (triggers[record.trigger] || 0) + 1;
        });
        
        return Object.entries(triggers).map(([trigger, count], index) => ({
            name: trigger,
            value: count,
            itemStyle: { color: colors[index % colors.length] }
        }));
    }

    // 获取心情数据
    getMoodData() {
        const moods = new Array(10).fill(0);
        
        this.data.records.forEach(record => {
            const mood = record.mood - 1;
            if (mood >= 0 && mood < 10) {
                moods[mood]++;
            }
        });
        
        return moods;
    }

    // 更新统计页面
    updateStatsPage() {
        if (!document.getElementById('totalDays')) return;

        const quitDate = this.data.quitDate ? new Date(this.data.quitDate) : new Date();
        const today = new Date();
        const days = Math.floor((today - quitDate) / (1000 * 60 * 60 * 24));
        
        this.animateNumber('totalDays', days);
        this.animateNumber('totalSmokes', this.data.records.length);
        
        // 计算总节省金额
        const totalRecords = this.data.records.length;
        const expectedSmokes = days * this.settings.dailySmokes;
        const savedSmokes = Math.max(0, expectedSmokes - totalRecords);
        const savedMoney = savedSmokes * (this.settings.cigarettePrice / this.settings.cigarettesPerPack);
        
        document.getElementById('totalSaved').textContent = '¥' + Math.round(savedMoney);
        
        // 计算平均心情
        const avgMood = this.data.records.length > 0 
            ? this.data.records.reduce((sum, record) => sum + record.mood, 0) / this.data.records.length 
            : 0;
        document.getElementById('avgMood').textContent = avgMood.toFixed(1);
        
        // 更新健康恢复进度条
        this.updateHealthRecoveryBars(days);
        
        // 更新里程碑
        this.updateMilestones();
    }

    // 更新健康恢复进度条
    updateHealthRecoveryBars(days) {
        const lungPercent = Math.min(100, days * 0.5);
        const heartPercent = Math.min(100, days * 0.3);
        const mentalPercent = Math.min(100, days * 0.8);
        
        document.getElementById('lungRecoveryBar').style.width = lungPercent + '%';
        document.getElementById('heartRecoveryBar').style.width = heartPercent + '%';
        document.getElementById('mentalRecoveryBar').style.width = mentalPercent + '%';
        
        document.getElementById('lungRecoveryPercent').textContent = Math.round(lungPercent) + '%';
        document.getElementById('heartRecoveryPercent').textContent = Math.round(heartPercent) + '%';
        document.getElementById('mentalRecoveryPercent').textContent = Math.round(mentalPercent) + '%';
    }

    // 更新里程碑
    updateMilestones() {
        const milestonesList = document.getElementById('milestonesList');
        if (!milestonesList) return;

        const achievements = this.calculateAchievements();
        milestonesList.innerHTML = '';
        
        achievements.forEach(achievement => {
            const milestoneEl = document.createElement('div');
            milestoneEl.className = `flex items-center space-x-3 p-3 rounded-lg ${achievement.completed ? 'bg-green-50' : 'bg-gray-50'}`;
            milestoneEl.innerHTML = `
                <div class="text-2xl">${achievement.icon}</div>
                <div class="flex-1">
                    <div class="text-sm font-medium ${achievement.completed ? 'text-green-800' : 'text-gray-800'}">${achievement.title}</div>
                    <div class="text-xs ${achievement.completed ? 'text-green-600' : 'text-gray-500'}">${achievement.description}</div>
                </div>
                <div class="text-lg ${achievement.completed ? 'text-green-600' : 'text-gray-400'}">
                    ${achievement.completed ? '✅' : '⏳'}
                </div>
            `;
            milestonesList.appendChild(milestoneEl);
        });
    }

    // 更新设置页面
    updateSettingsPage() {
        if (!document.getElementById('quitDate')) return;

        // 填充表单数据
        document.getElementById('quitDate').value = this.data.quitDate || '';
        document.getElementById('dailySmokes').value = this.settings.dailySmokes;
        document.getElementById('cigarettePrice').value = this.settings.cigarettePrice;
        document.getElementById('cigarettesPerPack').value = this.settings.cigarettesPerPack;
        document.getElementById('targetDate').value = this.settings.targetDate || '';
        document.getElementById('targetDailySmokes').value = this.settings.targetDailySmokes;
        document.getElementById('targetSavings').value = this.settings.targetSavings;
        
        // 设置切换开关
        if (this.settings.notifications.dailyReminder) {
            document.getElementById('dailyReminder').classList.add('active');
        }
        if (this.settings.notifications.milestoneReminder) {
            document.getElementById('milestoneReminder').classList.add('active');
        }
        if (this.settings.notifications.recordReminder) {
            document.getElementById('recordReminder').classList.add('active');
        }
    }

    // 保存设置
    saveSettings() {
        const newSettings = {
            dailySmokes: parseInt(document.getElementById('dailySmokes').value) || 20,
            cigarettePrice: parseFloat(document.getElementById('cigarettePrice').value) || 25,
            cigarettesPerPack: parseInt(document.getElementById('cigarettesPerPack').value) || 20,
            targetDate: document.getElementById('targetDate').value,
            targetDailySmokes: parseInt(document.getElementById('targetDailySmokes').value) || 5,
            targetSavings: parseInt(document.getElementById('targetSavings').value) || 1000,
            notifications: {
                dailyReminder: document.getElementById('dailyReminder').classList.contains('active'),
                milestoneReminder: document.getElementById('milestoneReminder').classList.contains('active'),
                recordReminder: document.getElementById('recordReminder').classList.contains('active')
            }
        };

        // 更新戒烟日期
        const quitDate = document.getElementById('quitDate').value;
        if (quitDate) {
            this.data.quitDate = quitDate;
            this.saveData();
        }

        this.settings = newSettings;
        this.saveSettingsData();
        this.showSuccessToast('设置已保存');
    }

    // 导出数据
    exportData() {
        const exportData = {
            data: this.data,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smoke-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showSuccessToast('数据已导出');
    }

    // 导入数据
    importData() {
        const input = document.getElementById('importFile');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.id = 'importFile';
            input.accept = '.json';
            input.style.display = 'none';
            document.body.appendChild(input);
        }
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importData = JSON.parse(e.target.result);
                        if (importData.data && importData.settings) {
                            this.data = importData.data;
                            this.settings = importData.settings;
                            this.saveData();
                            this.saveSettingsData();
                            this.updateUI();
                            this.showSuccessToast('数据导入成功');
                        } else {
                            alert('无效的数据格式');
                        }
                    } catch (error) {
                        alert('文件解析失败');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    // 确认清除数据
    confirmClearData() {
        this.showConfirmModal('确定要清除所有数据吗？此操作不可恢复。', () => {
            this.clearAllData();
        });
    }

    // 清除所有数据
    clearAllData() {
        localStorage.removeItem('smokeTrackerData');
        localStorage.removeItem('smokeTrackerSettings');
        this.data = this.loadData();
        this.settings = this.loadSettings();
        this.updateUI();
        this.showSuccessToast('数据已清除');
    }

    // 显示确认对话框
    showConfirmModal(message, callback) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');
        
        messageEl.textContent = message;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        okBtn.onclick = () => {
            this.hideConfirmModal();
            callback();
        };
    }

    // 隐藏确认对话框
    hideConfirmModal() {
        const modal = document.getElementById('confirmModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    // 显示成功提示
    showSuccessToast(message) {
        const toast = document.getElementById('successToast');
        const messageEl = document.getElementById('successMessage');
        
        if (toast && messageEl) {
            messageEl.textContent = message;
            toast.classList.remove('-translate-y-full', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
            
            setTimeout(() => {
                toast.classList.add('-translate-y-full', 'opacity-0');
                toast.classList.remove('translate-y-0', 'opacity-100');
            }, 3000);
        }
    }

    // 切换视图
    switchView(viewType) {
        // 更新按钮状态
        document.querySelectorAll('[id$="View"]').forEach(btn => {
            btn.classList.remove('bg-emerald-500', 'text-white');
            btn.classList.add('bg-gray-100', 'text-gray-600');
        });
        
        document.getElementById(viewType + 'View').classList.remove('bg-gray-100', 'text-gray-600');
        document.getElementById(viewType + 'View').classList.add('bg-emerald-500', 'text-white');
        
        // 重新初始化图表
        this.initCharts();
    }
}

// 初始化应用
let smokeTracker;

document.addEventListener('DOMContentLoaded', function() {
    smokeTracker = new SmokeTracker();
});

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    // 添加页面切换动画
    anime({
        targets: 'main > section',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 600,
        easing: 'easeOutQuart'
    });
});