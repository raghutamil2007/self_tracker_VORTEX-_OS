/* 
 * TITAN OS - Data State
 * You can feed or update this data. The app will react to changes here.
 */

const titanData = {
    // Current day scores (%)
    currentScores: {
        body: 71,
        mind: 100,
        money: 86,
        general: 50
    },

    // Points earned today vs total posssible
    points: {
        body: { earned: 10, total: 14 },
        mind: { earned: 9, total: 9 },
        money: { earned: 12, total: 14 },
        general: { earned: 2, total: 4 }
    },

    // Last week vs this week tracking
    vsLastWeek: {
        body: { change: 21, lastWeek: 61, thisWeek: 82 },
        mind: { change: 70, lastWeek: 16, thisWeek: 86 },
        money: { change: 41, lastWeek: 14, thisWeek: 55 },
        general: { change: 36, lastWeek: 14, thisWeek: 50 }
    },

    // Historical data for 7 days trend lines (mini charts)
    // Recent to oldest? Let's say left to right (oldest to newest)
    history7Days: {
        body:    [60, 65, 50, 75, 80, 65, 71],
        mind:    [80, 85, 90, 85, 95, 100, 100],
        money:   [40, 45, 60, 55, 70, 80, 86],
        general: [60, 50, 40, 50, 60, 40, 50]
    },

    // Analytics Chart Data
    trendDates: ['03-11', '03-12', '03-13', '03-14', '03-15', '03-16', '03-17'],
    titanScoreTrend: [85, 90, 60, 30, 35, 90, 85]
};

// Expose update function to rerender UI (to be implemented in app.js)
window.updateTitanData = function(newData) {
    Object.assign(titanData, newData);
    if(window.renderTitanUI) {
        window.renderTitanUI();
    }
};
