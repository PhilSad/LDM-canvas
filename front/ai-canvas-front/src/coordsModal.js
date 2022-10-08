import Modal from 'react-bootstrap/Modal';
import React, { useState } from 'react';



export default function CoordsModal(props) {
    var linkurl = window.location.origin + `/?room=${props.room}&x=${props.x}&y=${props.y}&zoom=${props.zoom}`
    
    const [showCoordModal, setShowCoordModal] = useState(false);

    const handleClose = () => setShowCoordModal(false);
    const handleShow = () => setShowCoordModal(true);

    const copyLink = () => {
        console.log("Link copied in clipboard");
        navigator.clipboard.writeText(linkurl);
    }

    return (
        <>
            <div className="coords" onClick={handleShow}>
                {props.x}, {props.y}, {props.zoom}
            </div>

            <Modal show={showCoordModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Link to your current position</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p> Use this link to share your current position</p>
                    <div className="shareLink">
                        <input type="textbox" value={linkurl} readonly="readonly" />
                        <button onclick={navigator.clipboard.writeText(linkurl)}>Copy text</button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

