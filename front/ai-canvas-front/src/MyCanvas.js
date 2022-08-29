import React, { Component, useState, useEffect, useRef, useReducer } from 'react';
import { Stage, Layer, Image, Rect, Group, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import useImage from 'use-image';
import ReactDOM from 'react-dom'
import { Buffer } from 'buffer';

const CANVAS_HEIGHT = window.innerHeight;
const CANVAS_WIDTH = window.innerWidth;

var FULL_CANVAS_LINK = "https://storage.googleapis.com/aicanvas-public-bucket/full_canvas.png"
// var URL_IMAGINE = 'https://function-api-imagen-jujlepts2a-ew.a.run.app/'
var URL_IMAGINE = "https://gpu.apipicaisso.ml/imagine/"

var URL_START_VM = "https://function-start-vm-jujlepts2a-ew.a.run.app"
var URL_STOP_VM = "https://function-stop-jujlepts2a-ew.a.run.app"
var URL_STATUS_VM = "https://function-get-status-gpu-jujlepts2a-ew.a.run.app"

// custom component that will handle loading image from url
// you may add more logic here to handle "loading" state
// or if loading is failed
// VERY IMPORTANT NOTES:
// at first we will set image state to null
// and then we will set it to native image instance when it is loaded

//states
const IDLE = 0, SELECTING = 1, PROMPTING = 2, WAITING = 3, MOVING = 4;

//camera speed
const CAMERA_SPEED = 0.1;

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
  const [movX, setMovX] = useState(0);
  const [movY, setMovY] = useState(0);
  const [imageDivList, setImageDivList] = useState([]);

  const [currentState, setCurrentState] = useState(IDLE);
  const [image_url, setImageUrl] = useState(FULL_CANVAS_LINK);

  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  function movingCursor(e) {
    switch (currentState) {
      case IDLE:
        setCursor('all-scroll');
        setCurrentState(MOVING);

        var x = e.evt.clientX;
        var y = e.evt.clientY;

        setCamInitX(x);
        setCamInitY(y);
        break;

      case MOVING:
        setCursor('default');
        setCurrentState(IDLE);
        break;
    }
  }

  function defineSelection(e) {
    if (currentState === IDLE) {
      var offsets = inputRef.current.content.getBoundingClientRect();
      var x = e.evt.clientX - offsets.x + cameraX;
      var y = e.evt.clientY - offsets.y + cameraY;

      //if we click on the current rect, we don't want to start a new selection
      if (x > posX && x < posX + width && y > posY && y < posY + height) {
        return;
      }

      //if we are already making a selection, return
      if (currentState === SELECTING) {
        return;
      }

      setPosX(x);
      setPosY(y);
      setWidth(0);
      setHeight(0);
      setCurrentState(SELECTING);
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
          draggable={true}
          fill="green"
        >
          <Rect
            stroke="black"
            shadowBlur={10}
            shadowColor="white"
            width={props.width}
            height={props.height}
            opacity={0.5}
            fill="pink"
          />

          <Group
            y={-50 + (props.height < 0 ? props.height : 0)}
            x={props.width - props.width / 2 - 200}
          >
            <Html>
              <div style={{ visibility: currentState === IDLE ? 'visible' : 'hidden' }}>
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

  function addNewImage(bytecode, x, y, w, h) {
    var img = {
      bytecode: bytecode,
      x: x,
      y: y,
      w: w,
      h: h
    };

    setImageDivList([...imageDivList, img])
  }

  const handleMouseDown = (e) => {
    switch (e.evt.which) {
      case 1:
        defineSelection(e);
        break;

      case 2:
        movingCursor(e);
        break;

      default:
    }
  };

  const handleMouseMove = (e) => {
    var offsets = inputRef.current.content.getBoundingClientRect();

    switch (currentState) {
      case SELECTING:
        var w = e.evt.clientX - offsets.x + cameraX - posX;
        var h = e.evt.clientY - offsets.y + cameraY - posY;
        setWidth(w);
        setHeight(h);
        break;

      case MOVING:
        setMovX((e.evt.clientX) - camInitX);
        setMovY((e.evt.clientY) - camInitY);

        setCameraX(cameraX + movX * CAMERA_SPEED);
        setCameraY(cameraY + movY * CAMERA_SPEED);
        break;
    }
  };

  const handleMouseUp = (e) => {
    if (currentState === SELECTING) {
      setCurrentState(IDLE);

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
    }
  };

  const handleClickRefresh = () => {
    setImageUrl(image_url + '?');
  };

  const handleStartVm = () => {
    fetch(URL_START_VM).then((data) => alert('VM SARTED'));
  };

  const handleStopVm = () => {
    fetch(URL_STOP_VM).then((data) => alert('VM STOPPED'));
  };

  const handleStatusVm = () => {
    fetch(URL_STATUS_VM).then(data => data.json()).
      then((data) => alert(data.message));
  };


  // const handleStatusVm = () => {
  //   fetch(URL_STATUS_VM).then(alert('VM STOPED'));
  // };

  const handleSend = () => {
    var x = Math.floor(posX);
    var y = Math.floor(posY);
    var w = Math.floor(width);
    var h = Math.floor(height);

    var prompt = document.getElementById('prompt_input').value
    document.getElementById('prompt_input').value = ''

    var url_with_params = URL_IMAGINE + '?prompt=' + btoa(prompt) + '&posX=' + x + '&posY=' + y + '&width=' + w + '&height=' + h;

    console.log(url_with_params);

    fetch(url_with_params)
      .then((response) => {
        return response.text()
      }).then((data) => {
        addNewImage(data, x, y, w, h);
        setHeight(0);
        setWidth(0);
        setCurrentState(IDLE);
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
      </div>


      <Stage
        ref={inputRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}>

        <Layer>
          {/* <URLImage src={image_url} /> */}

          {
            imageDivList.map((img) => {
              return (
                <URLImage
                  src={"data:image/png;base64," + img.bytecode}
                  x={img.x - cameraX}
                  y={img.y - cameraY}
                />                
              )
            })
          }

          <DraggableRect
            x={posX - cameraX}
            y={posY - cameraY}
            width={width}
            height={height}
            handleSend={handleSend}
          />
        </Layer>
      </Stage>
    </div>
  );

}

export default MyCanvas;
