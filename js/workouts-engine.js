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
        history: [], // [ { date: "2026-03-15", name: "Push Day", totalVolume: 4500 } ]
        
        // New: Track completion status for the specialized "Workouts" view
        dailyCompletion: {} // { "2026-04-06": [true, true, false, ...] }
    },

    presets: {
        'Push Day': [
            { name: "Bench Press", sets: "4 × 8 @ 80kg" },
            { name: "Incline DB Press", sets: "3 × 10 @ 28kg" },
            { name: "Overhead Press", sets: "3 × 8 @ 50kg" },
            { name: "Lateral Raises", sets: "3 × 15 @ 10kg" },
            { name: "Tricep Pushdown", sets: "3 × 12 @ 35kg" }
        ],
        'Pull Day': [
            { name: "Deadlift", sets: "3 × 5 @ 110kg" },
            { name: "Pullups", sets: "3 × Max" },
            { name: "Seated Rows", sets: "3 × 12 @ 55kg" },
            { name: "Face Pulls", sets: "3 × 15 @ 20kg" },
            { name: "Bicep Curls", sets: "3 × 12 @ 15kg" }
        ],
        'Legs Day': [
            { name: "Squat", sets: "3 × 8 @ 100kg" },
            { name: "Leg Press", sets: "3 × 12 @ 180kg" },
            { name: "Leg Curls", sets: "3 × 15 @ 45kg" },
            { name: "Calf Raises", sets: "4 × 20 @ 70kg" },
            { name: "Plank", sets: "3 × 60s" }
        ],
        'Rest Day': [
            { name: "Stretching & Mobility", sets: "20 min" },
            { name: "Light Walk", sets: "30 min" },
            { name: "Recovery Focus", sets: "-" }
        ]
    },

    getWorkoutByDay(dayName) {
        let p = this.data.presets || this.presets;
        let pName = (this.data.schedule && this.data.schedule[dayName]) ? this.data.schedule[dayName] : 'Rest Day';
        // Fallback in case preset mapping goes missing
        if (!p[pName]) pName = 'Rest Day'; 
        return { name: pName, exercises: p[pName] || [] };
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
        this.renderWorkoutsView(); // New main view renderer
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
        
        if (!this.data.presets) {
            this.data.presets = JSON.parse(JSON.stringify(this.presets));
        }
        
        if (!this.data.schedule) {
            this.data.schedule = {
                'Monday': 'Push Day',
                'Tuesday': 'Pull Day',
                'Wednesday': 'Legs Day',
                'Thursday': 'Push Day',
                'Friday': 'Pull Day',
                'Saturday': 'Legs Day',
                'Sunday': 'Rest Day'
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
        this.renderWorkoutsView(); // Update secondary view on save
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

        // --- New: Manual PR Modal Listeners ---
        const addPrBtn = document.getElementById('add-pr-btn');
        const prModalOverlay = document.getElementById('pr-modal-overlay');
        const prModalClose = document.getElementById('pr-modal-close');
        const prSaveBtn = document.getElementById('pr-save-entry');
        
        if (addPrBtn && prModalOverlay) {
            addPrBtn.addEventListener('click', () => {
                document.getElementById('pr-entry-name').value = '';
                document.getElementById('pr-entry-weight').value = '';
                prModalOverlay.style.display = 'flex';
            });
        }
        
        if (prModalClose) {
            prModalClose.addEventListener('click', () => {
                prModalOverlay.style.display = 'none';
            });
        }
        
        if (prSaveBtn) {
            prSaveBtn.addEventListener('click', () => {
                const name = document.getElementById('pr-entry-name').value.trim();
                const weight = parseFloat(document.getElementById('pr-entry-weight').value);
                
                if (name && !isNaN(weight)) {
                    // Update or create PR entry
                    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    this.data.prs[name] = { weight: weight, date: dateStr };
                    
                    this.saveData();
                    prModalOverlay.style.display = 'none';
                } else {
                    alert("Please enter a valid exercise name and weight.");
                }
            });
        }
        // --- End PR Listeners ---
        
        // --- Routine CRUD Modal Listeners ---
        const routineModalOverlay = document.getElementById('routine-modal-overlay');
        const routineModalClose = document.getElementById('routine-modal-close');
        const routineSaveBtn = document.getElementById('routine-save-entry');
        
        if (routineModalClose) {
            routineModalClose.addEventListener('click', () => {
                routineModalOverlay.style.display = 'none';
            });
        }
        
        if (routineSaveBtn) {
            routineSaveBtn.addEventListener('click', () => {
                this.saveRoutineModal();
            });
        }
        
        // --- Schedule Modal Listeners ---
        const editSchedBtn = document.getElementById('edit-schedule-btn');
        const schedModalOverlay = document.getElementById('schedule-modal-overlay');
        const schedModalClose = document.getElementById('schedule-modal-close');
        const schedSaveBtn = document.getElementById('schedule-save-entry');
        
        if (editSchedBtn) {
            editSchedBtn.addEventListener('click', () => this.openScheduleModal());
        }
        if (schedModalClose && schedModalOverlay) {
            schedModalClose.addEventListener('click', () => schedModalOverlay.style.display = 'none');
        }
        if (schedSaveBtn) {
            schedSaveBtn.addEventListener('click', () => this.saveScheduleModal());
        }
    },

    openScheduleModal() {
        const overlay = document.getElementById('schedule-modal-overlay');
        if (!overlay) return;
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const presetKeys = Object.keys(this.data.presets);
        
        const container = document.getElementById('schedule-select-container');
        if (container) {
            container.innerHTML = days.map(day => `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <label style="font-size:12px; color:var(--text-secondary); width:80px;">${day}</label>
                    <select id="sched-select-${day}" class="add-task-input" style="flex:1; padding:8px; background:rgba(0,0,0,0.3); color:#fff; border:1px solid var(--workout-border); border-radius:6px; outline:none;">
                        ${presetKeys.map(key => `<option value="${key}" ${this.data.schedule[day] === key ? 'selected' : ''}>${key}</option>`).join('')}
                        ${!presetKeys.includes('Rest Day') ? `<option value="Rest Day" ${this.data.schedule[day] === 'Rest Day' ? 'selected' : ''}>Rest Day</option>` : ''}
                    </select>
                </div>
            `).join('');
        }
        
        overlay.style.display = 'flex';
    },

    saveScheduleModal() {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (!this.data.schedule) this.data.schedule = {};
        
        days.forEach(day => {
            const select = document.getElementById(`sched-select-${day}`);
            if (select) {
                this.data.schedule[day] = select.value;
            }
        });
        
        this.saveData();
        document.getElementById('schedule-modal-overlay').style.display = 'none';
        
        // Force reset today's workout instance so it updates to the new schedule
        const todayStr = new Date().toDateString();
        if (this.data.dailyWorkouts && this.data.dailyWorkouts[todayStr]) {
             delete this.data.dailyWorkouts[todayStr];
        }
        this.renderWorkoutsView();
    },

    openRoutineModal(dayName, index = null, event = null) {
        if (event) event.stopPropagation(); // prevent tick
        
        const overlay = document.getElementById('routine-modal-overlay');
        if (!overlay) return;
        
        const today = new Date().toDateString();
        const workout = this.data.dailyWorkouts[today];
        
        this.currentRoutineEditDay = dayName;
        this.currentRoutineEditDate = today;
        this.currentRoutineEditIndex = index;
        
        const nameInput = document.getElementById('routine-entry-name');
        const setsInput = document.getElementById('routine-entry-sets');
        const titleEl = document.getElementById('routine-modal-title');
        
        if (index !== null) {
            const ex = workout.exercises[index];
            nameInput.value = ex.name;
            setsInput.value = ex.sets;
            titleEl.textContent = "EDIT EXERCISE";
        } else {
            nameInput.value = '';
            setsInput.value = '';
            titleEl.textContent = "ADD EXERCISE";
        }
        
        overlay.style.display = 'flex';
    },
    
    saveRoutineModal() {
        const name = document.getElementById('routine-entry-name').value.trim();
        const sets = document.getElementById('routine-entry-sets').value.trim();
        
        if (name && sets && this.currentRoutineEditDate) {
            const todayWorkout = this.data.dailyWorkouts[this.currentRoutineEditDate];
            
            if (this.currentRoutineEditIndex !== null) {
                todayWorkout.exercises[this.currentRoutineEditIndex] = { name, sets };
            } else {
                todayWorkout.exercises.push({ name, sets });
                // Ensure completion tracking array is synced
                if (this.data.dailyCompletion && this.data.dailyCompletion[this.currentRoutineEditDate]) {
                    this.data.dailyCompletion[this.currentRoutineEditDate].push(false);
                }
            }
            
            this.saveData();
            document.getElementById('routine-modal-overlay').style.display = 'none';
            this.currentRoutineEditDay = null;
            this.currentRoutineEditDate = null;
            this.currentRoutineEditIndex = null;
        } else {
            alert("Please fill in both name and sets.");
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
    },

    deletePR(name) {
        if (confirm(`Are you sure you want to delete your PR for ${name}?`)) {
            delete this.data.prs[name];
            this.saveData();
            // Automatically handled by saveData() re-rendering
        }
    },

    deleteRoutineExercise(dayName, index, event) {
        if (event) event.stopPropagation(); // prevent tick
        const today = new Date().toDateString();
        if (confirm("Delete this exercise from today's routine?")) {
            if (this.data.dailyWorkouts && this.data.dailyWorkouts[today]) {
                this.data.dailyWorkouts[today].exercises.splice(index, 1);
                
                // Keep completion array aligned
                if (this.data.dailyCompletion && this.data.dailyCompletion[today]) {
                    this.data.dailyCompletion[today].splice(index, 1);
                }

                this.saveData();
            }
        }
    },

    // New logic for the specialized WORKOUTS page
    renderWorkoutsView() {
        const today = new Date().toDateString();
        const dayName = this.getDayName();
        let baseWorkout = this.getWorkoutByDay(dayName);

        // --- NEW: Initialize today's specific workout instance ---
        if (!this.data.dailyWorkouts) this.data.dailyWorkouts = {};
        if (!this.data.dailyWorkouts[today]) {
            // Deep copy the preset for today
            this.data.dailyWorkouts[today] = JSON.parse(JSON.stringify(baseWorkout));
        }
        
        const workout = this.data.dailyWorkouts[today];

        // 1. Update WORKOUTS page Header/Title
        const titleEl = document.querySelector('#view-workouts .card:nth-child(2) .card-header');
        if (titleEl) {
            titleEl.textContent = `TODAY'S WORKOUT — ${workout.name.toUpperCase()}`;
        }

        // 2. Initialize completion for today if missing
        if (!this.data.dailyCompletion) this.data.dailyCompletion = {};
        if (!this.data.dailyCompletion[today]) {
            this.data.dailyCompletion[today] = new Array(workout.exercises.length).fill(false);
        }

        // 3. Render exercise list for the main view
        const listContainer = document.querySelector('#view-workouts .exercise-list');
        if (listContainer) {
            listContainer.innerHTML = workout.exercises.map((ex, idx) => {
                const isDone = this.data.dailyCompletion[today][idx];
                return `
                    <div class="exercise-row ${isDone ? 'checked' : ''}" onclick="WorkoutsEngine.toggleExerciseCheck(${idx})">
                        <div style="flex: 1;">
                            <span class="exercise-name" style="display:block;">${ex.name}</span>
                            <span class="exercise-sets" style="font-size: 11px; opacity: 0.7;">${ex.sets}</span>
                        </div>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <span class="exercise-done" style="margin-right: 8px;">${isDone ? '✓' : '—'}</span>
                            <button class="routine-action-btn" onclick="WorkoutsEngine.openRoutineModal('${dayName}', ${idx}, event)" title="Edit"><i class="ph ph-pencil-simple"></i></button>
                            <button class="routine-action-btn" onclick="WorkoutsEngine.deleteRoutineExercise('${dayName}', ${idx}, event)" title="Delete"><i class="ph ph-trash"></i></button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add the Add Exercise Button
            listContainer.innerHTML += `
                <button class="add-task-submit" style="width: 100%; margin-top: 10px; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px dashed var(--workout-border);" onclick="WorkoutsEngine.openRoutineModal('${dayName}')">
                    + ADD EXERCISE
                </button>
            `;
        }

        // 4. Render Personal Records for the main view
        const prContainer = document.getElementById('workouts-page-prs');
        if (prContainer) {
            const prKeys = Object.keys(this.data.prs);
            if (prKeys.length === 0) {
                prContainer.innerHTML = `
                    <div class="workout-empty-state" style="padding: 15px;">
                        <p style="margin:0; font-size: 12px;">No PRs tracked yet.<br>Click '+' to log one manually.</p>
                    </div>
                `;
            } else {
                prContainer.innerHTML = prKeys.map(name => `
                    <div class="exercise-row pr-list-item" style="cursor: default; display: flex; align-items: center;">
                        <span class="exercise-name" style="flex: 1;">${name}</span>
                        <div style="display: flex; gap: 16px; align-items: center;">
                            <div style="display: flex; flex-direction: column; text-align: right; gap: 2px;">
                                <span class="exercise-sets" style="color: #fff; font-weight: 600; line-height: 1;">${this.data.prs[name].weight}kg</span>
                                <span class="pr-date" style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">${this.data.prs[name].date}</span>
                            </div>
                            <button class="pr-delete-btn" onclick="WorkoutsEngine.deletePR('${name}')" title="Delete PR"><i class="ph ph-trash"></i></button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // 5. Update Weekly Row Status
        this.updateWeeklyRow();
    },

    toggleExerciseCheck(idx) {
        const today = new Date().toDateString();
        if (!this.data.dailyCompletion[today]) return;
        
        this.data.dailyCompletion[today][idx] = !this.data.dailyCompletion[today][idx];
        
        // Save and re-render
        this.saveData();
        this.renderWorkoutsView();

        // Optional: Update Body Engine score if all exercises are done
        const allDone = this.data.dailyCompletion[today].every(c => c === true);
        if (allDone) {
            this.updateBodyEngineScore();
        }
    },

    updateWeeklyRow() {
        const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        // HTML starts with Monday (idx 0), but getDay() returns 0 for Sunday.
        // We shift: Monday becomes 0, Tuesday becomes 1 ... Sunday becomes 6.
        let todayIdx = new Date().getDay() - 1; 
        if (todayIdx === -1) todayIdx = 6; // Sunday fix

        const container = document.querySelector('.workout-week-days');
        if (!container) return;

        const dayTiles = container.querySelectorAll('.workout-day');
        dayTiles.forEach((tile, idx) => {
            // weekDays mapping for getWorkoutByDay still uses Sunday=0 logic
            // so we need the "real" index for the day name
            let realDayIdx = idx + 1;
            if (realDayIdx === 7) realDayIdx = 0;
            const dayName = weekDays[realDayIdx];
            
            const workout = this.getWorkoutByDay(dayName);
            
            // Update the day's name and type label
            const typeLabel = tile.querySelector('.wd-type');
            if (typeLabel) typeLabel.textContent = workout.name.split(' ')[0].toUpperCase();

            // Set classes: done, today, upcoming, rest
            tile.classList.remove('done', 'today', 'upcoming', 'rest');
            
            if (workout.name === 'Rest Day') {
                tile.classList.add('rest');
            }

            if (idx === todayIdx) {
                tile.classList.add('today');
            } else if (idx < todayIdx) {
                if (workout.name !== 'Rest Day') tile.classList.add('done');
            } else {
                tile.classList.add('upcoming');
            }
        });
    }
};

// Expose globally
window.WorkoutsEngine = WorkoutsEngine;
