import React, { Component, useState, useRef } from 'react';
import { Stage, Layer, Image, Rect } from 'react-konva';
import ReactDOM from 'react-dom';

var CANVAS_HEIGHT = 1500;
var CANVAS_WIDTH  = 1500;

var FULL_CANVAS_LINK = "TODO"

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

function DraggableRect(props){

    return (
        <Rect
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        fill="red"
        shadowBlur={10}
    />
    );
}

function MyCanvas(props) {
    
    const inputRef = useRef();
    
    const [posX, setPosX] = useState(0);
    const [posY, setPosY] = useState(0);
    const [width, setwidth] = useState(10);
    const [height, setHeight] = useState(10);

    const [isSelectionning, setIsSelectionning] = useState(false);

    const[image_url, setImageUrl] = useState(FULL_CANVAS_LINK);

    const handleMouseDown = (e) => {
        var offsets = inputRef.current.content.getBoundingClientRect();
        setPosX(e.evt.clientX - offsets.x);
        setPosY(e.evt.clientY - offsets.y);
        setIsSelectionning(true);  
        // console.log(e);      

    };

    const handleMouseMove = (e) => {
        var offsets = inputRef.current.content.getBoundingClientRect();

        if (isSelectionning){
            setwidth(e.evt.clientX - offsets.x - posX);
            setHeight(e.evt.clientY - offsets.y - posY);
        }
      };

    const handleMouseUp = (e) => {
        setwidth(0);
        setHeight(0);
        setPosX(0);
        setPosY(0);
        setIsSelectionning(false);

        // call to draw image

    };
  
    return (
        <div>
            <button onClick={setImageUrl(FULL_CANVAS_LINK)}>
                Refresh </button>
            <Stage
                ref={inputRef}
                width={CANVAS_WIDTH} height={CANVAS_HEIGHT} 
                onMouseDown={handleMouseDown} 
                onMouseMove = {handleMouseMove}
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
