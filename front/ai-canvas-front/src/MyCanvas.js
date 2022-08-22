import React, { Component, useState, useRef, useReducer } from 'react';
import { Stage, Layer, Image, Rect, Group, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import ReactDOM from 'react-dom'
import { Buffer } from 'buffer';

var CANVAS_HEIGHT = 1500;
var CANVAS_WIDTH = 1500;

var FULL_CANVAS_LINK = "http://35.210.120.231:5000/full_canvas/"
var URL_IMAGINE = 'http://35.210.120.231:5000/imagine/'
// custom component that will handle loading image from url
// you may add more logic here to handle "loading" state
// or if loading is failed
// VERY IMPORTANT NOTES:
// at first we will set image state to null
// and then we will set it to native image instance when it is loaded



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
      x={props.x}
      y={props.y}
      width={props.width}
      height={props.height}
      draggable={true}>

      <Rect
        stroke="black"
        shadowBlur={10}
        shadowColor="white"
        width={props.width}
        height={props.height}
        opacity={0.5}
        fill="pink"
      />

      <Html
        divProps={{
          style: {
            position: 'absolute',
            top: -100,
            left: 10,
          },
        }}
>
        <input placeholder="Input prompt" />
      </Html>
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

function MyCanvas(props) {

  const inputRef = useRef();

  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [isSelectionning, setIsSelectionning] = useState(false);

  const [image_url, setImageUrl] = useState(FULL_CANVAS_LINK);

  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  const handleMouseDown = (e) => {
    var offsets = inputRef.current.content.getBoundingClientRect();
    var x = e.evt.clientX - offsets.x;
    var y = e.evt.clientY - offsets.y;

    //only accept left clicks
    if (e.evt.which != 1) {
      return;
    }

    //if we click on the current rect, we don't want to start a new selection
    if (x > posX && x < posX + width && y > posY && y < posY + height) {
      return;
    }

    if (isSelectionning) {
      return;
    }

    setPosX(x);
    setPosY(y);
    setWidth(0);
    setHeight(0);
    setIsSelectionning(true);
  };

  const handleMouseMove = (e) => {
    var offsets = inputRef.current.content.getBoundingClientRect();

    if (isSelectionning) {
      var w = e.evt.clientX - offsets.x - posX;
      var h = e.evt.clientY - offsets.y - posY;
      setWidth(w);
      setHeight(h);
    }
  };

  const handleMouseUp = (e) => {
    setIsSelectionning(false);

    //set rect new position

    if (width < 0) {
      setPosX(posX + width);
      setWidth(Math.abs(width));
    }

    if (height < 0) {
      setPosY(posY + height);
      setHeight(Math.abs(height));
    }

  };

  const handleClickRefresh = () => {
    setImageUrl(image_url + '?');
  };

  const handleSend = () => {
    var prompt = document.getElementById('input_prompt').value

    var url_with_params = URL_IMAGINE + '?prompt=' + btoa(prompt) + '&posX=' + Math.floor(posX) + '&posY=' + Math.floor(posY)
      + '&width=' + Math.floor(width) + '&height=' + Math.floor(height);

    console.log(url_with_params);

    fetch(url_with_params).then(() => {
      handleClickRefresh();
      setHeight(0);
      setWidth(0);
    });

  };

  return (
    <div>

      <div class="bar">


      <EditableInput />

      <button onClick={() => handleClickRefresh()}>
        Refresh
      </button>

      <button onClick={() => handleSend()}>
        Send
      </button>

      <button>
        Save
      </button>
      
        <button class="info">
          ?
        </button>
      
      </div>


      <Stage
        ref={inputRef}
        width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}>

        <Layer>
          <URLImage src={image_url} />
          <DraggableRect
            x={posX}
            y={posY}
            width={width}
            height={height}
          />
        </Layer>
      </Stage>
    </div>
  );

}

export default MyCanvas;
