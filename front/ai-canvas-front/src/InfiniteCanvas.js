import MyCanvas from './MyCanvas';
import React, {useEffect, useState} from "react";
import SideBar from "./SideBar";
import HeaderAppBar from "./headerAppBar/HeaderAppBar";
import {TourProvider, useTour} from "@reactour/tour";

const InfiniteCanvas = (props) => {

    const [sidebarOpen, setSideBarOpen] = useState(false);
    const handleViewSidebar = () => {
        setSideBarOpen(!sidebarOpen);
    };

    const [modifiers, setModifiers] = useState("")
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

    const {setIsOpen} = useTour()


    const tourSteps = [
        {
            selector: ".ImageCanvas",
            content: "Welcome to Koll.ai Infinite Canvas! Take a tour or click the cross to exit (you can show me later by click the ? button)"
        },
        {
            selector: ".ImageCanvas",
            content: "This is the canvas where all images are displayed, you can explore it and zoom in / out"
        },
        {
            selector: ".ModeSelectionButtons",
            content: "There you can switch to selection mode to generate an image (Require login)"
        },
        {
            selector: ".RoomTabs",
            content: "Here you can switch between rooms or access a private room"
        },
        {
            selector: ".sidebar-toggle",
            content: "The sidebar allows you to add prompt modifier and to see image generated in this session"
        },
        {
            selector: ".ProfilButton",
            content: "Start generating now by singing-in in one click!"
        }

    ]


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
            <TourProvider steps={tourSteps}

            >
                <meta name="viewport"
                      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
                <HeaderAppBar
                    room={room}
                    setRoom={setRoom}
                />
                <MyCanvas
                    camera={camera}
                    modifiers={modifiers}
                    setHistory={setHistory}
                    history={history}
                    isLogged={isLogged}
                    credential={credential}
                    isMobile={isMobile}
                    room={room}
                    canvasMeta={canvasMeta}

                />

                <SideBar
                    className={"Sidebar"}
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

            </TourProvider>


        </>
    );
}

export default InfiniteCanvas;