/* Vastrenix configuration
   ------------------------------------------------------------------
   Leave apiKey empty  -> the app runs offline and saves on this device only.
   Fill in your Firebase web config -> email login, multi-store, live team sync.
   Firebase console -> Project settings -> Your apps -> Web app -> SDK setup and configuration -> Config */
window.VX_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyCz9IXWXsC2pdmvh0Tr4h4Mk6UFLe3hUMk',
    authDomain: 'vastranix.firebaseapp.com',
    projectId: 'vastranix',
    storageBucket: 'vastranix.firebasestorage.app',
    messagingSenderId: '753186933692',
    appId: '1:753186933692:android:58fe3fc892d516db39b9b9'
  },
  /* Where store owners pay for their Vastrenix plan (UPI). Payments are verified in the admin console (admin/). */
  billing: {
    upiId: '',            // e.g. 'vastrenix@okhdfcbank' — leave empty to ask owners to contact support
    payeeName: 'Vastrenix',
    supportEmail: 'contact@vastrenix.com',
    /* Where the payment server (/api) lives. Leave '' when the app is served from the same Vercel site.
       Plans, prices, payment methods, UPI ID and the website link are managed in the admin console → Settings. */
    apiBase: ''
  }
};
