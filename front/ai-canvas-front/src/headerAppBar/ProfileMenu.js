import React, {useState} from "react";
import {IconButton, Menu, MenuItem, TextField} from "@mui/material";
import Modal from "react-bootstrap/Modal";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {auth, logout} from "../auth/Auth";
import {useAuthState} from "react-firebase-hooks/auth";
import Button from "@mui/material/Button";

export default function ProfileMenu(props) {
    const BACK_BASE_URL = process.env.REACT_APP_BACK_URL;
    const URL_FUNCTION_UPDATE_PSEUDO = BACK_BASE_URL + "/update_user_pseudo/"

    const [showModaleProfile, setShowModalProfile] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [open, setOpen] = React.useState(false);
    const [user, loading, error] = useAuthState(auth);
    const [displayedName, setDisplayedName] = useState("[CURRENT DISPLAYED NAME]")

    const handleClickProfile = (event) => {
        setAnchorEl(event.currentTarget);
        setOpen(true)
    };
    const handleCloseMenuProfile = () => {
        setAnchorEl(null);
        setOpen(false);
        setShowModalProfile(false);
    };

    const handleMenuLogout = () => {
        logout();
        setAnchorEl(null);
        setOpen(false);
    };

    function handleClicMenuUpdateProfile() {
        setShowModalProfile(true);
        setOpen(false)
    }

    function handleClicUpdateProfile() {
        setShowModalProfile(false)
        fetch(URL_FUNCTION_UPDATE_PSEUDO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                credential: user.accessToken,
                pseudo: displayedName
            }),
        })
    }

    return (
        <div>

            <Modal show={showModaleProfile} onHide={() => setShowModalProfile(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Enter new room name below</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{margin: 'auto'}}>
                    <TextField label="Displayed Name" type="textbox"
                               onChange={e => setDisplayedName(e.target.value)}/>
                    <br/>
                    <br/>
                    <Button variant={"outlined"} onClick={() => handleClicUpdateProfile()}>Update Profile</Button>
                </Modal.Body>
            </Modal>

            <IconButton onClick={handleClickProfile}>
                <AccountCircleIcon/>
            </IconButton>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleCloseMenuProfile}
                MenuListProps={{'aria-labelledby': 'basic-button'}}>

                <MenuItem onClick={handleClicMenuUpdateProfile}>Edit Profile</MenuItem>
                <MenuItem onClick={handleMenuLogout}>Logout</MenuItem>
            </Menu>

        </div>

    )
}