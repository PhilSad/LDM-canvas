import React, { Component, useState, useEffect, useRef, useReducer } from 'react';
import { Stage, Layer, Image, Rect, Group, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import useImage from 'use-image';
import ReactDOM from 'react-dom'
import { Buffer } from 'buffer';

const CANVAS_HEIGHT = window.innerHeight;
const CANVAS_WIDTH = window.innerWidth;

const FULL_CANVAS_LINK = "http://35.210.120.231:5000/full_canvas/"
const URL_IMAGINE = 'http://35.210.120.231:5000/imagine/'
// custom component that will handle loading image from url
// you may add more logic here to handle "loading" state
// or if loading is failed
// VERY IMPORTANT NOTES:
// at first we will set image state to null
// and then we will set it to native image instance when it is loaded

//states
const IDLE = 0, SELECTING = 1, MOVING = 2;

//camera speed
const CAMERA_SPEED = 0.02;

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
            <input id="prompt_input" placeholder="Input prompt" autoFocus />
            <button onClick={() => props.handleSend()}>
              Send
            </button>
          </Html>
        </Group>

      </Group>
    </Group>
  );
}

function EditableInput(props) {
  const [prompt, setPrompt] = useState('');

  return (
    <input
      id="input_prompt"
      type='text'
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      size={50}
      placeholder="Enter your prompt here"
    />
  );
}

const MyCanvas = (props) => {

  const inputRef = useRef();

  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [cursor, setCursor] = useState('default');

  //camera
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  const [scrollInitX, setScrollInitX] = useState(0);
  const [scrollInitY, setScrollInitY] = useState(0);

  const [currentState, setCurrentState] = useState(IDLE);

  const [image_url, setImageUrl] = useState(FULL_CANVAS_LINK);

  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  function switchMoveState(e) {
    switch (currentState) {
      case IDLE:
        setCursor('all-scroll');
        setCurrentState(MOVING);

        var x = e.evt.clientX;
        var y = e.evt.clientY;

        console.log('init', x, y);

        setScrollInitX(x);
        setScrollInitY(y);
        break;

      case MOVING:
        setCursor('default');
        setCurrentState(IDLE);
        break;
    }
  }

  function defineSelection(e) {
    if(currentState == IDLE) {
      var offsets = inputRef.current.content.getBoundingClientRect();
      var x = e.evt.clientX - offsets.x + cameraX;
      var y = e.evt.clientY - offsets.y + cameraY;
  
      //if we click on the current rect, we don't want to start a new selection
      if (x > posX && x < posX + width && y > posY && y < posY + height) {
        return;
      }
  
      //if we are already making a selection, return
      if (currentState == SELECTING) {
        return;
      }
  
      setPosX(x);
      setPosY(y);
      setWidth(0);
      setHeight(0);
      setCurrentState(SELECTING);
    }
  }

  const handleMouseDown = (e) => {
    switch (e.evt.which) {
      case 1:
        defineSelection(e);
        break;

      case 2:
        switchMoveState(e);
        break;

      default:
    }
  };

  const handleMouseMove = (e) => {
    var offsets = inputRef.current.content.getBoundingClientRect();

    switch(currentState){
      case SELECTING:
        var w = e.evt.clientX - offsets.x + cameraX - posX;
        var h = e.evt.clientY - offsets.y + cameraY - posY;
        setWidth(w);
        setHeight(h);
        break;

      case MOVING:
        var movX = (e.evt.clientX) - scrollInitX;
        var movY = (e.evt.clientY) - scrollInitY;

        console.log(movX, movY);

        setCameraX(cameraX + movX*CAMERA_SPEED);
        setCameraY(cameraY + movY*CAMERA_SPEED);
        break;
    }
  };

  const handleMouseUp = (e) => {
    if (currentState == SELECTING) {
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

  const handleSend = () => {
    var prompt = document.getElementById('prompt_input').value
    document.getElementById('prompt_input').value = ''

    var url_with_params = URL_IMAGINE + '?prompt=' + btoa(prompt) + '&posX=' + Math.floor(posX) + '&posY=' + Math.floor(posY)
      + '&width=' + Math.floor(width) + '&height=' + Math.floor(height);

    console.log(url_with_params);

    console.log('sent!!!');
    fetch(url_with_params).then(() => {
      console.log('received!!!');
      handleClickRefresh();
      setHeight(0);
      setWidth(0);
    });
  };

  return (
    <div style={{ cursor: cursor }}>

      <div className="bar">

        <button onClick={() => handleClickRefresh()}>
          Refresh
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

          <URLImage
            src={"https://konvajs.org/assets/lion.png"}
            x={0 - cameraX}
            y={0 - cameraY}
          />

          <URLImage
            src={"https://konvajs.org/assets/yoda.jpg"}
            x={150 - cameraX}
            y={300 - cameraY}
          />

          <URLImage
            src={"https://konvajs.org/assets/darth-vader.jpg"}
            x={3000 - cameraX}
            y={15 - cameraY}
          />

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
