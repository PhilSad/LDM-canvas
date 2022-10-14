import Modal from 'react-bootstrap/Modal';
import SignInPannel from './signInPanel';
import React, { useState } from 'react';


import { getAuth } from "firebase/auth";
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeApp } from "firebase/app";
import { useSignInWithGoogle, useAuthState } from 'react-firebase-hooks/auth';



export default function SignInModalButton(props) {
  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  return (
    <>
      <button onClick={handleShow}>
        Log In
      </button>

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Login or Register with your favorite provider</Modal.Title>
        </Modal.Header>
      <Modal.Body>

        <SignInPannel onLoginSuccess={(credential) => props.onLoginSuccess(credential)} />

        </Modal.Body>

        <Modal.Footer>
          <button onClick={handleClose}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );


}

