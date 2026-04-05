/* ======================================================
   TITAN OS — PAGES.JS
   All new pages: Money, General, Command, Habits,
   Journal, Goals, Focus Timer (standalone), Workouts,
   Sleep, Weight, Nutrition, Settings
   ====================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ---- GLOBAL DAILY AUTO-UPDATER ---- //
    // If the date rolls over while the dashboard is open, it automatically forces a silent reload to rebuild calendars and scores!
    const initDate = new Date().toDateString();
    setInterval(() => {
        if (new Date().toDateString() !== initDate) {
            window.location.reload();
        }
    }, 60000); // Check every 60 seconds

    // ---- GLOBAL DASHBOARD DATE SETTER ---- //
    // Updates sidebar and global dashboard clocks not caught by engine modules
    const dGlobal = new Date();
    const navDate = document.getElementById('nav-date-display');
    if (navDate) {
        const mn = dGlobal.toLocaleString('default', { month: 'short' });
        navDate.innerText = `${String(dGlobal.getDate()).padStart(2, '0')} ${mn} ${dGlobal.getFullYear()}`;
    }
    
    // Some widgets use .day-num / .day-month within class "date-widget"
    document.querySelectorAll('.date-widget, .calendar-widget').forEach(widget => {
        const dNum = widget.querySelector('.day-num');
        const dMonth = widget.querySelector('.day-month');
        const dYear = widget.querySelector('.day-year');
        if (dNum) dNum.innerText = String(dGlobal.getDate()).padStart(2, '0');
        if (dMonth) dMonth.innerText = dGlobal.toLocaleString('default', { month: 'short' }).toUpperCase();
        if (dYear) dYear.innerText = dGlobal.getFullYear();
    });

    initEngineModule('mind',    [3,3,3,2,1,2,3,3,3,2,2,3,2,1,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    initEngineModule('body',    [1,1,2,2,3,3,2,1,3,2,1,3,1,2,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    initEngineModule('money',   [1,2,2,0,0,3,2,3,3,2,1,3,2,3,1,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    initEngineModule('general', [0,1,0,0,0,2,2,1,3,2,0,1,2,1,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    initCommandCenter();
    initHabits();
    initJournal();
    initEngineSubTabs('view-mind-engine');
    initEngineSubTabs('view-body-engine');
    initEngineSubTabs('view-money-engine');
    initEngineTasks('mind');
    initEngineTasks('body');
    initEngineTasks('money');
    initEngineTasks('general');
    initSleepTracker();
    initWeightChart();
    initStandaloneFocusTimer();
    
    // Initialize new premium modules
    if (window.GoalsEngine) GoalsEngine.init();
    if (window.NutritionEngine) NutritionEngine.init();
});

/* ======== Global Helpers ======== */
function getScoreClass(pct) {
    if (pct < 50) return 'missed';
    if (pct <= 90) return 'hit';
    return 'perfect';
}

/* ======== Generic Calendar+Consistency for Money / General ======== */
function initEngineModule(engine, calData) {
    let d = new Date();
    let year = d.getFullYear(), month = d.getMonth() + 1;
    const TODAY = d.getDate();

    // Reset tasks logic for a new day
    const lastLogged = localStorage.getItem(`${engine}-last-date`);
    const todayStr = d.toDateString();
    if (lastLogged && lastLogged !== todayStr) {
        localStorage.removeItem(`${engine}-tasks-list`); // Clear saved tasks for new day
        setTimeout(() => { // Ensure DOM has processed default HTML values
            document.querySelectorAll(`#${engine}-main-tasks input, #${engine}-secondary-tasks input`).forEach(cb => {
                cb.checked = false;
            });
            const firstTask = document.querySelector(`#${engine}-main-tasks input`);
            if (firstTask) firstTask.dispatchEvent(new Event('change'));
        }, 100);
    }
    localStorage.setItem(`${engine}-last-date`, todayStr);

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
                cell.id = `${engine}-cal-day-today`;
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

    // Dynamic Header Dates
    const dtStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
    const isoDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dateDisplay = document.getElementById(`${engine}-date-display`);
    if (dateDisplay) dateDisplay.innerText = isoDate;
    const selectedDate = document.getElementById(`${engine}-selected-date`);
    if (selectedDate) selectedDate.innerText = dtStr;
    const mainTaskDate = document.getElementById(`${engine}-main-task-date`);
    if (mainTaskDate) mainTaskDate.innerText = isoDate;
    const secTaskDate = document.getElementById(`${engine}-sec-task-date`);
    if (secTaskDate) secTaskDate.innerText = isoDate;

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

        // Live update calendar color
        const todayCell = document.getElementById(`${engine}-cal-day-today`);
        if (todayCell) {
            todayCell.classList.remove('missed', 'hit', 'perfect');
            todayCell.classList.add(getScoreClass(pct));
        }

        // Save progress to localStorage
        saveTasks(engine);
    };

    const saveTasks = (engine) => {
        const tasks = [];
        document.querySelectorAll(`#${engine}-main-tasks .task-item, #${engine}-secondary-tasks .task-item`).forEach(item => {
            tasks.push({
                text: item.querySelector('.task-text').innerText,
                tag: item.querySelector('.task-tag').innerText,
                checked: item.querySelector('input').checked,
                isMain: item.closest(`#${engine}-main-tasks`) !== null
            });
        });
        localStorage.setItem(`${engine}-tasks-list`, JSON.stringify(tasks));
    };

    const loadTasks = (engine) => {
        const saved = localStorage.getItem(`${engine}-tasks-list`);
        if (!saved) return;
        const tasks = JSON.parse(saved);
        const mainList = document.getElementById(`${engine}-main-tasks`);
        const secList = document.getElementById(`${engine}-secondary-tasks`);
        if (!mainList || !secList) return;

        mainList.innerHTML = '';
        secList.innerHTML = '';

        tasks.forEach(t => {
            const label = document.createElement('label');
            label.className = 'task-item';
            label.innerHTML = `<input type="checkbox" ${t.checked ? 'checked' : ''}><span class="task-text">${t.text}</span><span class="task-tag">${t.tag}</span><div class="task-indiv-complete-btn">COMPLETE</div>`;
            label.querySelector('input').addEventListener('change', recalc);
            if (t.isMain) mainList.appendChild(label);
            else secList.appendChild(label);
        });
    };

    document.querySelectorAll(`#${engine}-main-tasks .task-item, #${engine}-secondary-tasks .task-item`).forEach(item => {
        if (!item.querySelector('.task-indiv-complete-btn')) {
            const btn = document.createElement('div');
            btn.className = 'task-indiv-complete-btn';
            btn.innerText = 'COMPLETE';
            item.appendChild(btn);
        }
    });

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
                label.innerHTML = `<input type="checkbox"><span class="task-text">${name}</span><span class="task-tag">${tag}</span><div class="task-indiv-complete-btn">COMPLETE</div>`;
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

    // Load saved tasks before initial recalc
    loadTasks(engine);

    // Set initial state
    recalc();
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
        
        // Command interpretation
        const cmd = name.toLowerCase();
        let feedback = name;

        if (cmd.includes('drink water') || cmd === 'water' || cmd === 'hydrate') {
            if (window.NutritionEngine) {
                window.NutritionEngine.addHydration();
                feedback = "Logged 500ml hydration via command.";
            }
        } else if (cmd.startsWith('eat ') || cmd.startsWith('log meal ')) {
             // simplified meal logging via cmd: e.g. "eat Pizza 500"
             const parts = name.split(' ');
             if (parts.length >= 3) {
                 const calories = parseInt(parts[parts.length - 1], 10);
                 const mealName = parts.slice(1, parts.length - 1).join(' ');
                 if (!isNaN(calories) && window.NutritionEngine) {
                     window.NutritionEngine.data.meals.push({
                         time: new Date().toTimeString().slice(0,5),
                         name: mealName,
                         cals: calories
                     });
                     window.NutritionEngine.saveData();
                     window.NutritionEngine.render();
                     feedback = `Logged meal: ${mealName} (${calories} kcal)`;
                 }
             }
        }

        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 5);
        const item = document.createElement('div');
        item.className = 'cmd-log-item';
        item.innerHTML = `<span class="cmd-log-time">${timeStr}</span>
                          <span class="cmd-log-engine ${engine}-tag">${engine.toUpperCase()}</span>
                          <span class="cmd-log-text">${feedback}</span>`;
        log.insertBefore(item, log.firstChild);
        input.value = '';
    };

    btn.addEventListener('click', doLog);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doLog(); });
}

/* ======== Habits — Build Mini Dot History ======== */
function initHabits() {
    const STORAGE_KEY = 'titan-habits-v2';
    const grid = document.getElementById('habits-grid');
    const overallBars = document.getElementById('overall-weekly-bars');
    const overallPctVal = document.getElementById('overall-habit-pct');
    const overallCircle = document.getElementById('overall-habit-circles-progress');
    const overallFraction = document.getElementById('overall-habit-fraction');

    // Modal elements
    const modal = document.getElementById('habit-modal-overlay');
    const modalTitle = document.getElementById('habit-modal-title');
    const modalClose = document.getElementById('habit-modal-close');
    const modalIdInput = document.getElementById('habit-edit-id');
    const modalNameInput = document.getElementById('habit-name-input');
    const modalIconInput = document.getElementById('habit-icon-input');
    const modalSaveBtn = document.getElementById('habit-save-btn');
    const modalDeleteBtn = document.getElementById('habit-delete-btn');
    const addHabitBtn = document.getElementById('add-habit-btn');

    if (!grid) return;

    // --- Data Management ---
    const getHabits = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        
        // Initial defaults if empty
        const defaults = [
            { id: 'h1', name: 'Gym', icon: 'ph-barbell', logs: {} },
            { id: 'h2', name: 'No reels', icon: 'ph-phone-slash', logs: {} },
            { id: 'h3', name: 'Daily Journal', icon: 'ph-notebook', logs: {} },
            { id: 'h4', name: 'Read 30 min', icon: 'ph-book-open', logs: {} },
            { id: 'h5', name: 'Meditation', icon: '🧘', logs: {} }
        ];
        saveHabits(defaults);
        return defaults;
    };

    const saveHabits = (habits) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    };

    // --- Helpers ---
    const getTodayStr = () => new Date().toDateString();
    
    const calculateStreak = (habit) => {
        let streak = 0;
        let d = new Date();
        // Today check
        if (habit.logs[d.toDateString()]) {
            streak++;
        } else {
            // Check yesterday to keep streak alive if not logged today yet
            d.setDate(d.getDate() - 1);
            if (!habit.logs[d.toDateString()]) return 0;
            streak++;
        }
        
        // Count backwards
        while (true) {
            d.setDate(d.getDate() - 1);
            if (habit.logs[d.toDateString()]) streak++;
            else break;
            if (streak > 365) break; // sanity cap
        }
        return streak;
    };

    const calculateMonthlyPct = (habit) => {
        const today = new Date();
        let completions = 0;
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            if (habit.logs[d.toDateString()]) completions++;
        }
        return Math.round((completions / 30) * 100);
    };

    // --- Rendering ---
    const renderHabits = () => {
        const habits = getHabits();
        grid.innerHTML = '';
        const todayStr = getTodayStr();

        habits.forEach(habit => {
            const streak = calculateStreak(habit);
            const monthlyPct = calculateMonthlyPct(habit);
            const isDoneToday = habit.logs[todayStr];
            
            const card = document.createElement('div');
            card.className = `habit-card ${isDoneToday ? 'habit-done' : ''}`;
            card.style.setProperty('--pct', `${monthlyPct}%`);
            
            // Icon rendering (Emoji vs ph-icon)
            const iconHtml = habit.icon.startsWith('ph-') 
                ? `<i class="ph ${habit.icon} habit-icon"></i>` 
                : `<span class="habit-icon" style="font-size: 18px; line-height: 1;">${habit.icon}</span>`;

            card.innerHTML = `
                <div class="habit-header">
                    <div class="habit-title-col">
                        <h3 class="habit-name">${habit.name}</h3>
                        <span class="habit-streak ${streak === 0 ? 'missed' : ''}">${streak === 0 ? '× 0' : streak} Day Streak</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        ${iconHtml}
                        <button class="habit-edit-btn" data-id="${habit.id}"><i class="ph ph-pencil-simple"></i></button>
                    </div>
                </div>
                <div class="habit-body">
                    <div class="habit-chart" id="chart-${habit.id}"></div>
                    <div class="habit-monthly">
                        <div class="habit-circular-progress">
                            <div class="habit-pct-text">
                                <span class="habit-pct-val">${monthlyPct}%</span>
                                <span class="habit-pct-lbl">Monthly</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="habit-log-btn" ${isDoneToday ? 'disabled' : ''}>
                    ${isDoneToday ? 'Logged ✓' : 'Log Today'}
                </button>
            `;

            // mini daily bars (last 7 days)
            const chartCont = card.querySelector(`#chart-${habit.id}`);
            const daysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                const dayLabelIndex = d.getDay();
                d.setDate(d.getDate() - i);
                const dayLabel = daysShort[d.getDay()];
                const done = habit.logs[d.toDateString()];
                const wrap = document.createElement('div');
                wrap.className = 'habit-bar-wrap';
                wrap.innerHTML = `<div class="habit-bar"><div class="habit-bar-fill ${done ? '' : 'empty'}" style="height:${done ? '100%' : '10%'}"></div></div><span>${dayLabel}</span>`;
                chartCont.appendChild(wrap);
            }

            // Log button listener
            card.querySelector('.habit-log-btn').addEventListener('click', () => logHabit(habit.id));
            
            // Edit button listener
            card.querySelector('.habit-edit-btn').addEventListener('click', () => openHabitModal(habit));

            grid.appendChild(card);
        });
        
        renderWeeklyProgress();
    };

    const renderWeeklyProgress = () => {
        const habits = getHabits();
        if (habits.length === 0) {
            overallBars.innerHTML = '';
            overallPctVal.innerText = '0%';
            overallCircle.style.setProperty('--pct', '0%');
            overallFraction.innerText = '0/0';
            return;
        }

        const today = new Date();
        const currentDayIndex = today.getDay(); // 0-6
        const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        
        overallBars.innerHTML = '';
        let totalWeekCompletions = 0;
        let todayCompletions = 0;

        // Calculate and build bars for each day of the week
        labels.forEach((label, i) => {
            const d = new Date();
            const diff = i - currentDayIndex;
            d.setDate(today.getDate() + diff);
            const dateStr = d.toDateString();

            const completed = habits.filter(h => h.logs[dateStr]).length;
            const pct = Math.round((completed / habits.length) * 100);
            
            if (i === currentDayIndex) todayCompletions = completed;
            totalWeekCompletions += completed;

            const wrap = document.createElement('div');
            wrap.className = 'overall-bar-wrapper';
            wrap.innerHTML = `<div class="overall-bar"><div class="overall-bar-fill" style="height:${pct}%"></div></div><span>${label}</span>`;
            overallBars.appendChild(wrap);
        });

        const todayPct = Math.round((todayCompletions / habits.length) * 100);
        overallPctVal.innerText = `${todayPct}%`;
        overallCircle.style.setProperty('--pct', `${todayPct}%`);
        overallFraction.innerText = `${todayCompletions}/${habits.length}`;
    };

    const logHabit = (id) => {
        const habits = getHabits();
        const habit = habits.find(h => h.id === id);
        if (habit) {
            habit.logs[getTodayStr()] = true;
            saveHabits(habits);
            renderHabits();
        }
    };

    // --- Modal Logic ---
    const openHabitModal = (habit = null) => {
        if (habit) {
            modalTitle.innerText = 'EDIT HABIT';
            modalIdInput.value = habit.id;
            modalNameInput.value = habit.name;
            modalIconInput.value = habit.icon;
            modalDeleteBtn.style.display = 'block';
        } else {
            modalTitle.innerText = 'CREATE HABIT';
            modalIdInput.value = '';
            modalNameInput.value = '';
            modalIconInput.value = 'ph-barbell';
            modalDeleteBtn.style.display = 'none';
        }
        modal.style.display = 'flex';
        modalNameInput.focus();
    };

    const closeHabitModal = () => {
        modal.style.display = 'none';
    };

    modalSaveBtn.addEventListener('click', () => {
        const name = modalNameInput.value.trim();
        const icon = modalIconInput.value.trim() || 'ph-star';
        const id = modalIdInput.value;
        if (!name) return;

        const habits = getHabits();
        if (id) {
            const index = habits.findIndex(h => h.id === id);
            if (index !== -1) {
                habits[index].name = name;
                habits[index].icon = icon;
            }
        } else {
            habits.push({
                id: 'h' + Date.now(),
                name,
                icon,
                logs: {}
            });
        }
        saveHabits(habits);
        renderHabits();
        closeHabitModal();
    });

    modalDeleteBtn.addEventListener('click', () => {
        if (!confirm('Are you sure you want to delete this habit? All history will be lost.')) return;
        const id = modalIdInput.value;
        const habits = getHabits().filter(h => h.id !== id);
        saveHabits(habits);
        renderHabits();
        closeHabitModal();
    });

    if (addHabitBtn) addHabitBtn.addEventListener('click', () => openHabitModal());
    if (modalClose) modalClose.addEventListener('click', closeHabitModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeHabitModal(); });

    // Initial Render
    renderHabits();
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
        saveJournal();
    });

    const saveJournal = () => {
        const entries = [];
        document.querySelectorAll('.journal-entry-card').forEach(card => {
            entries.push({
                date: card.querySelector('.journal-entry-date').innerText,
                text: card.querySelector('.journal-entry-preview').innerText
            });
        });
        localStorage.setItem('journal-entries', JSON.stringify(entries));
    };

    const loadJournal = () => {
        const saved = localStorage.getItem('journal-entries');
        if (!saved) return;
        const entries = JSON.parse(saved);
        entries.forEach(e => {
            const card = document.createElement('div');
            card.className = 'card journal-entry-card';
            card.innerHTML = `<div class="journal-entry-date">${e.date}</div>
                              <p class="journal-entry-preview">${e.text}</p>`;
            list.appendChild(card); // oldest first or just rebuild list
        });
    };

    loadJournal();
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
    
    let weightHistory = [82.0, 80.1, 77.5, 75.8, 74.0];
    const saved = localStorage.getItem('weight-history');
    if (saved) weightHistory = JSON.parse(saved);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(89, 209, 149, 0.4)');
    gradient.addColorStop(1, 'rgba(89, 209, 149, 0.0)');

    let chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan','Feb','Mar W1','Mar W2','Mar W3', 'Today'].slice(-weightHistory.length),
            datasets: [{
                label: 'Weight',
                data: weightHistory,
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
                y: { display: false, min: Math.min(...weightHistory) - 5, max: Math.max(...weightHistory) + 5 }
            },
            layout: { padding: { left: 10, right: 10, top: 10, bottom: 10 } }
        }
    });

    // Keypad Logic
    let currentInput = weightHistory[weightHistory.length - 1].toFixed(1);
    const keypadDisplay = document.getElementById('wt-keypad-display');
    const displayVal = document.getElementById('wt-display-val');
    if (displayVal) displayVal.textContent = currentInput;

    document.querySelectorAll('.wt-key').forEach(key => {
        key.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            if (btn.id === 'wt-key-clear') {
                currentInput = currentInput.slice(0, -1);
            } else {
                const val = btn.textContent.trim();
                if (val === '.') {
                    if (!currentInput.includes('.')) currentInput += val;
                } else if (val) {
                    if (currentInput === "0" && val !== "0") currentInput = val;
                    else if (currentInput.length < 5) currentInput += val;
                }
            }
            if (keypadDisplay) keypadDisplay.textContent = currentInput || "0";
        });
    });

    const updateBtn = document.getElementById('wt-update-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            const newVal = parseFloat(currentInput);
            if (!isNaN(newVal) && displayVal) {
                displayVal.textContent = newVal.toFixed(1);
                weightHistory.push(newVal);
                if (weightHistory.length > 10) weightHistory.shift();
                localStorage.setItem('weight-history', JSON.stringify(weightHistory));
                
                chart.data.datasets[0].data = weightHistory;
                chart.data.labels = weightHistory.map((_, i) => i);
                chart.update();

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

    // 4. Persistence & Daily Reset
    const lastDate = localStorage.getItem('goals-last-date');
    const today = new Date().toDateString();
    if (lastDate && lastDate !== today) {
        localStorage.removeItem('goals-logged-list');
    }
    localStorage.setItem('goals-last-date', today);

    const saveGoalLogs = () => {
        const logged = [];
        document.querySelectorAll('.st-log-btn').forEach((btn, idx) => {
            if (btn.disabled) logged.push(idx);
        });
        localStorage.setItem('goals-logged-list', JSON.stringify(logged));
    };

    const loadGoalLogs = () => {
        const saved = localStorage.getItem('goals-logged-list');
        if (!saved) return;
        const logged = JSON.parse(saved);
        const btns = document.querySelectorAll('.st-log-btn');
        logged.forEach(idx => {
            if (btns[idx]) {
                const btn = btns[idx];
                btn.textContent = 'Logged ✓';
                btn.style.background = 'rgba(89, 209, 149, 0.1)';
                btn.style.color = '#59d195';
                btn.style.borderColor = 'rgba(89, 209, 149, 0.3)';
                btn.disabled = true;
            }
        });
    };

    // 5. Short Term Log Buttons
    const stLogBtns = document.querySelectorAll('.st-log-btn');
    stLogBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            this.textContent = 'Logged ✓';
            this.style.background = 'rgba(89, 209, 149, 0.1)';
            this.style.color = '#59d195';
            this.style.borderColor = 'rgba(89, 209, 149, 0.3)';
            this.disabled = true;
            saveGoalLogs();
        });
    });

    loadGoalLogs();
}

