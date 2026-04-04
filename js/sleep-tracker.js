/* ======================================================
   TITAN OS — SLEEP TRACKER MODULE
   Full CRUD, chart, heatmap, insights, bedtime recommender
   ====================================================== */

function initSleepTracker() {
    // ---- DATA ----
    const STORAGE_KEY = 'titan_sleep_entries';
    const GOAL_KEY = 'titan_sleep_goal';
    let goalHours = parseFloat(localStorage.getItem(GOAL_KEY) || '8');

    // Seed data if empty
    const seedEntries = [
        { date: '2026-03-28', bed: '23:10', wake: '06:50', quality: 3, notes: '' },
        { date: '2026-03-29', bed: '22:30', wake: '05:45', quality: 2, notes: 'caffeine late' },
        { date: '2026-03-30', bed: '22:00', wake: '06:30', quality: 4, notes: '' },
        { date: '2026-03-31', bed: '23:45', wake: '06:00', quality: 2, notes: 'stressed' },
        { date: '2026-04-01', bed: '22:15', wake: '07:00', quality: 4, notes: '' },
        { date: '2026-04-02', bed: '23:30', wake: '07:30', quality: 3, notes: '' },
        { date: '2026-04-03', bed: '22:48', wake: '06:30', quality: 3, notes: '' },
    ];

    function getEntries() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
        return seedEntries;
    }
    function saveEntries(entries) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }

    // ---- HELPERS ----
    const qualityMap = { 1: { label: 'POOR', emoji: '😴', cls: 'sl-quality-poor' }, 2: { label: 'FAIR', emoji: '😐', cls: 'sl-quality-fair' }, 3: { label: 'GOOD', emoji: '😊', cls: 'sl-quality-good' }, 4: { label: 'GREAT', emoji: '🌟', cls: 'sl-quality-good' } };

    function calcDuration(bed, wake) {
        const [bh, bm] = bed.split(':').map(Number);
        const [wh, wm] = wake.split(':').map(Number);
        let mins = (wh * 60 + wm) - (bh * 60 + bm);
        if (mins < 0) mins += 24 * 60;
        return mins;
    }
    function fmtDuration(mins) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    }
    function fmtDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    function pct(mins) { return Math.min(100, Math.round((mins / (goalHours * 60)) * 100)); }

    // Optimal bedtime: 5 sleep cycles of 90min = 7.5h before wake, rounded to :00/:30
    function calcOptimalBedtime(wakeStr) {
        const [wh, wm] = wakeStr.split(':').map(Number);
        let totalMins = wh * 60 + wm - Math.round(goalHours * 60);
        if (totalMins < 0) totalMins += 24 * 60;
        const oh = Math.floor(totalMins / 60) % 24;
        const om = totalMins % 60;
        return `${oh.toString().padStart(2, '0')}:${om.toString().padStart(2, '0')}`;
    }

    // ---- DOM ELEMENTS ----
    let sleepChart = null;
    const $ = id => document.getElementById(id);

    // ---- RENDER ALL UI ----
    function render() {
        const entries = getEntries();
        const recent7 = entries.slice(-7);
        const last = recent7[recent7.length - 1];

        renderLastNight(last);
        renderInsights(recent7);
        renderRing(last);
        renderEntryList(entries);
        renderChart(recent7);
        renderHeatmap(entries);
    }

    function renderLastNight(e) {
        if (!e) return;
        const mins = calcDuration(e.bed, e.wake);
        const q = qualityMap[e.quality] || qualityMap[3];
        const p = pct(mins);

        $('sl-last-duration').textContent = fmtDuration(mins);
        $('sl-last-bed').textContent = e.bed;
        $('sl-last-wake').textContent = e.wake;

        const qualEl = $('sl-last-quality');
        qualEl.textContent = q.label;
        qualEl.className = `sl-stat-val ${q.cls}`;

        $('sl-last-bar').style.width = `${p}%`;
        $('sl-last-goal-label').textContent = `${p}% of ${goalHours}h goal`;

        // Optimal bedtime recommendation
        const recTime = calcOptimalBedtime(e.wake);
        const recEl = $('sl-rec-time');
        if (recEl) recEl.textContent = recTime;
        const recSpan = document.querySelector('#sl-bedtime-rec span');
        if (recSpan) recSpan.innerHTML = `Optimal bedtime for <strong>${e.wake}</strong> wake: <strong id="sl-rec-time">${recTime}</strong>`;
    }

    function renderInsights(recent7) {
        if (!recent7.length) return;
        const durations = recent7.map(e => calcDuration(e.bed, e.wake));
        const avgMins = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
        const bestMins = Math.max(...durations);
        const worstMins = Math.min(...durations);
        const goalMins = goalHours * 60;
        const goalMetCount = durations.filter(d => d >= goalMins).length;
        const debtMins = Math.round(goalMins * recent7.length - durations.reduce((a, b) => a + b, 0));

        // Consistency: std dev check
        const mean = avgMins;
        const variance = durations.reduce((sum, d) => sum + (d - mean) ** 2, 0) / durations.length;
        const stdDev = Math.sqrt(variance);
        const consistency = Math.max(0, Math.round(100 - (stdDev / 60) * 20));

        $('sl-avg-val').textContent = fmtDuration(avgMins);
        $('sl-best-val').textContent = fmtDuration(bestMins);
        $('sl-worst-val').textContent = fmtDuration(worstMins);
        $('sl-goal-met').textContent = `${goalMetCount} / ${recent7.length} days`;
        $('sl-consistency').textContent = `${consistency}%`;
        $('sl-consistency').className = `sl-insight-val ${consistency >= 70 ? 'sl-quality-good' : consistency >= 50 ? 'sl-quality-fair' : 'sl-quality-poor'}`;

        const debtEl = $('sl-debt-val');
        if (debtMins > 0) {
            debtEl.textContent = `−${fmtDuration(debtMins)}`;
            debtEl.className = 'sl-insight-val sl-debt-val';
        } else {
            debtEl.textContent = `+${fmtDuration(Math.abs(debtMins))}`;
            debtEl.className = 'sl-insight-val sl-quality-good';
        }
    }

    function renderRing(last) {
        if (!last) return;
        const mins = calcDuration(last.bed, last.wake);
        const p = pct(mins);
        const ring = $('sl-ring');
        const ringPct = $('sl-ring-pct');
        if (ring) ring.style.setProperty('--pct', `${p}%`);
        if (ringPct) ringPct.textContent = `${p}%`;
        const sub = ring?.querySelector('.wt-ring-sub');
        if (sub) sub.textContent = `of ${goalHours}h goal`;
    }

    function renderEntryList(entries) {
        const list = $('sl-entry-list');
        if (!list) return;
        list.innerHTML = '';
        const sorted = [...entries].reverse();
        sorted.forEach((e, i) => {
            const mins = calcDuration(e.bed, e.wake);
            const q = qualityMap[e.quality] || qualityMap[3];
            const item = document.createElement('div');
            item.className = 'sl-entry-item';
            item.innerHTML = `
                <span class="sl-entry-date">${fmtDate(e.date)}</span>
                <span class="sl-entry-dur">${fmtDuration(mins)}</span>
                <span class="sl-entry-qual">${q.emoji}</span>
                <span class="sl-entry-note">${e.notes || ''}</span>
                <button class="sl-entry-del" data-idx="${entries.length - 1 - i}" title="Delete"><i class="ph ph-trash"></i></button>
            `;
            list.appendChild(item);
        });

        list.querySelectorAll('.sl-entry-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                const entries = getEntries();
                entries.splice(idx, 1);
                saveEntries(entries);
                render();
            });
        });
    }

    function renderChart(recent7) {
        const canvas = document.getElementById('sleepTrendChart');
        if (!canvas) return;

        const labels = recent7.map(e => fmtDate(e.date));
        const data = recent7.map(e => +(calcDuration(e.bed, e.wake) / 60).toFixed(2));

        if (sleepChart) sleepChart.destroy();
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 200);
        grad.addColorStop(0, 'rgba(89,209,149,0.35)');
        grad.addColorStop(1, 'rgba(89,209,149,0.0)');

        sleepChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Sleep (h)',
                    data,
                    borderColor: '#59d195',
                    backgroundColor: grad,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#59d195',
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Goal',
                    data: Array(recent7.length).fill(goalHours),
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ctx.datasetIndex === 0 ? `${ctx.parsed.y}h sleep` : `${ctx.parsed.y}h goal`
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#6b6b6b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { ticks: { color: '#6b6b6b', font: { size: 10 }, callback: v => `${v}h` }, grid: { color: 'rgba(255,255,255,0.04)' }, min: 3, max: 10 }
                }
            }
        });
    }

    function renderHeatmap(entries) {
        const container = $('sl-heatmap');
        if (!container) return;
        container.innerHTML = '';

        // Build a map of date → quality
        const dateMap = {};
        entries.forEach(e => { dateMap[e.date] = e.quality; });

        // Show last 5 weeks (35 days)
        const today = new Date();
        for (let i = 34; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const q = dateMap[key] || 0;
            const cell = document.createElement('div');
            cell.className = `sl-heatmap-cell sl-heat-${q}`;
            cell.title = key;
            const tooltip = document.createElement('div');
            tooltip.className = 'sl-heatmap-tooltip';
            tooltip.textContent = q > 0
                ? `${fmtDate(key)}: ${qualityMap[q]?.label || 'Logged'}`
                : `${fmtDate(key)}: No data`;
            cell.appendChild(tooltip);
            container.appendChild(cell);
        }
    }

    // ---- CONTROLS ----
    // + Log toggle
    const logToggleBtn = $('sl-log-toggle-btn');
    const logForm = $('sl-log-form');
    if (logToggleBtn && logForm) {
        logToggleBtn.addEventListener('click', () => {
            const open = logForm.style.display !== 'none';
            logForm.style.display = open ? 'none' : 'block';
            logToggleBtn.innerHTML = open ? '<i class="ph ph-plus"></i>' : '<i class="ph ph-x"></i>';
        });
    }

    // Cancel
    const cancelBtn = $('sl-cancel-btn');
    if (cancelBtn && logForm) {
        cancelBtn.addEventListener('click', () => {
            logForm.style.display = 'none';
            if (logToggleBtn) logToggleBtn.innerHTML = '<i class="ph ph-plus"></i>';
        });
    }

    // Quality picker
    let selectedQuality = 3;
    const qualityPicker = $('sl-quality-picker');
    if (qualityPicker) {
        qualityPicker.querySelectorAll('.sl-q-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                qualityPicker.querySelectorAll('.sl-q-btn').forEach(b => b.classList.remove('sl-q-active'));
                btn.classList.add('sl-q-active');
                selectedQuality = parseInt(btn.dataset.q) || 3;
            });
        });
    }

    // Save entry
    const saveBtn = $('sl-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const bed = $('sl-input-bed')?.value;
            const wake = $('sl-input-wake')?.value;
            const notes = $('sl-input-notes')?.value || '';
            if (!bed || !wake) return;

            const today = new Date().toISOString().split('T')[0];
            const entries = getEntries();
            const existingIdx = entries.findIndex(e => e.date === today);
            const newEntry = { date: today, bed, wake, quality: selectedQuality, notes };

            if (existingIdx >= 0) entries[existingIdx] = newEntry;
            else entries.push(newEntry);

            saveEntries(entries);
            if (logForm) logForm.style.display = 'none';
            if (logToggleBtn) logToggleBtn.innerHTML = '<i class="ph ph-plus"></i>';
            render();
        });
    }

    // Settings popover (⋮)
    const settingsBtn = $('sl-settings-btn');
    const settingsPopover = $('sl-settings-popover');
    if (settingsBtn && settingsPopover) {
        settingsBtn.addEventListener('click', e => {
            e.stopPropagation();
            settingsPopover.style.display = settingsPopover.style.display === 'flex' ? 'none' : 'flex';
        });
        document.addEventListener('click', e => {
            if (!settingsPopover.contains(e.target) && e.target !== settingsBtn) {
                settingsPopover.style.display = 'none';
            }
        });
    }

    // Goal save
    const goalSaveBtn = $('sl-goal-save-btn');
    if (goalSaveBtn) {
        goalSaveBtn.addEventListener('click', () => {
            const newGoal = parseFloat($('sl-goal-input')?.value);
            if (!isNaN(newGoal) && newGoal >= 4) {
                goalHours = newGoal;
                localStorage.setItem(GOAL_KEY, goalHours);
                if (settingsPopover) settingsPopover.style.display = 'none';
                render();
            }
        });
    }

    // Reset all
    const resetBtn = $('sl-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all sleep data? This cannot be undone.')) {
                localStorage.removeItem(STORAGE_KEY);
                if (settingsPopover) settingsPopover.style.display = 'none';
                render();
            }
        });
    }

    // Initial render
    render();
}
