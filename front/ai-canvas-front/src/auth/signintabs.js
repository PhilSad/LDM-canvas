import React, { useState } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useSignInWithGoogle, useAuthState, useCreateUserWithEmailAndPassword, useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from './Auth';
import { GoogleLoginButton } from "react-social-login-buttons";
import TextField from '@mui/joy/TextField';

function SigninTabs() {
  const [key, setKey] = useState('login');
  const [signInWithGoogle, userGoogle, loadingGoogle, errorGoogle] = useSignInWithGoogle(auth);
  const [createUserWithEmailAndPassword,user,loading,error ] = useCreateUserWithEmailAndPassword(auth);
  const [emailCreate, setEmailCreate] = useState('');
  const [passwordCreate, setPasswordCreate] = useState('');
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');


  return (
    <Tabs
      id="controlled-tab-example"
      activeKey={key}
      onSelect={(k) => setKey(k)}
      className="mb-3"
    >
      <Tab eventKey="login" title="Login">
          <GoogleLoginButton onClick={() => signInWithGoogle()} />
          <TextField
            type="email"
            label="Email"
            value={emailLogin}
            onChange={(e) => setEmailLogin(e.target.value)}
            placeholder="user@domain.com"
        />
        <br/>
        <TextField 
            type="password"
            label="Password"
            value={passwordLogin}
            onChange={(e) => setPasswordLogin(e.target.value)}
            placeholder="password"
        />
      </Tab>
      <Tab eventKey="createAccount" title="Create Account">
        <TextField
            type="email"
            label="Email"
            value={emailCreate}
            onChange={(e) => setEmailCreate(e.target.value)}
            placeholder="user@domain.com"
        />
        <br/>
        <TextField 
            type="password"
            label="Password"
            value={passwordCreate}
            onChange={(e) => setPasswordCreate(e.target.value)}
            placeholder="password"
        />
        <br/>

        <button onClick={() => createUserWithEmailAndPassword(emailCreate, passwordCreate)}>
        Register
      </button>
        
      </Tab>
    </Tabs>
  );
}

export default SigninTabs;