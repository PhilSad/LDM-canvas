import React from 'react';
import { Rect, Group } from 'react-konva';
import { Html } from 'react-konva-utils';

function PromptRect(props) {
    var width = props.width;
    var height = props.height;
    var x = props.x;
    var y = props.y;

    return (
        <Group
            x={0}
            y={0}
        >
            <Group
                x={x}
                y={y}
                fill="green"
            >
                <Rect
                    stroke="black"
                    dash={[10, 10]}
                    shadowBlur={10}
                    shadowColor="white"
                    width={width}
                    height={height}
                    fill={"rgba(240,240,240,0.5)"}
                />

                {props.visible &&
                    <Group
                        y={-50 + (height < 0 ? height : 0)}
                        x={width - width / 2 - 150}
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
