// Router Module
const router = {
    currentView: 'dashboard',

    init() {
        // Don't navigate on init - wait for auth
        // router.navigate('dashboard');
        console.log('Router initialized');
    },

    navigate(view) {
        router.currentView = view;

        // Hide all views
        document.querySelectorAll('.view').forEach(v => {
            v.style.display = 'none';
        });

        // Show selected view
        const viewElement = document.getElementById(`${view}-view`);
        if (viewElement) {
            viewElement.style.display = 'block';
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Find the active nav button - check if event exists first
        let navBtn = null;
        if (typeof event !== 'undefined' && event && event.target) {
            navBtn = event.target.closest('.nav-btn');
        }

        // If no nav button from event, find by view
        if (!navBtn) {
            navBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => {
                const onclickStr = btn.onclick ? btn.onclick.toString() : '';
                return onclickStr.includes(`'${view}'`);
            });
        }
        if (navBtn) {
            navBtn.classList.add('active');
        }

        // Refresh view data - real-time listeners handle updates automatically
        // Only manually load if listeners aren't active
        if (view === 'dashboard' && window.dashboard) {
            dashboard.refresh();
        } else if (view === 'expenses' && window.expenses && !expenses.unsubscribe) {
            expenses.load();
        } else if (view === 'received' && window.received && !received.unsubscribe) {
            received.load();
        } else if (view === 'budget' && window.budget && !budget.unsubscribe) {
            budget.load();
        } else if (view === 'profile' && window.profile) {
            profile.load();
        }
    },

    showAuth() {
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('app-screen').classList.remove('active');
    },

    showApp() {
        console.log('Showing app screen...');
        const authScreen = document.getElementById('auth-screen');
        const appScreen = document.getElementById('app-screen');

        if (authScreen) {
            authScreen.classList.remove('active');
        }

        if (appScreen) {
            appScreen.classList.add('active');
            router.navigate('dashboard');
        } else {
            console.error('App screen element not found');
        }
    }
};