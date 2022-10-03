import React from "react";


const SideBar = props => {
    const sidebarClass = props.isOpen ? "sidebar open" : "sidebar";
    return (
        <div className={sidebarClass}>
            <div className="coords"> {Math.floor(props.cameraX)}, {Math.floor(props.cameraY)}, {Math.floor(props.cameraZoom * 100) / 100} </div>

            <h4> Steps </h4>
            <input type="range" name="vol" min="0" max="50"/>

            <h4> Guidance scale </h4>
            <input type="range" name="vol" min="0" max="50"/>

            <h4> Image Ratio </h4>
            <input type="range" name="vol" min="0" max="50"/>

            <h4> Seed </h4>
            <input type="text"/>

            <h4> Prompt modifiers </h4>
            <textarea placeholder="digital art, high resolution" rows="5"></textarea>

            <button onClick={props.toggleSidebar} className="sidebar-toggle">
                &lt;&lt;
            </button>
        </div>
    );
};
export default SideBar;
