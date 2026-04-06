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
            new Chart(engineBarCtx, {
                type: 'bar',
                data: {
                    labels: ['Body', 'Mind', 'Money', 'General'],
                    datasets: [{
                        data: [82, 88, 55, 50],
                        backgroundColor: '#e0e0e0',
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

        // Analytics Weekly Discipline Bar Chart
        const weeklyBarCtx = document.getElementById('analyticsWeeklyBarChart');
        if(weeklyBarCtx) {
            new Chart(weeklyBarCtx, {
                type: 'bar',
                data: {
                    labels: ['2026-W11', '2026-W12'],
                    datasets: [{
                        data: [62, 84],
                        backgroundColor: '#e0e0e0',
                        borderRadius: 4,
                        barPercentage: 0.5
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
    function initDynamicUI() {
        // Heatmap Generation
        const heatmapContainer = document.getElementById('consistencyHeatmap');
        if(heatmapContainer) {
            heatmapContainer.innerHTML = '';
            // Generate some random heatmap data to match the image
            for(let row = 0; row < 7; row++) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'heatmap-row';
                for(let col = 0; col < 14; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'heatmap-cell';
                    // Random class for demo
                    const rand = Math.random();
                    if(rand > 0.8) cell.classList.add('level-3');
                    else if(rand > 0.5) cell.classList.add('level-2');
                    else if(rand > 0.3) cell.classList.add('level-1');
                    else if(rand > 0.1) cell.classList.add('missed');
                    rowDiv.appendChild(cell);
                }
                heatmapContainer.appendChild(rowDiv);
            }
        }

        // Body Engine Calendar Generation (March 2026 placeholder)
        const calendarGrid = document.querySelector('.calendar-grid');
        if(calendarGrid) {
            calendarGrid.innerHTML = '';
            for(let i=1; i<=31; i++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'cal-day';
                dayDiv.innerText = i;
                
                // Add some example classes based on date
                if(i < 3) dayDiv.classList.add('missed');
                else if(i >= 3 && i <= 4) dayDiv.classList.add('hit');
                else if(i >= 5 && i <= 7) dayDiv.classList.add('perfect');
                else if(i > 7 && i <= 14 && Math.random() > 0.3) dayDiv.classList.add('perfect');
                else if(i > 7 && i <= 17) dayDiv.classList.add('hit');
                
                // Select 17th
                if(i === 17) dayDiv.style.border = '1px solid white';
                
                if(i > 17) dayDiv.style.opacity = '0.1'; // Future dates

                calendarGrid.appendChild(dayDiv);
            }
        }

        // Tiny consistent bars
        const tinyBars = document.getElementById('consistencyTinyBars');
        if(tinyBars) {
            tinyBars.innerHTML = '';
            for(let i=0; i<17; i++) {
                const bar = document.createElement('div');
                bar.className = 'tiny-bar';
                const rand = Math.random();
                bar.style.height = (20 + Math.random() * 40) + 'px';
                if(rand > 0.7) bar.classList.add('high');
                else if(rand < 0.2) bar.classList.add('low');
                tinyBars.appendChild(bar);
            }
        }
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

