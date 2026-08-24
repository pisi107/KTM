const admin = require("firebase-admin");

/* =====================================================
   FIREBASE ADMIN
===================================================== */

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error(
        "FIREBASE_SERVICE_ACCOUNT non è presente nelle GitHub Secrets."
    );
}

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();


/* =====================================================
   FUNZIONE PRINCIPALE
===================================================== */

async function main() {

    console.log("================================");
    console.log("🔔 KTM ORDINI - CONTROLLO NOTIFICHE");
    console.log("================================");


    /* =================================================
       1. RECUPERA TOKEN DI GIO
    ================================================= */

    const gioDoc = await db
        .collection("utenti")
        .doc("Gio")
        .get();


    if (!gioDoc.exists) {

        console.log(
            "❌ Documento utenti/Gio non trovato."
        );

        return;

    }


    const gioData = gioDoc.data();


    const token =
        gioData.notificationToken;


    const notificationActive =
        gioData.notificationActive;


    if (!token) {

        console.log(
            "❌ Nessun token di notifica trovato per Gio."
        );

        console.log(
            "Attiva prima le notifiche dal sito."
        );

        return;

    }


    if (notificationActive !== true) {

        console.log(
            "❌ Le notifiche risultano disattivate per Gio."
        );

        return;

    }


    console.log(
        "✅ Token di Gio trovato."
    );


    /* =================================================
       2. RECUPERA GLI ULTIMI ORDINI
    ================================================= */

    const snapshot = await db
        .collection("ordini")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();


    console.log(
        "Ordini trovati:",
        snapshot.size
    );


    if (snapshot.empty) {

        console.log(
            "Nessun ordine presente."
        );

        return;

    }


    /* =================================================
       3. CONTROLLA QUAL È L'ULTIMO ORDINE
    ================================================= */

    const latestDoc =
        snapshot.docs[0];


    const latestOrder =
        latestDoc.data();


    console.log(
        "Ultimo ordine:",
        latestDoc.id
    );


    console.log(
        "Numero:",
        latestOrder.number
    );


    console.log(
        "Cliente:",
        latestOrder.person
    );


    /* =================================================
       4. CONTROLLO DUPLICATI
       
       Salviamo l'ID dell'ultimo ordine notificato.
       
       In questo modo non ricevi una notifica
       ogni 5 minuti per lo stesso ordine.
    ================================================= */

    const lastNotifiedOrder =
        gioData.lastNotifiedOrderId || null;


    if (
        lastNotifiedOrder === latestDoc.id
    ) {

        console.log(
            "ℹ️ Questo ordine è già stato notificato."
        );

        console.log(
            "Nessuna nuova notifica da inviare."
        );

        return;

    }


    /* =================================================
       5. CREA LA NOTIFICA
    ================================================= */

    const orderNumber =
        latestOrder.number ||
        "Nuovo ordine";


    const person =
        latestOrder.person ||
        "Cliente";


    const articles =
        latestOrder.articles || [];


    const totalQuantity =
        articles.reduce(
            (total, article) => {

                return total +
                    (Number(article.qty) || 0);

            },
            0
        );


    const message = {

        token: token,

        notification: {

            title:
                "🧡 Nuovo ordine KTM",

            body:
                `${orderNumber} · ${person} · ${totalQuantity} articoli`

        },

        data: {

            orderId:
                latestDoc.id,

            orderNumber:
                String(orderNumber),

            person:
                String(person)

        },

        webpush: {

            notification: {

                title:
                    "🧡 Nuovo ordine KTM",

                body:
                    `${orderNumber} · ${person} · ${totalQuantity} articoli`,

                icon:
                    "https://pisi107.github.io/KTM/icon-192.png"

            }

        }

    };


    /* =================================================
       6. INVIA NOTIFICA FCM
    ================================================= */

    console.log(
        "📤 Invio notifica..."
    );


    try {

        const response =
            await messaging.send(message);


        console.log(
            "================================"
        );

        console.log(
            "✅ NOTIFICA INVIATA!"
        );

        console.log(
            "Firebase message ID:",
            response
        );

        console.log(
            "================================"
        );


    } catch (error) {

        console.error(
            "❌ ERRORE INVIO NOTIFICA:"
        );

        console.error(
            error
        );


        /*
         * Se il token non è più valido,
         * lo disattiviamo.
         */

        if (
            error.code ===
            "messaging/registration-token-not-registered"
        ) {

            console.log(
                "⚠️ Il token non è più valido."
            );


            await db
                .collection("utenti")
                .doc("Gio")
                .set(
                    {
                        notificationActive: false
                    },
                    {
                        merge: true
                    }
                );

        }


        throw error;

    }


    /* =================================================
       7. SALVA L'ORDINE COME NOTIFICATO
    ================================================= */

    await db
        .collection("utenti")
        .doc("Gio")
        .set(

            {

                lastNotifiedOrderId:
                    latestDoc.id,

                lastNotificationAt:
                    admin.firestore.FieldValue.serverTimestamp()

            },

            {
                merge: true
            }

        );


    console.log(
        "✅ Ordine registrato come notificato."
    );


    console.log(
        "================================"
    );

    console.log(
        "CONTROLLO COMPLETATO"
    );

    console.log(
        "================================"
    );

}


/* =====================================================
   AVVIO
===================================================== */

main().catch(error => {

    console.error(
        "================================"
    );

    console.error(
        "❌ ERRORE GENERALE"
    );

    console.error(
        error
    );

    console.error(
        "================================"
    );

    process.exit(1);

});
