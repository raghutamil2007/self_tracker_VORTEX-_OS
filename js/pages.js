/* ======================================================
   TITAN OS — PAGES.JS
   All new pages: Money, General, Command, Habits,
   Journal, Goals, Focus Timer (standalone), Workouts,
   Sleep, Weight, Nutrition, Settings
   ====================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initEngineModule('money',   [1,2,2,0,0,3,2,3,3,2,1,3,2,3,1,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    initEngineModule('general', [0,1,0,0,0,2,2,1,3,2,0,1,2,1,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    initCommandCenter();
    initHabits();
    initJournal();
    initEngineSubTabs('view-money-engine');
    initEngineTasks('money');
    initEngineTasks('general');
    initSleepLog();
    initWeightChart();
    initStandaloneFocusTimer();
});

/* ======== Generic Calendar+Consistency for Money / General ======== */
function initEngineModule(engine, calData) {
    let year = 2026, month = 3;
    const TODAY = 17;

    const buildCal = () => {
        const grid = document.getElementById(`${engine}-calendar-grid`);
        if (!grid) return;
        grid.innerHTML = '';
        const data = calData;
        const days = new Date(year, month, 0).getDate();
        const first = new Date(year, month - 1, 1).getDay();
        for (let i = 0; i < first; i++) {
            const e = document.createElement('div');
            e.style.aspectRatio = '1';
            grid.appendChild(e);
        }
        for (let d = 1; d <= days; d++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day';
            cell.innerText = d;
            if (d > TODAY) { cell.style.opacity = '0.1'; }
            else {
                const lvl = data[d - 1] || 0;
                if (lvl === 1) cell.classList.add('missed');
                else if (lvl === 2) cell.classList.add('hit');
                else if (lvl === 3) cell.classList.add('perfect');
            }
            if (d === TODAY) {
                cell.style.outline = '1.5px solid rgba(255,255,255,0.7)';
                cell.style.outlineOffset = '2px';
            }
            grid.appendChild(cell);
        }
        const header = document.getElementById(`${engine}-cal-header`);
        if (header) {
            const mn = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }).toUpperCase();
            header.innerText = `CALENDAR (${mn} ${year})`;
        }
    };

    buildCal();

    const prev = document.getElementById(`${engine}-cal-prev`);
    const next = document.getElementById(`${engine}-cal-next`);
    if (prev) prev.addEventListener('click', () => { month--; if (month < 1) { month = 12; year--; } buildCal(); });
    if (next) next.addEventListener('click', () => { month++; if (month > 12) { month = 1; year++; } buildCal(); });

    // Consistency bars
    const bars = document.getElementById(`${engine}-consistency-bars`);
    if (bars) {
        bars.innerHTML = '';
        const hs = [20,50,30,70,40,60,30,50,70,80,60,40,70,90,55,80,100,60];
        const g  = [0,1,0,1,0,1,0,1,1,1,0,1,1,0,1,0,1,0];
        hs.forEach((h, i) => {
            const b = document.createElement('div');
            b.className = 'tiny-bar ' + (g[i] ? 'high' : 'low');
            b.style.height = h + 'px';
            bars.appendChild(b);
        });
    }
}

/* ======== Engine Task Live Scoring (Money, General) ======== */
function initEngineTasks(engine) {
    const recalc = () => {
        const mains = document.querySelectorAll(`#${engine}-main-tasks input[type="checkbox"]`);
        const secs  = document.querySelectorAll(`#${engine}-secondary-tasks input[type="checkbox"]`);
        const mt = mains.length, st = secs.length;
        const md = [...mains].filter(c => c.checked).length;
        const sd = [...secs].filter(c => c.checked).length;
        const total = mt + st, earned = md + sd;
        const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
        const scoreEl = document.getElementById(`${engine}-day-score`);
        const fillEl  = document.getElementById(`${engine}-score-fill`);
        const subEl   = document.getElementById(`${engine}-score-sub`);
        if (scoreEl) scoreEl.innerText = pct + '%';
        if (fillEl)  fillEl.style.width = pct + '%';
        if (subEl)   subEl.innerText = `Main ${md}/${mt} · Secondary ${sd}/${st} · Points ${earned}/${total}`;
    };

    document.querySelectorAll(`#${engine}-main-tasks input, #${engine}-secondary-tasks input`).forEach(cb => {
        cb.addEventListener('change', recalc);
    });

    const makeAddBtn = (listId, tag, btnId) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', () => {
            if (btn.nextElementSibling && btn.nextElementSibling.classList.contains('add-task-form')) {
                btn.nextElementSibling.querySelector('.add-task-input').focus();
                return;
            }
            const form = document.createElement('div');
            form.className = 'add-task-form';
            form.innerHTML = `<input type="text" class="add-task-input" placeholder="Enter task name..." maxlength="60">
                              <button class="add-task-submit">ADD</button>`;
            btn.insertAdjacentElement('afterend', form);
            const input = form.querySelector('.add-task-input');
            input.focus();
            const doAdd = () => {
                const name = input.value.trim();
                if (!name) { form.remove(); return; }
                const list = document.getElementById(listId);
                const label = document.createElement('label');
                label.className = 'task-item';
                label.innerHTML = `<input type="checkbox"><span class="task-text">${name}</span><span class="task-tag">${tag}</span>`;
                label.querySelector('input').addEventListener('change', recalc);
                list.appendChild(label);
                form.remove();
                recalc();
            };
            form.querySelector('.add-task-submit').addEventListener('click', doAdd);
            input.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); if (e.key === 'Escape') form.remove(); });
        });
    };

    makeAddBtn(`${engine}-main-tasks`,      'MAIN',      `${engine}-add-main-btn`);
    makeAddBtn(`${engine}-secondary-tasks`, 'SECONDARY', `${engine}-add-secondary-btn`);
}

/* ======== Engine Sub-Tab Switcher ======== */
function initEngineSubTabs(viewId) {
    document.querySelectorAll(`#${viewId} .engine-tab`).forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll(`#${viewId} .engine-tab`).forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.querySelectorAll(`#${viewId} .engine-tab-content`).forEach(panel => {
                panel.style.display = 'none';
                panel.classList.remove('active');
            });
            const target = document.getElementById(targetId);
            if (target) { target.style.display = 'block'; target.classList.add('active'); }
        });
    });
}

/* ======== Command Center ======== */
function initCommandCenter() {
    const btn = document.getElementById('cmd-submit');
    const input = document.getElementById('cmd-task-input');
    const engineSel = document.getElementById('cmd-engine-select');
    const log = document.getElementById('cmd-log');

    if (!btn || !input || !log) return;

    const doLog = () => {
        const name = input.value.trim();
        if (!name) return;
        const engine = engineSel ? engineSel.value : 'mind';
        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 5);
        const item = document.createElement('div');
        item.className = 'cmd-log-item';
        item.innerHTML = `<span class="cmd-log-time">${timeStr}</span>
                          <span class="cmd-log-engine ${engine}-tag">${engine.toUpperCase()}</span>
                          <span class="cmd-log-text">${name}</span>`;
        log.insertBefore(item, log.firstChild);
        input.value = '';
    };

    btn.addEventListener('click', doLog);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doLog(); });
}

/* ======== Habits — Build Mini Dot History ======== */
function initHabits() {
    // Each habit gets 14 day dots: random green/red based on pct
    const habits = [
        { id: 'hd1', pct: 86 }, { id: 'hd2', pct: 100 }, { id: 'hd3', pct: 72 }, { id: 'hd4', pct: 43 },
        { id: 'hd5', pct: 57 }, { id: 'hd6', pct: 93 }, { id: 'hd7', pct: 50 }, { id: 'hd8', pct: 71 }
    ];
    habits.forEach(({ id, pct }) => {
        const container = document.getElementById(id);
        if (!container) return;
        for (let i = 0; i < 14; i++) {
            const dot = document.createElement('div');
            dot.className = 'habit-dot';
            const hit = Math.random() * 100 < pct;
            const h = 8 + Math.random() * 18;
            dot.style.height = h + 'px';
            dot.style.background = hit ? '#59d195' : 'rgba(242,95,95,0.5)';
            container.appendChild(dot);
        }
    });
}

/* ======== Journal ======== */
function initJournal() {
    const saveBtn = document.getElementById('journal-save-btn');
    const textarea = document.getElementById('journal-textarea');
    const list = document.getElementById('journal-entries-list');

    // Live date
    const dateEl = document.getElementById('journal-today-date');
    if (dateEl) {
        const d = new Date();
        dateEl.innerText = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    }

    if (!saveBtn || !textarea || !list) return;

    saveBtn.addEventListener('click', () => {
        const text = textarea.value.trim();
        if (!text) return;
        const d = new Date();
        const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const card = document.createElement('div');
        card.className = 'card journal-entry-card';
        card.innerHTML = `<div class="journal-entry-date">${dateStr}</div>
                          <p class="journal-entry-preview">${text.substring(0, 180)}${text.length > 180 ? '...' : ''}</p>`;
        list.insertBefore(card, list.firstChild);
        textarea.value = '';
    });
}

/* ======== Sleep Log ======== */
function initSleepLog() {
    const grid = document.getElementById('sleep-log-grid');
    if (!grid) return;
    const days   = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const hours  = ['8h 10m', '6h 45m', '7h 30m', '8h 00m', '5h 45m', '9h 00m', '7h 42m'];
    const pcts   = [102, 84, 94, 100, 72, 113, 96];
    days.forEach((day, i) => {
        const pct = Math.min(pcts[i], 100);
        const item = document.createElement('div');
        item.className = 'sleep-log-item';
        item.innerHTML = `<div class="sleep-log-day">${day}</div>
                          <div class="sleep-log-val">${hours[i]}</div>
                          <div class="sleep-log-bar"><div class="sleep-log-bar-fill" style="width:${pct}%"></div></div>`;
        grid.appendChild(item);
    });
}

/* ======== Weight Chart ======== */
function initWeightChart() {
    const canvas = document.getElementById('weightTrendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan','Feb','Mar W1','Mar W2','Mar W3'],
            datasets: [{
                label: 'Weight (kg)',
                data: [82, 80.1, 77.5, 75.8, 74.2],
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1.5,
                pointRadius: 3,
                pointBackgroundColor: '#ffffff',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#6b6b6b', font: { family: 'Inter', size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#6b6b6b', font: { family: 'Inter', size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 68, max: 85 }
            }
        }
    });

    const logBtn = document.getElementById('weight-log-btn');
    if (logBtn) {
        logBtn.addEventListener('click', () => {
            const val = document.getElementById('weight-input').value;
            if (!val) return;
            alert(`Weight ${val}kg logged! (connect to a backend to persist this)`);
        });
    }
}

/* ======== Standalone Focus Timer ======== */
function initStandaloneFocusTimer() {
    const display    = document.getElementById('ft-display');
    const modeLabel  = document.getElementById('ft-mode');
    const playIcon   = document.getElementById('ft-icon');
    const dotsEl     = document.getElementById('ft-dots');
    const logEl      = document.getElementById('ft-log');
    if (!display) return;

    let interval = null, running = false, secs = 1500, total = 1500, sessionCnt = 0, mode = 'FOCUS';

    const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    const render = () => { display.innerText = fmt(secs); };

    const setMode = (s, label, btnId) => {
        clearInterval(interval); running = false;
        secs = s; total = s; mode = label;
        modeLabel.innerText = label;
        display.innerText = fmt(secs);
        display.classList.remove('running');
        if (playIcon) playIcon.className = 'ph ph-play';
        document.querySelectorAll('#view-focus-timer .timer-mode-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.add('active');
    };

    const btnFocus = document.getElementById('ft-btn-focus');
    const btnShort = document.getElementById('ft-btn-short');
    const btnLong  = document.getElementById('ft-btn-long');
    if (btnFocus) btnFocus.addEventListener('click', () => setMode(1500, 'FOCUS',       'ft-btn-focus'));
    if (btnShort) btnShort.addEventListener('click', () => setMode(300,  'SHORT BREAK', 'ft-btn-short'));
    if (btnLong)  btnLong.addEventListener('click',  () => setMode(900,  'LONG BREAK',  'ft-btn-long'));

    const startBtn = document.getElementById('ft-start');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (running) {
                clearInterval(interval); running = false;
                display.classList.remove('running');
                if (playIcon) playIcon.className = 'ph ph-play';
            } else {
                running = true;
                display.classList.add('running');
                if (playIcon) playIcon.className = 'ph ph-pause';
                interval = setInterval(() => {
                    secs--;
                    render();
                    if (secs <= 0) {
                        clearInterval(interval); running = false;
                        display.classList.remove('running');
                        if (playIcon) playIcon.className = 'ph ph-play';
                        // Log it
                        if (logEl) {
                            const now = new Date();
                            const timeStr = now.toTimeString().slice(0,5);
                            const mins = Math.floor(total/60);
                            const item = document.createElement('div');
                            item.className = 'focus-log-item';
                            item.innerHTML = `<span class="log-time">${timeStr}</span>
                                              <span class="log-label">${mode} — ${mins} min</span>
                                              <span class="log-badge">DONE</span>`;
                            logEl.insertBefore(item, logEl.firstChild);
                        }
                        if (mode === 'FOCUS') {
                            sessionCnt = Math.min(sessionCnt + 1, 4);
                            if (dotsEl) {
                                dotsEl.querySelectorAll('.session-dot').forEach((d, i) => {
                                    d.classList.toggle('filled', i < sessionCnt);
                                });
                            }
                        }
                        secs = total; render();
                    }
                }, 1000);
            }
        });
    }

    const resetBtn = document.getElementById('ft-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            clearInterval(interval); running = false;
            secs = total; display.classList.remove('running');
            if (playIcon) playIcon.className = 'ph ph-play';
            render();
        });
    }

    const skipBtn = document.getElementById('ft-skip');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            clearInterval(interval); running = false; secs = 0;
            display.classList.remove('running');
            if (playIcon) playIcon.className = 'ph ph-play';
            render();
        });
    }

    render();
}
