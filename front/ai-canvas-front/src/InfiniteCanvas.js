import MyCanvas from './MyCanvas';
import React, { useState } from "react";
import SideBar from "./SideBar";

const InfiniteCanvas = (props) => {

    const [sidebarOpen, setSideBarOpen] = useState(true);
    const handleViewSidebar = () => {
        setSideBarOpen(!sidebarOpen);
    };

    return (
        <>
            <MyCanvas />
            <SideBar isOpen={sidebarOpen} toggleSidebar={handleViewSidebar} />
        </>
    );
}

export default InfiniteCanvas;