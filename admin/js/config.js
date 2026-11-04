/* Vastrenix Admin — same Firebase project as the store app (www/js/config.js). */
window.VX_ADMIN_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyCz9IXWXsC2pdmvh0Tr4h4Mk6UFLe3hUMk',
    authDomain: 'vastranix.firebaseapp.com',
    projectId: 'vastranix',
    storageBucket: 'vastranix.firebasestorage.app',
    messagingSenderId: '753186933692',
    appId: '1:753186933692:android:58fe3fc892d516db39b9b9'
  },
  apiBase: '',  /* payment server origin; '' = same site */
  /* Plan defaults used until you save Settings in the admin console (config/billing). */
  plans: {
    monthly: { label: 'Monthly', amount: 699, days: 30 },
    quarterly: { label: '3 Months', amount: 1899, days: 90 },
    annual: { label: 'Annual', amount: 6999, days: 365 }
  }
};
