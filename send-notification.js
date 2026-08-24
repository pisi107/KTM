const admin = require("firebase-admin");

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function main() {

    console.log("================================");
    console.log("CONTROLLO NUOVI ORDINI");
    console.log("================================");

    const snapshot = await db
        .collection("ordini")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

    console.log(
        "Ordini trovati:",
        snapshot.size
    );

    snapshot.forEach(doc => {

        console.log(
            "Ordine:",
            doc.id,
            doc.data()
        );

    });

    console.log("================================");
    console.log("CONTROLLO COMPLETATO");
    console.log("================================");
}

main().catch(error => {

    console.error(
        "ERRORE:",
        error
    );

    process.exit(1);

});
