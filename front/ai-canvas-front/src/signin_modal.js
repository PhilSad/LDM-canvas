import Modal from 'react-bootstrap/Modal';
import React, { useState } from 'react';

import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { useSignInWithGoogle } from 'react-firebase-hooks/auth';

// Configure Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyApc_Q01mz-RNVtxwvtcxF5WhAOk8M6OEg",
  authDomain: "ai-canvas.firebaseapp.com",
  projectId: "ai-canvas",
  storageBucket: "ai-canvas.appspot.com",
  messagingSenderId: "732264051436",
  appId: "1:732264051436:web:95cb2c7c6bb56099502bc9"
};
firebase.initializeApp(firebaseConfig);


const auth = getAuth(firebase);

const SignIn = () => {
  const [signInWithGoole, user, loading, error] = useSignInWithGoogle(auth);

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
      </div>
    );
  }
  if (loading) {
    return <p>Loading...</p>;
  }
  if (user) {
    return (
      <div>
        <p>Signed In User: {user.email}</p>
      </div>
    );
  }
  return (
    <div className="App">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => signInWithGoogle()}>Sign In</button>
    </div>
  );
};


export default function SigninModal(props) {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleClose = () => setShowHelpModal(false);
  const handleShow = () => setShowHelpModal(true);


  return (
    <>

      { props.isLogged === false ? (
          <button onClick={handleShow}>
            Sign-in
          </button>
        ) : (
          <button onClick={() => props.handleSignout()}>
            Sign-out
          </button>
        )

      }

        
      <Modal show={showHelpModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Sign in with your prefered provider</Modal.Title>
        </Modal.Header>
        <Modal.Body>
    
            <StyledFirebaseAuth uiConfig={props.uiConfig} firebaseAuth={firebase.auth()} />
    
        </Modal.Body>

        <Modal.Footer>
          <button onClick={handleClose}>
            Got it !
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );


}

