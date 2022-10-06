import './App.css';
import './MyCanvas'
import InfiniteCanvas from './InfiniteCanvas';
import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="732264051436-0jgjer21ntnoi5ovilmgtqpghaj286sv.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<InfiniteCanvas />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
