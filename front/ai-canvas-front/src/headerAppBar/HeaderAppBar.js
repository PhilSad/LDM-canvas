import * as React from 'react';
import {useState} from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import {AppBar, Tab, TextField} from "@mui/material";
import SignInModalButton from "../auth/signinModal";
import TabList from '@mui/lab/TabList';
import {TabContext} from "@mui/lab";
import {auth, logout} from "../auth/Auth";
import {useAuthState} from "react-firebase-hooks/auth";
import AddIcon from '@mui/icons-material/Add';
import Modal from "react-bootstrap/Modal";


export default function HeaderAppBar(props) {
    console.log(props.room);
    const [user, loading, error] = useAuthState(auth);
    const [rooms, setRooms] = useState(["default", "demo", "test"])

    const [showModal, setShowModal] = useState(false);
    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);
    const [newRoomName, setNewRoomName] = useState("");

    function handleClickAccessRoom(roomName) {
        handleClose()
        props.setRoom(roomName)
        setRooms(prevState => {
            return [...prevState, roomName]
        })
    }

    function handleTabsOnChange(roomName) {
        if (roomName == "+") {
            handleShow()
        } else {
            props.setRoom(roomName)
        }

    }

    return (
        <>
            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Enter new room name below</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{margin: 'auto'}}>
                    <TextField autofocus label="Room Name" type="textbox"
                               onChange={e => setNewRoomName(e.target.value)}/>
                    <br/>
                    <br/>
                    <Button variant={"outlined"} onClick={() => handleClickAccessRoom(newRoomName)}>Access Room</Button>
                </Modal.Body>
            </Modal>

            <Box sx={{flexGrow: 1}}>
                <AppBar position="static">
                    <Toolbar style={{justifyContent: 'space-between'}}>
                        {/*<IconButton*/}
                        {/*    size="large"*/}
                        {/*    edge="start"*/}
                        {/*    color="inherit"*/}
                        {/*    aria-label="menu"*/}
                        {/*    sx={{mr: 2}}*/}
                        {/*>*/}
                        {/*    <MenuIcon/>*/}
                        {/*</IconButton>*/}
                        {/*<Typography variant="h6" component="div" style={{marginRight: 'auto'}}>*/}
                        {/*    Koll AI*/}
                        {/*</Typography>*/}
                        <img src="./android-chrome-192x192.png" sx={{mr: 2}}
                             style={{maxWidth: 'auto', maxHeight: '50px', marginRight: '10px'}}/>

                        {/*TAB LIST*/}
                        <TabContext value={props.room} color={'inherit'} style={{}}>
                            <TabList variant="scrollable"
                                     onChange={(e, value) => handleTabsOnChange(value)}
                                     textColor={"inherit"}
                                     TabIndicatorProps={{style: {background: 'pink'}}}
                                     style={{}}>

                                {
                                    rooms.map((curRoom, i) => {
                                        return (
                                            <Tab label={curRoom} value={curRoom}/>
                                        )
                                    })
                                }

                                <Tab icon={<AddIcon/>} value={"+"}/>
                            </TabList>
                        </TabContext>


                        {/* LOGIN / LOGOUT Button */}
                        <Box style={{}}>
                            {!user ? (
                                <SignInModalButton/>

                            ) : (
                                <Button color={'inherit'} variant='outlined' onClick={() => {
                                    logout()
                                }}> Logout </Button>
                            )}
                        </Box>

                    </Toolbar>
                </AppBar>

            </Box>
        </>
    );
}
