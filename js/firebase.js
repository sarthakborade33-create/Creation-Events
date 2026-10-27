(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyCRySmcQXF9ZVmz9iHavnOKiTeP0F6H_l8",
    authDomain: "creation-events.firebaseapp.com",
    projectId: "creation-events",
    storageBucket: "creation-events.firebasestorage.app",
    messagingSenderId: "618084425305",
    appId: "1:618084425305:web:d3841afb28f70d8e23db48"
  };

  let db = null;
  let initError = null;

  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("Firebase App and Firestore (Compat) initialized successfully.");
  } catch (error) {
    initError = error;
    console.error("Firebase Initialization Error:", error);
  }

  // Expose firestore references to the global scope
  window.firebaseModule = {
    db,
    collection: function (dbInstance, collectionName) {
      return dbInstance.collection(collectionName);
    },
    addDoc: function (collectionRef, docData) {
      return collectionRef.add(docData);
    },
    serverTimestamp: function () {
      return firebase.firestore.FieldValue.serverTimestamp();
    },
    initError
  };
})();
