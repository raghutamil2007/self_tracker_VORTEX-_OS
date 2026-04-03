/* ====================================================
   MONEY PLANNER — money-planner.js
   Full state management with localStorage persistence
   ==================================================== */

(function initMoneyPlanner() {
    // ── State ──────────────────────────────────────────
    let state = {
        income: 0,
        categories: [],
        plans: [],
        monthlyLimit: 0,
        expenses: []
    };

    const STORAGE_KEY = 'titan_money_planner';

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                state = { ...state, ...parsed };
                // Ensure arrays exist if old state didn't have them
                if (!state.categories) state.categories = [];
                if (!state.plans) state.plans = [];
                if (!state.expenses) state.expenses = [];
            }
        } catch (e) { /* ignore */ }
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    loadState();

    // ── Helpers ────────────────────────────────────────
    const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');

    function totalBudgeted() {
        return state.categories.reduce((s, c) => s + (Number(c.budget) || 0), 0);
    }

    function totalSavingsGoalMonthly() {
        return state.plans.reduce((s, p) => s + (Number(p.monthly) || 0), 0);
    }

    function unallocated() {
        return Math.max(0, state.income - totalBudgeted() - totalSavingsGoalMonthly());
    }

    // ── DOM refs ───────────────────────────────────────
    const incomeDisplay    = () => document.getElementById('mp-income-display');
    const budgetedDisplay  = () => document.getElementById('mp-budgeted-display');
    const savingsDisplay   = () => document.getElementById('mp-savings-display');
    const freeDisplay      = () => document.getElementById('mp-free-display');
    const categoryList     = () => document.getElementById('mp-categories-list');
    const plansList        = () => document.getElementById('mp-plans-list');
    const catEmpty         = () => document.getElementById('mp-cat-empty');
    const plansEmpty       = () => document.getElementById('mp-plans-empty');

    // ── Render Overview ────────────────────────────────
    function renderOverview() {
        const inc   = state.income;
        const budg  = totalBudgeted();
        const sav   = totalSavingsGoalMonthly();
        const free  = Math.max(0, inc - budg - sav);

        if (incomeDisplay())   incomeDisplay().innerText   = fmt(inc);
        if (budgetedDisplay()) budgetedDisplay().innerText = fmt(budg);
        if (savingsDisplay())  savingsDisplay().innerText  = fmt(sav);
        if (freeDisplay())     freeDisplay().innerText     = fmt(free);

        // Allocation bar
        const spendPct = inc > 0 ? Math.min(100, (budg / inc) * 100) : 0;
        const savePct  = inc > 0 ? Math.min(100 - spendPct, (sav / inc) * 100) : 0;
        const freePct  = Math.max(0, 100 - spendPct - savePct);

        const spSeg = document.getElementById('mp-alloc-spending');
        const svSeg = document.getElementById('mp-alloc-savings');
        const frSeg = document.getElementById('mp-alloc-free');
        if (spSeg) spSeg.style.width = spendPct.toFixed(1) + '%';
        if (svSeg) svSeg.style.width = savePct.toFixed(1) + '%';
        if (frSeg) frSeg.style.width = freePct.toFixed(1) + '%';

        const spLabel = document.getElementById('mp-alloc-spending-pct');
        const svLabel = document.getElementById('mp-alloc-savings-pct');
        const frLabel = document.getElementById('mp-alloc-free-pct');
        if (spLabel) spLabel.innerText = `Spending ${spendPct.toFixed(0)}%`;
        if (svLabel) svLabel.innerText = `Savings ${savePct.toFixed(0)}%`;
        if (frLabel) frLabel.innerText = `Unallocated ${freePct.toFixed(0)}%`;
    }

    // ── Render Categories ──────────────────────────────
    function renderCategories() {
        const list  = categoryList();
        const empty = catEmpty();
        if (!list) return;

        list.innerHTML = '';

        if (state.categories.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        state.categories.forEach((cat, i) => {
            const budget = Number(cat.budget) || 0;
            const spent  = Number(cat.spent) || 0;
            const pct    = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
            const over   = spent > budget;

            const card = document.createElement('div');
            card.className = 'card mp-cat-card';
            card.innerHTML = `
                <div class="mp-cat-header">
                    <div class="mp-cat-name">${cat.name}</div>
                    <div class="mp-cat-actions">
                        <button class="mp-action-btn" data-edit="${i}" title="Edit"><i class="ph ph-pencil-simple"></i></button>
                        <button class="mp-action-btn delete" data-del="${i}" title="Delete"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
                <div class="mp-cat-amounts">
                    <span>Spent: <span class="mp-cat-spent-val">${fmt(spent)}</span></span>
                    <span>Budget: ${fmt(budget)}</span>
                </div>
                <div class="mp-cat-pct ${over ? 'over' : ''}">${over ? '⚠ Over budget' : pct + '% used'}</div>
                <div class="progress-bar mp-cat-bar">
                    <div class="progress-fill ${over ? 'over' : ''}" style="width:${pct}%"></div>
                </div>
            `;

            // Edit
            card.querySelector(`[data-edit="${i}"]`).addEventListener('click', () => openCatModal(i));
            // Delete
            card.querySelector(`[data-del="${i}"]`).addEventListener('click', () => {
                state.categories.splice(i, 1);
                saveState(); renderCategories(); renderOverview();
            });

            list.appendChild(card);
        });
    }

    // ── Render Plans ───────────────────────────────────
    function renderPlans() {
        const list  = plansList();
        const empty = plansEmpty();
        if (!list) return;

        list.innerHTML = '';

        if (state.plans.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        state.plans.forEach((plan, i) => {
            const target  = Number(plan.target) || 0;
            const saved   = Number(plan.saved) || 0;
            const monthly = Number(plan.monthly) || 0;
            const pct = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
            const remaining = Math.max(0, target - saved);
            const monthsLeft = monthly > 0 ? Math.ceil(remaining / monthly) : null;

            // ETA
            let etaText = '';
            if (monthsLeft !== null) {
                const etaDate = new Date();
                etaDate.setMonth(etaDate.getMonth() + monthsLeft);
                etaText = `At ${fmt(monthly)}/mo — target reached ~${etaDate.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
            }

            // Deadline
            let deadlineText = '';
            if (plan.date) {
                const [y, m] = plan.date.split('-');
                deadlineText = new Date(y, m - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase();
            }

            const card = document.createElement('div');
            card.className = 'card mp-plan-card';
            card.innerHTML = `
                <div class="mp-plan-header">
                    <div>
                        <div class="mp-plan-name">${plan.name}</div>
                        ${deadlineText ? `<div class="mp-plan-deadline"><i class="ph ph-calendar-blank"></i> BY ${deadlineText}</div>` : ''}
                    </div>
                    <div class="mp-plan-actions">
                        <button class="mp-action-btn" data-edit-plan="${i}" title="Edit"><i class="ph ph-pencil-simple"></i></button>
                        <button class="mp-action-btn delete" data-del-plan="${i}" title="Delete"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
                <div class="mp-plan-amounts">
                    <span>Saved: <span class="mp-plan-saved-val">${fmt(saved)}</span></span>
                    <span>Goal: <span class="mp-plan-target-val">${fmt(target)}</span></span>
                </div>
                <div class="progress-bar mp-plan-bar">
                    <div class="progress-fill" style="width:${pct}%"></div>
                </div>
                <div style="font-size:10px; color:#6b6b6b; margin-top:4px; letter-spacing:0.5px;">${pct}% complete · ${fmt(remaining)} remaining</div>
                ${etaText ? `<div class="mp-plan-eta"><i class="ph ph-clock"></i>${etaText}</div>` : ''}
            `;

            // Add-to-savings quick button
            const addSavedBtn = document.createElement('button');
            addSavedBtn.className = 'add-task-btn';
            addSavedBtn.style.marginTop = '12px';
            addSavedBtn.innerHTML = '<i class="ph ph-plus-circle"></i> LOG DEPOSIT';
            addSavedBtn.addEventListener('click', () => {
                const amt = prompt(`Add deposit to "${plan.name}" (₹):`);
                if (amt && !isNaN(amt) && Number(amt) > 0) {
                    state.plans[i].saved = (Number(state.plans[i].saved) || 0) + Number(amt);
                    saveState(); renderPlans(); renderOverview();
                }
            });
            card.appendChild(addSavedBtn);

            // Edit
            card.querySelector(`[data-edit-plan="${i}"]`).addEventListener('click', () => openPlanModal(i));
            // Delete
            card.querySelector(`[data-del-plan="${i}"]`).addEventListener('click', () => {
                state.plans.splice(i, 1);
                saveState(); renderPlans(); renderOverview();
            });

            list.appendChild(card);
        });
    }

    // ── INCOME MODAL ───────────────────────────────────
    function openModal(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'flex';
    }
    function closeModal(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }

    // Close on overlay click
    ['mp-income-modal','mp-category-modal','mp-plan-modal', 'mst-limit-modal'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', (e) => { if (e.target === el) closeModal(id); });
    });

    // Close buttons
    document.getElementById('mp-income-close')?.addEventListener('click', () => closeModal('mp-income-modal'));
    document.getElementById('mp-cat-close')?.addEventListener('click', () => closeModal('mp-category-modal'));
    document.getElementById('mp-plan-close')?.addEventListener('click', () => closeModal('mp-plan-modal'));
    document.getElementById('mst-limit-close')?.addEventListener('click', () => closeModal('mst-limit-modal'));

    // Open income modal
    document.getElementById('mp-set-income-btn')?.addEventListener('click', () => {
        const input = document.getElementById('mp-income-input');
        if (input) input.value = state.income || '';
        openModal('mp-income-modal');
        setTimeout(() => input?.focus(), 100);
    });

    // Save income
    document.getElementById('mp-income-save')?.addEventListener('click', () => {
        const val = Number(document.getElementById('mp-income-input')?.value || 0);
        if (val < 0) return;
        state.income = val;
        saveState(); renderOverview();
        closeModal('mp-income-modal');
    });

    // ── CATEGORY MODAL ─────────────────────────────────
    function openCatModal(editIndex = -1) {
        const titleEl = document.getElementById('mp-cat-modal-title');
        const saveEl  = document.getElementById('mp-cat-save');
        const nameEl  = document.getElementById('mp-cat-name');
        const amtEl   = document.getElementById('mp-cat-amount');
        const spentEl = document.getElementById('mp-cat-spent');
        const idxEl   = document.getElementById('mp-cat-edit-index');

        if (editIndex >= 0) {
            const cat = state.categories[editIndex];
            if (titleEl) titleEl.innerText = 'EDIT BUDGET CATEGORY';
            if (saveEl)  saveEl.innerText  = 'SAVE CHANGES';
            if (nameEl)  nameEl.value  = cat.name;
            if (amtEl)   amtEl.value   = cat.budget;
            if (spentEl) spentEl.value = cat.spent;
            if (idxEl)   idxEl.value   = editIndex;
        } else {
            if (titleEl)  titleEl.innerText = 'ADD BUDGET CATEGORY';
            if (saveEl)   saveEl.innerText  = 'ADD CATEGORY';
            if (nameEl)   nameEl.value  = '';
            if (amtEl)    amtEl.value   = '';
            if (spentEl)  spentEl.value = '';
            if (idxEl)    idxEl.value   = -1;
        }

        openModal('mp-category-modal');
        setTimeout(() => nameEl?.focus(), 100);
    }

    document.getElementById('mp-add-category-btn')?.addEventListener('click', () => openCatModal(-1));

    document.getElementById('mp-cat-save')?.addEventListener('click', () => {
        const name  = document.getElementById('mp-cat-name')?.value.trim();
        const budget = Number(document.getElementById('mp-cat-amount')?.value || 0);
        const spent  = Number(document.getElementById('mp-cat-spent')?.value || 0);
        const idx   = Number(document.getElementById('mp-cat-edit-index')?.value ?? -1);

        if (!name || budget <= 0) {
            alert('Please enter a category name and a budget amount greater than 0.');
            return;
        }

        const entry = { name, budget, spent };
        if (idx >= 0) {
            state.categories[idx] = entry;
        } else {
            state.categories.push(entry);
        }

        saveState(); renderCategories(); renderOverview();
        closeModal('mp-category-modal');
    });

    // ── PLAN MODAL ─────────────────────────────────────
    function openPlanModal(editIndex = -1) {
        const titleEl   = document.getElementById('mp-plan-modal-title');
        const saveEl    = document.getElementById('mp-plan-save');
        const nameEl    = document.getElementById('mp-plan-name');
        const targetEl  = document.getElementById('mp-plan-target');
        const savedEl   = document.getElementById('mp-plan-saved');
        const monthlyEl = document.getElementById('mp-plan-monthly');
        const dateEl    = document.getElementById('mp-plan-date');
        const idxEl     = document.getElementById('mp-plan-edit-index');

        if (editIndex >= 0) {
            const plan = state.plans[editIndex];
            if (titleEl)   titleEl.innerText   = 'EDIT SAVINGS PLAN';
            if (saveEl)    saveEl.innerText    = 'SAVE CHANGES';
            if (nameEl)    nameEl.value    = plan.name;
            if (targetEl)  targetEl.value  = plan.target;
            if (savedEl)   savedEl.value   = plan.saved;
            if (monthlyEl) monthlyEl.value = plan.monthly;
            if (dateEl)    dateEl.value    = plan.date || '';
            if (idxEl)     idxEl.value     = editIndex;
        } else {
            if (titleEl)   titleEl.innerText = 'CREATE SAVINGS PLAN';
            if (saveEl)    saveEl.innerText  = 'CREATE PLAN';
            if (nameEl)    nameEl.value    = '';
            if (targetEl)  targetEl.value  = '';
            if (savedEl)   savedEl.value   = '';
            if (monthlyEl) monthlyEl.value = '';
            if (dateEl)    dateEl.value    = '';
            if (idxEl)     idxEl.value     = -1;
        }

        openModal('mp-plan-modal');
        setTimeout(() => nameEl?.focus(), 100);
    }

    document.getElementById('mp-add-plan-btn')?.addEventListener('click', () => openPlanModal(-1));

    document.getElementById('mp-plan-save')?.addEventListener('click', () => {
        const name    = document.getElementById('mp-plan-name')?.value.trim();
        const target  = Number(document.getElementById('mp-plan-target')?.value  || 0);
        const saved   = Number(document.getElementById('mp-plan-saved')?.value   || 0);
        const monthly = Number(document.getElementById('mp-plan-monthly')?.value || 0);
        const date    = document.getElementById('mp-plan-date')?.value || '';
        const idx     = Number(document.getElementById('mp-plan-edit-index')?.value ?? -1);

        if (!name || target <= 0) {
            alert('Please enter a plan name and a target amount greater than 0.');
            return;
        }

        const entry = { name, target, saved, monthly, date };
        if (idx >= 0) {
            state.plans[idx] = entry;
        } else {
            state.plans.push(entry);
        }

        saveState(); renderPlans(); renderOverview();
        closeModal('mp-plan-modal');
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('mp-income-modal');
            closeModal('mp-category-modal');
            closeModal('mp-plan-modal');
            closeModal('mst-limit-modal');
        }
    });

    // ── Render Monthly Spending Tracker ────────────────
    function renderMST() {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        
        // Month Label
        const mLabel = document.getElementById('mst-month-label');
        if (mLabel) mLabel.innerText = now.toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase();
        
        const logMonth = document.getElementById('mst-log-month');
        if (logMonth) logMonth.innerText = now.toLocaleString('default', { month: 'long' }).toUpperCase();

        const limit = Number(state.monthlyLimit) || 0;
        
        // Filter expenses for current month
        const currentMonthExpenses = state.expenses.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === y && d.getMonth() === m;
        });

        const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const remaining = Math.max(0, limit - totalSpent);
        const pct = limit > 0 ? Math.min(100, Math.round((totalSpent / limit) * 100)) : 0;
        const overLimit = totalSpent > limit;

        // Set Stats
        const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
        setTxt('mst-spent-val', fmt(totalSpent));
        setTxt('mst-limit-val', limit > 0 ? fmt(limit) : '₹—');
        setTxt('mst-remaining-val', limit > 0 ? fmt(remaining) : '₹—');
        
        const remEl = document.getElementById('mst-remaining-val');
        if (remEl) {
            remEl.className = 'mst-stat-val ' + (overLimit ? 'red' : 'green');
        }

        // Days left & Avg
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const daysPassed = now.getDate();
        const daysLeft = daysInMonth - daysPassed;
        
        setTxt('mst-days-val', daysLeft);

        const avg = daysPassed > 0 ? totalSpent / daysPassed : 0;
        setTxt('mst-avg-val', totalSpent > 0 ? fmt(Math.round(avg)) : '₹—');

        const projected = avg * daysInMonth;
        setTxt('mst-projected-val', totalSpent > 0 ? fmt(Math.round(projected)) : '₹—');

        // Ring
        const ringFill = document.getElementById('mst-ring-fill');
        const ringPct = document.getElementById('mst-ring-pct');
        if (ringFill) {
            const dash = 414.69; 
            const offset = dash - (dash * pct) / 100;
            ringFill.style.strokeDashoffset = offset;
            if (overLimit) ringFill.classList.add('over');
            else ringFill.classList.remove('over');
        }
        if (ringPct) ringPct.innerText = pct + '%';

        // Thin Daily Bar
        const dailySafeLimit = limit > 0 ? Math.round(limit / daysInMonth) : 0;
        setTxt('mst-bar-spent-label', 'Spent ' + fmt(totalSpent));
        setTxt('mst-bar-limit-label', 'Limit ' + (limit > 0 ? fmt(limit) : '₹—'));
        
        const barFill = document.getElementById('mst-daily-fill');
        const safeLine = document.getElementById('mst-safe-line');
        const safeLabel = document.getElementById('mst-safe-label');
        
        if (barFill) {
            barFill.style.width = pct + '%';
            if (overLimit) barFill.classList.add('over');
            else barFill.classList.remove('over');
        }
        
        if (limit > 0) {
            const safePct = ((dailySafeLimit * daysPassed) / limit) * 100;
            if (safeLine) {
                safeLine.style.display = 'block';
                safeLine.style.left = Math.min(100, safePct) + '%';
            }
            if (safeLabel) {
                safeLabel.innerText = `Safe zone: spend ≤ ${fmt(dailySafeLimit)}/day to stay within limit`;
            }
        } else {
            if (safeLine) safeLine.style.display = 'none';
            if (safeLabel) safeLabel.innerText = 'Set a monthly limit to see safe zones.';
        }

        // Render List
        const entriesContainer = document.getElementById('mst-entries');
        if (entriesContainer) {
            // retain the empty state element
            const emptyEl = document.getElementById('mst-entries-empty');
            entriesContainer.innerHTML = '';
            if (emptyEl) entriesContainer.appendChild(emptyEl);
            
            if (currentMonthExpenses.length === 0) {
                if (emptyEl) emptyEl.style.display = 'flex';
            } else {
                if (emptyEl) emptyEl.style.display = 'none';
                
                // sort newest first
                currentMonthExpenses.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(exp => {
                    const el = document.createElement('div');
                    el.className = 'mst-entry';
                    
                    const dObj = new Date(exp.date);
                    const dateStr = dObj.toLocaleDateString('default', { day: 'numeric', month: 'short' });
                    
                    el.innerHTML = `
                        <div class="mst-entry-left">
                            <div class="mst-entry-note">${exp.note || 'Expense'}</div>
                            <div class="mst-entry-date">${dateStr}</div>
                        </div>
                        <div class="mst-entry-right">
                            <div class="mst-entry-amount">${fmt(exp.amount)}</div>
                            <button class="mst-del-btn" title="Delete"><i class="ph ph-x"></i></button>
                        </div>
                    `;
                    el.querySelector('.mst-del-btn').addEventListener('click', () => {
                        state.expenses = state.expenses.filter(e => e.id !== exp.id);
                        saveState();
                        renderMST();
                    });
                    entriesContainer.appendChild(el);
                });
            }
        }
    }

    // MST Events
    document.getElementById('mst-set-limit-btn')?.addEventListener('click', () => {
        const input = document.getElementById('mst-limit-input');
        if (input) input.value = state.monthlyLimit || '';
        openModal('mst-limit-modal');
        setTimeout(() => input?.focus(), 100);
    });

    document.getElementById('mst-limit-save')?.addEventListener('click', () => {
        const val = Number(document.getElementById('mst-limit-input')?.value || 0);
        state.monthlyLimit = val;
        saveState();
        renderMST();
        closeModal('mst-limit-modal');
    });

    document.getElementById('mst-add-btn')?.addEventListener('click', () => {
        const noteInput = document.getElementById('mst-note');
        const amtInput = document.getElementById('mst-amount');
        
        const note = noteInput?.value.trim() || 'Expense';
        const amount = Number(amtInput?.value || 0);
        
        if (amount > 0) {
            state.expenses.push({
                id: Date.now().toString(),
                date: new Date().toISOString(),
                note: note,
                amount: amount
            });
            saveState();
            renderMST();
            
            if (noteInput) noteInput.value = '';
            if (amtInput) amtInput.value = '';
            noteInput?.focus();
        }
    });

    document.getElementById('mst-clear-btn')?.addEventListener('click', () => {
        if(confirm("Are you sure you want to clear all expenses for this month?")) {
            const now = new Date();
            const y = now.getFullYear();
            const m = now.getMonth();
            
            state.expenses = state.expenses.filter(e => {
                const d = new Date(e.date);
                return !(d.getFullYear() === y && d.getMonth() === m);
            });
            saveState();
            renderMST();
        }
    });

    // ── Initial Render ─────────────────────────────────
    renderOverview();
    renderCategories();
    renderPlans();
    renderMST();

})();
