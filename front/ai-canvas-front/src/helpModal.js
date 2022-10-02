import Modal from 'react-bootstrap/Modal';
import React, { useState} from 'react';



export default function HelpModalButton(){
    const [showHelpModal, setShowHelpModal ] = useState(false);

    const handleClose = () => setShowHelpModal(false);
    const handleShow = () => setShowHelpModal(true);

    return (
        <>
          <button onClick={handleShow}>
            Help
          </button>
    
          <Modal show={showHelpModal} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>How to use this app</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                
                <p> To interact with the canvas, you can either:</p>
                <ul>
                    <li> Use <strong>right click</strong> and move to explore the canvas </li>
                    <li> Use <strong>left click</strong> to make a selection to generate an image you can then enter your prompt and select witch generation mode you desire: 
                        <ul>
                            <li><strong>NI</strong>: Generate a new image from scratch </li>
                            <li><strong>IA</strong>: Only generate the pixels that were not generated previously </li>
                            <li><strong>I2I</strong>: Start the generation with the selection as init image </li>
                            <li><strong>SV</strong>: Download the selection </li>
                        </ul>
                    </li>
                </ul>
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

