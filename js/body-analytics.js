/* ======================================================
   TITAN OS — BODY-ANALYTICS.JS
   Performance Command Center: Heatmaps, Readiness, and Metrics.
   ====================================================== */

const BodyAnalytics = {
    data: {
        muscles: { Chest: 0, Back: 0, Quads: 0, Hamstrings: 0, Shoulders: 0, Biceps: 0, Triceps: 0, Core: 0 },
        readiness: 78, // Current %
        fatigue: 22,   // Current %
        metrics: {
            weight: 78.5,
            fat: 18.2,
            chest: 104,
            waist: 82,
            biceps: 38,
            thighs: 58
        },
        readinessTrend: [65, 72, 84, 80, 75, 88, 78], // last 7 days
        muscleVolumeWeek: { // for the chart
            Chest: 1200, Back: 1500, Quads: 800, Hamstrings: 600, Shoulders: 900, Biceps: 400, Triceps: 400, Core: 500
        }
    },

    storageKey: 'titan-body-analytics-v1',

    init() {
        this.loadData();
        this.render();
        this.initCharts();
        console.log("TITAN OS: Body Analytics Suite Initialized.");
    },

    loadData() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            this.data = JSON.parse(saved);
        }
        
        // Auto-calculate Readiness based on cross-engine data
        this.calculateReadiness();
    },

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    },

    calculateReadiness() {
        // 1. Fetch Sleep Recovery (mocking if not available)
        let sleepEffect = 85; // 0-100
        const sleepData = localStorage.getItem('titan-sleep-v1');
        if (sleepData) {
            const sd = JSON.parse(sleepData);
            if (sd.history && sd.history.length > 0) {
                // simple calc: quality of last night
                sleepEffect = sd.history[0].quality === 'GOOD' ? 95 : (sd.history[0].quality === 'FAIR' ? 70 : 40);
            }
        }

        // 2. Fetch Nutrition Energy (mocking if not available)
        let nutritionEffect = 80;
        const nutScore = localStorage.getItem('nutrition-last-score');
        if (nutScore) nutritionEffect = parseInt(nutScore);

        // 3. Fetch Fatigue (from Workouts)
        // More volume in last 3 days = more fatigue
        this.data.fatigue = Math.min(35, this.data.fatigue); // simple cap for demo
        
        // Readiness = (Recovery * 0.4) + (Energy * 0.3) + (100 - Fatigue * 0.3)
        this.data.readiness = Math.round((sleepEffect * 0.4) + (nutritionEffect * 0.3) + ((100 - this.data.fatigue) * 0.3));
    },

    logVolume(group, volume) {
        if (this.data.muscles[group] !== undefined) {
            this.data.muscles[group] += volume;
            this.data.muscleVolumeWeek[group] += volume;
            // Workout increases fatigue
            this.data.fatigue = Math.min(100, this.data.fatigue + 5); 
            this.calculateReadiness();
            this.saveData();
            this.render();
            this.initCharts();
        }
    },

    updateMetric(key, val) {
        if (this.data.metrics[key] !== undefined) {
            this.data.metrics[key] = parseFloat(val);
            this.saveData();
            this.render();
            this.initCharts(); // Refresh heatmap if needed
        }
    },

    render() {
        const container = document.getElementById('body-tab-performance');
        if (!container) return;

        const getColor = (pct) => {
            if (pct > 80) return '#59d195';
            if (pct > 50) return '#f2a75f';
            return '#f25f5c';
        };

        const readyColor = getColor(this.data.readiness);
        const statusText = this.data.readiness > 80 ? "PEAK READINESS" : (this.data.readiness > 50 ? "RECOVERED" : "FATIGUED");
        const recommendation = this.data.readiness > 80 ? "PR DAY: PUSH HARD" : (this.data.readiness > 50 ? "STANDARD LOAD" : "DELOAD / RECOVERY");

        container.innerHTML = `
            <div class="performance-dashboard">
                <div class="ana-grid">
                    <!-- READINESS CARD -->
                    <div class="ana-card readiness-card">
                        <div class="card-header">READINESS INDEX</div>
                        <div class="readiness-container">
                            <div class="readiness-gauge" style="--pct: ${this.data.readiness}%; --ready-color: ${readyColor}">
                                <div class="readiness-val">${this.data.readiness}%</div>
                            </div>
                            <div class="readiness-status" style="--ready-color: ${readyColor}">${statusText}</div>
                            <p class="readiness-desc">${recommendation}</p>
                        </div>
                    </div>

                    <!-- MUSCLE HEATMAP / RADAR -->
                    <div class="ana-card heatmap-card">
                        <div class="card-header">MUSCLE LOAD HEATMAP</div>
                        <p class="card-subtitle" style="font-size:10px; color:#6b6b6b; margin-top:-10px; margin-bottom:15px; letter-spacing:1px;">7-DAY VOLUME DISTRIBUTION (kg)</p>
                        <div class="heatmap-container">
                            <canvas id="muscleHeatmapChart"></canvas>
                        </div>
                    </div>

                    <!-- BODY METRICS -->
                    <div class="ana-card ana-full-width metrics-card">
                        <div class="card-header">BODY ANALYTICS</div>
                        
                        <div class="metrics-log-row">
                            <select class="ana-input ana-select" id="metric-select">
                                <option value="weight">Weight (kg)</option>
                                <option value="fat">Body Fat %</option>
                                <option value="chest">Chest (cm)</option>
                                <option value="waist">Waist (cm)</option>
                                <option value="biceps">Bicep (cm)</option>
                                <option value="thighs">Thigh (cm)</option>
                            </select>
                            <input type="number" class="ana-input" id="metric-val-input" placeholder="Value...">
                            <button class="ana-btn" onclick="BodyAnalytics.handleMetricUpdate()">UPDATE</button>
                        </div>

                        <div class="metrics-grid">
                            <div class="metric-tile">
                                <span class="metric-label">WEIGHT</span>
                                <span class="metric-val">${this.data.metrics.weight}<span class="metric-unit">kg</span></span>
                            </div>
                            <div class="metric-tile">
                                <span class="metric-label">BODY FAT</span>
                                <span class="metric-val">${this.data.metrics.fat}<span class="metric-unit">%</span></span>
                            </div>
                            <div class="metric-tile">
                                <span class="metric-label">WAIST</span>
                                <span class="metric-val">${this.data.metrics.waist}<span class="metric-unit">cm</span></span>
                            </div>
                            <div class="metric-tile">
                                <span class="metric-label">CHEST</span>
                                <span class="metric-val">${this.data.metrics.chest}<span class="metric-unit">cm</span></span>
                            </div>
                            <div class="metric-tile">
                                <span class="metric-label">BICEP</span>
                                <span class="metric-val">${this.data.metrics.biceps}<span class="metric-unit">cm</span></span>
                            </div>
                            <div class="metric-tile">
                                <span class="metric-label">THIGH</span>
                                <span class="metric-val">${this.data.metrics.thigh}<span class="metric-unit">cm</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    initCharts() {
        const ctx = document.getElementById('muscleHeatmapChart');
        if (!ctx) return;

        // For the Radar chart data
        const labels = Object.keys(this.data.muscleVolumeWeek);
        const values = Object.values(this.data.muscleVolumeWeek);

        if (this.muscleChart) this.muscleChart.destroy();

        this.muscleChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Volume (kg)',
                    data: values,
                    backgroundColor: 'rgba(89, 209, 149, 0.1)',
                    borderColor: '#59d195',
                    pointBackgroundColor: '#59d195',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#59d195',
                    borderWidth: 2,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.05)' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        pointLabels: { color: '#8a8a8a', font: { size: 10, family: 'Inter' } },
                        ticks: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    handleMetricUpdate() {
        const key = document.getElementById('metric-select').value;
        const val = document.getElementById('metric-val-input').value;
        if (val) {
            this.updateMetric(key, val);
            document.getElementById('metric-val-input').value = '';
        }
    }
};

// Global Exposure
window.BodyAnalytics = BodyAnalytics;
