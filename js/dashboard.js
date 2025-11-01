// Dashboard Module
const dashboard = {
    db: null,
    budgetChart: null,
    categoryChart: null,
    refreshing: false,

    init() {
        dashboard.db = window.firebaseDb || firebase.firestore();
    },

    async refresh() {
        if (!auth.currentUser) return;

        try {
            // Don't show loading for real-time updates
            const isInitialLoad = !dashboard.refreshing;
            dashboard.refreshing = true;

            if (isInitialLoad) {
                dashboard.showLoading();
            }

            // Load all data in parallel
            const [expenses, received, budgets] = await Promise.all([
                dashboard.loadExpenses(),
                dashboard.loadReceived(),
                dashboard.loadBudgets()
            ]);

            dashboard.updateStats(expenses, received);
            dashboard.updateCharts(expenses, budgets);
            dashboard.updateRecentExpenses(expenses);
            dashboard.updateRecentReceived(received);
            dashboard.updateBudgetWarnings(expenses, budgets);

            if (isInitialLoad) {
                dashboard.hideLoading();
            }
            dashboard.refreshing = false;
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            dashboard.hideLoading();
            dashboard.refreshing = false;
        }
    },

    async loadExpenses() {
        const snapshot = await dashboard.db
            .collection('expenses')
            .where('userId', '==', auth.currentUser.uid)
            .orderBy('date', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    async loadReceived() {
        const snapshot = await dashboard.db
            .collection('received')
            .where('userId', '==', auth.currentUser.uid)
            .orderBy('date', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    async loadBudgets() {
        const doc = await dashboard.db
            .collection('budgets')
            .doc(auth.currentUser.uid)
            .get();

        return doc.exists ? doc.data() : {};
    },

    updateStats(expenses, received) {
        const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const totalReceived = received.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const netBalance = totalReceived - totalExpenses;

        document.getElementById('total-expenses').textContent =
            `MVR ${totalExpenses.toFixed(2)}`;
        document.getElementById('total-received').textContent =
            `MVR ${totalReceived.toFixed(2)}`;
        document.getElementById('net-balance').textContent =
            `MVR ${netBalance.toFixed(2)}`;

        // Color code net balance
        const balanceEl = document.getElementById('net-balance');
        balanceEl.style.color = netBalance >= 0 ? '#10b981' : '#ef4444';
    },

    updateCharts(expenses, budgets) {
        dashboard.updateBudgetChart(expenses, budgets);
        dashboard.updateCategoryChart(expenses);
    },

    updateBudgetChart(expenses, budgets) {
        const categories = ['Grocery', 'Cosmetics', 'Clothes', 'Miscellaneous'];
        const budgetData = categories.map(cat => parseFloat(budgets[cat.toLowerCase()] || 0));
        const expenseData = categories.map(cat => {
            return expenses
                .filter(e => e.category === cat)
                .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        });

        const ctx = document.getElementById('budget-chart').getContext('2d');

        if (dashboard.budgetChart) {
            dashboard.budgetChart.destroy();
        }

        dashboard.budgetChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                        label: 'Budget',
                        data: budgetData,
                        backgroundColor: 'rgba(37, 99, 235, 0.6)',
                        borderColor: 'rgba(37, 99, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: 'rgba(239, 68, 68, 0.6)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'MVR ' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': MVR ' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    },

    updateCategoryChart(expenses) {
        const categories = ['Grocery', 'Cosmetics', 'Clothes', 'Miscellaneous'];
        const categoryTotals = categories.map(cat => {
            return expenses
                .filter(e => e.category === cat)
                .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        });

        const ctx = document.getElementById('category-chart').getContext('2d');

        if (dashboard.categoryChart) {
            dashboard.categoryChart.destroy();
        }

        dashboard.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: categoryTotals,
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return label + ': MVR ' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    },

    updateRecentExpenses(expenses) {
        const recent = expenses.slice(0, 5);
        const container = document.getElementById('recent-expenses');

        if (recent.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p>No expenses yet</p></div>';
            return;
        }

        container.innerHTML = recent.map(expense => `
            <div class="item-card expense-card">
                <div class="item-header">
                    <div class="item-title">${expense.merchant || 'N/A'}</div>
                    <div class="item-amount">MVR ${parseFloat(expense.amount || 0).toFixed(2)}</div>
                </div>
                <div class="item-details">
                    <div>Purpose: ${expense.purpose || 'N/A'}</div>
                    <div>Category: ${expense.category || 'N/A'}</div>
                    <div>Date: ${expense.date || 'N/A'}</div>
                    <div>Purchase by: ${expense.purchaseBy || 'N/A'}</div>
                </div>
            </div>
        `).join('');
    },

    updateRecentReceived(received) {
        const recent = received.slice(0, 5);
        const container = document.getElementById('recent-received');

        if (recent.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p>No received payments yet</p></div>';
            return;
        }

        container.innerHTML = recent.map(item => `
            <div class="item-card received-card">
                <div class="item-header">
                    <div class="item-title">${item.payer || 'N/A'}</div>
                    <div class="item-amount">MVR ${parseFloat(item.amount || 0).toFixed(2)}</div>
                </div>
                <div class="item-details">
                    <div>Project: ${item.project || 'N/A'}</div>
                    <div>Payment Type: ${item.paymentType || 'N/A'}</div>
                    <div>Date: ${item.date || 'N/A'}</div>
                </div>
            </div>
        `).join('');
    },

    updateBudgetWarnings(expenses, budgets) {
        const warnings = [];
        const categories = ['Grocery', 'Cosmetics', 'Clothes', 'Miscellaneous'];

        categories.forEach(category => {
            const budget = parseFloat(budgets[category.toLowerCase()] || 0);
            if (budget > 0) {
                const spent = expenses
                    .filter(e => e.category === category)
                    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

                const usage = (spent / budget) * 100;

                if (usage >= 75) {
                    const remaining = budget - spent;
                    warnings.push({
                        category,
                        usage: usage.toFixed(1),
                        remaining: remaining.toFixed(2),
                        spent: spent.toFixed(2),
                        budget: budget.toFixed(2)
                    });
                }
            }
        });

        const container = document.getElementById('budget-warnings');

        if (warnings.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = warnings.map(w => `
            <div class="warning-card">
                <h3>⚠️ ${w.category} Budget Alert</h3>
                <p>You've used ${w.usage}% of your budget (MVR ${w.spent} of MVR ${w.budget})</p>
                <p>Remaining: MVR ${w.remaining}</p>
            </div>
        `).join('');
    },

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    },

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }
};