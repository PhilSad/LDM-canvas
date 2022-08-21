import logo from './logo.svg';
import './App.css';
import './MyCanvas'
import MyCanvas from './MyCanvas';
import EditableInput from './EditableInput'

function App() {
  return (
    <div className="App">
      <EditableInput />
      <MyCanvas />
    </div>
  );
}

export default App;