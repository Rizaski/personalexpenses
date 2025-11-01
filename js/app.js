// Main Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initializing...');

    // Check Firebase configuration
    if (!isFirebaseConfigured()) {
        dialog.alert('Please update js/firebase-config.js with your Firebase credentials.\n\nYou can find them in:\nFirebase Console → Project Settings → General → Your apps', {
            title: 'Firebase Configuration Required',
            type: 'warning'
        });
        return;
    }

    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not loaded!');
        dialog.alert('Please check your internet connection and try again.', {
            title: 'Firebase SDK Not Loaded',
            type: 'error'
        });
        return;
    }

    console.log('Firebase is loaded:', firebase.apps.length > 0);

    // Initialize modules with error handling
    try {
        console.log('Initializing auth...');
        if (typeof auth !== 'undefined') {
            auth.init();
        } else {
            throw new Error('auth module not found');
        }

        console.log('Initializing router...');
        if (typeof router !== 'undefined') {
            router.init();
        } else {
            throw new Error('router module not found');
        }

        console.log('Initializing dashboard...');
        if (typeof dashboard !== 'undefined') {
            dashboard.init();
        }

        console.log('Initializing expenses...');
        if (typeof expenses !== 'undefined') {
            expenses.init();
        }

        console.log('Initializing received...');
        if (typeof received !== 'undefined') {
            received.init();
        }

        console.log('Initializing budget...');
        if (typeof budget !== 'undefined') {
            budget.init();
        }

        console.log('Initializing profile...');
        if (typeof profile !== 'undefined') {
            profile.init();
        }

        console.log('All modules initialized successfully');
    } catch (error) {
        console.error('Error initializing modules:', error);
        console.error('Error stack:', error.stack);
        dialog.alert('Error: ' + error.message + '\n\nPlease check the console for more details.', {
            title: 'Initialization Error',
            type: 'error'
        });
    }

    // Close modals on outside click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
        // Close custom dialogs on overlay click
        if (e.target.classList.contains('custom-dialog-overlay')) {
            dialog.closeDialog(false);
        }
    });

    // Enable Enter key for login
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');

    if (loginEmail && loginPassword) {
        [loginEmail, loginPassword].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    auth.login();
                }
            });
        });
    }
});