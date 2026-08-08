```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global functions
    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return request.auth.uid == userId; }
    
    match /{document=**} {
      allow read, write: if false; // default deny
    }

    match /transactions/{transactionId} {
      // Users can only read their own transactions
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      
      // Users can only create transactions if they assign their own userId
      allow create: if isSignedIn() && isOwner(request.resource.data.userId);
      
      // Users can only update/delete their own transactions
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
    
    match /budgets/{budgetId} {
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      allow create: if isSignedIn() && isOwner(request.resource.data.userId);
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
    
    match /goals/{goalId} {
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      allow create: if isSignedIn() && isOwner(request.resource.data.userId);
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
    
    match /subscriptions/{subscriptionId} {
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      allow create: if isSignedIn() && isOwner(request.resource.data.userId);
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
    
    match /settings/{settingId} {
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      allow create: if isSignedIn() && isOwner(request.resource.data.userId);
      allow update, delete: if isSignedIn() && isOwner(resource.data.userId);
    }
  }
}
```
