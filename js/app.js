document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Global Chart defaults
    Chart.defaults.color = '#8c8c8c';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';

    // Global chart instances
    let radarChart, trendChart;
    const miniCharts = {};

    // 2. Initialize Charts
    function initCharts() {
        const radarCtx = document.getElementById('engineRadarChart');
        if(radarCtx) {
            radarChart = new Chart(radarCtx, {
                type: 'radar',
                data: {
                    labels: ['Body', 'Mind', 'General', 'Money'], // order from image
                    datasets: [{
                        label: 'Engine Score',
                        data: [
                            titanData.currentScores.body,
                            titanData.currentScores.mind,
                            titanData.currentScores.general,
                            titanData.currentScores.money
                        ],
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        pointBackgroundColor: '#fff',
                        borderWidth: 1.5,
                        pointRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            pointLabels: {
                                font: { size: 10, family: 'Inter' },
                                color: '#8c8c8c'
                            },
                            ticks: { display: false, max: 100, min: 0 }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Mini Charts Generator
        const createMiniChart = (ctxId, dataValues, isPositive) => {
            const ctx = document.getElementById(ctxId);
            if(!ctx) return null;
            
            const lineColor = isPositive ? '#ffffff' : '#8c8c8c'; // white if high, dimmer if low
            
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['1','2','3','4','5','6','7'],
                    datasets: [{
                        data: dataValues,
                        borderColor: lineColor,
                        borderWidth: 1.5,
                        tension: 0.4, // smooth curve
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false, min: 0, max: 100 }
                    },
                    layout: { padding: 0 }
                }
            });
        };

        // Init mini charts
        miniCharts.body = createMiniChart('bodyMiniChart', titanData.history7Days.body, true);
        miniCharts.mind = createMiniChart('mindMiniChart', titanData.history7Days.mind, true);
        miniCharts.money = createMiniChart('moneyMiniChart', titanData.history7Days.money, true);
        miniCharts.general = createMiniChart('generalMiniChart', titanData.history7Days.general, false);

        // Analytics Trend Chart
        const trendCtx = document.getElementById('analyticsTrendChart');
        if(trendCtx) {
            trendChart = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: titanData.trendDates,
                    datasets: [{
                        data: titanData.titanScoreTrend,
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { min: 0, max: 100, ticks: { stepSize: 25 } }
                    }
                }
            });
        }

        // Analytics Engine Bar Chart
        const engineBarCtx = document.getElementById('analyticsEngineBarChart');
        if(engineBarCtx) {
            window.analyticsEngineChart = new Chart(engineBarCtx, {
                type: 'bar',
                data: {
                    labels: ['Body', 'Mind', 'Money', 'General'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: ['#fff', '#fff', '#fff', '#fff'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { min: 0, max: 100, ticks: { stepSize: 25 } }
                    }
                }
            });
        }

    }

    // 2.5 Generate Dynamic UI elements (Heatmap, Calendar, etc.)
    const HISTORY_KEY = 'titan-engine-history-v3';

    function getHistoryData() {
        const saved = localStorage.getItem(HISTORY_KEY);
        return saved ? JSON.parse(saved) : {};
    }

    function initDynamicUI() {
        renderInteractiveHeatmap();
        updateAnalyticsControls();
        refreshAnalytics(7); // Initial 7D view
    }

    function renderInteractiveHeatmap() {
        const container = document.getElementById('consistencyHeatmap');
        const tooltip = document.getElementById('heatmap-tooltip');
        if (!container) return;

        container.innerHTML = '';
        const history = getHistoryData();
        const now = new Date();
        
        // 14 weeks = 98 days
        const totalDays = 98;
        const days = [];
        
        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            let hasData = false;
            let dayData = { body: 0, mind: 0, money: 0, general: 0 };
            ['body', 'mind', 'money', 'general'].forEach(eng => {
                if (history[eng] && history[eng][dateStr] !== undefined) {
                    dayData[eng] = history[eng][dateStr];
                    hasData = true;
                }
            });

            days.push({ date: dateStr, data: hasData ? dayData : null, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
        }

        // Create 7 rows (days of week) x 14 cols
        for (let r = 0; r < 7; r++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'heatmap-row';
            for (let c = 0; c < 14; c++) {
                const dayIndex = c * 7 + r;
                const dayObj = days[dayIndex];
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                
                if (dayObj.data) {
                    const avg = (dayObj.data.body + dayObj.data.mind + dayObj.data.money + dayObj.data.general) / 4;
                    if (avg >= 90) cell.classList.add('level-3');
                    else if (avg >= 70) cell.classList.add('level-2');
                    else if (avg >= 40) cell.classList.add('level-1');
                    else cell.classList.add('missed');
                }

                cell.addEventListener('mouseenter', (e) => {
                    const scoreText = dayObj.data ? ( (dayObj.data.body + dayObj.data.mind + dayObj.data.money + dayObj.data.general) / 4 ).toFixed(1) + '%' : 'No Data';
                    tooltip.innerHTML = `<strong>${dayObj.label}</strong><br>Score: ${scoreText}`;
                    tooltip.style.display = 'block';
                    const rect = cell.getBoundingClientRect();
                    tooltip.style.left = (rect.left + window.scrollX - 40) + 'px';
                    tooltip.style.top = (rect.top + window.scrollY - 50) + 'px';
                });

                cell.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });

                rowDiv.appendChild(cell);
            }
            container.appendChild(rowDiv);
        }
    }

    function updateAnalyticsControls() {
        const filters = document.querySelectorAll('.filter-btn');
        filters.forEach(btn => {
            btn.onclick = () => {
                filters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const range = parseInt(btn.getAttribute('data-range'));
                refreshAnalytics(range);
            };
        });
    }

    function refreshAnalytics(range) {
        const history = getHistoryData();
        const now = new Date();
        const labels = [];
        const trendData = [];
        const engineSums = { body: 0, mind: 0, money: 0, general: 0, count: 0 };

        for (let i = range - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            let hasData = false;
            let dayData = { body: 0, mind: 0, money: 0, general: 0 };
            ['body', 'mind', 'money', 'general'].forEach(eng => {
                if (history[eng] && history[eng][dateStr] !== undefined) {
                    dayData[eng] = history[eng][dateStr];
                    hasData = true;
                }
            });
            
            labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            if (hasData) {
                const avg = (dayData.body + dayData.mind + dayData.money + dayData.general) / 4;
                trendData.push(avg);
                engineSums.body += dayData.body;
                engineSums.mind += dayData.mind;
                engineSums.money += dayData.money;
                engineSums.general += dayData.general;
                engineSums.count++;
            } else {
                trendData.push(0);
            }
        }

        // Update Trend Chart
        if (trendChart) {
            trendChart.data.labels = labels;
            trendChart.data.datasets[0].data = trendData;
            trendChart.update();
            document.getElementById('trend-range-display').innerText = `(${range} Days)`;
        }

        // Update Bar Chart
        if (window.analyticsEngineChart) {
            let avgData;
            if (engineSums.count > 0) {
                avgData = [
                    engineSums.body / engineSums.count,
                    engineSums.mind / engineSums.count,
                    engineSums.money / engineSums.count,
                    engineSums.general / engineSums.count
                ];
            } else {
                // Fallback to today's scores if no history
                avgData = [
                    titanData.currentScores.body,
                    titanData.currentScores.mind,
                    titanData.currentScores.money,
                    titanData.currentScores.general
                ];
            }
            
            // Set some distinct colors for the engines based on typical TITAN OS palette or just distinct whites
            window.analyticsEngineChart.data.datasets[0].backgroundColor = [
                'rgba(242, 95, 92, 0.8)',   // Body (Red-ish)
                'rgba(89, 209, 149, 0.8)',  // Mind (Green-ish)
                'rgba(255, 209, 102, 0.8)', // Money (Yellow-ish)
                'rgba(140, 140, 140, 0.8)'  // General (Grey-ish)
            ];
            window.analyticsEngineChart.data.datasets[0].data = avgData;
            window.analyticsEngineChart.update();
        }

        renderInsights(engineSums, range);
    }

    function renderInsights(sums, range) {
        const list = document.getElementById('analytics-insights-list');
        if (!list) return;

        let activeSums = sums;
        let isFallback = false;

        if (sums.count === 0) {
            // Fallback to today's data so we show something
            activeSums = {
                count: 1,
                body: titanData.currentScores.body,
                mind: titanData.currentScores.mind,
                money: titanData.currentScores.money,
                general: titanData.currentScores.general
            };
            isFallback = true;
        }

        const averages = [
            { name: 'Body', val: activeSums.body / activeSums.count },
            { name: 'Mind', val: activeSums.mind / activeSums.count },
            { name: 'Money', val: activeSums.money / activeSums.count },
            { name: 'General', val: activeSums.general / activeSums.count }
        ];

        averages.sort((a, b) => b.val - a.val);
        const top = averages[0];
        const bottom = averages[3];

        let html = `
            <div class="insight-item">
                <i class="ph ph-trend-up"></i>
                <div class="insight-text">
                    <strong>Strongest Link:</strong> ${top.name} is your top performing engine at ${top.val.toFixed(1)}%. Keep it up!
                </div>
            </div>
            <div class="insight-item">
                <i class="ph ph-warning"></i>
                <div class="insight-text">
                    <strong>Growth Opportunity:</strong> ${bottom.name} needs more attention (${bottom.val.toFixed(1)}%).
                </div>
            </div>
            <div class="insight-item">
                <i class="ph ph-calendar-check"></i>
                <div class="insight-text">
                    ${isFallback 
                        ? `<strong>Notice:</strong> No historical data found. Analyzing today's scores instead. Start logging tasks to build history!`
                        : `<strong>Consistency:</strong> You logged data for ${sums.count} out of the last ${range} days.`
                    }
                </div>
            </div>
        `;
        list.innerHTML = html;
    }

    // 3. Render UI from titanData
    window.renderTitanUI = function() {
        // Update texts
        document.getElementById('fill-body').style.width = titanData.currentScores.body + '%';
        document.getElementById('val-body').innerText = titanData.currentScores.body + '.0%';
        
        document.getElementById('fill-mind').style.width = titanData.currentScores.mind + '%';
        document.getElementById('val-mind').innerText = titanData.currentScores.mind + '.0%';
        
        document.getElementById('fill-money').style.width = titanData.currentScores.money + '%';
        document.getElementById('val-money').innerText = titanData.currentScores.money + '.0%';
        
        document.getElementById('fill-general').style.width = titanData.currentScores.general + '%';
        document.getElementById('val-general').innerText = titanData.currentScores.general + '.0%';

        // Overall average (simplified)
        const avg = (titanData.currentScores.body + titanData.currentScores.mind + titanData.currentScores.money + titanData.currentScores.general) / 4;
        document.getElementById('overall-score-display').innerText = avg.toFixed(1) + '%';

        // Update Charts if initialized
        if(radarChart) {
            radarChart.data.datasets[0].data = [
                titanData.currentScores.body,
                titanData.currentScores.mind,
                titanData.currentScores.general,
                titanData.currentScores.money
            ];
            radarChart.update();
        }

        ['body', 'mind', 'money', 'general'].forEach(engine => {
            if(miniCharts[engine]) {
                miniCharts[engine].data.datasets[0].data = titanData.history7Days[engine];
                miniCharts[engine].update();
            }
        });

        if(trendChart) {
             trendChart.data.datasets[0].data = titanData.titanScoreTrend;
             trendChart.data.labels = titanData.trendDates;
             trendChart.update();
        }
    };

    // 4. View Switching Logic
    const viewLinks = document.querySelectorAll('[data-view]');
    viewLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active classes
            viewLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.view').forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
            });
            
            // Set new active
            link.classList.add('active');
            const targetViewId = 'view-' + link.getAttribute('data-view');
            const targetView = document.getElementById(targetViewId);
            
            if(targetView) {
                targetView.classList.add('active');
                targetView.style.display = 'block';
            }
        });
    });

    // Run Initializers
    initCharts();
    initDynamicUI();
    window.renderTitanUI();
    initHabits();
});

