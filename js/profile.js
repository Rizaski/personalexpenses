// Profile Module
const profile = {
    db: null,
    userData: null,

    init() {
        profile.db = window.firebaseDb || firebase.firestore();

        // Attach form handlers
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => profile.updateProfile(e));
        }

        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => profile.changePassword(e));
        }
    },

    setUserData(userData) {
        profile.userData = userData;
        profile.load();
    },

    async load() {
        if (!auth.currentUser) return;

        try {
            const doc = await profile.db
                .collection('users')
                .doc(auth.currentUser.uid)
                .get();

            if (doc.exists) {
                const data = doc.data();
                document.getElementById('profile-name').value = data.name || '';
                document.getElementById('profile-email').value = data.email || auth.currentUser.email || '';
                document.getElementById('profile-mobile').value = data.mobile || '';
            } else {
                // Fallback to auth user email
                document.getElementById('profile-email').value = auth.currentUser.email || '';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            document.getElementById('profile-email').value = auth.currentUser.email || '';
        }
    },

    async updateProfile(event) {
        if (event) event.preventDefault();

        const profileData = {
            name: document.getElementById('profile-name').value,
            email: document.getElementById('profile-email').value,
            mobile: document.getElementById('profile-mobile').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!profileData.name || !profileData.email || !profileData.mobile) {
            await dialog.alert('Please fill in all fields', {
                title: 'Validation Error',
                type: 'warning'
            });
            return;
        }

        try {
            profile.showLoading();

            // Update user profile in Firestore
            await profile.db
                .collection('users')
                .doc(auth.currentUser.uid)
                .set(profileData, {
                    merge: true
                });

            // Update email in Firebase Auth if changed
            if (profileData.email !== auth.currentUser.email) {
                await auth.currentUser.updateEmail(profileData.email);
            }

            profile.userData = profileData;
            profile.hideLoading();
            await dialog.alert('Profile updated successfully!', {
                title: 'Success',
                type: 'success'
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            profile.hideLoading();
            await dialog.alert('Error: ' + (error.message || 'Unknown error'), {
                title: 'Error Updating Profile',
                type: 'error'
            });
        }
    },

    async changePassword(event) {
        if (event) event.preventDefault();

        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!oldPassword || !newPassword || !confirmPassword) {
            await dialog.alert('Please fill in all fields', {
                title: 'Validation Error',
                type: 'warning'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            await dialog.alert('New passwords do not match', {
                title: 'Validation Error',
                type: 'warning'
            });
            return;
        }

        if (newPassword.length < 6) {
            await dialog.alert('Password must be at least 6 characters', {
                title: 'Validation Error',
                type: 'warning'
            });
            return;
        }

        try {
            profile.showLoading();

            // Re-authenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(
                auth.currentUser.email,
                oldPassword
            );

            await auth.currentUser.reauthenticateWithCredential(credential);

            // Update password
            await auth.currentUser.updatePassword(newPassword);

            // Clear form
            document.getElementById('password-form').reset();

            profile.hideLoading();
            await dialog.alert('Password changed successfully!', {
                title: 'Success',
                type: 'success'
            });
        } catch (error) {
            console.error('Error changing password:', error);
            profile.hideLoading();

            let errorMessage = 'Error changing password';
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Current password is incorrect';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'New password is too weak';
            } else if (error.message) {
                errorMessage = error.message;
            }

            await dialog.alert(errorMessage, {
                title: 'Error Changing Password',
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