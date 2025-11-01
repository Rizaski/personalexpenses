// Authentication Module
const auth = {
    currentUser: null,

    init() {
        // Wait for Firebase to be ready
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.error('Firebase is not loaded. Please check your Firebase configuration.');
            return;
        }

        auth.auth = window.firebaseAuth || firebase.auth();
        auth.db = window.firebaseDb || firebase.firestore();

        // Listen for auth state changes
        auth.auth.onAuthStateChanged(async (user) => {
            if (user) {
                auth.currentUser = user;
                console.log('User authenticated:', user.email);

                try {
                    // Load user profile (don't wait if it fails)
                    await auth.loadUserProfile().catch(err => {
                        console.warn('Failed to load user profile:', err);
                        // Create basic profile if it doesn't exist
                        return auth.createBasicProfile();
                    });

                    // Hide loading overlay
                    auth.hideLoading();

                    // Navigate to app
                    if (typeof router !== 'undefined' && router) {
                        router.showApp();
                    } else if (window.router) {
                        window.router.showApp();
                    } else {
                        console.error('Router not found');
                        // Fallback: manually show app screen
                        const authScreen = document.getElementById('auth-screen');
                        const appScreen = document.getElementById('app-screen');
                        if (authScreen) authScreen.classList.remove('active');
                        if (appScreen) appScreen.classList.add('active');
                    }

                    // Initialize dashboard and listeners
                    if (window.dashboard) {
                        dashboard.refresh();
                    }

                    // Initialize real-time listeners
                    if (window.expenses) expenses.initRealTimeListeners();
                    if (window.received) received.initRealTimeListeners();
                    if (window.budget) budget.initRealTimeListeners();
                } catch (error) {
                    console.error('Error after login:', error);
                    auth.hideLoading();
                    // Still navigate even if something fails
                    if (window.router) {
                        router.showApp();
                    }
                }
            } else {
                auth.currentUser = null;
                auth.hideLoading();
                if (window.router) {
                    router.showAuth();
                }
                // Stop real-time listeners
                if (window.expenses) expenses.stopRealTimeListeners();
                if (window.received) received.stopRealTimeListeners();
                if (window.budget) budget.stopRealTimeListeners();
            }
        });
    },

    async loadUserProfile() {
        if (!auth.currentUser) {
            return Promise.resolve();
        }

        try {
            const userDoc = await auth.db.collection('users').doc(auth.currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (window.profile) {
                    profile.setUserData(userData);
                }
            } else {
                console.log('User profile does not exist, creating basic profile...');
                // Profile doesn't exist - will be created by createBasicProfile
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            throw error; // Re-throw to be caught by caller
        }
    },

    async createBasicProfile() {
        if (!auth.currentUser) return Promise.resolve();

        try {
            const email = auth.currentUser.email || '';
            const displayName = auth.currentUser.displayName || '';
            const userName = displayName || (email ? email.split('@')[0] : '') || 'User';

            const basicProfile = {
                email: email,
                name: userName,
                mobile: '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await auth.db.collection('users').doc(auth.currentUser.uid).set(basicProfile, {
                merge: true
            });
            console.log('Basic profile created');

            if (window.profile) {
                profile.setUserData(basicProfile);
            }
        } catch (error) {
            console.error('Error creating basic profile:', error);
            // Don't throw - just log it. Profile can be created later when rules are fixed.
            console.warn('Profile creation failed. This is usually due to Firestore security rules.');
        }

        return Promise.resolve();
    },


    showError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('active');
        }

        const loginError = document.getElementById('login-error');
        if (loginError) {
            loginError.textContent = message;
            loginError.style.display = 'block';
        }
    },

    hideError() {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.classList.remove('active');
        }

        const loginError = document.getElementById('login-error');
        if (loginError) {
            loginError.style.display = 'none';
        }
    },

    async login() {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');

        if (!emailInput || !passwordInput) {
            console.error('Login form elements not found');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            auth.showError('Please fill in all fields');
            return;
        }

        try {
            auth.showLoading();

            // Use the auth instance from init
            if (!auth.auth) {
                auth.auth = firebase.auth();
            }

            const userCredential = await auth.auth.signInWithEmailAndPassword(email, password);
            console.log('Login successful:', userCredential.user.email);
            auth.hideError();
            // Don't hide loading here - let auth state change handle it
            // Auth state change listener will handle navigation
        } catch (error) {
            console.error('Login error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            auth.hideLoading();
            auth.showError(auth.getErrorMessage(error));
        }
    },

    async signup() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const mobile = document.getElementById('signup-mobile').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (!name || !email || !mobile || !password || !confirmPassword) {
            auth.showError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            auth.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            auth.showError('Password must be at least 6 characters');
            return;
        }

        try {
            auth.showLoading();
            const userCredential = await auth.auth.createUserWithEmailAndPassword(email, password);

            // Save user profile to Firestore
            await auth.db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                mobile: mobile,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            auth.hideError();
        } catch (error) {
            auth.hideLoading();
            auth.showError(this.getErrorMessage(error));
        }
    },

    async logout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                await auth.auth.signOut();
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
    },

    getErrorMessage(error) {
        if (!error) return 'An unknown error occurred';

        switch (error.code) {
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/user-disabled':
                return 'User account is disabled';
            case 'auth/user-not-found':
                return 'No account found with this email. Please create an account first or check your email address.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/invalid-credential':
                return 'Invalid email or password. Please check your credentials.';
            case 'auth/email-already-in-use':
                return 'Email already in use';
            case 'auth/weak-password':
                return 'Password is too weak';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            case 'auth/too-many-requests':
                return 'Too many failed login attempts. Please try again later.';
            default:
                return error.message || 'An error occurred: ' + (error.code || 'Unknown error');
        }
    },

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    },

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }
};

// Helper function to create a test account (run in browser console)
// Usage: createTestAccount('test@example.com', 'password123', 'Test User', '1234567890')
window.createTestAccount = async function(email, password, name, mobile) {
    try {
        console.log('Creating test account...');
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        console.log('User created:', userCredential.user.uid);

        // Save user profile
        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
            name: name || 'Test User',
            email: email,
            mobile: mobile || '0000000000',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Test account created successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('You can now login with these credentials.');
        alert('Test account created! You can now login.\n\nEmail: ' + email + '\nPassword: ' + password);
    } catch (error) {
        console.error('Error creating test account:', error);
        alert('Error: ' + error.message);
    }
};