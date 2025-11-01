# Personal Expense Manager

A complete, responsive mobile-first web application for managing personal expenses with Firebase backend.

## Features

- **Dashboard**: Visual charts, graphs, expense vs budget tracking, and budget warnings (when usage exceeds 75%)
- **Expenses**: Track expenses with unique ID, date, merchant, purpose, amount, category, and purchase by
- **Received**: Track received payments with unique ID, date, payer, project, amount, and payment type
- **Budget Settings**: Set budgets for Grocery, Cosmetics, Clothes, and Miscellaneous categories
- **User Profile**: Manage profile information and change password

## Technology Stack

- HTML5
- CSS3 (Mobile-first responsive design)
- Vanilla JavaScript
- Firebase Authentication
- Cloud Firestore Database
- Chart.js for data visualization

## Currency

All amounts are displayed in Maldivian Rufiyaa (MVR).

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
4. Enable Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Start in test mode (or set up security rules as needed)
   - Choose a location
5. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click on the web icon (`</>`) or create a new web app
   - Copy the Firebase configuration object

### 2. Update Firebase Configuration

Open `js/firebase-config.js` and replace the placeholder values with your Firebase credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Firestore Security Rules (Recommended)

Update your Firestore security rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    match /received/{receivedId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    match /budgets/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### 4. Firestore Indexes

You may need to create composite indexes for queries. Firebase will prompt you with a link when needed.

Create indexes for:
- `expenses` collection: `userId` (Ascending), `date` (Descending)
- `received` collection: `userId` (Ascending), `date` (Descending)

### 5. Run the Application

Simply open `index.html` in a web browser. For best experience:
- Use a local web server (e.g., Python's `python -m http.server` or Node's `http-server`)
- Or deploy to Firebase Hosting

## Usage

1. **Sign Up**: Create a new account with your email and password
2. **Dashboard**: View your financial overview, charts, and budget warnings
3. **Expenses**: Add and manage your expenses
4. **Received**: Track received payments
5. **Budget**: Set monthly budgets for different categories
6. **Profile**: Update your profile and change password

## Project Structure

```
PersonalEXP/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Stylesheet
├── js/
│   ├── app.js          # Main application initialization
│   ├── auth.js         # Authentication logic
│   ├── router.js       # Routing system
│   ├── dashboard.js    # Dashboard with charts
│   ├── expenses.js     # Expenses management
│   ├── received.js    # Received payments management
│   ├── budget.js      # Budget settings
│   ├── profile.js     # User profile
│   └── firebase-config.js  # Firebase configuration
└── README.md          # This file
```

## Notes

- The application uses Firebase Authentication for user management
- All data is stored in Cloud Firestore
- Charts are rendered using Chart.js library
- The app is fully responsive and optimized for mobile devices
- Budget warnings appear when category usage exceeds 75% of the set budget

