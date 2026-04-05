/* ======================================================
   TITAN OS — NUTRITION-ENGINE.JS
   Daily Macros, Hydration slots, and Meal logs
   ====================================================== */

const NutritionEngine = {
    STORAGE_KEY: 'titan-nutrition-data',
    data: {
        lastDate: '',
        hydration: 0,
        targetHydration: 3.5,
        meals: [],
        macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
        targets: { protein: 200, carbs: 250, fat: 80, fiber: 30, cals: 2250 }
    },

    init() {
        this.loadData();
        this.checkDayReset();
        this.render();
        this.initEventListeners();
    },

    loadData() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            this.data.lastDate = new Date().toDateString();
            this.saveData();
        }
    },

    saveData() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    },

    checkDayReset() {
        const today = new Date().toDateString();
        if (this.data.lastDate !== today) {
            // New day reset
            this.data.lastDate = today;
            this.data.hydration = 0;
            this.data.meals = [];
            this.data.macros = { protein: 0, carbs: 0, fat: 0, fiber: 0 };
            this.saveData();
        }
    },

    addHydration() {
        if (this.data.hydration < this.data.targetHydration) {
            this.data.hydration += 0.5;
            this.saveData();
            this.render();
        } else {
            alert("Daily hydration target reached! Extra hydration logged.");
            this.data.hydration += 0.5;
            this.saveData();
            this.render();
        }
    },

    addMeal() {
        const name = prompt("Meal Name:");
        if (!name) return;
        const cals = parseInt(prompt("Calories (kcal):"), 10) || 0;
        const protein = parseInt(prompt("Protein (g):"), 10) || 0;
        const carbs = parseInt(prompt("Carbs (g):"), 10) || 0;
        const fat = parseInt(prompt("Fat (g):"), 10) || 0;
        const fiber = parseInt(prompt("Fiber (g):"), 10) || 0;

        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        this.data.meals.push({ time: timeStr, name, cals });
        this.data.macros.protein += protein;
        this.data.macros.carbs += carbs;
        this.data.macros.fat += fat;
        this.data.macros.fiber += fiber;

        this.saveData();
        this.render();
    },

    render() {
        // Render Hydration
        const hydroVal = document.getElementById('hydro-val');
        if (hydroVal) hydroVal.innerHTML = `${this.data.hydration.toFixed(1)}<span class="hydro-unit">L</span>`;
        
        const hydroTargetLabel = document.getElementById('hydro-target-label');
        if (hydroTargetLabel) hydroTargetLabel.innerText = `TARGET: ${this.data.targetHydration} LITERS`;

        const hydroSlots = document.getElementById('hydro-slots');
        if (hydroSlots) {
            hydroSlots.innerHTML = '';
            const totalSlots = Math.ceil(this.data.targetHydration / 0.5);
            const filledSlots = Math.floor(this.data.hydration / 0.5);
            for (let i = 0; i < totalSlots; i++) {
                const slot = document.createElement('div');
                slot.className = `hydro-slot ${i < filledSlots ? 'filled' : 'empty'}`;
                slot.innerHTML = `<i class="ph ph-drop"></i>`;
                hydroSlots.appendChild(slot);
            }
        }

        // Render Macros
        const totalCals = this.data.meals.reduce((sum, m) => sum + m.cals, 0);
        const calsDisplay = document.querySelector('.nutrition-big');
        if (calsDisplay) calsDisplay.innerHTML = `${totalCals} <span class="weight-unit">kcal</span>`;
        
        const calsTargetLabel = document.querySelector('.nutrition-big + .progress-bar + div');
        if (calsTargetLabel) {
            const pct = Math.min(Math.round((totalCals / this.data.targets.cals) * 100), 100);
            calsTargetLabel.innerText = `TARGET: ${this.data.targets.cals} kcal · ${pct}% REACHED`;
            document.querySelector('.nutrition-big + .progress-bar .progress-fill').style.width = pct + '%';
        }

        const macroBars = document.querySelectorAll('.macro-item');
        if (macroBars.length >= 4) {
             const mKeys = ['protein', 'carbs', 'fat', 'fiber'];
             mKeys.forEach((key, i) => {
                 const cur = this.data.macros[key];
                 const target = this.data.targets[key];
                 const pct = Math.min(Math.round((cur / target) * 100), 100);
                 const bar = macroBars[i].querySelector('.progress-fill');
                 const val = macroBars[i].querySelector('.macro-val');
                 if (bar) bar.style.width = pct + '%';
                 if (val) val.innerText = `${cur}g / ${target}g`;
             });
        }

        // Render Meals
        const mealList = document.getElementById('meal-list');
        if (mealList) {
            mealList.innerHTML = '';
            if (this.data.meals.length === 0) {
                mealList.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--text-muted);">No meals logged today.</p>`;
            } else {
                this.data.meals.forEach(m => {
                    const row = document.createElement('div');
                    row.className = 'meal-item';
                    row.innerHTML = `<span class="meal-time">${m.time}</span>
                                     <span class="meal-name">${m.name}</span>
                                     <span class="meal-cals">${m.cals} kcal</span>`;
                    mealList.appendChild(row);
                });
            }
        }
    },

    initEventListeners() {
        const hydroAddBtn = document.getElementById('hydro-add-btn');
        if (hydroAddBtn) hydroAddBtn.onclick = () => this.addHydration();

        const addMealBtn = document.getElementById('add-meal-btn');
        if (addMealBtn) addMealBtn.onclick = () => this.addMeal();

        // Hydration Settings
        const hydroOptionsBtn = document.getElementById('hydro-options-btn');
        const hydroPopover = document.getElementById('hydro-popover');
        const hydroSaveBtn = document.getElementById('hydro-save-btn');
        const hydroResetBtn = document.getElementById('hydro-reset-btn');
        const hydroTargetInput = document.getElementById('hydro-target-input');

        if (hydroOptionsBtn && hydroPopover) {
            hydroOptionsBtn.onclick = (e) => {
                e.stopPropagation();
                hydroPopover.style.display = hydroPopover.style.display === 'flex' ? 'none' : 'flex';
            };
            
            document.addEventListener('click', (e) => {
                if (!hydroPopover.contains(e.target) && e.target !== hydroOptionsBtn) {
                    hydroPopover.style.display = 'none';
                }
            });
        }

        if (hydroSaveBtn && hydroTargetInput) {
            hydroSaveBtn.onclick = () => {
                this.data.targetHydration = parseFloat(hydroTargetInput.value) || 3.5;
                this.saveData();
                this.render();
                hydroPopover.style.display = 'none';
            };
        }

        if (hydroResetBtn) {
            hydroResetBtn.onclick = () => {
                this.data.hydration = 0;
                this.saveData();
                this.render();
                hydroPopover.style.display = 'none';
            };
        }
    }
};

window.NutritionEngine = NutritionEngine;
