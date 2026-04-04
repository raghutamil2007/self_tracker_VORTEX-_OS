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
    initHydration();
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
    // Overall weekly bars
    const overallContainer = document.getElementById('overall-weekly-bars');
    if (overallContainer) {
        const overallLevels = [100, 70, 50, 90, 80, 0, 0];
        const overallLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        overallLevels.forEach((lvl, i) => {
            const wrap = document.createElement('div');
            wrap.className = 'overall-bar-wrapper';
            wrap.innerHTML = `<div class="overall-bar"><div class="overall-bar-fill" style="height:${lvl}%"></div></div><span>${overallLabels[i]}</span>`;
            overallContainer.appendChild(wrap);
        });
    }

    // Individual Habit charts
    const habits = [
        { id: 'hc1', pct: 86, daily: [40,60,86,100,50,0,86] },
        { id: 'hc2', pct: 100, daily: [100,100,100,100,100,100,100] },
        { id: 'hc3', pct: 72, daily: [80,60,50,60,80,72,20] },
        { id: 'hc4', pct: 43, daily: [50,10,30,40,20,0,43] },
        { id: 'hc5', pct: 57, daily: [100,100,100,0,0,0,57] },
        { id: 'hc6', pct: 93, daily: [90,95,100,80,90,100,93] },
        { id: 'hc7', pct: 50, daily: [100,10,0,0,0,100,50] },
        { id: 'hc8', pct: 71, daily: [50,60,70,80,60,70,71] }
    ];
    const habitLabels = ['1', 'T', '4', '5', '6', '7', '7'];
    habits.forEach(({ id, pct, daily }) => {
        const container = document.getElementById(id);
        if (!container) return;
        for (let i = 0; i < 7; i++) {
            const wrap = document.createElement('div');
            wrap.className = 'habit-bar-wrap';
            const h = daily[i] || (Math.random() * 80 + 20);
            wrap.innerHTML = `<div class="habit-bar"><div class="habit-bar-fill" style="height:${h}%"></div></div><span>${habitLabels[i] || ''}</span>`;
            container.appendChild(wrap);
        }
    });

    // Add click listeners for Habit log buttons
    const habitLogBtns = document.querySelectorAll('.habit-log-btn');
    habitLogBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            this.textContent = 'Logged ✓';
            this.style.background = 'rgba(89, 209, 149, 0.1)';
            this.style.color = '#59d195';
            this.style.borderColor = 'rgba(89, 209, 149, 0.3)';
            this.disabled = true;
        });
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
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 180);
        gradient.addColorStop(0, 'rgba(89, 209, 149, 0.4)');
        gradient.addColorStop(1, 'rgba(89, 209, 149, 0.0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan','Feb','Mar W1','Mar W2','Mar W3'],
                datasets: [{
                    label: 'Weight',
                    data: [82.0, 80.1, 77.5, 75.8, 74.0],
                    borderColor: '#59d195',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#59d195',
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false, min: 68, max: 85 }
                },
                layout: { padding: { left: 10, right: 10, top: 10, bottom: 10 } }
            }
        });
    }

    // Keypad Logic
    let currentInput = "74.0";
    const keypadDisplay = document.getElementById('wt-keypad-display');
    const displayVal = document.getElementById('wt-display-val');

    document.querySelectorAll('.wt-key').forEach(key => {
        key.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            if (btn.id === 'wt-key-clear') {
                if (currentInput === "74.0") currentInput = ""; // if it's the initial string, clear all
                else currentInput = currentInput.slice(0, -1);
            } else {
                const val = btn.textContent.trim();
                if (val === '.') {
                    if (!currentInput.includes('.')) currentInput += val;
                } else if (val) {
                    if (currentInput === "0" && val !== "0") currentInput = val;
                    else if (currentInput === "74.0") currentInput = val; // clear initial dummy val
                    else if (currentInput.length < 5) currentInput += val;
                }
            }
            if (keypadDisplay) keypadDisplay.textContent = currentInput || "0";
        });
    });

    const updateBtn = document.getElementById('wt-update-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            if (currentInput && displayVal) {
                displayVal.textContent = currentInput;
                // mock adding to chart/etc
                currentInput = "";
                if (keypadDisplay) keypadDisplay.textContent = "Logged!";
                setTimeout(() => {
                    if (keypadDisplay) keypadDisplay.textContent = displayVal.textContent;
                }, 2000);
            }
        });
    }

    // Progress to Goal Popover
    const optionsBtn = document.getElementById('wt-options-btn');
    const popover = document.getElementById('wt-popover');
    const saveBtn = document.getElementById('wt-save-btn');

    if (optionsBtn && popover) {
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            popover.style.display = popover.style.display === 'flex' ? 'none' : 'flex';
        });

        document.addEventListener('click', (e) => {
            if (popover.style.display === 'flex' && !popover.contains(e.target) && !optionsBtn.contains(e.target)) {
                popover.style.display = 'none';
            }
        });

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                popover.style.display = 'none';
            });
        }
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

/* ======== Advanced Goals Dashboard Interactions ======== */
function initGoalsAdvanced() {
    // 1. Add Goal dropdown
    const addGoalBtn = document.getElementById('adv-add-goal-btn');
    const addDropdown = document.getElementById('adv-add-dropdown');
    
    if (addGoalBtn && addDropdown) {
        addGoalBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addDropdown.style.display = addDropdown.style.display === 'none' ? 'flex' : 'none';
        });
        document.addEventListener('click', (e) => {
            if (!addGoalBtn.contains(e.target) && !addDropdown.contains(e.target)) {
                addDropdown.style.display = 'none';
            }
        });
    }

    // 2. Long Term Log Popup
    const ltLogBtns = document.querySelectorAll('.lt-log-btn');
    const logPopup = document.getElementById('goal-log-popup');
    const logSlider = document.getElementById('goal-slider');
    const logSliderVal = document.getElementById('goal-slider-val');
    const logConfirmBtn = document.getElementById('goal-slider-confirm');

    if (logPopup && logSlider && logSliderVal) {
        ltLogBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close edit dropdown if open
                const editDrop = document.getElementById('goal-edit-dropdown');
                if (editDrop) editDrop.style.display = 'none';
                
                const val = btn.getAttribute('data-val');
                logSliderVal.textContent = val;
                
                // Append popup to the button's parent
                const wrap = btn.parentElement;
                wrap.style.position = 'relative';
                wrap.appendChild(logPopup);
                logPopup.style.display = 'flex';
                logPopup.style.top = 'calc(100% + 8px)';
                logPopup.style.left = '50%';
                logPopup.style.transform = 'translateX(-50%)';
            });
        });

        // Hide when clicking outside
        document.addEventListener('click', (e) => {
            if (logPopup.style.display === 'flex' && !logPopup.contains(e.target) && !e.target.closest('.lt-log-btn')) {
                logPopup.style.display = 'none';
            }
        });

        // Slider input visually updates the text
        logSlider.addEventListener('input', (e) => {
            logSliderVal.textContent = e.target.value + (logSliderVal.textContent.includes('%') ? '%' : '');
        });

        if (logConfirmBtn) {
            logConfirmBtn.addEventListener('click', () => {
                logPopup.style.display = 'none';
            });
        }
    }

    // 3. Short Term Edit/Delete Dropdown
    const stOptionsBtns = document.querySelectorAll('.st-options-btn');
    const editDropdown = document.getElementById('goal-edit-dropdown');

    if (editDropdown) {
        stOptionsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close log popup if open
                if (logPopup) logPopup.style.display = 'none';

                const wrap = btn.closest('.st-menu-wrap');
                wrap.appendChild(editDropdown);
                editDropdown.style.display = 'flex';
                editDropdown.style.top = '100%';
                editDropdown.style.right = '0';
                editDropdown.style.left = 'auto';
            });
        });

        // Hide when clicking outside
        document.addEventListener('click', (e) => {
            if (editDropdown.style.display === 'flex' && !editDropdown.contains(e.target) && !e.target.closest('.st-options-btn')) {
                editDropdown.style.display = 'none';
            }
        });
    }

    // 4. Short Term Log Buttons
    const stLogBtns = document.querySelectorAll('.st-log-btn');
    stLogBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            this.textContent = 'Logged ✓';
            this.style.background = 'rgba(89, 209, 149, 0.1)';
            this.style.color = '#59d195';
            this.style.borderColor = 'rgba(89, 209, 149, 0.3)';
            this.disabled = true;
        });
    });
}

// Call on load
initGoalsAdvanced();

/* ======== Hydration Index ======== */
function initHydration() {
    let currentLiters = 2.0;
    const maxLiters = 3.5;
    const step = 0.5;
    const maxSlots = Math.ceil(maxLiters / step);
    
    const valDisplay = document.getElementById('hydro-val');
    const slotsContainer = document.getElementById('hydro-slots');
    const addBtn = document.getElementById('hydro-add-btn');
    
    if(!valDisplay || !slotsContainer || !addBtn) return;
    
    const updateUI = () => {
        valDisplay.innerHTML = `${currentLiters.toFixed(1)}<span class="hydro-unit">L</span>`;
        let slotsHtml = '';
        const filledSlots = Math.floor(currentLiters / step);
        for (let i = 0; i < maxSlots; i++) {
            if (i < filledSlots) {
                slotsHtml += `<div class="hydro-slot filled"><i class="ph ph-drop"></i></div>`;
            } else {
                slotsHtml += `<div class="hydro-slot empty"><i class="ph ph-drop"></i></div>`;
            }
        }
        slotsContainer.innerHTML = slotsHtml;
        
        if (currentLiters >= maxLiters) {
            addBtn.innerHTML = '<i class="ph-bold ph-check"></i> TARGET REACHED';
            addBtn.style.color = '#59d195';
        } else {
            addBtn.innerHTML = '+ ADD 500ML FLUID';
            addBtn.style.color = '#fff';
        }
    };
    
    updateUI();
    
    addBtn.addEventListener('click', () => {
        if (currentLiters + step <= maxLiters) {
            currentLiters += step;
            updateUI();
        }
    });
}
