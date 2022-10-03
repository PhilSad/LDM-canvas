import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import { createSearchParams, useSearchParams } from "react-router-dom";
import URLImage from './URLImage';
import PromptRect from './promptRect';
import LoadPlaceholder from './LoadPlaceholder';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import _ from "lodash";
import ImageSaverLayer from './imageSaveLayer';
import Amplify from '@aws-amplify/core'
import * as gen from './generated'
import HelpModalButton from './helpModal'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// import ImageSaver from './ImageSaver';
// import * as env from './env.js';
import * as requests from './requests'

Amplify.configure(gen.config)

const URL_BUCKET = "https://storage.googleapis.com/aicanvas-public-bucket/"
const URL_NEW_IMAGE = 'https://europe-west1-ai-canvas.cloudfunctions.net/new_image'
const URL_IP_MASK = 'https://europe-west1-ai-canvas.cloudfunctions.net/inpaint_mask'
const URL_IP_ALPHA = 'https://europe-west1-ai-canvas.cloudfunctions.net/inpaint_alpha/'
const URL_IMG2IMG = 'https://europe-west1-ai-canvas.cloudfunctions.net/img_to_img/'

const URL_START_VM = "https://function-start-vm-jujlepts2a-ew.a.run.app"
const URL_STOP_VM = "https://function-stop-jujlepts2a-ew.a.run.app"
const URL_STATUS_VM = "https://function-get-status-gpu-jujlepts2a-ew.a.run.app"

const URL_GET_IMAGES = 'https://europe-west1-ai-canvas.cloudfunctions.net/function-get_images_for_pos'

const URL_FUNCTION_IMAGEN = "https://imagen-pubsub-jujlepts2a-ew.a.run.app/"

//draw states
const SELECTING = "SELECTING";
const PROMPTING = "PROMPTING";
const INPUT_TYPE = "INPUT_TYPE";

//move state
const IDLE = "IDLE";
const MOVING = "MOVING";
const READY = "READY";

//camera speed
const CAMERA_SPEED = 1;
const CAMERA_ZOOM_SPEED = 1.1;
const MIN_ZOOM = 0.01;
const BKG_DOT_SPACING = 20;

let generation_type;
let cursor_pos = [0, 0];

var init_x = 0, init_y = 0;
var bkg_x = 0, bkg_y = 0;
var moving = false;

const MyCanvas = (props) => {
  const stageRef = useRef(null);
  const imageLayerRef = useRef(null);
  const imageSaveRef = useRef(null);

  const [imageSave, setImageSave] = useState(null);

  const [currentState, setCurrentState] = useState(IDLE);
  const [moveState, setMoveState] = useState(IDLE);

  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [cursor, setCursor] = useState('default');

  const [canvasW, setCanvasW] = useState(window.innerWidth);
  const [canvasH, setCanvasH] = useState(window.innerHeight);

  //camera
  const [camInitX, setCamInitX] = useState(0);
  const [camInitY, setCamInitY] = useState(0);
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  const [cameraZoom, setCameraZoom] = useState(1);

  const [searchParams, setSearchParams] = useSearchParams();

  const [imageDivList, setImageDivList] = useState([]);
  const [placeholderList, setPlaceholderList] = useState(new Map());
  const [coordRemovePH, setCoordRemovePH] = useState(null);

  const [isMobile, setIsMobile] = React.useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const [room, setRoom] = useState('default');

  const [credential, setCredential] = useState('');




  function handle_receive_from_socket(data) {
    data = JSON.parse(data)

    var z = Math.min(canvasW/+data.width, canvasH/+data.height) * 0.5;
    var x = +data.posX - (canvasW/2)/z + +data.width/2
    var y = +data.posY - (canvasH/2)/z + +data.height/2

    if (data.action == "new_image") {
      removePlaceholder(data.posX, data.posY)
      addNewImage(URL_BUCKET + data.path, data.posX, data.posY, data.width, data.height, data.prompt)
      toast(<div onClick={() => {moveCamera(x, y, z)}}>
        New image: {data.prompt} at ({data.posX}, {data.posY})
      </div >, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }

    if (data.action == "generating_image") {
      console.log(data.queue_size)
      addNewPlaceholder(data.posX, data.posY, data.width, data.height)
    }
  }

  //socket
  useEffect(() => {
    const subscription = gen.subscribe(room, ({ data }) => handle_receive_from_socket(data))
    return () => subscription.unsubscribe()
  }, [room])

  //on page load
  useEffect(() => {
    const onPageLoad = () => {
      setIsMobile(window.innerWidth <= 768);

      var x = searchParams.get("x") !== null ? +searchParams.get("x") : 0;
      var y = searchParams.get("y") !== null ? +searchParams.get("y") : 0;
      var zoom = searchParams.get("zoom") !== null ? +searchParams.get("zoom") : 1;

      handleClickRefresh();

      moveCamera(x, y, zoom);
    };

    const onPageResize = () => {
      setCanvasW(window.innerWidth);
      setCanvasH(window.innerHeight);
    }

    window.addEventListener("resize", onPageResize);

    window.addEventListener('contextmenu', event => event.preventDefault());

    // Check if the page has already loaded
    if (document.readyState === "complete") {
      onPageLoad();
    } else {
      window.addEventListener("load", onPageLoad);
      // Remove the event listener when component unmounts
      return () => {
        window.removeEventListener("load", onPageLoad);
      }
    }
  }, [room]);

  function switchState(state) {
    switch (state) {
      case IDLE:
        break;

      case SELECTING:
        break;

      case INPUT_TYPE:
        //set rect new position
        if (width < 0) {
          setPosX(posX + width);
          setWidth(Math.abs(width));
        }

        if (height < 0) {
          setPosY(posY + height);
          setHeight(Math.abs(height));
        }

        break;
    }
    setCurrentState(state);
  }

  function switchMoveState(state) {
    switch (state) {
      case IDLE:
        setCursor('default');
        break;

      case MOVING:
        setCursor('all-scroll');
        break;
    }
    setMoveState(state);
  }

  //smove camera and set zoom
  function moveCamera(x, y, zoom) {
    setCameraX(x);
    setCameraY(y);
    setCameraZoom(zoom);
  }

  function setSearchParam() {
    setSearchParams(
      createSearchParams({ x: Math.round(cameraX), y: Math.round(cameraY), zoom: Math.round(cameraZoom * 100) / 100 })
    );
  }

  // convert coordinates system
  function toGlobalSpace(x, y) {
    x = +cameraX + +x / cameraZoom;
    y = +cameraY + +y / cameraZoom;
    return [x, y]
  }

  function toRelativeSpace(x, y) {
    x = (x - cameraX) * cameraZoom;
    y = (y - cameraY) * cameraZoom;
    return [x, y]
  }

  // define a new selection
  function defineSelection(x, y) {
    if (isLogged === false) {
      // return
    }

    [x, y] = toGlobalSpace(x, y);

    //if we click on the current rect, we don't want to start a new selection
    if (x > posX && x < posX + width && y > posY && y < posY + height) {
      return;
    }

    setPosX(x);
    setPosY(y);
    setWidth(0);
    setHeight(0);

    switchState(SELECTING);
  }

  function hideSelectionRect() {
    setPosX(Number.MAX_SAFE_INTEGER);
    setPosY(Number.MAX_SAFE_INTEGER);
    setWidth(0);
    setHeight(0);
  }

  function addNewPlaceholder(x, y, w, h) {
    var ph = {
      type: 'placeholder',
      x: x,
      y: y,
      w: w,
      h: h
    };

    setPlaceholderList(prevState => {
      var copy = new Map(prevState);
      copy.set(`${x},${y}`, ph);
      return copy;
    });

  }

  function removePlaceholder(x, y) {
    setPlaceholderList(prevState => {
      var copy = new Map(prevState);

      if (copy.has(`${x},${y}`))
        copy.delete(`${x},${y}`);

      return copy;
    });
  }

  function addNewImage(src, x, y, w, h, prompt) {
    var img = {
      type: 'image',
      src: src,
      x: x,
      y: y,
      w: w,
      h: h,
      prompt: prompt
    };

    setImageDivList(prevState => [...prevState, img]);
  }

  function handleMoveStart() {
    moving = true;

    setCamInitX(cursor_pos[0]);
    setCamInitY(cursor_pos[1]);

    init_x = cursor_pos[0] - bkg_x;
    init_y = cursor_pos[1] - bkg_y;

    switchMoveState(MOVING);
  }

  // movement handlers
  const handleTouchDown = (e) => {
    var touchposx = e.currentTarget.pointerPos.x;
    var touchposy = e.currentTarget.pointerPos.y;

    cursor_pos = [touchposx, touchposy];

    if (currentState === IDLE && moveState === IDLE) {
      handleMoveStart();
    } else if (currentState === IDLE && moveState === IDLE) {
      defineSelection(cursor_pos[0], cursor_pos[1]);
    }
  }

  const handleMouseDown = (e) => {
    switch (e.evt.which) {
      case 1:
        defineSelection(cursor_pos[0], cursor_pos[1]);
        break;

      case 2:
        handleMoveStart();
        break;

      case 3:
        handleMoveStart();
        break;

      default:
    }
  };

  function handleMove() {
    if (currentState === SELECTING) {
      var w = (cursor_pos[0] / cameraZoom + cameraX - posX);
      var h = (cursor_pos[1] / cameraZoom + cameraY - posY);
      setWidth(w);
      setHeight(h);
    }

    if (moveState === MOVING) {
      var movX = cursor_pos[0] - camInitX;
      var movY = cursor_pos[1] - camInitY;

      setCamInitX(cursor_pos[0]);
      setCamInitY(cursor_pos[1]);

      moveCamera((cameraX - movX / cameraZoom), (cameraY - movY / cameraZoom), cameraZoom);
    }
  }

  const handleTouchMove = (e) => {
    var touchposx = e.currentTarget.pointerPos.x;
    var touchposy = e.currentTarget.pointerPos.y;
    cursor_pos = [touchposx, touchposy];

    handleMove();
  }

  const handleMouseMove = (e) => {
    cursor_pos = [e.evt.clientX, e.evt.clientY];

    handleMove();
  };

  const handleMouseScroll = (e) => {
    if (e.evt.wheelDelta === 0)
      return;

    var newZoom;
    if (e.evt.wheelDelta > 0) {
      newZoom = cameraZoom * CAMERA_ZOOM_SPEED;
    } else {
      newZoom = cameraZoom / CAMERA_ZOOM_SPEED;
    }

    newZoom = Math.max(newZoom, MIN_ZOOM);

    var [ax, ay] = toGlobalSpace(cursor_pos[0], cursor_pos[1]);

    // init_x = (init_x * cameraZoom);
    // init_y = (init_y * cameraZoom);

    moveCamera((ax - cursor_pos[0] / newZoom), (ay - cursor_pos[1] / newZoom), newZoom);
  }

  function handleMoveStop() {
    moving = false;
    switchMoveState(IDLE);
  }

  const handleTouchUp = (e) => {
    if (currentState === IDLE && moveState === IDLE) {
      handleMoveStop();
    } else if (currentState === SELECTING && moveState === IDLE) {
      switchState(INPUT_TYPE);
    }

    setSearchParam();
  }

  const handleMouseUp = (e) => {
    init_x = cursor_pos[0] - bkg_x;
    init_y = cursor_pos[1] - bkg_y;

    switch (e.evt.which) {
      case 1:
        if (currentState === SELECTING) {
          switchState(INPUT_TYPE);
        }
        break;

      case 2:
        handleMoveStop()
        break;

      case 3:
        handleMoveStop()
        break;

      default:
    }

    setSearchParam();
  };

  const cropImageToSelection = () => {
    let image = new window.Image();


    var [x, y] = toRelativeSpace(posX, posY);
    var [w, h] = [width * cameraZoom, height * cameraZoom];

    // the biggest side must be 512px
    var pixelRatio = 512 / Math.max(w, h);

    image.src = imageLayerRef.current.toDataURL({ pixelRatio: pixelRatio });

    let imageSaveInfo = {
      x: x * pixelRatio,
      y: y * pixelRatio,
      w: w * pixelRatio,
      h: h * pixelRatio,
      image: image
    }

    setImageSave(imageSaveInfo);
  }

  const handleClickRefresh = () => {
    setImageDivList([]);

    var url_get_image_with_params = URL_GET_IMAGES + '?posX=0&posY=0&width=100&height=100';

    fetch(url_get_image_with_params).then((data) => data.json())
      .then((json) => json.message)
      .then((images) => Array.from(images).forEach((image) => {
        // console.log(image);
        // console.log(image.path);
        addNewImage(URL_BUCKET + image.path, image.posX, image.posY, image.width, image.height, image.prompt);
      }));
  };

  const handleClickMove = () => {
    switchMoveState(READY);
    switchState(IDLE);
  }

  const handleClickDraw = () => {
    switchState(IDLE);
    switchMoveState(IDLE);
  }

  const handleStartVm = () => {
    fetch(URL_START_VM).then((data) => alert('VM SARTED'));
  };

  const handleStopVm = () => {
    fetch(URL_STOP_VM).then((data) => alert('VM STOPPED'));
  };

  const handleStatusVm = () => {
    // fetch(URL_STATUS_VM).then(data => data.json()).
    //   then((data) => alert(data.message));
  };

  const handleInpaintAlpha = () => {
    generation_type = "inpaint_alpha";
    cropImageToSelection();
    switchState(PROMPTING);
  }

  const handleImg2Img = () => {
    generation_type = "img_to_img";
    cropImageToSelection();
    switchState(PROMPTING);
  }

  const handleSave = () => {
    cropImageToSelection();

    setTimeout(function () { imageSaveRef.current.download(); }, 100);
  }

  const handleNewImage = () => {
    generation_type = "new_image";
    switchState(PROMPTING);
  }

  const handleSend = () => {
    var x = Math.floor(posX)
    var y = Math.floor(posY)
    var w = Math.floor(width)
    var h = Math.floor(height)
    var prompt = document.getElementById('prompt_input').value

    document.getElementById('prompt_input').value = ''

    hideSelectionRect();

    var imageParamsDict = {
      'credential' : credential,
      'prompt': btoa(prompt),
      'room': room,
      'posX': x,
      'posY': y,
      'width': w,
      'height': h
    }

    var url_function_imagen_with_action = URL_FUNCTION_IMAGEN + '?action=' + generation_type;
    switch (generation_type) {
      case 'new_image':
        fetch(url_function_imagen_with_action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imageParamsDict),
        }).then(handleFetchErrors)

        break;

      case 'inpaint_alpha':
        var uri = imageSaveRef.current.uri()
        // remove "data:image/png;base64,"
        uri = uri.substring(22)

        imageParamsDict['init_image'] = uri;

        fetch(url_function_imagen_with_action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imageParamsDict),
        }).then(handleFetchErrors)

        break;

      case 'img_to_img':
        var uri = imageSaveRef.current.uri()
        // remove "data:image/png;base64,"
        uri = uri.substring(22)

        imageParamsDict['init_image'] = uri;

        fetch(url_function_imagen_with_action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imageParamsDict),
        }).then(handleFetchErrors)

        break;
    }

    addNewPlaceholder(x, y, w, h);
  };

  // true if rectangle a and b overlap
  function overlap(a, b) {
    if (a.x >= b.x + b.w || b.x >= a.x + a.w) return false;
    if (a.y >= b.y + b.h || b.y >= a.y + a.h) return false;
    return true;
  }

  function get_bkg_style() {
    var size = BKG_DOT_SPACING * cameraZoom;

    if (moving) {
      bkg_x = ((cursor_pos[0] - init_x));
      bkg_y = ((cursor_pos[1] - init_y));
    }

    return {
      backgroundColor: "#fff",
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${bkg_x}px ${bkg_y}px`,
      backgroundImage: `radial-gradient(rgb(200, 200, 200) 10%, transparent 0%)`,
      // backgroundImage: 'url(https://www.referenseo.com/wp-content/uploads/2019/03/image-attractive-960x540.jpg)',
      // backgroundRepeat: 'no-repeat'
    }
  }

  function handleFetchErrors(response) {
    if (!response.ok) {
      toast.error('Error ! Are you connected ?', {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      console.log(response);
      throw Error(response.statusText);
    }
    return response;
  }

  return (
    <div style={{ cursor: cursor }}>

      <div className="top_button_bar">

        { isLogged === false ? (
          //TODO login login
          <GoogleLogin
            onSuccess={credentialResponse => {
              console.log(credentialResponse);
              setIsLogged(true);
              setCredential(credentialResponse.credential)
              requests.send_connexion_request(credentialResponse.credential)

            }}
            onError={() => {
              console.log('Login Failed');
            }}
            useOneTap
            auto_select
          //todo add auto login
          
          />
        ) : (

          <button onClick={() => {
            googleLogout();
            setIsLogged(false);
            setCredential('');
            console.log(isLogged);
            // todo add logout=1 dans l'url et enlever le automatic login s'il est present
          }}> Logout </button>


        )}

        {isMobile ? (
          <span>
            <button onClick={() => handleClickRefresh()}> Refresh </button>
            <button onClick={() => handleClickMove()}> Move </button>
            <button onClick={() => handleClickDraw()}> Draw </button>
            <button onClick={() => setCameraZoom(cameraZoom * 1.1)}> Z+ </button>
            <button onClick={() => setCameraZoom(cameraZoom * 0.9)}> Z- </button>
            <button className="info"> ? </button>
          </span>
        ) : (
          <span>
            <button onClick={() => handleClickRefresh()}> Refresh </button>
          </span>
        )}
        <HelpModalButton />
      </div>

      <div className="coords"> {Math.floor(cameraX)}, {Math.floor(cameraY)}, {Math.floor(cameraZoom * 100) / 100} </div>

      <Stage
        ref={stageRef}
        style={get_bkg_style()}

        width={canvasW}
        height={canvasH}

        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleMouseScroll}

        onTouchStart={handleTouchDown}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchUp}
      >

        <Layer ref={imageLayerRef}>
          {
            imageDivList.map((img, i) => {
              var cameraBox = {
                x: cameraX - (window.innerWidth / cameraZoom) * 0.125,
                y: cameraY - (window.innerHeight / cameraZoom) * 0.125,
                w: (window.innerWidth / cameraZoom) * 1.25,
                h: (window.innerHeight / cameraZoom) * 1.25
              }
              if (
                overlap(cameraBox, img)
              ) {
                var [x, y] = toRelativeSpace(img.x, img.y);

                // display image only if the area is > 25px
                if (img.w * cameraZoom * img.h * cameraZoom > 25) {
                  return (
                    <URLImage
                      key={i}
                      src={img.src}
                      x={x}
                      y={y}
                      width={img.w * cameraZoom}
                      height={img.h * cameraZoom}
                      prompt={img.prompt}
                    />)
                }
              }

            })
          }
        </Layer>

        <Layer>
          {
            Array.from(placeholderList.values()).map((pl, i) => {
              if (!pl) {
                return;
              }

              var [x, y] = toRelativeSpace(pl.x, pl.y);
              return (
                <LoadPlaceholder
                  key={i}
                  x={x}
                  y={y}
                  width={pl.w * cameraZoom}
                  height={pl.h * cameraZoom}
                />)
            })
          }

          {Math.abs(width * cameraZoom * height * cameraZoom) > 100 &&
            <PromptRect
              x={(posX - cameraX) * cameraZoom}
              y={(posY - cameraY) * cameraZoom}
              width={width * cameraZoom}
              height={height * cameraZoom}
              handleSend={handleSend}
              handleNewImage={handleNewImage}
              handleInpaintAlpha={handleInpaintAlpha}
              handleImg2Img={handleImg2Img}
              handleSave={handleSave}
              currentState={currentState}
            />
          }
        </Layer>

      </Stage>

      {
        imageSave !== null &&
        <ImageSaverLayer ref={imageSaveRef} imageSave={imageSave} />
      }

      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );

}

export default MyCanvas;
