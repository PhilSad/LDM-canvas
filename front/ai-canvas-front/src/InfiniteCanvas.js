import MyCanvas from './MyCanvas';
import React, {useEffect, useState} from "react";
import SideBar from "./SideBar";
import HeaderAppBar from "./headerAppBar/HeaderAppBar";

const InfiniteCanvas = (props) => {

    const [sidebarOpen, setSideBarOpen] = useState(false);
    const handleViewSidebar = () => {
        setSideBarOpen(!sidebarOpen);
    };

    const [modifiers, setModifiers] = useState('')
    const [history, setHistory] = useState([])

    const [isLogged, setIsLogged] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [credential, setCredential] = useState('');

    const [room, setRoom] = useState('default');

    const [camera, setCamera] = useState({
        x: 0,
        y: 0,
        zoom: 1,
        move: (x, y, zoom) => {
            setCamera(prevState => {
                return {
                    x: x,
                    y: y,
                    zoom: zoom,
                    move: prevState.move
                }
            })
        }
    })

    const [canvasMeta, setCanvasMeta] = useState({
        w: window.innerWidth,
        h: window.innerHeight
    })

    useEffect(() => {
        const onPageLoad = () => {
            setIsMobile(window.innerWidth <= 768);
        }

        const onPageResize = () => {
            setCanvasMeta({
                w: window.innerWidth,
                h: window.innerHeight,
            });
        }
        window.addEventListener("resize", onPageResize);
        window.addEventListener("load", onPageLoad);
    })

    return (
        <>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
            <HeaderAppBar/>
            <MyCanvas
                camera={camera}
                modifiers={modifiers}
                setHistory={setHistory}
                isLogged={isLogged}
                credential={credential}
                isMobile={isMobile}
                room={room}
            />

            <SideBar
                camera={camera}
                isOpen={sidebarOpen}
                toggleSidebar={handleViewSidebar}
                setModifiers={setModifiers}
                canvasMeta={canvasMeta}
                history={history}
                setIsLogged={setIsLogged}
                setCredential={setCredential}
                setIsMobile={setIsMobile}
            />

            {/*<RoomTabPanel*/}
            {/*    room={room}*/}
            {/*    setRoom={setRoom}*/}
            {/*/>*/}
        </>
    );
}

export default InfiniteCanvas;