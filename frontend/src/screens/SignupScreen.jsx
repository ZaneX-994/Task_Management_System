import React from 'react';
import { BigButton } from '../components/Button';
import { Alert, Box, Divider, TextField } from '@mui/material';
import PageContainer from '../components/PageContainer';
import { apiCall } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ColumnBox } from '../components/FlexBox';
import formatDate from '../utils/formatDate'

export default function SignupScreen () {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordC, setPasswordC] = React.useState('');
  const [first_name, setFirstName] = React.useState('');
  const [last_name, setLastName] = React.useState('');
  const [dob, setDob] = React.useState(formatDate(new Date()));
  const [hasError, setHasError] = React.useState(false);
  const [hasErrorEmail, setHasErrorEmail] = React.useState(false);
  const [hasErrorName, setHasErrorName] = React.useState(false);
  const [hasErrorDOB, setHasErrorDOB] = React.useState(false);
  const [hasErrorPassword, sethasErrorPassword] = React.useState(false);
  const [error, setError] = React.useState('');

  const navigate = useNavigate();

  const validateEmail = (email) => {
    return String(email)
      .match(
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
      );
  };
  const validateName = (name) => {
    return String(name)
    .match(
      /^[a-zA-Z]+$/) && name.length <= 12 && name.length >= 2;
  }

  const validatePassword = (password) => {
    return password.length >= 8 && password.length <= 32
  }


  const handleCloseAllError = () => {
    setHasError(false)
    setHasErrorEmail(false)
    setHasErrorName(false)
    setHasErrorDOB(false)
    sethasErrorPassword(false)
  }

  

  const signupAPI = async () => {
    if (!validateName(first_name) && !validateName(last_name)) {
      handleCloseAllError()
      setError("Username must be alphanumeric 2-12 characters each")
      setHasErrorName(true)
      setHasError(true)
      return
    }

    if (!validateEmail(email)) {
      handleCloseAllError()
      setError("Invalid Email Syntax")
      setHasErrorEmail(true)
      setHasError(true)
      return
    }

    if (dob === "") {
      handleCloseAllError()
      setError("Date of birth cannot be empty")
      setHasErrorDOB(true)
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

    if (password !== passwordC) {
      handleCloseAllError()
      setError("Password are not match")
      sethasErrorPassword(true)
      setHasError(true)
      return

    }



    const object = {
      email,
      password,
      first_name,
      last_name,
      dob,
    }
    try {
      await apiCall('/register', object, 'POST', undefined);
      navigate('/login')
    } catch (err) {
      if (err === 401) {
        setError("Email already registered")
      }
      setHasError(true)
    }
  }

  return (
    <PageContainer sx={{ border: '1px solid #ddd', padding: '10px' }} marginTop='140px' maxWidth='xs'>
      <ColumnBox rowGap='20px' margin={'-20px auto 0'}>
        <Box margin={'-10px auto 0'}>
          <h2>Register</h2>
        </Box>
        <Box display='flex' flexDirection='row' columnGap='20px'>
        <TextField  label="First Name" error={ hasErrorName } variant="outlined" value={first_name} onChange={(e) => setFirstName(e.target.value)} />
        <TextField  label="Last Name" error={ hasErrorName } variant="outlined" value={last_name} onChange={(e) => setLastName(e.target.value)} />
        </Box>
        <TextField error={ hasErrorEmail } helperText="Please enter a valid email" label="Email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField error={ hasErrorDOB } helperText="Date of birth" type='date' variant="outlined" value={dob} onChange={(e) => setDob(e.target.value)} />
        <TextField error={ hasErrorPassword } helperText='Must be between 8 and 32 characters long' label="Password" type='password' variant="outlined" value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextField error={ hasErrorPassword } helperText='Must be same as password' label="Confirm Password" type='password' variant="outlined" value={passwordC} onChange={(e) => setPasswordC(e.target.value)} />
        { hasError && <Alert severity="error" onClose={() => { setHasError(false) }}>{error}</Alert> }
        <BigButton variant='contained' onClick={() => signupAPI()}>Register</BigButton>
        <Divider />
        <BigButton variant='outlined' onClick={() => navigate('/login')}>Already have account?</BigButton>
        <br />
      </ColumnBox>
    </PageContainer>
  )
}
