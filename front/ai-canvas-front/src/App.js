import './App.css';
import './MyCanvas'
import InfiniteCanvas from './InfiniteCanvas';
import React from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {GoogleOAuthProvider} from '@react-oauth/google';
import {CssVarsProvider} from '@mui/joy/styles';

function App() {
    return (
        <GoogleOAuthProvider clientId="732264051436-0jgjer21ntnoi5ovilmgtqpghaj286sv.apps.googleusercontent.com">
            <CssVarsProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<InfiniteCanvas/>}/>
                    </Routes>
                </BrowserRouter>
            </CssVarsProvider>
        </GoogleOAuthProvider>
  );
}

export default App;
