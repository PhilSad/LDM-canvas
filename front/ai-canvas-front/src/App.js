import logo from './logo.svg';
import './App.css';
import './MyCanvas'
import MyCanvas from './MyCanvas';
import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, createSearchParams, useSearchParams } from "react-router-dom";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MyCanvas />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
