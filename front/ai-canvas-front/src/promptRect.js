import React from 'react';
import { Rect, Group } from 'react-konva';
import { Html } from 'react-konva-utils';

function PromptRect(props) {
    var minSize = Math.min(props.width, props.height)

    const style = {
        borderColor: "rgba(215, 215, 215, 1)",
        borderWidth: minSize*0.0025+"em",
        borderStyle: "solid",
        boxSizing: "border-box",
        backgroundColor: "white",
        display: "block",
        marginLeft: "auto",
        marginRight: "auto",
        width: props.width,
        height: props.height,
        position: "relative"
    }

    return (
        <Group
            x={0}
            y={0}
        >
            <Group
                x={props.x}
                y={props.y}
                fill="green"
            >
                <Rect
                    stroke="black"
                    dash={[10, 10]}
                    shadowBlur={10}
                    shadowColor="white"
                    width={props.width}
                    height={props.height}
                    fill={"rgba(240,240,240,0.5)"}
                />

                {props.visible &&
                    <Group
                        y={-50}
                        x={props.width - props.width / 2 - 150}
                    >
                        <Html>
                            <div>
                                <input id="prompt_input" placeholder="Image prompt" autoFocus />
                                <button onClick={() => props.handleSend()}>
                                    Send
                                </button>
                            </div>
                        </Html>
                    </Group>
                }

            </Group>
        </Group>
    );
}

export default PromptRect;
