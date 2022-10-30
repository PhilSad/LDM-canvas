import * as React from 'react';
import {useState} from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import {AppBar, Tab, TextField} from "@mui/material";
import SignInModalButton from "../auth/signinModal";
import TabList from '@mui/lab/TabList';
import {TabContext} from "@mui/lab";
import {auth} from "../auth/Auth";
import {useAuthState} from "react-firebase-hooks/auth";
import AddIcon from '@mui/icons-material/Add';
import Modal from "react-bootstrap/Modal";
import ProfileMenu from "./ProfileMenu";

function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue(value => value + 1); // update state to force render
    // An function that increment 👆🏻 the previous state like here
    // is better than directly setting `value + 1`
}

export default function HeaderAppBar(props) {
    const [user, loading, error] = useAuthState(auth);
    const [rooms, setRooms] = useState(["default", "demo", "test"])

    const [showModalTabs, setShowModalTabs] = useState(false);
    const handleCloseTabs = () => setShowModalTabs(false);
    const handleShowTabs = () => setShowModalTabs(true);
    const [newRoomName, setNewRoomName] = useState("");

    const [displayedName, setDisplayedName] = React.useState("")

    const forceUpdate = useForceUpdate();


    function handleClickAccessRoom(roomName) {
        handleCloseTabs()
        props.setRoom(roomName)
        setRooms(prevState => {
            return [...prevState, roomName]
        })
    }

    function handleTabsOnChange(roomName) {
        if (roomName == "+") {
            handleShowTabs()
        } else {
            props.setRoom(roomName)
        }

    }


    return (
        <>
            <Modal show={showModalTabs} onHide={handleCloseTabs} style={{marginTop: "50px"}}>
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
                <AppBar position="absolute">
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
                        <img src="./android-chrome-384x384.png" sx={{mr: 2}}
                             style={{maxWidth: 'auto', maxHeight: '50px', marginRight: '10px'}}/>

                        {/*TAB LIST*/}
                        <TabContext value={props.room} color={'inherit'} style={{}}>
                            <TabList variant="scrollable"
                                     onChange={(e, value) => handleTabsOnChange(value)}
                                     textColor={"inherit"}
                                     TabIndicatorProps={{style: {background: 'pink'}}}
                                     style={{}}
                                     className={"RoomTabs"}
                            >

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
                        <Box className={"ProfilButton"}>
                            {!user ? (
                                <SignInModalButton onSuccess={(pseudo) => setDisplayedName(pseudo)}
                                                   onUserChange={forceUpdate}/>

                            ) : (
                                <ProfileMenu displayedName={displayedName}
                                             onUserChange={forceUpdate}/>
                            )}

                        </Box>

                    </Toolbar>
                </AppBar>

            </Box>
        </>
    );
}
