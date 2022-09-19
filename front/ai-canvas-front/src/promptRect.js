import React from 'react';
import { Rect, Group } from 'react-konva';
import { Html } from 'react-konva-utils';

function PromptRect(props) {
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
                        <div style={{ visibility: props.visible ? 'visible' : 'hidden' }}>
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

export default PromptRect;
