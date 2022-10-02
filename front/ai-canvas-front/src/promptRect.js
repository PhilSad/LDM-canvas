import React from 'react';
import { Rect, Group } from 'react-konva';
import { Html } from 'react-konva-utils';
import Modal from 'react-bootstrap/Modal';

function PromptRect(props) {
    var width = props.width;
    var height = props.height;
    var x = props.x;
    var y = props.y;

    var el = document.getElementById("prompt_input");
    if (el !== null) {
        el.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                props.handleSend();
            }
        });
    }

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

                <Group
                    y={-50 + (height < 0 ? height : 0)}
                    x={width - width / 2 - 200}
                >
                    <Html>
                        <div className='choiceButtonCont'>

                            {props.currentState === "INPUT_TYPE" &&
                                <div>
                                    <button className='choiceButton' title="New Image" onClick={() => props.handleNewImage()}>Ni</button>
                                    <button className='choiceButton' title="Inpainting Alpha" onClick={() => props.handleInpaintAlpha()}>Ip</button>
                                    <button className='choiceButton' title="Image To Image" onClick={() => props.handleImg2Img()}>i2i</button>
                                    <button className='choiceButton green' title="Save Selection" onClick={() => props.handleSave()}>Sv</button>
                                </div>
                            }

                            {props.currentState === "PROMPTING" &&
                                <div>
                                    <input id="prompt_input" placeholder="Image prompt" autoFocus />
                                    <button onClick={() => props.handleSend()} >
                                        Send
                                    </button>
                                </div>
                            }

                        </div>
                    </Html>
                </Group>

            </Group>
        </Group>
    );
}

export default PromptRect;
