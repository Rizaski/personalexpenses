# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started** (if first time)
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Click **Save**

## Step 3: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Select **Start in test mode** (for development) or **Production mode** (with custom rules)
4. Choose a location (select closest to your users)
5. Click **Enable**

### Recommended Security Rules

After enabling Firestore, go to **Rules** tab and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Expenses collection - users can only read/write their own expenses
    match /expenses/{expenseId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Received collection - users can only read/write their own received payments
    match /received/{receivedId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Budgets collection - users can only read/write their own budgets
    match /budgets/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

**Important:** For production, make sure to review and update these rules according to your security requirements!

## Step 4: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to **Project Overview**
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. Click the web icon (`</>`) to add a web app, or select an existing web app
5. Register your app (give it a nickname if prompted)
6. Copy the Firebase configuration object

It should look like this:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyD9myt189w1KWFrmNkNJPWBTSnTcQYD26A",
    authDomain: "personalexpenses-8763d.firebaseapp.com",
    projectId: "personalexpenses-8763d",
    storageBucket: "personalexpenses-8763d.firebasestorage.app",
    messagingSenderId: "394451487547",
    appId: "1:394451487547:web:6750a0d5dcd5f559f8051e"
};
```

## Step 5: Update Application Configuration

1. Open `js/firebase-config.js` in your project
2. Replace the placeholder values with your actual Firebase configuration
3. Save the file

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
    projectId: "YOUR_ACTUAL_PROJECT_ID",
    storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
    messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
    appId: "YOUR_ACTUAL_APP_ID"
};
```

## Step 6: Create Firestore Indexes

When you first run queries that use both `where` and `orderBy`, Firebase will prompt you to create indexes. Click the provided link to create them automatically.

Alternatively, you can create them manually:

1. Go to **Firestore Database** → **Indexes** tab
2. Click **Create Index**
3. Create the following indexes:

### For Expenses Collection:
- **Collection ID:** `expenses`
- **Fields to index:**
  - `userId` (Ascending)
  - `date` (Descending)
- **Query scope:** Collection
- Click **Create**

### For Received Collection:
- **Collection ID:** `received`
- **Fields to index:**
  - `userId` (Ascending)
  - `date` (Descending)
- **Query scope:** Collection
- Click **Create**

## Step 7: Test Your Setup

1. Open `index.html` in a web browser
2. Try signing up with a test account
3. If everything is configured correctly, you should be able to:
   - Sign up successfully
   - Login
   - Add expenses and received payments
   - Set budgets

## Troubleshooting

### "Firebase configuration required" warning
- Make sure you've updated `js/firebase-config.js` with your actual Firebase credentials

### "Permission denied" errors
- Check your Firestore security rules
- Make sure Authentication is enabled
- Verify the user is logged in

### Index errors
- Create the required composite indexes as described in Step 6
- Firebase will provide a link in the console error message

### Authentication errors
- Verify Email/Password authentication is enabled
- Check that the email format is correct
- Ensure password is at least 6 characters

## Next Steps

Once Firebase is configured:
1. Test the application thoroughly
2. Consider setting up Firebase Hosting for deployment
3. Review and customize Firestore security rules for production
4. Set up Firebase Analytics if needed

## Support

If you encounter issues:
- Check the browser console for error messages
- Verify all Firebase services are enabled
- Ensure all configuration values are correct
- Review Firebase documentation: https://firebase.google.com/docs

