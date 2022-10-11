import Modal from 'react-bootstrap/Modal';
import React, { useState } from 'react';



export default function HelpModalButton() {
  const [showHelpModal, setShowHelpModal] = useState(true);

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
          <b>View Mode</b> : move the camera, explore the canvas
          <br/><br/>
          <b>Edit mode</b> : make a selection and select one of the modes
          <ul>
            <li><b>New Image</b>: Generate a new image from scratch </li>
            <li><b>Inpaint Transparent</b>: Only generate empty parts in the selection for seamless effect </li>
            <li><b>Image to Image</b>: Start the generation with the selection as init. image </li>
            <li><b>Save</b>: Download the selection as jpeg</li>
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

