// Re-export initialized Firebase services from the root firebase.js file
import { auth, db, app, analytics } from '../firebase';

export { auth, db, app, analytics };
export default app;
