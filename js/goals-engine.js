/* ======================================================
   TITAN OS — GOALS-ENGINE.JS
   Advanced Goal Architect — Long-term & Short-term
   ====================================================== */

const GoalsEngine = {
    STORAGE_KEY: 'titan-goals-data-v2',
    goals: {
        lt: [], // Long-term
        st: []  // Short-term
    },

    init() {
        this.loadData();
        this.render();
        this.initEventListeners();
    },

    loadData() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            this.goals = JSON.parse(saved);
        } else {
            // Default Demo Goals matching the UI look
            this.goals = {
                lt: [
                    { id: 'lt1', category: 'body', title: 'Reach 15% body fat', current: 18.5, target: 15, unit: '%', deadline: 'Jun 2026' },
                    { id: 'lt2', category: 'body', title: 'Deadlift 140kg', current: 110, target: 140, unit: 'kg', deadline: 'Aug 2026' },
                    { id: 'lt3', category: 'money', title: 'Save ₹1,00,000', current: 38000, target: 100000, unit: '₹', deadline: 'Dec 2026' }
                ],
                st: [
                    { id: 'st1', category: 'mind', title: 'Finish React Project', progress: 80 },
                    { id: 'st2', category: 'body', title: 'Weekly Run (20km)', progress: 75 },
                    { id: 'st3', category: 'money', title: 'Pay Bills', progress: 50 }
                ]
            };
            this.saveData();
        }
    },

    saveData() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.goals));
    },

    render() {
        this.renderLT();
        this.renderST();
    },

    renderLT() {
        const grid = document.querySelector('.goals-adv-grid-lt');
        if (!grid) return;
        grid.innerHTML = '';
        
        this.goals.lt.forEach(goal => {
            const pct = Math.min(Math.round(((goal.current) / (goal.target || 1)) * 100), 100);
            const card = document.createElement('div');
            card.className = `goal-lt-card ${goal.category}-border`;
            card.innerHTML = `
                <div class="lt-header">
                    <span class="adv-tag ${goal.category}">${goal.category.toUpperCase()}</span>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="lt-date">${goal.deadline}</span>
                        <button class="st-options-btn" onclick="GoalsEngine.deleteLT('${goal.id}')"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
                <h3 class="lt-name">${goal.title}</h3>
                <div class="lt-stats">
                    <span>Current: ${goal.current}${goal.unit}</span>
                    <button class="lt-log-btn" onclick="GoalsEngine.logLT('${goal.id}')">+ Log Today</button>
                    <span>Target: ${goal.target}${goal.unit}</span>
                </div>
                <div class="lt-progress-row">
                    <span class="lt-lbl">Progress:</span>
                    <div class="lt-bar-wrap"><div class="lt-bar ${goal.category}-bg" style="width:${pct}%"></div></div>
                    <span class="lt-val">${pct}%</span>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    renderST() {
        const grid = document.querySelector('.goals-adv-grid-st');
        if (!grid) return;
        grid.innerHTML = '';

        this.goals.st.forEach(goal => {
            const card = document.createElement('div');
            card.className = 'goal-st-card';
            card.innerHTML = `
                <div class="st-header">
                    <h3 class="st-name">${goal.title}</h3>
                    <span class="adv-tag ${goal.category}-text-only">${goal.category.toUpperCase()}</span>
                    <div class="st-menu-wrap">
                        <button class="st-options-btn" onclick="GoalsEngine.deleteST('${goal.id}')"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
                <div class="st-ring-row">
                    <div class="st-ring ${goal.category}-ring" style="--pct: ${goal.progress}%"><span>${goal.progress}%</span></div>
                </div>
                <button class="st-log-btn" onclick="GoalsEngine.logST('${goal.id}')">Log Today</button>
            `;
            grid.appendChild(card);
        });
    },

    logLT(id) {
        const goal = this.goals.lt.find(g => g.id === id);
        if (goal) {
            const val = parseFloat(prompt(`Current value for "${goal.title}" (${goal.unit}):`, goal.current));
            if (!isNaN(val)) {
                goal.current = val;
                this.saveData();
                this.render();
            }
        }
    },

    logST(id) {
        const goal = this.goals.st.find(g => g.id === id);
        if (goal) {
            const val = parseInt(prompt(`Update progress % for "${goal.title}":`, goal.progress), 10);
            if (!isNaN(val)) {
                goal.progress = Math.min(Math.max(val, 0), 100);
                this.saveData();
                this.render();
            }
        }
    },

    deleteST(id) {
        if (confirm("Delete this short-term goal?")) {
            this.goals.st = this.goals.st.filter(g => g.id !== id);
            this.saveData();
            this.render();
        }
    },
    
    deleteLT(id) {
        if (confirm("Delete this long-term goal?")) {
            this.goals.lt = this.goals.lt.filter(g => g.id !== id);
            this.saveData();
            this.render();
        }
    },

    addGoal(type) {
        const title = prompt("Goal Title:");
        if (!title) return;
        const category = prompt("Category (body, mind, money, general):").toLowerCase();
        const cat = ['body', 'mind', 'money', 'general'].includes(category) ? category : 'general';
        
        if (type === 'lt') {
            const target = parseFloat(prompt("Target Value:"));
            const unit = prompt("Unit (e.g. kg, %, ₹):");
            const deadline = prompt("Deadline (e.g. Dec 2026):");
            this.goals.lt.push({
                id: 'lt' + Date.now(),
                category: cat,
                title,
                current: 0,
                target: target || 100,
                unit: unit || '',
                deadline: deadline || '2026'
            });
        } else {
            this.goals.st.push({
                id: 'st' + Date.now(),
                category: cat,
                title,
                progress: 0
            });
        }
        this.saveData();
        this.render();
    },

    initEventListeners() {
        const addBtn = document.getElementById('adv-add-goal-btn');
        const dropdown = document.getElementById('adv-add-dropdown');
        if (addBtn && dropdown) {
            addBtn.onclick = (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
            };
            document.addEventListener('click', () => dropdown.style.display = 'none');
            
            const btns = dropdown.querySelectorAll('button');
            if (btns[0]) btns[0].onclick = () => this.addGoal('lt');
            if (btns[1]) btns[1].onclick = () => this.addGoal('st');
        }
    }
};

window.GoalsEngine = GoalsEngine;
