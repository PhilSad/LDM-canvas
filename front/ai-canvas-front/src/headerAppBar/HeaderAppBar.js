import * as React from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import {AppBar, Tab} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import SignInModalButton from "../auth/signinModal";
import TabList from '@mui/lab/TabList';
import {TabContext} from "@mui/lab";
import {auth, logout} from "../auth/Auth";
import {useAuthState} from "react-firebase-hooks/auth";

export default function HeaderAppBar(props) {
    console.log(props.room);
    const [user, loading, error] = useAuthState(auth);

    return (
        <Box sx={{flexGrow: 1}}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{mr: 2}}
                    >
                        <MenuIcon/>
                    </IconButton>
                    <Typography variant="h6" component="div" style={{marginRight: 'auto'}}>
                        Koll AI
                    </Typography>
                    <TabContext value={props.room} color={'inherit'} sx={{flexGrow: 1}}>
                        <TabList variant="scrollable"
                                 onChange={(e) => props.setRoom(e.target.textContent)}
                                 textColor={"inherit"}
                                 TabIndicatorProps={{style: {background: 'pink'}}}>
                            <Tab label="default" value={"default"}/>
                            <Tab label="demo" value={"demo"}/>
                            <Tab label="test" value={"test"}/>

                        </TabList>
                    </TabContext>
                    <Box style={{marginLeft: 'auto'}}>
                        {!user ? (
                            <SignInModalButton/>

                        ) : (
                            <Button color={'inherit'} onClick={() => {
                                logout()
                            }}> Logout </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
