require("dotenv").config(); // Load environment variables
var admin = require("firebase-admin");

let firebaseApp;

try {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix newlines if stored as a string
    }),
  });

  console.log("✅ Firebase Admin Initialized Successfully!");
} catch (error) {
  console.error("❌ Error initializing Firebase Admin:", error);
}

// Export the initialized app
module.exports = { firebaseApp, admin };
