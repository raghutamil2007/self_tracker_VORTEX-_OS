/* ============================================================
   WEIGHT TRACKER — Full Logic (CRUD, Charts, BMI, Projections)
   TITAN OS | localStorage-backed
   ============================================================ */

(function () {
    'use strict';

    /* ===== CONSTANTS ===== */
    const LS_ENTRIES = 'wt_entries';   // Array of weight logs
    const LS_SETTINGS = 'wt_settings';  // Settings object

    /* ===== STATE ===== */
    let entries = [];   // [{id, date, weight_kg, note}]
    let settings = {
        unit: 'kg',           // 'kg' | 'lbs'
        height_cm: 170,       // for BMI
        goal_weight_kg: null, // null = not set
        goal_date: '',        // YYYY-MM-DD
        start_weight_kg: null // anchor for "total lost"
    };
    let trendChart = null;
    let currentTab = '7D';
    let editingId = null;  // null = new entry

    /* ===== HELPERS ===== */
    const kgToLbs = kg => +(kg * 2.20462).toFixed(1);
    const lbsToKg = lbs => +(lbs / 2.20462).toFixed(2);
    const dispW = kg => settings.unit === 'kg' ? +kg.toFixed(1) : kgToLbs(kg);
    const unitLbl = () => settings.unit;

    function genId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    function saveEntries() { localStorage.setItem(LS_ENTRIES, JSON.stringify(entries)); }
    function saveSettings() { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); }

    function loadData() {
        try { entries = JSON.parse(localStorage.getItem(LS_ENTRIES)) || []; } catch { entries = []; }
        try { settings = { ...settings, ...JSON.parse(localStorage.getItem(LS_SETTINGS)) }; } catch { }
    }

    function sortedEntries() {
        return [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function shortDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }

    function todayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    function bmi(weight_kg, height_cm) {
        if (!height_cm) return null;
        const h = height_cm / 100;
        return +(weight_kg / (h * h)).toFixed(1);
    }

    function bmiCategory(bmiVal) {
        if (bmiVal === null) return { label: 'N/A', cls: '' };
        if (bmiVal < 18.5) return { label: 'Underweight', cls: 'underweight' };
        if (bmiVal < 25) return { label: 'Normal', cls: 'normal' };
        if (bmiVal < 30) return { label: 'Overweight', cls: 'overweight' };
        return { label: 'Obese', cls: 'obese' };
    }

    function bmiColor(bmiVal) {
        if (bmiVal === null) return '#8b8ba0';
        if (bmiVal < 18.5) return '#60a5fa';
        if (bmiVal < 25) return '#10b981';
        if (bmiVal < 30) return '#f59e0b';
        return '#ef4444';
    }

    /* Streak: consecutive days with an entry up to today */
    function calcStreak() {
        if (!entries.length) return 0;
        const dates = new Set(entries.map(e => e.date));
        let streak = 0;
        let d = new Date();
        while (true) {
            const s = d.toISOString().slice(0, 10);
            if (dates.has(s)) {
                streak++;
                d.setDate(d.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    /* Linear projection: days to reach goal from current trend */
    function calcProjectedDate(sorted) {
        if (!settings.goal_weight_kg || sorted.length < 2) return null;
        const n = sorted.length;
        const xs = sorted.map((_, i) => i);
        const ys = sorted.map(e => e.weight_kg);
        const xM = xs.reduce((a, b) => a + b, 0) / n;
        const yM = ys.reduce((a, b) => a + b, 0) / n;
        const num = xs.reduce((s, x, i) => s + (x - xM) * (ys[i] - yM), 0);
        const den = xs.reduce((s, x) => s + (x - xM) ** 2, 0);
        if (den === 0) return null;
        const slope = num / den;
        if (slope >= 0 && settings.goal_weight_kg < sorted[n - 1].weight_kg) return null; // gaining, can't reach lower goal
        if (slope <= 0 && settings.goal_weight_kg > sorted[n - 1].weight_kg) return null;
        // days from last entry to goal
        const stepsFromLast = (settings.goal_weight_kg - sorted[n - 1].weight_kg) / slope;
        const lastDate = new Date(sorted[n - 1].date + 'T00:00:00');
        lastDate.setDate(lastDate.getDate() + Math.round(stepsFromLast));
        return lastDate;
    }

    /* Average weekly change */
    function avgWeeklyChange(sorted) {
        if (sorted.length < 2) return null;
        const first = sorted[0], last = sorted[sorted.length - 1];
        const days = (new Date(last.date) - new Date(first.date)) / 86400000;
        if (days === 0) return null;
        const weeks = days / 7;
        return +((last.weight_kg - first.weight_kg) / weeks).toFixed(2);
    }

    /* ===== DOM REFS ===== */
    const $ = id => document.getElementById(id);
    const q = (sel, ctx = document) => ctx.querySelector(sel);

    /* ===== INIT ===== */
    function init() {
        loadData();
        bindEvents();
        renderAll();
    }

    /* ===== BIND EVENTS ===== */
    function bindEvents() {
        /* Unit toggle */
        document.querySelectorAll('.wt-unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                settings.unit = btn.dataset.unit;
                saveSettings();
                document.querySelectorAll('.wt-unit-btn').forEach(b => b.classList.toggle('active', b.dataset.unit === settings.unit));
                renderAll();
            });
        });

        /* LOG WEIGHT button */
        $('wt-log-btn')?.addEventListener('click', () => openLogModal());

        /* SETTINGS button */
        $('wt-settings-btn')?.addEventListener('click', openSettingsModal);

        /* Modal close and overlay clicks */
        $('wt-modal-close')?.addEventListener('click', closeLogModal);
        $('wt-modal-overlay')?.addEventListener('click', e => { if (e.target === $('wt-modal-overlay')) closeLogModal(); });
        $('wt-settings-close')?.addEventListener('click', closeSettingsModal);
        $('wt-settings-overlay')?.addEventListener('click', e => { if (e.target === $('wt-settings-overlay')) closeSettingsModal(); });

        /* Save entry */
        $('wt-save-entry')?.addEventListener('click', saveEntry);

        /* Save settings */
        $('wt-save-settings')?.addEventListener('click', saveSettingsForm);

        /* Trend tabs */
        document.querySelectorAll('.wt-time-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                currentTab = tab.dataset.tab;
                document.querySelectorAll('.wt-time-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === currentTab));
                renderChart();
            });
        });

        /* Enter key on log form */
        $('wt-entry-weight')?.addEventListener('keydown', e => { if (e.key === 'Enter') saveEntry(); });
    }

    /* ===== MODALS ===== */
    function openLogModal(entryId = null) {
        editingId = entryId;
        const overlay = $('wt-modal-overlay');
        const title = $('wt-modal-title');
        const saveBtn = $('wt-save-entry');

        if (entryId) {
            const entry = entries.find(e => e.id === entryId);
            if (!entry) return;
            title.textContent = 'EDIT ENTRY';
            saveBtn.textContent = 'SAVE CHANGES';
            $('wt-entry-date').value = entry.date;
            $('wt-entry-weight').value = dispW(entry.weight_kg);
            $('wt-entry-note').value = entry.note || '';
        } else {
            title.textContent = 'LOG WEIGHT';
            saveBtn.textContent = 'LOG WEIGHT';
            $('wt-entry-date').value = todayStr();
            $('wt-entry-weight').value = '';
            $('wt-entry-note').value = '';
        }

        overlay.style.display = 'flex';
        setTimeout(() => $('wt-entry-weight').focus(), 80);
    }

    function closeLogModal() {
        $('wt-modal-overlay').style.display = 'none';
        editingId = null;
    }

    function openSettingsModal() {
        $('wt-set-unit').value = settings.unit;
        $('wt-set-height').value = settings.height_cm || '';
        const goalDisp = settings.goal_weight_kg ? dispW(settings.goal_weight_kg) : '';
        $('wt-set-goal').value = goalDisp;
        $('wt-set-goal-date').value = settings.goal_date || '';
        const startDisp = settings.start_weight_kg ? dispW(settings.start_weight_kg) : '';
        $('wt-set-start').value = startDisp;
        $('wt-settings-overlay').style.display = 'flex';
    }

    function closeSettingsModal() {
        $('wt-settings-overlay').style.display = 'none';
    }

    /* ===== SAVE ENTRY ===== */
    function saveEntry() {
        const dateVal = $('wt-entry-date').value;
        const weightVal = parseFloat($('wt-entry-weight').value);
        const noteVal = $('wt-entry-note').value.trim();

        if (!dateVal || isNaN(weightVal) || weightVal <= 0) {
            showToast('Please enter a valid date and weight.', 'error');
            return;
        }

        const weight_kg = settings.unit === 'kg' ? weightVal : lbsToKg(weightVal);

        if (editingId) {
            const idx = entries.findIndex(e => e.id === editingId);
            if (idx > -1) {
                entries[idx] = { ...entries[idx], date: dateVal, weight_kg, note: noteVal };
            }
            showToast('Entry updated!', 'success');
        } else {
            entries.push({ id: genId(), date: dateVal, weight_kg, note: noteVal });
            showToast('Weight logged!', 'success');
        }

        saveEntries();
        closeLogModal();
        renderAll();
    }

    /* ===== SAVE SETTINGS ===== */
    function saveSettingsForm() {
        const unit = $('wt-set-unit').value;
        const heightVal = parseFloat($('wt-set-height').value);
        const goalVal = parseFloat($('wt-set-goal').value);
        const goalDate = $('wt-set-goal-date').value;
        const startVal = parseFloat($('wt-set-start').value);

        settings.unit = unit || settings.unit;
        settings.height_cm = isNaN(heightVal) ? settings.height_cm : heightVal;
        settings.goal_weight_kg = isNaN(goalVal) ? null : (unit === 'kg' ? goalVal : lbsToKg(goalVal));
        settings.goal_date = goalDate || '';
        settings.start_weight_kg = isNaN(startVal) ? null : (unit === 'kg' ? startVal : lbsToKg(startVal));

        document.querySelectorAll('.wt-unit-btn').forEach(b => b.classList.toggle('active', b.dataset.unit === settings.unit));

        saveSettings();
        closeSettingsModal();
        renderAll();
        showToast('Settings saved!', 'success');
    }

    /* ===== DELETE ENTRY ===== */
    function deleteEntry(id) {
        if (!confirm('Delete this entry?')) return;
        entries = entries.filter(e => e.id !== id);
        saveEntries();
        renderAll();
        showToast('Entry deleted.', 'success');
    }

    /* ===== RENDER ALL ===== */
    function renderAll() {
        const sorted = sortedEntries();
        renderTopStats(sorted);
        renderBmiGauge(sorted);
        renderGoalRing(sorted);
        renderChart();
        renderInsights(sorted);
        renderHistory(sorted);
        syncUnitButtons();
    }

    function syncUnitButtons() {
        document.querySelectorAll('.wt-unit-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.unit === settings.unit)
        );
    }

    /* ===== TOP STATS ===== */
    function renderTopStats(sorted) {
        const latest = sorted[sorted.length - 1] || null;
        const prev = sorted[sorted.length - 2] || null;
        const startW = settings.start_weight_kg || (sorted[0]?.weight_kg ?? null);

        // Current Weight
        const valEl = $('wt-current-val');
        const unitEl = $('wt-current-unit');
        const subEl = $('wt-current-sub');
        const deltaEl = $('wt-current-delta');

        if (latest) {
            valEl.textContent = dispW(latest.weight_kg);
            unitEl.textContent = unitLbl();
            subEl.textContent = formatDate(latest.date);

            if (prev) {
                const d = dispW(latest.weight_kg) - dispW(prev.weight_kg);
                const sign = d < 0 ? '↓' : d > 0 ? '↑' : '→';
                deltaEl.textContent = `${sign} ${Math.abs(d).toFixed(1)} ${unitLbl()} vs prev`;
                deltaEl.className = `wt-stat-delta ${d < 0 ? 'down' : d > 0 ? 'up' : 'neutral'}`;
                deltaEl.style.display = '';
            } else {
                deltaEl.style.display = 'none';
            }
        } else {
            valEl.textContent = '—';
            unitEl.textContent = unitLbl();
            subEl.textContent = 'No entries yet';
            deltaEl.style.display = 'none';
        }

        // Total change
        const totalEl = $('wt-total-val');
        const totalSub = $('wt-total-sub');
        if (latest && startW) {
            const delta = latest.weight_kg - startW;
            const sign = delta < 0 ? '↓' : '↑';
            totalEl.textContent = `${sign} ${Math.abs(dispW(latest.weight_kg) - dispW(startW)).toFixed(1)}`;
            totalEl.className = `wt-stat-value ${delta < 0 ? 'green' : 'red'}`;
            totalSub.textContent = `${unitLbl()} since start`;
        } else {
            totalEl.textContent = '—';
            totalSub.textContent = 'Set start weight in settings';
        }
    }

    /* ===== BMI GAUGE ===== */
    function renderBmiGauge(sorted) {
        const latest = sorted[sorted.length - 1];
        const bmiVal = latest ? bmi(latest.weight_kg, settings.height_cm) : null;
        const cat = bmiCategory(bmiVal);
        const color = bmiColor(bmiVal);

        $('wt-bmi-number').textContent = bmiVal !== null ? bmiVal : '—';
        const labelEl = $('wt-bmi-label');
        labelEl.textContent = cat.label;
        labelEl.className = `wt-gauge-label ${cat.cls}`;

        // Draw gauge SVG arc
        // Full arc = 180° semicircle. BMI range 15–40. Clamp and map.
        const svg = $('wt-gauge-svg');
        if (!svg) return;

        const MIN = 15, MAX = 40;
        const pct = bmiVal !== null ? Math.min(1, Math.max(0, (bmiVal - MIN) / (MAX - MIN))) : 0;
        const angle = pct * 180; // 0 = left, 180 = right

        // Arc path: center (70,75), radius 60, semicircle from left to right
        const cx = 70, cy = 75, r = 60;
        const toRad = deg => (deg - 180) * Math.PI / 180;
        const startX = cx + r * Math.cos(toRad(0));
        const startY = cy + r * Math.sin(toRad(0));   // left point
        const endX = cx + r * Math.cos(toRad(180));
        const endY = cy + r * Math.sin(toRad(180)); // right point
        const needleX = cx + r * Math.cos(toRad(angle));
        const needleY = cy + r * Math.sin(toRad(angle));

        // Color stops for gauge background: blue=underweight, green=normal, amber=overweight, red=obese
        // Draw 4 gradient segments as arcs
        const segColors = ['#60a5fa', '#10b981', '#f59e0b', '#ef4444'];
        const segBounds = [0, 0.14, 0.4, 0.6, 1]; // proportion of arc

        let gaugeArcs = '';
        for (let i = 0; i < 4; i++) {
            const a1 = segBounds[i] * 180;
            const a2 = segBounds[i + 1] * 180;
            const x1 = cx + r * Math.cos(toRad(a1));
            const y1 = cy + r * Math.sin(toRad(a1));
            const x2 = cx + r * Math.cos(toRad(a2));
            const y2 = cy + r * Math.sin(toRad(a2));
            gaugeArcs += `<path d="M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}" fill="none" stroke="${segColors[i]}" stroke-width="10" stroke-linecap="butt" opacity="0.5"/>`;
        }

        // Needle
        const needlePath = `<line x1="${cx}" y1="${cy}" x2="${needleX}" y2="${needleY}" stroke="${bmiVal !== null ? color : '#8b8ba0'}" stroke-width="3" stroke-linecap="round"/>`;
        const dot = `<circle cx="${cx}" cy="${cy}" r="5" fill="${bmiVal !== null ? color : '#8b8ba0'}"/>`;

        svg.innerHTML = gaugeArcs + needlePath + dot;
    }

    /* ===== GOAL RING ===== */
    function renderGoalRing(sorted) {
        const latest = sorted[sorted.length - 1];
        const goalCard = $('wt-goal-ring');
        const noGoal = $('wt-no-goal-msg');
        const ringWrap = $('wt-ring-wrap');

        if (!settings.goal_weight_kg || !latest) {
            if (goalCard) { goalCard.style.display = 'none'; }
            if (noGoal) { noGoal.style.display = 'block'; }
            return;
        }

        if (goalCard) { goalCard.style.display = 'flex'; }
        if (noGoal) { noGoal.style.display = 'none'; }

        const start = (settings.start_weight_kg || (sorted[0]?.weight_kg)) ?? latest.weight_kg;
        const total = Math.abs(start - settings.goal_weight_kg);
        const done = Math.abs(start - latest.weight_kg);
        const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

        const circumference = 2 * Math.PI * 47;
        const offset = circumference * (1 - pct / 100);
        const fill = $('wt-ring-fill');
        if (fill) {
            fill.style.strokeDasharray = circumference;
            fill.style.strokeDashoffset = offset;
        }

        $('wt-ring-pct').textContent = `${pct}%`;

        const toGo = Math.abs(dispW(latest.weight_kg) - dispW(settings.goal_weight_kg)).toFixed(1);
        $('wt-goal-to-go').textContent = `${toGo} ${unitLbl()} to go`;

        if (settings.goal_date) {
            $('wt-goal-deadline').textContent = `Target: ${formatDate(settings.goal_date)}`;
        } else {
            $('wt-goal-deadline').textContent = '';
        }

        // Projected date
        const projDate = calcProjectedDate(sorted);
        const projEl = $('wt-projected-date');
        if (projEl) {
            if (projDate) {
                projEl.textContent = `Projected: ${projDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            } else {
                projEl.textContent = sorted.length < 2 ? 'Log more to project' : 'Projection unavailable';
            }
        }
    }

    /* ===== TREND CHART ===== */
    function renderChart() {
        const sorted = sortedEntries();
        let data = sorted;

        if (currentTab === '7D') {
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
            data = sorted.filter(e => new Date(e.date + 'T00:00:00') >= cutoff);
        } else if (currentTab === '30D') {
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
            data = sorted.filter(e => new Date(e.date + 'T00:00:00') >= cutoff);
        }

        const labels = data.map(e => shortDate(e.date));
        const weights = data.map(e => dispW(e.weight_kg));

        const canvas = $('wt-trend-chart');
        if (!canvas) return;

        if (trendChart) { trendChart.destroy(); trendChart = null; }

        if (data.length === 0) {
            canvas.style.display = 'none';
            $('wt-chart-empty')?.style && ($('wt-chart-empty').style.display = 'flex');
            return;
        }

        canvas.style.display = '';
        if ($('wt-chart-empty')) $('wt-chart-empty').style.display = 'none';

        const ctx = canvas.getContext('2d');

        // Gradient fill
        const grad = ctx.createLinearGradient(0, 0, 0, 240);
        grad.addColorStop(0, 'rgba(59,130,246,0.35)');
        grad.addColorStop(1, 'rgba(59,130,246,0.01)');

        // Goal line dataset
        const datasets = [
            {
                label: `Weight (${unitLbl()})`,
                data: weights,
                borderColor: '#3b82f6',
                backgroundColor: grad,
                borderWidth: 2.5,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#1a1a2e',
                pointBorderWidth: 2,
                pointRadius: data.length <= 14 ? 5 : 3,
                tension: 0.35,
                fill: true
            }
        ];

        // Add goal line if set
        if (settings.goal_weight_kg) {
            const goalDisp = dispW(settings.goal_weight_kg);
            datasets.push({
                label: `Goal (${unitLbl()})`,
                data: labels.map(() => goalDisp),
                borderColor: '#10b981',
                borderWidth: 1.5,
                borderDash: [6, 4],
                pointRadius: 0,
                fill: false,
                tension: 0
            });
        }

        trendChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#8b8ba0',
                            font: { family: 'Inter', size: 11 },
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: '#16213e',
                        borderColor: 'rgba(59,130,246,0.3)',
                        borderWidth: 1,
                        titleColor: '#8b8ba0',
                        bodyColor: '#fff',
                        bodyFont: { family: 'Inter', size: 13, weight: '700' },
                        callbacks: {
                            label: ctx => ` ${ctx.parsed.y} ${unitLbl()}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#8b8ba0', font: { family: 'Inter', size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    },
                    y: {
                        ticks: {
                            color: '#8b8ba0', font: { family: 'Inter', size: 10 },
                            callback: v => `${v} ${unitLbl()}`
                        },
                        grid: { color: 'rgba(255,255,255,0.06)' }
                    }
                },
                interaction: { mode: 'index', intersect: false }
            }
        });
    }

    /* ===== INSIGHTS ===== */
    function renderInsights(sorted) {
        // Avg weekly change
        const avgEl = $('wt-insight-avg');
        const avgSub = $('wt-insight-avg-sub');
        const awc = avgWeeklyChange(sorted);
        if (awc !== null) {
            const sign = awc < 0 ? '↓' : '↑';
            avgEl.textContent = `${sign} ${Math.abs(dispW(awc) - 0).toFixed(1)}`;  // convert rate
            // actual rate in display unit
            const rateDisp = settings.unit === 'kg' ? Math.abs(awc).toFixed(2) : Math.abs(kgToLbs(awc)).toFixed(2);
            avgEl.textContent = `${sign} ${rateDisp}`;
            avgSub.textContent = `${unitLbl()}/week`;
            avgEl.style.color = awc < 0 ? '#10b981' : (awc > 0 ? '#ef4444' : '#fff');
        } else {
            avgEl.textContent = '—';
            avgSub.textContent = 'Log more entries';
            avgEl.style.color = '';
        }

        // Streak
        const strkEl = $('wt-insight-streak');
        const strkSub = $('wt-insight-streak-sub');
        const streak = calcStreak();
        strkEl.textContent = streak;
        strkSub.textContent = streak === 1 ? 'day logged' : 'days in a row';

        // Lowest (best)
        const lowEl = $('wt-insight-low');
        const lowSub = $('wt-insight-low-sub');
        if (sorted.length) {
            const best = sorted.reduce((a, b) => a.weight_kg < b.weight_kg ? a : b);
            lowEl.textContent = `${dispW(best.weight_kg)} <small>${unitLbl()}</small>`;
            lowEl.innerHTML = `${dispW(best.weight_kg)} <small>${unitLbl()}</small>`;
            lowSub.textContent = formatDate(best.date);
        } else {
            lowEl.textContent = '—';
            lowSub.textContent = 'No entries';
        }

        // Highest
        const hiEl = $('wt-insight-hi');
        const hiSub = $('wt-insight-hi-sub');
        if (sorted.length) {
            const hi = sorted.reduce((a, b) => a.weight_kg > b.weight_kg ? a : b);
            hiEl.innerHTML = `${dispW(hi.weight_kg)} <small>${unitLbl()}</small>`;
            hiSub.textContent = formatDate(hi.date);
        } else {
            hiEl.textContent = '—';
            hiSub.textContent = 'No entries';
        }
    }

    /* ===== HISTORY LOG ===== */
    function renderHistory(sorted) {
        const list = $('wt-history-list');
        const countEl = $('wt-history-count');
        if (!list) return;

        const reversed = [...sorted].reverse(); // newest first
        $('wt-history-count').textContent = `${reversed.length} entries`;

        if (reversed.length === 0) {
            list.innerHTML = `
        <div class="wt-empty-state">
          <i class="ph ph-scales"></i>
          <p>No entries yet.<br>Tap <strong>+ LOG WEIGHT</strong> to begin.</p>
        </div>`;
            return;
        }

        const lowestKg = Math.min(...sorted.map(e => e.weight_kg));

        list.innerHTML = reversed.map((entry, idx) => {
            const prevEntry = reversed[idx + 1]; // previous in original (one older)
            let deltaHtml = '';
            if (prevEntry) {
                const d = dispW(entry.weight_kg) - dispW(prevEntry.weight_kg);
                const sign = d < 0 ? '↓' : d > 0 ? '↑' : '→';
                const cls = d < 0 ? 'down' : d > 0 ? 'up' : 'neutral';
                deltaHtml = `<span class="wt-history-delta ${cls}">${sign} ${Math.abs(d).toFixed(1)}</span>`;
            } else {
                deltaHtml = `<span class="wt-history-delta neutral">—</span>`;
            }

            const isRecord = entry.weight_kg === lowestKg && sorted.length > 1;
            const recordBadge = isRecord ? `<span class="wt-record-badge">💎 RECORD</span>` : '';

            return `
        <div class="wt-history-item ${isRecord ? 'record-entry' : ''}" data-id="${entry.id}">
          <span class="wt-history-date">${shortDate(entry.date)}</span>
          <span class="wt-history-weight">${dispW(entry.weight_kg)} ${unitLbl()}</span>
          ${deltaHtml}
          <span class="wt-history-note">${entry.note ? '🗒 ' + entry.note : ''}</span>
          ${recordBadge}
          <div class="wt-history-actions">
            <button class="wt-icon-btn edit" data-id="${entry.id}" title="Edit">
              <i class="ph ph-pencil-simple"></i>
            </button>
            <button class="wt-icon-btn delete" data-id="${entry.id}" title="Delete">
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </div>`;
        }).join('');

        // Bind edit / delete
        list.querySelectorAll('.wt-icon-btn.edit').forEach(btn =>
            btn.addEventListener('click', () => openLogModal(btn.dataset.id))
        );
        list.querySelectorAll('.wt-icon-btn.delete').forEach(btn =>
            btn.addEventListener('click', () => deleteEntry(btn.dataset.id))
        );
    }

    /* ===== TOAST ===== */
    function showToast(msg, type = 'success') {
        const existing = document.querySelector('.wt-toast');
        if (existing) existing.remove();
        const icon = type === 'success' ? 'ph-check-circle' : 'ph-warning-circle';
        const t = document.createElement('div');
        t.className = `wt-toast ${type}`;
        t.innerHTML = `<i class="ph ${icon}"></i> ${msg}`;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 2600);
    }

    /* ===== STARTUP ===== */
    // Wait for the view to be shown / DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-render when the weight view is activated via TITAN OS nav
    document.addEventListener('click', function (e) {
        const navItem = e.target.closest('[data-view="weight"]');
        if (navItem) {
            setTimeout(renderAll, 50);
        }
    });

})();
