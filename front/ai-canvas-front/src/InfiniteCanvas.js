import MyCanvas from './MyCanvas';
import React, {useEffect, useState} from "react";
import SideBar from "./SideBar";
import HeaderAppBar from "./headerAppBar/HeaderAppBar";
import {TourProvider} from "@reactour/tour";
import {useSearchParams} from "react-router-dom";

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

    const [searchParams, setSearchParams] = useSearchParams();
    const [room, setRoom] = useState(searchParams.get("room") !== null ? searchParams.get("room") : "default");

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




    const tourSteps = [
        {
            selector: ".HelpButton",
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
            selector: ".ButtonCoordModal",
            content: "Clic the current position to get a shareble link to you current room and position"
        },
        {
            selector: ".sidebar-toggle",
            content: "The sidebar allows you to add prompt modifier and to see image generated in this session"
        },
        {
            selector: ".ProfilButton",
            content: "Start generating now by singing-in in one click!"
        },
        {
            selector: ".ChoiceButtons",
            content: "You can choose between multiple actions"
        },
        {
            selector: ".NewImageButton",
            content: "**New Image** Generate a new image from scratch"
        },
        {
            selector: ".OutpaintingButton",
            content: "**Outpainting** Only generate empty parts in the selection for seamless effect"
        },
        {
            selector: ".Img2imgButton",
            content: "**Image To Image** Start the generation with the selection as init image"
        },
        {
            selector: ".SaveButton",
            content: "**Save** Download the selection as jpeg"
        },
        {
            selector: ".GenerationHelpButton",
            content: "**Help** Display this help"
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
            // setCanvasMeta({
            //     w: window.innerWidth,
            //     h: window.innerHeight,
            // });
        }
        window.addEventListener("resize", onPageResize);
        window.addEventListener("load", onPageLoad);
    })

    return (
        <>
            <TourProvider steps={tourSteps}
                          nextButton={({
                                           Button: TourButton,
                                           currentStep,
                                           stepsLength,
                                           setIsOpen,
                                           setCurrentStep,
                                           steps,
                                       }) => {
                              const last_initial = currentStep === 6
                              const last_generation = currentStep === stepsLength - 1
                              const last = last_initial || last_generation
                              return (
                                  <TourButton
                                      onClick={() => {
                                          if (last) {
                                              setIsOpen(false)
                                          } else {
                                              setCurrentStep((s) => (s === steps?.length - 1 ? 0 : s + 1))
                                          }
                                      }}
                                  >
                                      {last ? 'Close!' : null}
                                  </TourButton>
                              )
                          }}
                          onClickMask={({setCurrentStep, currentStep, steps, setIsOpen}) => {
                              const last_initial = currentStep === 6
                              const last_generation = currentStep === steps.length - 1
                              const last = last_initial || last_generation

                              if (last) {
                                  setIsOpen(false)
                              }
                              setCurrentStep((s) => (s === steps.length - 1 ? 0 : s + 1))
                          }}
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