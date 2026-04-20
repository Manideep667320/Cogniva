import admin from 'firebase-admin'

export const initializeFirebase = () => {
  try {
    // Initialize Firebase Admin SDK
    // Make sure to set GOOGLE_APPLICATION_CREDENTIALS env variable
    // or provide the service account key path
    
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        // Firebase will auto-detect credentials from GOOGLE_APPLICATION_CREDENTIALS
      })
    }

    console.log('✅ Firebase Admin Initialized')
    return admin
  } catch (error) {
    console.error(`❌ Firebase Initialization Error: ${error.message}`)
    throw error
  }
}

export const getAuth = () => admin.auth()
export const getDatabase = () => admin.firestore?.()

export default initializeFirebase
