const admin = require("firebase-admin");


// =====================================================
// FIREBASE ADMIN
// =====================================================

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error(
        "FIREBASE_SERVICE_ACCOUNT non trovato."
    );
}

let serviceAccount;

try {

    serviceAccount =
        JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT
        );

} catch (error) {

    throw new Error(
        "Il Secret FIREBASE_SERVICE_ACCOUNT non contiene un JSON valido."
    );

}


admin.initializeApp({

    credential:
        admin.credential.cert(
            serviceAccount
        )

});


const db =
    admin.firestore();

const messaging =
    admin.messaging();


// =====================================================
// FUNZIONE PRINCIPALE
// =====================================================

async function main() {

    console.log(
        "================================"
    );

    console.log(
        "KTM ORDINI - CONTROLLO NOTIFICHE"
    );

    console.log(
        "================================"
    );


    // -------------------------------------------------
    // 1. RECUPERIAMO GIO
    // -------------------------------------------------

    const gioRef =
        db
            .collection("utenti")
            .doc("Gio");


    const gioSnapshot =
        await gioRef.get();


    if (!gioSnapshot.exists) {

        console.log(
            "Documento utenti/Gio non trovato."
        );

        return;

    }


    const gio =
        gioSnapshot.data();


    if (
        !gio.notificationActive ||
        !gio.notificationToken
    ) {

        console.log(
            "Notifiche di Gio non attive."
        );

        return;

    }


    const token =
        gio.notificationToken;


    // -------------------------------------------------
    // 2. RECUPERIAMO LO STATO
    // -------------------------------------------------

    const stateRef =
        db
            .collection("sistema")
            .doc("notifiche");


    const stateSnapshot =
        await stateRef.get();


    let lastProcessedAt =
        0;


    if (stateSnapshot.exists) {

        const state =
            stateSnapshot.data();


        lastProcessedAt =
            Number(
                state.lastProcessedAt || 0
            );

    }


    // -------------------------------------------------
    // 3. CERCHIAMO GLI ORDINI RECENTI
    // -------------------------------------------------

    const ordersSnapshot =
        await db
            .collection("ordini")
            .orderBy(
                "createdAt",
                "asc"
            )
            .get();


    const newOrders = [];


    ordersSnapshot.forEach(
        document => {

            const order =
                document.data();


            const createdAt =
                Number(
                    order.createdAt || 0
                );


            if (
                createdAt >
                lastProcessedAt
            ) {

                newOrders.push({

                    id:
                        document.id,

                    ...order

                });

            }

        }
    );


    // -------------------------------------------------
    // 4. PRIMO AVVIO
    // -------------------------------------------------

    if (
        !stateSnapshot.exists
    ) {

        let newestCreatedAt =
            Date.now();


        if (
            ordersSnapshot.size > 0
        ) {

            const lastOrder =
                ordersSnapshot.docs[
                    ordersSnapshot.docs.length - 1
                ].data();


            newestCreatedAt =
                Number(
                    lastOrder.createdAt ||
                    Date.now()
                );

        }


        await stateRef.set({

            lastProcessedAt:
                newestCreatedAt,

            updatedAt:
                Date.now()

        });


        console.log(
            "Prima esecuzione completata."
        );

        console.log(
            "Gli ordini già esistenti NON verranno notificati."
        );

        return;

    }


    // -------------------------------------------------
    // 5. NESSUN NUOVO ORDINE
    // -------------------------------------------------

    if (
        newOrders.length === 0
    ) {

        console.log(
            "Nessun nuovo ordine."
        );

        return;

    }


    console.log(
        "Nuovi ordini trovati:",
        newOrders.length
    );


    // -------------------------------------------------
    // 6. INVIO NOTIFICHE
    // -------------------------------------------------

    let newestCreatedAt =
        lastProcessedAt;


    for (
        const order
        of newOrders
    ) {

        const number =
            order.number ||
            "Nuovo ordine";


        const person =
            order.person ||
            "";


        const articles =
            Array.isArray(
                order.articles
            )
                ? order.articles.length
                : 0;


        const message = {

            token:

                token,


            notification: {

                title:
                    "🟠 Nuovo ordine KTM",

                body:
                    `${number} · ${person} · ` +
                    `${articles} articol${
                        articles === 1
                            ? "o"
                            : "i"
                    }`

            },


            data: {

                orderId:
                    String(
                        order.id || ""
                    ),

                number:
                    String(
                        order.number || ""
                    ),

                person:
                    String(
                        order.person || ""
                    )

            }

        };


        try {

            await messaging.send(
                message
            );


            console.log(
                "Notifica inviata:",
                number
            );


        } catch (error) {

            console.error(
                "Errore invio notifica per",
                number
            );

            console.error(
                error.message
            );

        }


        const createdAt =
            Number(
                order.createdAt || 0
            );


        if (
            createdAt >
            newestCreatedAt
        ) {

            newestCreatedAt =
                createdAt;

        }

    }


    // -------------------------------------------------
    // 7. SALVIAMO LO STATO
    // -------------------------------------------------

    await stateRef.set({

        lastProcessedAt:
            newestCreatedAt,

        updatedAt:
            Date.now()

    });


    console.log(
        "Stato notifiche aggiornato."
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


main()

    .then(() => {

        console.log(
            "Operazione terminata."
        );

        process.exit(0);

    })

    .catch(error => {

        console.error(
            "ERRORE:",
            error
        );

        process.exit(1);

    });
