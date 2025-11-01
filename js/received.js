// Received Module
const received = {
    db: null,
    unsubscribe: null,

    init() {
        received.db = window.firebaseDb || firebase.firestore();
    },

    initRealTimeListeners() {
        if (!auth.currentUser) return;

        // Stop existing listener if any
        received.stopRealTimeListeners();

        // Set up real-time listener for received payments
        received.unsubscribe = received.db
            .collection('received')
            .where('userId', '==', auth.currentUser.uid)
            .orderBy('date', 'desc')
            .onSnapshot((snapshot) => {
                const receivedList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                received.render(receivedList);

                // Refresh dashboard when received changes
                if (window.dashboard && router.currentView === 'dashboard') {
                    dashboard.refresh();
                }
            }, (error) => {
                console.error('Error in received listener:', error);
            });
    },

    stopRealTimeListeners() {
        if (received.unsubscribe) {
            received.unsubscribe();
            received.unsubscribe = null;
        }
    },

    async load() {
        if (!auth.currentUser) return;

        try {
            received.showLoading();

            const snapshot = await received.db
                .collection('received')
                .where('userId', '==', auth.currentUser.uid)
                .orderBy('date', 'desc')
                .get();

            const receivedList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            received.render(receivedList);
            received.hideLoading();
        } catch (error) {
            console.error('Error loading received:', error);
            received.hideLoading();
        }
    },

    render(receivedList) {
        const container = document.getElementById('received-list');

        if (receivedList.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p>No received payments yet. Add your first received payment!</p></div>';
            return;
        }

        container.innerHTML = receivedList.map(item => `
            <div class="item-card received-card">
                <div class="item-header">
                    <div class="item-title">${item.payer || 'N/A'}</div>
                    <div class="item-amount">MVR ${parseFloat(item.amount || 0).toFixed(2)}</div>
                </div>
                <div class="item-details">
                    <div><strong>Project:</strong> ${item.project || 'N/A'}</div>
                    <div><strong>Payment Type:</strong> ${item.paymentType || 'N/A'}</div>
                    <div><strong>Date:</strong> ${item.date || 'N/A'}</div>
                    <div><strong>ID:</strong> ${item.uniqueId || item.id}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="received.edit('${item.id}')">Edit</button>
                    <button class="btn-small btn-delete" onclick="received.delete('${item.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    },

    showAddForm() {
        document.getElementById('received-form').reset();
        document.getElementById('received-id').value = '';
        document.getElementById('received-modal-title').textContent = 'Add Received';
        document.getElementById('received-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('received-modal').classList.add('active');
    },

    async edit(id) {
        try {
            received.showLoading();

            const doc = await received.db.collection('received').doc(id).get();
            if (!doc.exists) {
                alert('Received payment not found');
                received.hideLoading();
                return;
            }

            const item = doc.data();

            document.getElementById('received-id').value = id;
            document.getElementById('received-date').value = item.date || '';
            document.getElementById('received-payer').value = item.payer || '';
            document.getElementById('received-project').value = item.project || '';
            document.getElementById('received-amount').value = item.amount || '';
            document.getElementById('received-payment-type').value = item.paymentType || '';

            document.getElementById('received-modal-title').textContent = 'Edit Received';
            document.getElementById('received-modal').classList.add('active');

            received.hideLoading();
        } catch (error) {
            console.error('Error loading received:', error);
            received.hideLoading();
            alert('Error loading received payment');
        }
    },

    closeModal() {
        document.getElementById('received-modal').classList.remove('active');
    },

    async save(event) {
        if (event) event.preventDefault();

        const id = document.getElementById('received-id').value;
        const receivedData = {
            date: document.getElementById('received-date').value,
            payer: document.getElementById('received-payer').value,
            project: document.getElementById('received-project').value,
            amount: parseFloat(document.getElementById('received-amount').value),
            paymentType: document.getElementById('received-payment-type').value,
            userId: auth.currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!receivedData.date || !receivedData.payer || !receivedData.project ||
            !receivedData.amount || !receivedData.paymentType) {
            alert('Please fill in all fields');
            return;
        }

        try {
            received.showLoading();

            if (id) {
                // Update existing
                await received.db.collection('received').doc(id).update(receivedData);
            } else {
                // Create new with unique ID
                receivedData.uniqueId = 'REC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                receivedData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await received.db.collection('received').doc().set(receivedData);
            }

            received.closeModal();
            // Real-time listener will update the list automatically
            if (window.dashboard) dashboard.refresh();

            received.hideLoading();
        } catch (error) {
            console.error('Error saving received:', error);
            received.hideLoading();
            alert('Error saving received payment');
        }
    },

    async delete(id) {
        if (!confirm('Are you sure you want to delete this received payment?')) return;

        try {
            received.showLoading();
            await received.db.collection('received').doc(id).delete();
            // Real-time listener will update the list automatically
            if (window.dashboard) dashboard.refresh();
            received.hideLoading();
        } catch (error) {
            console.error('Error deleting received:', error);
            received.hideLoading();
            alert('Error deleting received payment');
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
    const form = document.getElementById('received-form');
    if (form) {
        form.addEventListener('submit', (e) => received.save(e));
    }
});