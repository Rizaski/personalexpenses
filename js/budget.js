// Budget Module
const budget = {
    db: null,
    unsubscribe: null,

    init() {
        budget.db = window.firebaseDb || firebase.firestore();
    },

    initRealTimeListeners() {
        if (!auth.currentUser) return;

        // Stop existing listener if any
        budget.stopRealTimeListeners();

        // Set up real-time listener for budgets
        budget.unsubscribe = budget.db
            .collection('budgets')
            .doc(auth.currentUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    document.getElementById('budget-grocery').value = data.grocery || '';
                    document.getElementById('budget-cosmetics').value = data.cosmetics || '';
                    document.getElementById('budget-clothes').value = data.clothes || '';
                    document.getElementById('budget-miscellaneous').value = data.miscellaneous || '';

                    // Refresh dashboard when budgets change
                    if (window.dashboard && router.currentView === 'dashboard') {
                        dashboard.refresh();
                    }
                }
            }, (error) => {
                console.error('Error in budget listener:', error);
            });
    },

    stopRealTimeListeners() {
        if (budget.unsubscribe) {
            budget.unsubscribe();
            budget.unsubscribe = null;
        }
    },

    async load() {
        if (!auth.currentUser) return;

        try {
            const doc = await budget.db
                .collection('budgets')
                .doc(auth.currentUser.uid)
                .get();

            if (doc.exists) {
                const data = doc.data();
                document.getElementById('budget-grocery').value = data.grocery || '';
                document.getElementById('budget-cosmetics').value = data.cosmetics || '';
                document.getElementById('budget-clothes').value = data.clothes || '';
                document.getElementById('budget-miscellaneous').value = data.miscellaneous || '';
            }
        } catch (error) {
            console.error('Error loading budgets:', error);
        }
    },

    async save() {
        if (!auth.currentUser) return;

        const budgetData = {
            grocery: parseFloat(document.getElementById('budget-grocery').value) || 0,
            cosmetics: parseFloat(document.getElementById('budget-cosmetics').value) || 0,
            clothes: parseFloat(document.getElementById('budget-clothes').value) || 0,
            miscellaneous: parseFloat(document.getElementById('budget-miscellaneous').value) || 0,
            userId: auth.currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            budget.showLoading();

            await budget.db
                .collection('budgets')
                .doc(auth.currentUser.uid)
                .set(budgetData, {
                    merge: true
                });

            budget.hideLoading();
            alert('Budgets saved successfully!');
            // Real-time listener will update the UI automatically
        } catch (error) {
            console.error('Error saving budgets:', error);
            budget.hideLoading();
            alert('Error saving budgets');
        }
    },

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    },

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }
};