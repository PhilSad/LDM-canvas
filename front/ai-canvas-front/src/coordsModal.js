import Modal from 'react-bootstrap/Modal';
import React, {useState} from 'react';
import Button from "@mui/material/Button";
import {TextField} from "@mui/material";


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

            <Modal show={showCoordModal} onHide={handleClose} style={{marginTop: "50px"}}>
                <Modal.Header closeButton>
                    <Modal.Title>Link to your current position</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p> Use this link to share your current position</p>
                    <div className="shareLink"
                         style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
                        <TextField type="textbox" value={linkurl} readOnly={"readonly"} style={{flexGrow: 1}}
                                   InputProps={{
                                       readOnly: true,
                                       autoFocus: true,
                                   }}/>
                        <Button variant={"outlined"} onClick={copyLink} style={{marginLeft: '10px'}}>Copy URL</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

