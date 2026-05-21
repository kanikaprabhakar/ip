import admin from 'firebase-admin';

export const verifyFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.warn('verifyFirebaseToken: no Authorization header');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    if (!admin.apps || admin.apps.length === 0) {
      console.error('Firebase Admin not initialized; cannot verify token');
      return res.status(500).json({ error: 'Server misconfigured: Firebase Admin not initialized' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    console.error('verifyFirebaseToken: token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

export default verifyFirebaseToken;
