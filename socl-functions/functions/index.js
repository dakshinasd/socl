const functions = require('firebase-functions');
const admin = require('firebase-admin');
const firebase = require('firebase');
admin.initializeApp();

const config = {
  apiKey: "AIzaSyDhxmxa-GeCBIwDGxXfJDknCvX9g9x6UZY",
  authDomain: "socl-4105c.firebaseapp.com",
  databaseURL: "https://socl-4105c.firebaseio.com",
  projectId: "socl-4105c",
  storageBucket: "socl-4105c.appspot.com",
  messagingSenderId: "350864116612"
};

firebase.initializeApp(config);

const app = require('express')();
const db = admin.firestore();


app.get('/screams', (req, res) => {
    db
        .collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then( data => {
            
            let screams = [];

            data.forEach(doc => {
            
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt
                })
            })
            
            return res.json(screams)
        })
        .catch(err => {

            console.error(err)
        });
})

app.post('/scream', (req, res) => {

    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    db
        .collection('screams')
        .add(newScream)
        .then( doc => {

            res.json({message: `document ${doc.id} created successfully`});
        })
        .catch(err => {
            res.status(500).json({err: "something went wrong"});
            console.error(err)
        });
});

// Signup endpoint
let token, userId;
app.post('/signup', (req, res) => {


let errors = {};

const isEmpty = (string) => {
    if(string.trim() === "") { 
        return true 
    }else { 
        return false
    } 
}




    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }

    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if(doc.exists){

                return res.status(400).json({ handle: 'this handle is already exist'})
            } else {

                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idToken => {
            token = idToken;

            const userCreds = {

                handle : newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userid: userId
            }

            return db.doc(`/users/${newUser.handle}`).set(userCreds)
        })
        .then(() => {
            return res.status(201).json({token})
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({message: err.code})
        })
})


exports.api = functions.https.onRequest(app);