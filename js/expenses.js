// Expenses Module
const expenses = {
    db: null,
    unsubscribe: null,

    init() {
        expenses.db = window.firebaseDb || firebase.firestore();
    },

    initRealTimeListeners() {
        if (!auth.currentUser) return;

        // Stop existing listener if any
        expenses.stopRealTimeListeners();

        // Set up real-time listener for expenses
        try {
            expenses.unsubscribe = expenses.db
                .collection('expenses')
                .where('userId', '==', auth.currentUser.uid)
                .orderBy('date', 'desc')
                .onSnapshot((snapshot) => {
                    const expensesList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    console.log('Expenses loaded:', expensesList.length);
                    expenses.render(expensesList);

                    // Refresh dashboard when expenses change
                    if (window.dashboard && router.currentView === 'dashboard') {
                        dashboard.refresh();
                    }
                }, (error) => {
                    console.error('Error in expenses listener:', error);
                    if (error.code === 'failed-precondition') {
                        console.error('Index required. Please create the composite index in Firebase Console.');
                        dialog.alert('Database index required. Click the link in the console to create it, or create it manually in Firebase Console → Firestore → Indexes.', {
                            title: 'Index Required',
                            type: 'warning'
                        });
                    } else {
                        dialog.alert('Error loading expenses: ' + error.message, {
                            title: 'Error',
                            type: 'error'
                        });
                    }
                    // Fallback: Load without ordering
                    expenses.loadWithoutOrderBy();
                });
        } catch (error) {
            console.error('Error setting up expenses listener:', error);
            expenses.loadWithoutOrderBy();
        }
    },

    stopRealTimeListeners() {
        if (expenses.unsubscribe) {
            expenses.unsubscribe();
            expenses.unsubscribe = null;
        }
    },

    async load() {
        if (!auth.currentUser) return;

        try {
            expenses.showLoading();

            const snapshot = await expenses.db
                .collection('expenses')
                .where('userId', '==', auth.currentUser.uid)
                .orderBy('date', 'desc')
                .get();

            const expensesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log('Expenses loaded:', expensesList.length);
            expenses.render(expensesList);
            expenses.hideLoading();
        } catch (error) {
            console.error('Error loading expenses:', error);
            expenses.hideLoading();

            if (error.code === 'failed-precondition') {
                await dialog.alert('Database index required. Please create the composite index in Firebase Console → Firestore → Indexes.', {
                    title: 'Index Required',
                    type: 'warning'
                });
                // Fallback: Load without ordering
                await expenses.loadWithoutOrderBy();
            } else {
                await dialog.alert('Error loading expenses: ' + error.message, {
                    title: 'Error',
                    type: 'error'
                });
            }
        }
    },

    async loadWithoutOrderBy() {
        if (!auth.currentUser) return;

        try {
            console.log('Loading expenses without orderBy...');
            const snapshot = await expenses.db
                .collection('expenses')
                .where('userId', '==', auth.currentUser.uid)
                .get();

            const expensesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort client-side
            expensesList.sort((a, b) => {
                const dateA = a.date || '';
                const dateB = b.date || '';
                return dateB.localeCompare(dateA);
            });

            expenses.render(expensesList);
        } catch (error) {
            console.error('Error loading expenses without orderBy:', error);
            await dialog.alert('Error loading expenses: ' + error.message, {
                title: 'Error',
                type: 'error'
            });
        }
    },

    render(expensesList) {
        const container = document.getElementById('expenses-list');

        if (expensesList.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p>No expenses yet. Add your first expense!</p></div>';
            return;
        }

        container.innerHTML = expensesList.map(expense => `
            <div class="item-card expense-card">
                <div class="item-header">
                    <div class="item-title">${expense.merchant || 'N/A'}</div>
                    <div class="item-amount">MVR ${parseFloat(expense.amount || 0).toFixed(2)}</div>
                </div>
                <div class="item-details">
                    <div><strong>Purpose:</strong> ${expense.purpose || 'N/A'}</div>
                    <div><strong>Category:</strong> ${expense.category || 'N/A'}</div>
                    <div><strong>Date:</strong> ${expense.date || 'N/A'}</div>
                    <div><strong>Purchase by:</strong> ${expense.purchaseBy || 'N/A'}</div>
                    <div><strong>ID:</strong> ${expense.uniqueId || expense.id}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="expenses.edit('${expense.id}')">Edit</button>
                    <button class="btn-small btn-delete" onclick="expenses.delete('${expense.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    },

    showAddForm() {
        document.getElementById('expense-form').reset();
        document.getElementById('expense-id').value = '';
        document.getElementById('expense-modal-title').textContent = 'Add Expense';
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('expense-modal').classList.add('active');
    },

    async edit(id) {
        try {
            expenses.showLoading();

            const doc = await expenses.db.collection('expenses').doc(id).get();
            if (!doc.exists) {
                expenses.hideLoading();
                await dialog.alert('Expense not found', {
                    title: 'Not Found',
                    type: 'warning'
                });
                return;
            }

            const expense = doc.data();

            document.getElementById('expense-id').value = id;
            document.getElementById('expense-date').value = expense.date || '';
            document.getElementById('expense-merchant').value = expense.merchant || '';
            document.getElementById('expense-purpose').value = expense.purpose || '';
            document.getElementById('expense-amount').value = expense.amount || '';
            document.getElementById('expense-category').value = expense.category || '';
            document.getElementById('expense-purchase-by').value = expense.purchaseBy || '';

            document.getElementById('expense-modal-title').textContent = 'Edit Expense';
            document.getElementById('expense-modal').classList.add('active');

            expenses.hideLoading();
        } catch (error) {
            console.error('Error loading expense:', error);
            expenses.hideLoading();
            await dialog.alert('Error loading expense', {
                title: 'Error',
                type: 'error'
            });
        }
    },

    closeModal() {
        document.getElementById('expense-modal').classList.remove('active');
    },

    async save(event) {
        if (event) event.preventDefault();

        const id = document.getElementById('expense-id').value;
        const expenseData = {
            date: document.getElementById('expense-date').value,
            merchant: document.getElementById('expense-merchant').value,
            purpose: document.getElementById('expense-purpose').value,
            amount: parseFloat(document.getElementById('expense-amount').value),
            category: document.getElementById('expense-category').value,
            purchaseBy: document.getElementById('expense-purchase-by').value,
            userId: auth.currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!expenseData.date || !expenseData.merchant || !expenseData.purpose ||
            !expenseData.amount || !expenseData.category || !expenseData.purchaseBy) {
            await dialog.alert('Please fill in all fields', {
                title: 'Validation Error',
                type: 'warning'
            });
            return;
        }

        try {
            expenses.showLoading();

            if (id) {
                // Update existing
                await expenses.db.collection('expenses').doc(id).update(expenseData);
                console.log('Expense updated:', id);
            } else {
                // Create new with unique ID
                expenseData.uniqueId = 'EXP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                expenseData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                const docRef = expenses.db.collection('expenses').doc();
                await docRef.set(expenseData);
                console.log('Expense created:', docRef.id);
            }

            expenses.closeModal();

            // Show success message
            await dialog.alert(id ? 'Expense updated successfully!' : 'Expense added successfully!', {
                title: 'Success',
                type: 'success'
            });

            // Real-time listener will update the list automatically
            if (window.dashboard) dashboard.refresh();

            expenses.hideLoading();
        } catch (error) {
            console.error('Error saving expense:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            expenses.hideLoading();

            let errorMessage = 'Error saving expense';
            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please check Firestore security rules.';
            } else if (error.code === 'unavailable') {
                errorMessage = 'Firestore is temporarily unavailable. Please try again.';
            } else if (error.message) {
                errorMessage = 'Error: ' + error.message;
            }

            await dialog.alert(errorMessage, {
                title: 'Error Saving Expense',
                type: 'error'
            });
        }
    },

    async delete(id) {
        const confirmed = await dialog.confirm('Are you sure you want to delete this expense?', {
            title: 'Delete Expense',
            type: 'warning'
        });
        if (!confirmed) return;

        try {
            expenses.showLoading();
            await expenses.db.collection('expenses').doc(id).delete();
            // Real-time listener will update the list automatically
            if (window.dashboard) dashboard.refresh();
            expenses.hideLoading();
        } catch (error) {
            console.error('Error deleting expense:', error);
            expenses.hideLoading();
            await dialog.alert('Error deleting expense', {
                title: 'Error',
                type: 'error'
            });
        }
    },

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    },

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }
};

// Attach form submit handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('expense-form');
    if (form) {
        form.addEventListener('submit', (e) => expenses.save(e));
    }
});