import React, { useState } from "react";
import CoordsModal from './coordsModal'
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import SignInModalButton from "./signinModal";
import * as requests from './requests'
import { firebaseConfig } from './firebaseConfig';
import { getAuth, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);



const SideBar = props => {
    const sidebarClass = props.isOpen ? "sidebar open" : "sidebar";

    let camera = props.camera;
    let room = "default";

    const [logged, setLogged] = useState(false);

    return (
        <div className={sidebarClass}>
            {/* <div className="coords"> {Math.floor(props.camera.x)}, {Math.floor(props.camera.y)}, {Math.floor(props.camera.zoom * 100)} </div> */}

            <CoordsModal
                x={Math.round(camera.x)}
                y={Math.round(camera.y)}
                zoom={Math.round(camera.zoom * 100)}
                room={room}
            />

            <button onClick={props.toggleSidebar} className="sidebar-toggle">
                {props.isOpen ? ">" : "<"}
            </button>

            {false &&
                <>
                    <h4> Steps </h4>
                    <input type="range" name="vol" min="0" max="50" />

                    <h4> Guidance scale </h4>
                    <input type="range" name="vol" min="0" max="50" />

                    <h4> Seed </h4>
                    <input type="text" />

                    <h4> Image Ratio </h4>
                    <input type="range" name="vol" min="0" max="100" />

                </>
            }

            <h4> Prompt modifiers </h4>
            <textarea
                placeholder="digital art, high resolution"
                rows="5"
                onChange={e => props.setModifiers(e.target.value)}
                className="modifiersTextArea"
            ></textarea>

            <h4>Last images</h4>

            <div className="history">
                <table>
                    {props.history.map((data) => {
                        var z = Math.min(props.canvasMeta.w / +data.width, props.canvasMeta.h / +data.height) * 0.5;
                        var x = +data.posX - (props.canvasMeta.w / 2) / z + +data.width / 2
                        var y = +data.posY - (props.canvasMeta.h / 2) / z + +data.height / 2

                        return (
                            <tr className={"histLine"}>
                                <td onClick={() => { camera.move(x, y, z) }}>{data.prompt}</td>
                            </tr>
                        )
                    })
                    }
                </table>
            </div>

            <h4>Parameters</h4>
            
            {logged === true ? (
                <button onClick={() =>{
                    signOut(auth)
                    props.setIsLogged(true);
                    setLogged(true);
                }
                } > 
                Log out</button>
            ):(
            <SignInModalButton  
                onLoginSuccess={credentialResponse => {
                    props.setIsLogged(true);
                    setLogged(true);
                    props.setCredential(credentialResponse.credential)
                    requests.send_connexion_request(credentialResponse.credential)
                    console.log('user has been logged in !')
                    }
                }
            />
            )
        }

            {/* {logged === false ? (
                <SignInModalButton 
                    onLoginSuccess={credentialResponse => {
                        props.setIsLogged(true);
                        setLogged(true);
                        props.setCredential(credentialResponse.credential)
                        requests.send_connexion_request(credentialResponse.credential)
                        console.log('user has been logged in !')
                    }}
                    onError={() => {
                        console.log('Login Failed');
                    }}

                />
            ) : (
                <button onClick={() => {
                    googleLogout();
                    props.setIsLogged(false);
                    setLogged(false);
                    props.setCredential('');
                    // todo add logout=1 dans l'url et enlever le automatic login s'il est present
                }}> Logout </button>
            )} */}


        </div>
    );
};
export default SideBar;
