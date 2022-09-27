import React from 'react';
import { forwardRef, useRef, useImperativeHandle } from 'react';
import { Image, Stage, Layer } from 'react-konva';

const ImageSaverLayer = forwardRef((props, ref) => {
    const saveLayerRef = useRef(null);

    useImperativeHandle(ref, () => ({

        download() {
            function downloadURI(uri, name) {
                var link = document.createElement('a');
                link.download = name;
                link.href = uri;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            downloadURI(saveLayerRef.current.toDataURL(), "crop.png")
        }

    }));

    return (
        <Stage
            width={512}
            height={512}
        >
            <Layer
                ref={saveLayerRef}
                clipX={0}
                clipY={0}
                clipWidth={props.imageSave.w}
                clipHeight={props.imageSave.h}
            >
                <Image
                    x={-props.imageSave.x}
                    y={-props.imageSave.y}
                    image={props.imageSave.image}
                />
            </Layer>

        </Stage>
    )
})

export default ImageSaverLayer;
