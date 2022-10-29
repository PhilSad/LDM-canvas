import Modal from 'react-bootstrap/Modal';
import React, {useState} from 'react';


export default function CoordsModal(props) {
    var linkurl = window.location.origin + `/?room=${props.room}&x=${props.x}&y=${props.y}&zoom=${props.zoom}`
    
    const [showCoordModal, setShowCoordModal] = useState(false);

    const handleClose = () => setShowCoordModal(false);
    const handleShow = () => setShowCoordModal(true);

    function copyLink() {
        console.log("Link copied in clipboard");
        navigator.clipboard.writeText(linkurl);
    }

    return (
        <>
            <div onClick={handleShow} style={{zIndex: 99, backgroundColor: 'white'}}>
                {props.x}, {props.y}, {props.zoom}
            </div>

            <Modal show={showCoordModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Link to your current position</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p> Use this link to share your current position</p>
                    <div className="shareLink">
                        <input type="textbox" value={linkurl} readOnly={"readonly"} />
                        <button onClick={copyLink}>Copy text</button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

