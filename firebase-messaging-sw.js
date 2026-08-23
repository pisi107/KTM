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

messaging.onBackgroundMessage(function(payload) {

  console.log(
    "[firebase-messaging-sw.js] Messaggio ricevuto:",
    payload
  );

  const notificationTitle =
    payload.notification?.title || "KTM ORDINI";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "È arrivato un nuovo ordine.",
    icon: "./icon-192.png"
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );

});
