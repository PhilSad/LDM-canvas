import Modal from 'react-bootstrap/Modal';
import React, { useState } from 'react';



export default function HelpModalButton() {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleClose = () => setShowHelpModal(false);
  const handleShow = () => setShowHelpModal(true);

  return (
    <>
      <button onClick={handleShow}>
        Help
      </button>

      <Modal show={showHelpModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>How to use Kollai infinite canvas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <b>Right click/Middle Click</b> : move the camera, explore the canvas
          <br/><br/>
          <b>Left click</b> : make a selection and select one of the modes
          <ul>
            <li><b>NI</b>: Generate a new image from scratch </li>
            <li><b>IA</b>: Only generate empty parts in the selection </li>
            <li><b>I2I</b>: Start the generation with the selection as init. image </li>
            <li><b>SV</b>: Download the selection as jpeg</li>
          </ul>
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

