import React from 'react';
import { Image, Group, Rect } from 'react-konva';

class URLImage extends React.Component {
    state = {
        image: null,
        infoVisible: true
    };

    componentDidMount() {
        this.loadImage();
    }

    // componentDidUpdate(oldProps) {
    //     if (oldProps.src !== this.props.src) {
    //         this.loadImage();
    //     }
    // }

    componentWillUnmount() {
        this.image.removeEventListener('load', this.handleLoad);
    }

    loadImage() {
        this.image = new window.Image();
        this.image.src = this.props.src;
        this.image.crossOrigin = 'Anonymous';
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
    }

    render() {
        return (
            <Group
                x={this.props.x}
                y={this.props.y}
                onMouseEnter={this.handleEnter}
                onMouseLeave={this.handleLeave}
            >
                <Rect
                    width={this.props.width}
                    height={this.props.height}
                    fill={this.props.avg_color}
                />

                <Image
                    width={this.props.width}
                    height={this.props.height}
                    image={this.state.image}
                    ref={(node) => { this.imageNode = node; }}
                    onClick={this.handleClick}
                />
            </Group>
        );
    }
}

export default URLImage;