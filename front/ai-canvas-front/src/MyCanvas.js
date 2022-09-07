import React, { Component, useState, useEffect, useRef, useReducer } from 'react';
import { Stage, Layer, Image, Rect, Group, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import useImage from 'use-image';
import ReactDOM from 'react-dom'
import { Buffer } from 'buffer';
import { GoogleLogin } from '@react-oauth/google';

const CANVAS_HEIGHT = window.innerHeight;
const CANVAS_WIDTH = window.innerWidth;

var URL_BUCKET = "https://storage.googleapis.com/aicanvas-public-bucket/"
var URL_IMAGINE = 'https://europe-west1-ai-canvas.cloudfunctions.net/function-imagen-1stgen'
// var URL_IMAGINE = "https://gpu.apipicaisso.ml/imagine/"

var URL_START_VM = "https://function-start-vm-jujlepts2a-ew.a.run.app"
var URL_STOP_VM = "https://function-stop-jujlepts2a-ew.a.run.app"
var URL_STATUS_VM = "https://function-get-status-gpu-jujlepts2a-ew.a.run.app"

var URL_GET_IMAGES = 'https://europe-west1-ai-canvas.cloudfunctions.net/function-get_images_for_pos'

//draw states
const SELECTING = 1, PROMPTING = 2;

//move state
const IDLE = 0, MOVING = 4, READY = 3;


//camera speed
const CAMERA_SPEED = 1;
const CAMERA_ZOOM_SPEED = 1.1;
const MIN_ZOOM = 0.01;

var nb_drawn = 0;

class URLImage extends React.Component {
  state = {
    image: null,
  };
  componentDidMount() {
    this.loadImage();
  }
  componentDidUpdate(oldProps) {
    if (oldProps.src !== this.props.src) {
      this.loadImage();
    }
  }
  componentWillUnmount() {
    this.image.removeEventListener('load', this.handleLoad);
  }
  loadImage() {
    // save to "this" to remove "load" handler on unmount
    this.image = new window.Image();
    this.image.src = this.props.src;
    this.image.addEventListener('load', this.handleLoad);
  }
  handleLoad = () => {
    // after setState react-konva will update canvas and redraw the layer
    // because "image" property is changed
    this.setState({
      image: this.image,
    });
    // if you keep same image object during source updates
    // you will have to update layer manually:
    // this.imageNode.getLayer().batchDraw();
  };
  render() {
    return (
      <Image
        x={this.props.x}
        y={this.props.y}
        width={this.props.width}
        height={this.props.height}
        image={this.state.image}
        ref={(node) => {
          this.imageNode = node;
        }}
      />
    );
  }
}

const MyCanvas = (props) => {
  const inputRef = useRef();

  const [currentState, setCurrentState] = useState(IDLE);
  const [moveState, setMoveState] = useState(IDLE);

  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [cursor, setCursor] = useState('default');

  //camera
  const [camInitX, setCamInitX] = useState(0);
  const [camInitY, setCamInitY] = useState(0);
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  const [cameraZoom, setCameraZoom] = useState(1);

  const [imageDivList, setImageDivList] = useState([]);
  const [placeHolderList, setPlaceHolderList] = useState({})

  const [isMobile, setIsMobile] = React.useState(false);


  useEffect(() => {
    const onPageLoad = () => {
      var el = document.getElementById("prompt_input");
      if (el !== null) {
        el.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            handleSend();
          }
        });
      }
      
      setIsMobile(window.innerWidth <= 768);
      handleClickRefresh();
    };

    // Check if the page has already loaded
    if (document.readyState === "complete") {
      onPageLoad();
    } else {
      window.addEventListener("load", onPageLoad);
      // Remove the event listener when component unmounts
      return () => window.removeEventListener("load", onPageLoad);
    }
  }, []);

  function switchState(state) {
    switch (state) {
      case IDLE:
        break;

      case SELECTING:
        break;

      case PROMPTING:
        //set rect new position
        if (width < 0) {
          setPosX(posX + width);
          setWidth(Math.abs(width));
        }

        if (height < 0) {
          setPosY(posY + height);
          setHeight(Math.abs(height));
        }

        var input = document.getElementById("prompt_input");
        input.value = '';
        input.focus();
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

  function toAbsoluteSpace(x, y) {
    x = cameraX + x / cameraZoom;
    y = cameraY + y / cameraZoom;
    return [x, y]
  }

  function toRelativeSpace(x, y) {
    x = (x - cameraX) * cameraZoom;
    y = (y - cameraY) * cameraZoom;
    return [x, y]
  }

  function defineSelection(e) {
    var offsets = inputRef.current.content.getBoundingClientRect();

    var x = (e.evt.clientX - offsets.x);
    var y = (e.evt.clientY - offsets.y);
    [x, y] = toAbsoluteSpace(x, y);

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

  function DraggableRect(props) {

    return (
      <Group
        x={0}
        y={0}
      >
        <Group
          x={props.x}
          y={props.y}
          draggable={false} //TODO change it to true once coord works
          fill="green"
        >
          <Rect
            stroke="black"
            shadowBlur={10}
            shadowColor="white"
            width={props.width}
            height={props.height}
            opacity={0.5}
            fill={"pink"}
          />

          <Group
            y={-50 + (props.height < 0 ? props.height : 0)}
            x={props.width - props.width / 2 - 200}
          >
            <Html>
              <div style={{ visibility: currentState === PROMPTING ? 'visible' : 'hidden' }}>
                <input id="prompt_input" placeholder="Input prompt" autoFocus />
                <button onClick={() => props.handleSend()}>
                  Send
                </button>
              </div>
            </Html>
          </Group>

        </Group>
      </Group>
    );
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

    setImageDivList(prevState => [...prevState, img]);
  }

  function addNewImage(src, x, y, w, h) {
    // console.log('image added');
    // console.log(src);
    var img = {
      type: 'image',
      src: src,
      x: x,
      y: y,
      w: w,
      h: h
    };

    setImageDivList(prevState => [...prevState, img]);
  }

  const handleMouseDown = (e) => {
    console.log(isMobile);
    if (!isMobile) {
      switch (e.evt.which) {
        case 1:
          defineSelection(e);
          break;

        case 2:
          setCamInitX(e.evt.clientX);
          setCamInitY(e.evt.clientY);
          switchMoveState(MOVING);
          break;

        default:
      }
    } else {
      if (currentState === IDLE && moveState === READY) {
        setCamInitX(e.evt.clientX);
        setCamInitY(e.evt.clientY);
        switchMoveState(MOVING)
      } else if (currentState === IDLE && moveState === IDLE) {
        defineSelection(e);
      }
    }
  };

  const handleMouseMove = (e) => {
    var offsets = inputRef.current.content.getBoundingClientRect();

    if (!isMobile) {
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

          setCameraX((cameraX - movX / cameraZoom));
          setCameraY((cameraY - movY / cameraZoom));
          break;
      }
    } else {
      if (currentState === SELECTING && moveState === IDLE) {
        w = ((e.evt.clientX - offsets.x) / cameraZoom + cameraX - posX);
        h = ((e.evt.clientY - offsets.y) / cameraZoom + cameraY - posY);
        setWidth(w);
        setHeight(h);
      } else if (currentState === IDLE && moveState === MOVING) {
        movX = (e.evt.clientX) - camInitX;
        movY = (e.evt.clientY) - camInitY;

        setCamInitX(e.evt.clientX);
        setCamInitY(e.evt.clientY);

        setCameraX((cameraX - movX / cameraZoom));
        setCameraY((cameraY - movY / cameraZoom));
      }
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

    var offsets = inputRef.current.content.getBoundingClientRect();
    var x = (e.evt.clientX - offsets.x);
    var y = (e.evt.clientY - offsets.y);
    var [ax, ay] = toAbsoluteSpace(x, y);

    setCameraX(ax - x / newZoom);
    setCameraY(ay - y / newZoom);

    setCameraZoom(newZoom);
  }

  const handleMouseUp = (e) => {
    switch (e.evt.which) {
      case 1:
        if (!isMobile) {
          if (currentState === SELECTING) {
            switchState(PROMPTING);
          }
        } else {
          if (currentState === IDLE && moveState === MOVING) {
            switchMoveState(READY);
          } else if (currentState === SELECTING && moveState === IDLE) {
            switchState(PROMPTING);
          }
        }
        break;

      case 2:
        switchMoveState(IDLE);
        break;

      default:
    }
  };

  const handleClickRefresh = () => {
    var url_get_image_with_params = URL_GET_IMAGES + '?posX=0&posY=0&width=100&height=100';

    fetch(url_get_image_with_params).then((data) => data.json())
      .then((json) => json.message)
      .then((images) => Array.from(images).forEach((image) => {
        console.log(image);
        console.log(image.path);
        addNewImage(URL_BUCKET + image.path, image.posX, image.posY, image.width, image.height);
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

  const handleSend = () => {
    var x = Math.floor(posX)
    var y = Math.floor(posY)
    var w = Math.floor(width)
    var h = Math.floor(height)

    //var [w,h] = toRelativeSpace(width,height).map((v) => {return Math.floor(v)})

    var prompt = document.getElementById('prompt_input').value
    document.getElementById('prompt_input').value = ''

    var url_with_params = URL_IMAGINE + '?prompt=' + btoa(prompt) + '&posX=' + x + '&posY=' + y + '&width=' + w + '&height=' + h;

    hideSelectionRect();

    const promise = fetch(url_with_params);

    addNewPlaceholder(x, y, w, h);

    promise.then((response) => {
      return response.text()
    }).then((data) => {
      addNewImage(URL_BUCKET + data, x, y, w, h);
    });

  };

  function overlaps(a, b) {
    if (a.x >= b.x + b.w || b.x >= a.x + a.w) return false;
    if (a.y >= b.y + b.h || b.y >= a.y + a.h) return false;
    return true;
  }

  return (
    <div style={{ cursor: cursor }}>

      <div className="bar">
      {/* <GoogleLogin
        onSuccess={credentialResponse => {
          console.log(credentialResponse);
        }}
        onError={() => {
          console.log('Login Failed');
        }}
      /> */}
        {isMobile ? (
          <div>
            <button onClick={() => handleClickRefresh()}>
              Refresh
            </button>

            <button onClick={() => handleClickMove()}>
              Move
            </button>

            <button onClick={() => handleClickDraw()}>
              Draw
            </button>

            <button onClick={() => setCameraZoom(cameraZoom * 1.1)}>
              Z+
            </button>

            <button onClick={() => setCameraZoom(cameraZoom * 0.9)}>
              Z-
            </button>

            <button className="info">
              ?
            </button>
          </div>
        ) : (
          <button onClick={() => { setIsMobile(!isMobile) }}>
            Mobile controls
          </button>
        )}

        <p>
          {Math.floor(cameraX)}, {Math.floor(cameraY)}, {Math.floor(cameraZoom * 100) / 100}
        </p>

      </div>


      <Stage
        ref={inputRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleMouseScroll}>

        <Layer>
          {
            imageDivList.map((img, i) => {
              var cameraBox = {
                x : cameraX,
                y : cameraY,
                w : window.innerWidth / cameraZoom,
                h : window.innerHeight / cameraZoom
              }
              if (
                overlaps(cameraBox, img)
              ) {
                var [x, y] = toRelativeSpace(img.x, img.y);

                if (img.type === 'image') {
                  return (
                    <URLImage
                      key={i}
                      src={img.src}
                      x={x}
                      y={y}
                      width={img.w * cameraZoom}
                      height={img.h * cameraZoom}
                    />)
                } else if (img.type === 'placeholder') {
                  return (
                    <Rect
                      stroke="black"
                      shadowBlur={10}
                      shadowColor="white"
                      x={x}
                      y={y}
                      width={img.w * cameraZoom}
                      height={img.h * cameraZoom}
                      opacity={0.5}
                      fill={"green"}
                    />
                  )
                }
              }

            })
          }

          <DraggableRect
            x={(posX - cameraX) * cameraZoom}
            y={(posY - cameraY) * cameraZoom}
            width={width * cameraZoom}
            height={height * cameraZoom}
            handleSend={handleSend}
          />
        </Layer>
      </Stage>
    </div>
  );

}

export default MyCanvas;
