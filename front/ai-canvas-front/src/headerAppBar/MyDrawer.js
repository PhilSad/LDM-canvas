import {Divider, Fab, IconButton, List, ListItemButton, SwipeableDrawer, TextField, Typography} from "@mui/material";
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import React from "react";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

export default function MyDrawer(props) {

    const [isOpen, setIsopen] = React.useState(false)


    return (
        <>
            <Fab style={{position: 'absolute', right: 0}}
                 onClick={() => setIsopen(true)}
            >
                <KeyboardDoubleArrowLeftIcon/>
            </Fab>
            <SwipeableDrawer
                var
                anchor={"right"}
                open={isOpen}
                onClose={() => setIsopen(false)}
                variant={"persistent"}
            >
                <IconButton
                    onClick={() => setIsopen(false)}
                >
                    <KeyboardDoubleArrowRightIcon/>
                    Close
                </IconButton>

                <h3></h3>

                <TextField
                    id="outlined-multiline-flexible"
                    label="Modifiers"
                    multiline
                    maxRows={4}
                    onChange={(e) => props.setModifiers(e.target.value)}
                />


                <Typography variant={('h4')}
                            sx={{marginTop: '10px', marginRight: 'auto', marginLeft: 'auto'}}>History</Typography>
                <List>
                    {props.history.map((data) => {
                        var z = Math.min(props.canvasMeta.w / +data.width, props.canvasMeta.h / +data.height) * 0.5;
                        var x = +data.posX - (props.canvasMeta.w / 2) / z + +data.width / 2
                        var y = +data.posY - (props.canvasMeta.h / 2) / z + +data.height / 2

                        return (<>
                                <Divider sx={{borderBottomColor: 'black'}}/>

                                <ListItemButton onClick={() => {
                                    props.camera.move(x, y, z)
                                }}>{data.prompt}</ListItemButton>
                            </>
                        )
                    })

                    }
                    <Divider sx={{borderBottomColor: 'black'}}/>

                </List>

            </SwipeableDrawer>
        </>
    )

}