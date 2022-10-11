import MyCanvas from './MyCanvas';
import React, { useEffect, useState } from "react";
import SideBar from "./SideBar";

const InfiniteCanvas = (props) => {

    const [sidebarOpen, setSideBarOpen] = useState(false);
    const handleViewSidebar = () => {
        setSideBarOpen(!sidebarOpen);
    };

    const [modifiers, setModifiers] = useState('')
    const [history, setHistory] = useState([])

    const [isLogged, setIsLogged] = useState(false);
    const [credential, setCredential] = useState('');

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
        const onPageResize = () => {
            setCanvasMeta({
                w: window.innerWidth,
                h: window.innerHeight,
            });
        }
        window.addEventListener("resize", onPageResize);
    })

    return (
        <>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            
            <MyCanvas
                camera={camera}
                modifiers={modifiers}
                setHistory={setHistory}
                isLogged={isLogged}
                credential={credential}
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
            />
        </>
    );
}

export default InfiniteCanvas;