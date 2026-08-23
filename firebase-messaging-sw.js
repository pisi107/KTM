importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyAnu-kly4oALndRaeCl2dvQjWefJSHWZvc",
    authDomain: "ktm-ordini.firebaseapp.com",
    projectId: "ktm-ordini",
    storageBucket: "ktm-ordini.firebasestorage.app",
    messagingSenderId: "1031736748386",
    appId: "1:1031736748386:web:b1070dcf67563b84c4643b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

    console.log(
        "[firebase-messaging-sw.js] Notifica ricevuta:",
        payload
    );

    const title =
        payload.notification?.title ||
        "KTM ORDINI";

    const options = {
        body:
            payload.notification?.body ||
            "Hai ricevuto un nuovo ordine.",
        icon: "/IDROLIST/favicon.ico"
    };

    self.registration.showNotification(
        title,
        options
    );
});
