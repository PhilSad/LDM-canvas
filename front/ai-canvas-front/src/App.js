import logo from './logo.svg';
import './App.css';
import './MyCanvas'
import MyCanvas from './MyCanvas';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
  <div className="App">
    <GoogleOAuthProvider clientId="732264051436-0jgjer21ntnoi5ovilmgtqpghaj286sv.apps.googleusercontent.com">
        <MyCanvas />
    </GoogleOAuthProvider>;
  </div>
    
  );
}

export default App;
