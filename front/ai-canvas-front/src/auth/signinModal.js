import Modal from 'react-bootstrap/Modal';
import React, { useState } from 'react';
import SigninTabs from './signintabs';



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

        <SigninTabs />

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

