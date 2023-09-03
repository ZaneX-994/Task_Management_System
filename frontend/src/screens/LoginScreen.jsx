import React, { useState } from 'react';
import axios from 'axios';
import { BigButton } from '../components/Button';
import { Alert, Box, Divider, TextField, Typography } from '@mui/material';
import PageContainer from '../components/PageContainer';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import { setProfile } from '../actions';

const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = React.useState(false);
  const [hasErrorEmail, setHasErrorEmail] = React.useState(false);
  const [hasErrorPassword, sethasErrorPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch()


  const handleFetchProfileId = async (token) => {
    try {
      const id = await apiCall('/token/id', {}, 'GET', `bearer ${token}`);
      const profile_data = await apiCall(`/profile?page=profile&profile_id=${id}`, {}, 'GET', `bearer ${token}`);
      Cookies.set('userId', id, { expires: 365 });
      // Cookies.set('userId', profile_data.profile_id);
      console.log("// LoginScreen: ", Cookies.get('userId'))
      dispatch(setProfile(profile_data))
    } catch (err) {
      setHasError(false)
      setError("Error: Fail to fetch id")
    }
  }

  const handleCloseAllError = () => {
    setHasError(false)
    setHasErrorEmail(false)
    sethasErrorPassword(false)
  }

  const validateEmail = (email) => {
    return String(email)
      .match(
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
      );
  };

  const validatePassword = (password) => {
    return password.length >= 8 && password.length <= 32
  }



  const login = async () => {
    if (!validateEmail(email)) {
      handleCloseAllError()
      setError("Invalid Email Syntax")
      setHasErrorEmail(true)
      setHasError(true)
      return
    }

    if (!validatePassword(password)) {
      handleCloseAllError()
      setError("Password must be between 8 and 32 characters long")
      sethasErrorPassword(true)
      setHasError(true)
      return
    }

    const object = {
      email,
      password
    }
    try {
      const res = await apiCall('/token', object, 'POST', undefined);
      const token = res.access_token;
      // Calculate the expiry date 2 minutes from the current time
      // const expiryDate = new Date();
      // expiryDate.setTime(expiryDate.getTime() + 10 * 60 * 1000);
      Cookies.set('loginToken', token, { expires: 365 });
      // dispatch(login())
      await handleFetchProfileId(token)
      navigate('/home')
    } catch (err) {
      if (err === 401) {
        setError("Invalid Email or Password")
      }
      setHasError(true)
    }
  }

  return (
      <PageContainer marginTop='160px' maxWidth='xs' >
        <Box display='flex' flexDirection='row' justifyContent='space-around'>
          <Box display='flex' flexDirection='column' rowGap='20px' maxWidth='400px'>
            <Box margin={'-10px auto 0'}>
                <h2>Login</h2>
            </Box>
            <TextField error={ hasErrorEmail } label="Email" variant="outlined" value={email} onKeyDown={(e) => {if (e.key === "Enter") {login()}}} onChange={(e) => setEmail(e.target.value)} />
            <TextField error={ hasErrorPassword } type='password' label="Password" variant="outlined" value={password} onKeyDown={(e) => {if (e.key === "Enter") {login()}}} onChange={(e) => setPassword(e.target.value)} />
            { hasError && <Alert severity="error" onClose={() => { setHasError(false) }}>{error}</Alert> }
            <BigButton variant='contained' onClick={() => login()}>Login</BigButton>
            <Divider />
            <BigButton variant='outlined' onClick={() => navigate('/register')}>Register</BigButton>
          </Box>
          {/* <Box width='450px' height='450px' component="img" src="" /> */}
        </Box>
      </PageContainer>
  )
};

export default LoginScreen;