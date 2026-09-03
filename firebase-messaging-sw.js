importScripts(
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyAnu-kly4oALndRaeCl2dvQjWefJSHWZvc",
  authDomain: "ktm-ordini.firebaseapp.com",
  projectId: "ktm-ordini",
  storageBucket: "ktm-ordini.firebasestorage.app",
  messagingSenderId: "1031736748386",
  appId: "1:1031736748386:web:b1070dcf67563b84c4643b"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

/*
 * Il messaggio inviato dal server contiene gia una notifica Web Push.
 * Firebase la mostra automaticamente quando l'app e in background.
 * Non chiamiamo showNotification qui, altrimenti su iPhone appare due volte.
 */
messaging.onBackgroundMessage(function(payload) {
  console.log(
    "[firebase-messaging-sw.js] Notifica gestita da Firebase:",
    payload
  );
});
