import React, { useState } from "react";

const RoomTabPanel = props => {
    let rooms = ["default", "demo", "test"]
    
    function changeRoom(newRoom) {
        props.setRoom(newRoom);
    }

    return (
        <div className="roomtabpanel">
            {
                rooms.map((r, i) => {
                    return (
                        <div className={"roomtab" + (props.room == r ? " roomtabSelected" : '')} onClick={() => changeRoom(r)}>
                            {r}

                            <div className="roomtabClose">
                                x
                            </div>
                        </div>
                    )
                })
            }


            <div className="newRoomTab">
                +
            </div>
        </div>
    )
}

export default RoomTabPanel;