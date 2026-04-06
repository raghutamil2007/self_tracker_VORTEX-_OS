/* ======================================================
   TITAN OS — WORKOUTS-ENGINE.JS
   Functional Workout Tracker: Logging, PRs, and Rest Timers.
   ====================================================== */

const WorkoutsEngine = {
    data: {
        currentWorkout: {
            name: "New Workout",
            exercises: []
        },
        prs: {}, // { "Bench Press": { weight: 100, date: "2026-03-15" } }
        history: [] // [ { date: "2026-03-15", name: "Push Day", totalVolume: 4500 } ]
    },

    storageKey: 'titan-workouts-v1',

    muscleGroupMap: {
        'Bench Press': 'Chest', 'Incline Press': 'Chest', 'Chest Fly': 'Chest', 'Pushups': 'Chest',
        'Squat': 'Quads', 'Leg Press': 'Quads', 'Lunges': 'Quads', 'Leg Extension': 'Quads',
        'Deadlift': 'Back', 'Pullups': 'Back', 'Lat Pulldown': 'Back', 'Rows': 'Back', 'Rows (Seated)': 'Back',
        'OHP': 'Shoulders', 'Shoulder Press': 'Shoulders', 'Lateral Raise': 'Shoulders', 'Front Raise': 'Shoulders',
        'Bicep Curl': 'Biceps', 'Hammer Curl': 'Biceps', 'Preacher Curl': 'Biceps',
        'Tricep Pushdown': 'Triceps', 'Skullscrushers': 'Triceps', 'Dips': 'Triceps',
        'Leg Curl': 'Hamstrings', 'Hamstring Curl': 'Hamstrings', 'RDL': 'Hamstrings',
        'Crunches': 'Core', 'Plank': 'Core', 'Leg Raise': 'Core', 'Ab Wheel': 'Core'
    },

    init() {
        this.loadData();
        this.render();
        this.initEventListeners();
        console.log("TITAN OS: Workouts Engine Initialized.");
    },

    loadData() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            // Default PRs for demo
            this.data.prs = {
                "Bench Press": { weight: 100, date: "12 Feb" },
                "Squat": { weight: 130, date: "28 Jan" },
                "Deadlift": { weight: 110, date: "05 Mar" },
                "OHP": { weight: 65, date: "14 Mar" }
            };
        }
        
        // Reset current workout if it's a new day
        const today = new Date().toDateString();
        if (this.data.lastLoggedDate !== today) {
            this.data.currentWorkout = {
                name: this.getDayName() + " Workout",
                exercises: []
            };
        }
    },

    saveData() {
        this.data.lastLoggedDate = new Date().toDateString();
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    },

    getDayName() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    },

    addExercise(name) {
        if (!name) return;
        this.data.currentWorkout.exercises.push({
            name: name,
            sets: []
        });
        this.saveData();
        this.render();
    },

    logSet(exerciseIndex, weight, reps) {
        const ex = this.data.currentWorkout.exercises[exerciseIndex];
        if (!ex) return;
        
        const set = { weight: parseFloat(weight), reps: parseInt(reps), timestamp: Date.now() };
        ex.sets.push(set);
        
        this.checkPR(ex.name, set.weight);
        this.saveData();
        this.render();
        this.updateBodyEngineScore();
        
        // Notify Analytics Engine (if it exists)
        if (window.BodyAnalytics) {
            const group = this.muscleGroupMap[ex.name] || 'Other';
            window.BodyAnalytics.logVolume(group, set.weight * set.reps);
        }
    },

    checkPR(name, weight) {
        if (!this.data.prs[name] || weight > this.data.prs[name].weight) {
            const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            this.data.prs[name] = { weight: weight, date: dateStr };
            this.notifyPR(name, weight);
        }
    },

    notifyPR(name, weight) {
        // UI notification logic could go here
        console.log(`NEW PR: ${name} @ ${weight}kg!`);
    },

    updateBodyEngineScore() {
        // Find "Gym" task index in Body Engine and mark it as complete
        const gymTask = Array.from(document.querySelectorAll('#body-main-tasks .task-item'))
                             .find(item => item.textContent.toLowerCase().includes('gym'));
        
        if (gymTask) {
            const checkbox = gymTask.querySelector('input');
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change')); // Trigger recalc in pages.js
            }
        }
    },

    startRestTimer(seconds = 60) {
        let remaining = seconds;
        const timerBtn = document.getElementById('workout-rest-timer-btn');
        if (!timerBtn) return;

        clearInterval(this.timerInterval);
        timerBtn.classList.add('timer-active');
        
        this.timerInterval = setInterval(() => {
            remaining--;
            const m = Math.floor(remaining / 60);
            const s = remaining % 60;
            timerBtn.querySelector('.timer-text').innerText = `${m}:${s.toString().padStart(2, '0')}`;
            
            if (remaining <= 0) {
                clearInterval(this.timerInterval);
                timerBtn.classList.remove('timer-active');
                timerBtn.querySelector('.timer-text').innerText = "REST";
                // Optional sound or notification
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
            }
        }, 1000);
    },

    initEventListeners() {
        // Global listener for dynamic exercise adding
        const addExBtn = document.getElementById('add-exercise-btn');
        const exInput = document.getElementById('new-exercise-input');
        if (addExBtn && exInput) {
            addExBtn.addEventListener('click', () => {
                this.addExercise(exInput.value.trim());
                exInput.value = '';
            });
            exInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.addExercise(exInput.value.trim());
                    exInput.value = '';
                }
            });
        }

        // Rest timer button
        const restBtn = document.getElementById('workout-rest-timer-btn');
        if (restBtn) {
            restBtn.addEventListener('click', () => this.startRestTimer(60));
        }
    },

    render() {
        const workoutContainer = document.getElementById('body-tab-workouts');
        if (!workoutContainer) return;

        // Header and layout
        workoutContainer.innerHTML = `
            <div class="workout-dashboard">
                <div class="workout-header-row">
                    <div class="workout-title-group">
                        <h2 class="workout-main-title">${this.data.currentWorkout.name.toUpperCase()}</h2>
                        <span class="workout-sub-title">Session Log • ${new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="workout-actions">
                        <button class="rest-timer-btn" id="workout-rest-timer-btn">
                            <i class="ph ph-clock"></i>
                            <span class="timer-text">REST</span>
                        </button>
                    </div>
                </div>

                <div class="workout-grid-layout">
                    <div class="workout-main-panel card">
                        <div class="ex-input-row">
                            <input type="text" id="new-exercise-input" placeholder="Add exercise (e.g. Bench Press)...">
                            <button id="add-exercise-btn">+ ADD</button>
                        </div>
                        <div id="exercise-list-container" class="exercise-list-dynamic">
                            <!-- Exercises will be injected here -->
                        </div>
                        ${this.data.currentWorkout.exercises.length === 0 ? 
                          '<div class="workout-empty-state"><p>No exercises added for today yet.<br>Start by adding one above.</p></div>' : ''}
                    </div>

                    <div class="workout-side-panel">
                        <div class="card pr-card">
                            <div class="card-header">PERSONAL RECORDS</div>
                            <div class="pr-list">
                                ${Object.keys(this.data.prs).map(name => `
                                    <div class="pr-item">
                                        <span class="pr-name">${name}</span>
                                        <div class="pr-v-group">
                                            <span class="pr-val">${this.data.prs[name].weight}kg</span>
                                            <span class="pr-date">${this.data.prs[name].date}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="card volume-card">
                            <div class="card-header">TOTAL VOLUME</div>
                            <div class="volume-display" id="total-vol-display">0 kg</div>
                            <div class="tiny-bar-chart" id="vol-trend-bars">
                                <!-- Volume trend could be rendered here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render Exercise Rows
        const list = document.getElementById('exercise-list-container');
        if (!list) return;

        let totalVolume = 0;

        this.data.currentWorkout.exercises.forEach((ex, exIdx) => {
            const exDiv = document.createElement('div');
            exDiv.className = 'exercise-log-card';
            
            let setsHtml = ex.sets.map((set, sIdx) => {
                totalVolume += (set.weight * set.reps);
                return `
                    <div class="set-row">
                        <span class="set-idx">${sIdx + 1}</span>
                        <span class="set-val">${set.weight}kg × ${set.reps}</span>
                        <button class="remove-set-btn" onclick="WorkoutsEngine.removeSet(${exIdx}, ${sIdx})"><i class="ph ph-trash"></i></button>
                    </div>
                `;
            }).join('');

            exDiv.innerHTML = `
                <div class="ex-log-header">
                    <h3 class="ex-log-name">${ex.name}</h3>
                    <button class="ex-remove-btn" onclick="WorkoutsEngine.removeExercise(${exIdx})"><i class="ph ph-x"></i></button>
                </div>
                <div class="ex-sets-list">${setsHtml}</div>
                <div class="ex-log-form">
                    <input type="number" step="0.5" placeholder="kg" class="set-input weight-in">
                    <span class="x">×</span>
                    <input type="number" placeholder="reps" class="set-input reps-in">
                    <button class="log-set-btn" onclick="WorkoutsEngine.handleLogSet(this, ${exIdx})">LOG SET</button>
                    <button class="rest-suggest-btn" onclick="WorkoutsEngine.startRestTimer()"><i class="ph ph-stopwatch"></i></button>
                </div>
            `;
            list.appendChild(exDiv);
        });

        const volDisplay = document.getElementById('total-vol-display');
        if (volDisplay) volDisplay.innerText = totalVolume.toLocaleString() + " kg";

        // Re-attach event listeners for newly rendered static buttons
        this.initEventListeners();
    },

    handleLogSet(btn, exIdx) {
        const row = btn.parentElement;
        const w = row.querySelector('.weight-in').value;
        const r = row.querySelector('.reps-in').value;
        if (w && r) {
            this.logSet(exIdx, w, r);
        }
    },

    removeExercise(idx) {
        this.data.currentWorkout.exercises.splice(idx, 1);
        this.saveData();
        this.render();
    },

    removeSet(exIdx, sIdx) {
        this.data.currentWorkout.exercises[exIdx].sets.splice(sIdx, 1);
        this.saveData();
        this.render();
    }
};

// Expose globally
window.WorkoutsEngine = WorkoutsEngine;
