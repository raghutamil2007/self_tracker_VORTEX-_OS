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
    initMindEngine();
});

/* ======================================================
   MIND ENGINE MODULE
   ====================================================== */
function initMindEngine() {

    // ------- Calendar Data -------
    // 0=none, 1=missed, 2=hit, 3=perfect
    const mindCalData = {
        2026: {
            3: [0,1,1,0,0,2,2,2,3,3,1,2,3,3,1,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0] // March 2026, days 1-31
        }
    };
    let calYear = 2026, calMonth = 3; // 1-indexed month
    const TODAY_DAY = 17;

    function buildMindCalendar() {
        const grid = document.getElementById('mind-calendar-grid');
        if(!grid) return;
        grid.innerHTML = '';

        const data = (mindCalData[calYear] && mindCalData[calYear][calMonth]) || [];
        const daysInMonth = new Date(calYear, calMonth, 0).getDate();
        const firstDay = new Date(calYear, calMonth - 1, 1).getDay(); // 0=Sun

        // Leading empty cells
        for(let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.style.aspectRatio = '1';
            grid.appendChild(empty);
        }

        for(let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day';
            cell.innerText = d;

            if(d > TODAY_DAY) {
                cell.style.opacity = '0.12';
            } else {
                const level = data[d - 1] || 0;
                if(level === 1) cell.classList.add('missed');
                else if(level === 2) cell.classList.add('hit');
                else if(level === 3) cell.classList.add('perfect');
            }

            if(d === TODAY_DAY) {
                cell.style.outline = '1.5px solid rgba(255,255,255,0.7)';
                cell.style.outlineOffset = '2px';
            }

            grid.appendChild(cell);
        }

        // Update header
        const monthName = new Date(calYear, calMonth - 1, 1).toLocaleString('default', { month: 'short' }).toUpperCase();
        document.querySelector('#view-mind-engine .calendar-card-header .card-header').innerText =
            `CALENDAR (${monthName} ${calYear})`;
    }

    buildMindCalendar();

    document.getElementById('mind-cal-prev').addEventListener('click', () => {
        calMonth--;
        if(calMonth < 1) { calMonth = 12; calYear--; }
        buildMindCalendar();
    });
    document.getElementById('mind-cal-next').addEventListener('click', () => {
        calMonth++;
        if(calMonth > 12) { calMonth = 1; calYear++; }
        buildMindCalendar();
    });

    // ------- Consistency Bars -------
    function buildConsistencyBars() {
        const container = document.getElementById('mind-consistency-bars');
        if(!container) return;
        container.innerHTML = '';
        const heights = [30, 50, 20, 60, 45, 55, 35, 50, 20, 65, 75, 40, 60, 80, 70, 90, 55, 100];
        const greens = [0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0]; // 1=green, 0=red
        heights.forEach((h, i) => {
            const bar = document.createElement('div');
            bar.className = 'tiny-bar' + (greens[i] ? ' high' : ' low');
            bar.style.height = h + 'px';
            container.appendChild(bar);
        });
    }
    buildConsistencyBars();

    // ------- Live Task Scoring -------
    function recalcMindScore() {
        const mainCheckboxes = document.querySelectorAll('#mind-main-tasks input[type="checkbox"]');
        const secCheckboxes = document.querySelectorAll('#mind-secondary-tasks input[type="checkbox"]');
        const mainTotal = mainCheckboxes.length;
        const secTotal = secCheckboxes.length;
        const mainDone = [...mainCheckboxes].filter(c => c.checked).length;
        const secDone = [...secCheckboxes].filter(c => c.checked).length;
        const totalPoints = mainTotal + secTotal;
        const earnedPoints = mainDone + secDone;
        const pct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

        document.getElementById('mind-day-score').innerText = pct + '%';
        document.getElementById('mind-score-fill').style.width = pct + '%';
        document.getElementById('mind-score-sub').innerText =
            `Main ${mainDone}/${mainTotal} · Secondary ${secDone}/${secTotal} · Points ${earnedPoints}/${totalPoints}`;
    }

    // Attach to all existing checkboxes
    document.querySelectorAll('#mind-main-tasks input, #mind-secondary-tasks input').forEach(cb => {
        cb.addEventListener('change', recalcMindScore);
    });

    // ------- Add Task Functionality -------
    function makeAddTaskHandler(listId, tag, buttonId) {
        const btn = document.getElementById(buttonId);
        if(!btn) return;
        btn.addEventListener('click', () => {
            // Avoid double-rendering
            if(btn.nextElementSibling && btn.nextElementSibling.classList.contains('add-task-form')) {
                btn.nextElementSibling.querySelector('.add-task-input').focus();
                return;
            }
            const form = document.createElement('div');
            form.className = 'add-task-form';
            form.innerHTML = `
                <input type="text" class="add-task-input" placeholder="Enter task name..." maxlength="60">
                <button class="add-task-submit">ADD</button>
            `;
            btn.insertAdjacentElement('afterend', form);
            const input = form.querySelector('.add-task-input');
            const submit = form.querySelector('.add-task-submit');
            input.focus();

            const doAdd = () => {
                const name = input.value.trim();
                if(!name) { form.remove(); return; }
                const list = document.getElementById(listId);
                const label = document.createElement('label');
                label.className = 'task-item';
                label.innerHTML = `
                    <input type="checkbox">
                    <span class="task-text">${name}</span>
                    <span class="task-tag">${tag}</span>
                `;
                label.querySelector('input').addEventListener('change', recalcMindScore);
                list.appendChild(label);
                form.remove();
                recalcMindScore();
            };

            submit.addEventListener('click', doAdd);
            input.addEventListener('keydown', (e) => {
                if(e.key === 'Enter') doAdd();
                if(e.key === 'Escape') form.remove();
            });
        });
    }

    makeAddTaskHandler('mind-main-tasks', 'MAIN', 'mind-add-main-btn');
    makeAddTaskHandler('mind-secondary-tasks', 'SECONDARY', 'mind-add-secondary-btn');

    // ------- Engine Sub-Tab Switching -------
    document.querySelectorAll('#view-mind-engine .engine-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Update tab active states
            document.querySelectorAll('#view-mind-engine .engine-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show the correct content panel
            const targetId = tab.getAttribute('data-tab');
            document.querySelectorAll('#view-mind-engine .engine-tab-content').forEach(panel => {
                panel.style.display = 'none';
                panel.classList.remove('active');
            });
            const target = document.getElementById(targetId);
            if(target) {
                target.style.display = 'block';
                target.classList.add('active');
            }
        });
    });

    // ------- Focus Timer -------
    let timerInterval = null;
    let timerRunning = false;
    let timerSeconds = 25 * 60;
    let timerTotal = 25 * 60;
    let sessionCount = 0;
    let currentMode = 'FOCUS';

    const timerDisplay = document.getElementById('focus-timer-display');
    const timerModeLabel = document.getElementById('focus-timer-mode-label');
    const playIcon = document.getElementById('focus-play-icon');

    function formatTime(s) {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    }

    function renderTimer() {
        timerDisplay.innerText = formatTime(timerSeconds);
    }

    function setTimerMode(seconds, label, btnId) {
        clearInterval(timerInterval);
        timerRunning = false;
        timerSeconds = seconds;
        timerTotal = seconds;
        currentMode = label;
        timerModeLabel.innerText = label;
        timerDisplay.innerText = formatTime(timerSeconds);
        timerDisplay.classList.remove('running');
        playIcon.className = 'ph ph-play';

        document.querySelectorAll('.timer-mode-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(btnId);
        if(btn) btn.classList.add('active');
    }

    document.getElementById('btn-focus').addEventListener('click', () => setTimerMode(1500, 'FOCUS', 'btn-focus'));
    document.getElementById('btn-short').addEventListener('click', () => setTimerMode(300, 'SHORT BREAK', 'btn-short'));
    document.getElementById('btn-long').addEventListener('click', () => setTimerMode(900, 'LONG BREAK', 'btn-long'));

    document.getElementById('focus-timer-start').addEventListener('click', () => {
        if(timerRunning) {
            // Pause
            clearInterval(timerInterval);
            timerRunning = false;
            timerDisplay.classList.remove('running');
            playIcon.className = 'ph ph-play';
        } else {
            // Start
            timerRunning = true;
            timerDisplay.classList.add('running');
            playIcon.className = 'ph ph-pause';
            timerInterval = setInterval(() => {
                timerSeconds--;
                renderTimer();
                if(timerSeconds <= 0) {
                    clearInterval(timerInterval);
                    timerRunning = false;
                    timerDisplay.classList.remove('running');
                    playIcon.className = 'ph ph-play';
                    // Log the session
                    logFocusSession(currentMode, timerTotal);
                    if(currentMode === 'FOCUS') {
                        sessionCount = Math.min(sessionCount + 1, 4);
                        updateSessionDots();
                    }
                    // Auto-reset
                    timerSeconds = timerTotal;
                    renderTimer();
                }
            }, 1000);
        }
    });

    document.getElementById('focus-timer-reset').addEventListener('click', () => {
        clearInterval(timerInterval);
        timerRunning = false;
        timerSeconds = timerTotal;
        timerDisplay.classList.remove('running');
        playIcon.className = 'ph ph-play';
        renderTimer();
    });

    document.getElementById('focus-timer-skip').addEventListener('click', () => {
        clearInterval(timerInterval);
        timerRunning = false;
        timerSeconds = 0;
        timerDisplay.classList.remove('running');
        playIcon.className = 'ph ph-play';
        renderTimer();
    });

    function updateSessionDots() {
        document.querySelectorAll('.session-dot').forEach((dot, i) => {
            dot.classList.toggle('filled', i < sessionCount);
        });
    }

    function logFocusSession(mode, durationSecs) {
        const log = document.getElementById('focus-log');
        if(!log) return;
        const now = new Date();
        const timeStr = now.toTimeString().slice(0,5);
        const mins = Math.floor(durationSecs / 60);
        const modeLabel = mode === 'FOCUS' ? `Focus — ${mins} min` : `${mode.charAt(0) + mode.slice(1).toLowerCase()} — ${mins} min`;
        const item = document.createElement('div');
        item.className = 'focus-log-item';
        item.innerHTML = `
            <span class="log-time">${timeStr}</span>
            <span class="log-label">${modeLabel}</span>
            <span class="log-badge">DONE</span>
        `;
        log.insertBefore(item, log.firstChild);
    }

    renderTimer();
}

