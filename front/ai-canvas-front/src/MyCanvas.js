import React, { Component, useState, useEffect, useRef, useReducer, TouchEvent } from 'react';
import { Stage, Layer, Image, Rect, Group, Text } from 'react-konva';
import { Router, Routes, Route, createSearchParams, useSearchParams } from "react-router-dom";
import URLImage from './URLImage';
import PromptRect from './promptRect';
// import ImageSaver from './ImageSaver';
import LoadPlaceholder from './LoadPlaceholder';
import { GoogleLogin, useGoogleLogin, googleLogout } from '@react-oauth/google';
import _ from "lodash";
import ImageSaverLayer from './imageSaveLayer';
import * as env from './env.js';
import Amplify from '@aws-amplify/core'
import * as gen from './generated'

import * as request from './requests'

Amplify.configure(gen.config)

var URL_BUCKET = "https://storage.googleapis.com/aicanvas-public-bucket/"
var URL_NEW_IMAGE = 'https://europe-west1-ai-canvas.cloudfunctions.net/new_image'
var URL_IP_MASK = 'https://europe-west1-ai-canvas.cloudfunctions.net/inpaint_mask'
var URL_IP_ALPHA = 'https://europe-west1-ai-canvas.cloudfunctions.net/inpaint_alpha'

var URL_START_VM = "https://function-start-vm-jujlepts2a-ew.a.run.app"
var URL_STOP_VM = "https://function-stop-jujlepts2a-ew.a.run.app"
var URL_STATUS_VM = "https://function-get-status-gpu-jujlepts2a-ew.a.run.app"

var URL_GET_IMAGES = 'https://europe-west1-ai-canvas.cloudfunctions.net/function-get_images_for_pos'

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


const MyCanvas = (props) => {
  let init_image;

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
  const [placeholderList, setPlaceholderList] = useState([]);

  const [isMobile, setIsMobile] = React.useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const [room, setRoom] = useState('default');



  //Publish data to subscribed clients
  async function handleSubmit(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    let send_data = '{"from":"client"}'
    await gen.publish(room, JSON.stringify(JSON.parse(send_data), null, 2))
  }

  function handle_receive_from_socket(data) {
    data = JSON.parse(data)
    console.log(data)
    setPlaceholderList(prevState => _.tail(prevState));
    addNewImage(URL_BUCKET + data.path, data.posX, data.posY, data.width, data.height, data.prompt)
    console.log('added image from ' + URL_BUCKET + data.path)
  }

  //socket
  useEffect(() => {
    //Subscribe via WebSockets
    const subscription = gen.subscribe(room, ({ data }) => handle_receive_from_socket(data))
    return () => subscription.unsubscribe()
  }, [room])


  //on page load
  useEffect(() => {
    const onPageLoad = () => {
      setIsMobile(window.innerWidth <= 768);

      handleClickRefresh();

      var x = searchParams.get("x") !== null ? searchParams.get("x") : 0;
      var y = searchParams.get("y") !== null ? searchParams.get("y") : 0;
      var zoom = searchParams.get("zoom") !== null ? searchParams.get("zoom") : 1;

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
  }, []);

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
    // console.log('image added');
    // console.log(src);
    var img = {
      type: 'placeholder',
      x: x,
      y: y,
      w: w,
      h: h
    };

    setPlaceholderList(prevState => [...prevState, img]);
  }

  function addNewImage(src, x, y, w, h, prompt) {
    // console.log('image added');
    // console.log(src);
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

  // movement handlers
  const handleTouchDown = (e) => {
    var touchposx = e.currentTarget.pointerPos.x;
    var touchposy = e.currentTarget.pointerPos.y;

    if (currentState === IDLE && moveState === READY) {
      setCamInitX(touchposx);
      setCamInitY(touchposy);
      switchMoveState(MOVING)
    } else if (currentState === IDLE && moveState === IDLE) {
      var offsets = stageRef.current.content.getBoundingClientRect();
      var x = (touchposx - offsets.x);
      var y = (touchposy - offsets.y);
      defineSelection(x, y);
    }
  }

  const handleMouseDown = (e) => {
    switch (e.evt.which) {
      case 1:
        var offsets = stageRef.current.content.getBoundingClientRect();
        var x = (e.evt.clientX - offsets.x);
        var y = (e.evt.clientY - offsets.y);
        defineSelection(x, y);
        break;

      case 2:
        setCamInitX(e.evt.clientX);
        setCamInitY(e.evt.clientY);
        switchMoveState(MOVING);
        break;

      case 3:
        setCamInitX(e.evt.clientX);
        setCamInitY(e.evt.clientY);
        switchMoveState(MOVING);
        break;

      default:
    }
  };

  const handleTouchMove = (e) => {
    var offsets = stageRef.current.content.getBoundingClientRect();

    var touchposx = e.currentTarget.pointerPos.x;
    var touchposy = e.currentTarget.pointerPos.y;

    if (currentState === SELECTING && moveState === IDLE) {

      var w = ((touchposx - offsets.x) / cameraZoom + cameraX - posX);
      var h = ((touchposy - offsets.y) / cameraZoom + cameraY - posY);
      setWidth(w);
      setHeight(h);
    } else if (currentState === IDLE && moveState === MOVING) {
      var movX = (touchposx) - camInitX;
      var movY = (touchposy) - camInitY;

      setCamInitX(touchposx);
      setCamInitY(touchposy);

      moveCamera((cameraX - movX / cameraZoom), (cameraY - movY / cameraZoom), cameraZoom);
    }
  }

  const handleMouseMove = (e) => {
    var offsets = stageRef.current.content.getBoundingClientRect();

    switch (currentState) {
      case SELECTING:
        var w = ((e.evt.clientX - offsets.x) / cameraZoom + cameraX - posX);
        var h = ((e.evt.clientY - offsets.y) / cameraZoom + cameraY - posY);

        setWidth(w);
        setHeight(h);
        break;
    }

    switch (moveState) {
      case MOVING:
        var movX = (e.evt.clientX) - camInitX;
        var movY = (e.evt.clientY) - camInitY;

        setCamInitX(e.evt.clientX);
        setCamInitY(e.evt.clientY);

        moveCamera((cameraX - movX / cameraZoom), (cameraY - movY / cameraZoom), cameraZoom);
        break;
    }
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

    var offsets = stageRef.current.content.getBoundingClientRect();
    var x = (e.evt.clientX - offsets.x);
    var y = (e.evt.clientY - offsets.y);
    var [ax, ay] = toGlobalSpace(x, y);

    moveCamera((ax - x / newZoom), (ay - y / newZoom), newZoom);
  }

  const handleTouchUp = (e) => {
    if (currentState === IDLE && moveState === MOVING) {
      switchMoveState(READY);
    } else if (currentState === SELECTING && moveState === IDLE) {
      switchState(INPUT_TYPE);
    }

    setSearchParam();
  }

  const handleMouseUp = (e) => {
    switch (e.evt.which) {
      case 1:
        if (currentState === SELECTING) {
          switchState(INPUT_TYPE);
        }
        break;

      case 2:
        switchMoveState(IDLE);
        break;

      case 3:
        switchMoveState(IDLE);
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
    console.log(imageDivList);
  };

  const handleInpaintAlpha = () => {
    var x = Math.floor(posX)
    var y = Math.floor(posY)
    var w = Math.floor(width)
    var h = Math.floor(height)

    var prompt = document.getElementById('prompt_input').value
    document.getElementById('prompt_input').value = ''

    var url_with_params = URL_IP_ALPHA +
      '?prompt=' + btoa(prompt) +
      '&room=' + room +
      '&posX=' + x +
      '&posY=' + y +
      '&width=' + w +
      '&height=' + h +
      '&init_image=' + imageSaveRef.current.uri();

    hideSelectionRect();

    fetch(url_with_params);

    addNewPlaceholder(x, y, w, h);
  }

  const handleImg2Img = () => {

  }

  const handleSave = () => {
    cropImageToSelection();
    imageSaveRef.current.download();
  }

  const handleNewImage = () => {
    cropImageToSelection();
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
      'prompt': btoa(prompt),
      'room': room,
      'posX': x,
      'posY': y,
      'width': w,
      'height': h,
      'init_image': imageSaveRef.current.uri()
    }

    let xhr = new XMLHttpRequest();
    xhr.open("POST", URL_IP_ALPHA);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(imageParamsDict);

    // fetch(URL_IP_ALPHA, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(imageParamsDict),
    // })

    addNewPlaceholder(x, y, w, h);
  };

  // true if rectangle a and b overlap
  function overlap(a, b) {
    if (a.x >= b.x + b.w || b.x >= a.x + a.w) return false;
    if (a.y >= b.y + b.h || b.y >= a.y + a.h) return false;
    return true;
  }

  return (
    <div style={{ cursor: cursor }}>

      <div className="bar">

        {isLogged === false ? (
          <GoogleLogin
            onSuccess={credentialResponse => {
              console.log(credentialResponse);
              setIsLogged(true);
              // request.send_connexion_request(credentialResponse.credential)

            }}
            onError={() => {
              console.log('Login Failed');
            }}
            useOneTap
          //todo add auto login

          />
        ) : (



          <button onClick={() => {
            googleLogout();
            setIsLogged(false);
            console.log(isLogged);
            // todo add logout=1 dans l'url et enlever le automatic login s'il est present
          }}> Logout </button>


        )}

        <button onClick={handleSubmit}> send socket </button>

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
            <button onClick={() => { setIsMobile(!isMobile) }}> Mobile controls </button>
            <button onClick={() => { cropImageToSelection() }}> Pre-save </button>
          </span>
        )}

        <p className="coords">
          {Math.floor(cameraX)}, {Math.floor(cameraY)}, {Math.floor(cameraZoom * 100) / 100}
        </p>

      </div>

      <Stage
        ref={stageRef}

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

                // display image only if the area is > 10px
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
            placeholderList.map((img, i) => {
              if (!img) {
                return;
              }

              var [x, y] = toRelativeSpace(img.x, img.y);
              return (
                <LoadPlaceholder
                  key={i}
                  x={x}
                  y={y}
                  width={img.w * cameraZoom}
                  height={img.h * cameraZoom}
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
        <ImageSaverLayer
          ref={imageSaveRef}
          imageSave={imageSave}
        />
      }

    </div>
  );

}

export default MyCanvas;
