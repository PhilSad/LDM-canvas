import React, { useState } from 'react';
import { GoogleLoginButton } from "react-social-login-buttons";

import { getAuth } from "firebase/auth";
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeApp } from "firebase/app";
import { useSignInWithGoogle, useAuthState } from 'react-firebase-hooks/auth';

const firebaseConfig = {
  apiKey: "AIzaSyApc_Q01mz-RNVtxwvtcxF5WhAOk8M6OEg",
  authDomain: "ai-canvas.firebaseapp.com",
  projectId: "ai-canvas",
  storageBucket: "ai-canvas.appspot.com",
  messagingSenderId: "732264051436",
  appId: "1:732264051436:web:95cb2c7c6bb56099502bc9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginWithMailAndPassword = (mail, password) => {
  signInWithEmailAndPassword(auth, mail, password);
};
  
const logout = () => {
  signOut(auth);
};

export default function SignInPannel(props){

    const [signInWithGoogle, userGoogle, loadingGoogle, errorGoogle] = useSignInWithGoogle(auth);
    const [user, loading, error] = useAuthState(auth);

    if (error) {
        return (
          <div>
            <p>Error: {error.message}</p>
          </div>
        );
      }

      if (loading) {
        return <p>Loading...</p>;
      }

      if (user) {
        props.onLoginSuccess(user.accessToken)
        return (
          <div>
            <p>Signed In User: {user.email}</p>
          </div>
        );
      }
      return (
          <GoogleLoginButton onClick={() => signInWithGoogle()} />
      );

}