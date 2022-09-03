import React, { Component, useState, useEffect, useRef, useReducer } from 'react';
import { Stage, Layer, Image, Rect, Group, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import useImage from 'use-image';
import ReactDOM from 'react-dom'
import { Buffer } from 'buffer';

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
const IDLE = 0, SELECTING = 1, PROMPTING = 2, WAITING = 3, MOVING = 4;

//camera speed
const CAMERA_SPEED = 1;
const CAMERA_ZOOM_SPEED = 0.1;
const MIN_ZOOM = 0.1;

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
  // const [movX, setMovX] = useState(0);
  // const [movY, setMovY] = useState(0);


  function switchState(state) {
    
    switch (state) {
      case IDLE:
        setCursor('default');
        setHeight(0);
        setWidth(0);
        break;

      case SELECTING:
        break;

      case PROMPTING:
        //add enter key listener
        var el = document.getElementById("prompt_input");
        if (el !== null) {
          el.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
              handleSend();
            }
          });
        }

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

      case WAITING:
        break;

      case MOVING:
        setCursor('all-scroll');
        break;
    }
    setCurrentState(state);
  }

  function toAbsoluteSpace(x, y) {
    x = cameraX + x / cameraZoom;
    y = cameraY + y / cameraZoom;
    return [x,y]
  }

  function toRelativeSpace(x, y) {
    x = (x-cameraX) * cameraZoom;
    y = (y-cameraY) * cameraZoom;
    return [x,y]
  }

  function defineSelection(e) {
    if (currentState === IDLE) {
      var offsets = inputRef.current.content.getBoundingClientRect();

      var x = (e.evt.clientX - offsets.x);
      var y = (e.evt.clientY - offsets.y);
      [x,y] = toAbsoluteSpace(x, y);

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
            fill={currentState === WAITING ? "green" : "pink"}
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

  function addNewImage(src, x, y, w, h) {
    // console.log('image added');
    // console.log(src);
    var img = {
      src: URL_BUCKET + src,
      x: x,
      y: y,
      w: w,
      h: h
    };

    setImageDivList(prevState => [...prevState, img]);
  }

  const handleMouseDown = (e) => {
    switch (e.evt.which) {
      case 1:
        defineSelection(e);
        break;

      case 2:
        setCamInitX(e.evt.clientX);
        setCamInitY(e.evt.clientY);
        switchState(MOVING);
        break;

      default:
    }
  };

  const handleMouseMove = (e) => {
    var offsets = inputRef.current.content.getBoundingClientRect();

    switch (currentState) {
      case SELECTING:
        var w = ((e.evt.clientX - offsets.x) / cameraZoom + cameraX - posX);
        var h = ((e.evt.clientY - offsets.y) / cameraZoom + cameraY - posY);
        setWidth(w);
        setHeight(h);
        break;

      case MOVING:
        var movX = (e.evt.clientX)  - camInitX;
        var movY = (e.evt.clientY) - camInitY;

        setCamInitX(e.evt.clientX);
        setCamInitY(e.evt.clientY);

        setCameraX((cameraX - movX / cameraZoom));
        setCameraY((cameraY - movY / cameraZoom));
        break;
    }
  };

  const handleMouseScroll = (e) => {
    if(e.evt.wheelDelta === 0)
      return;
      
    var newZoom = cameraZoom + CAMERA_ZOOM_SPEED * (e.evt.wheelDelta > 0 ? 1 : -1)
    newZoom = Math.max(newZoom, 0.1);
    
    var offsets = inputRef.current.content.getBoundingClientRect();
    var x = (e.evt.clientX - offsets.x);
    var y = (e.evt.clientY - offsets.y);
    var [ax,ay] = toAbsoluteSpace(x,y);

    setCameraX(ax - x/newZoom);
    setCameraY(ay - y/newZoom);

    setCameraZoom(newZoom);
  }

  const handleMouseUp = (e) => {
    switch (e.evt.which) {
      case 1:
        if (currentState === SELECTING) {
          switchState(PROMPTING);
        }
        break;

      case 2:
        switchState(IDLE);
        break;

      default:
    }
  };

  const handleClickRefresh = () => {
    
    var url_get_image_with_params = URL_GET_IMAGES+'?posX=0&posY=0&width=100&height=100';
    console.log(url_get_image_with_params);
    fetch(url_get_image_with_params).then((data) => data.json())
                                    .then((json) => json.message)
                                    .then((images) => Array.from(images).forEach((image) => {
                                      console.log(image);
                                      console.log(image.path);
                                      addNewImage(image.path, image.posX, image.posY, image.width, image.height);
                                    }));
       

  };

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

    var prompt = document.getElementById('prompt_input').value
    document.getElementById('prompt_input').value = ''

    var url_with_params = URL_IMAGINE + '?prompt=' + btoa(prompt) + '&posX=' + x + '&posY=' + y + '&width=' + w + '&height=' + h;

    console.log(url_with_params);

    switchState(WAITING);

    fetch(url_with_params)
      .then((response) => {
        return response.text()
      }).then((data) => {
        console.log(data);
        addNewImage(data, x, y, w, h);
        switchState(IDLE);
      });

  };

  return (
    <div style={{ cursor: cursor }}>

      <div className="bar">

        <button onClick={() => handleClickRefresh()}>
          Refresh
        </button>

        <button onClick={() => handleStartVm()}>
          start vm
        </button>

        <button onClick={() => handleStopVm()}>
          stop vm
        </button>

        <button onClick={() => handleStatusVm()}>
          status vm
        </button>

        <button>
          Save
        </button>

        <button className="info">
          ?
        </button>

        <p>
          {Math.floor(cameraX)}, {Math.floor(cameraY)}, {Math.floor(cameraZoom*100)/100}
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
              var [x,y] = toRelativeSpace(img.x, img.y);

              return (
                <URLImage
                  key={i}
                  src={img.src}
                  x={x}
                  y={y}
                  width={img.w * cameraZoom}
                  height={img.h * cameraZoom}
                />
              )
            })
          }

          <DraggableRect
            x={(posX - cameraX)*cameraZoom}
            y={(posY - cameraY)*cameraZoom}
            width={width*cameraZoom}
            height={height*cameraZoom}
            handleSend={handleSend}
          />
        </Layer>
      </Stage>
    </div>
  );

}

export default MyCanvas;
