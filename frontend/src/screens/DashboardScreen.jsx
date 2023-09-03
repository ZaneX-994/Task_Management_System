import React, { useEffect, useState } from 'react';
import PageContainer from '../components/PageContainer';
import { Box, ListItem, TextField, Typography, List, Snackbar } from '@mui/material';
import TaskList from '../components/TaskList'
import Button from '../components/Button';
import { RowBox } from '../components/FlexBox';
import SearchBar from '../components/SearchBar';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setConnections, setTasks } from '../actions';
import Cookies from 'js-cookie';
import { apiCall } from '../utils/api';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const DashboardScreen = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const tasks = useSelector(state => state.taskReducer)
  const profile = useSelector(state => state.profileReducer)
  const token = Cookies.get('loginToken')
  const userId = Cookies.get('userId')
  const [taskStorage, setTaskStorage] = useState([])
  // const [loading, setLoading] = useState(false)
  const [openAlert, setOpenAlert] = React.useState(false)
  const [alertMessage, setAlertMessage] = React.useState("")

  const handleOpenAlert = () => {
    setOpenAlert(true)
  }

  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenAlert(false);
  };



  // CHAT DEMO STUFF CHAT DEMO STUFF

  const [messageText, setMessageText] = useState('');
  const [ws, setWs] = useState(null);

  // const getMessages = async () => {
  //   try {
  //     const res = await apiCall('/messages', {}, 'GET', `bearer ${token}`);
  //     setMessages(res)
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
  
  // useEffect(() => {
  //   getMessages()
  //   const websocket = new WebSocket("ws://localhost:8000/ws")
  //   setWs(websocket)

  //   websocket.onmessage = (event) => {
  //       const message = JSON.parse(event.data);
  //       setMessages((prevMessages) => [...prevMessages, message]);
  //   }
  //   return () => {websocket.close()}
  //   }, []);

  
  // const sendMessage = (text, profile_id) => {
  //   if (ws && ws.readyState === WebSocket.OPEN) {
  //     const message = { text, profile_id }
  //     ws.send(JSON.stringify(message))
  //   }
  // }

  // END OF CHAT DEMO STUFF

  const handleFetchConnections = async () => {
    try {
      const res = await apiCall('/connections', {}, 'GET', `bearer ${token}`);
      dispatch(setConnections(res.connection_list))
    } catch (err) {
      setAlertMessage("Error: Failed to fetch connections")
      handleOpenAlert()
    }
  }



  const handleFetchTasks = async () => {
    try {
      const res = await apiCall('/tasks?page=dashboard', {}, 'GET', `bearer ${token}`);
      dispatch(setTasks(res))
      setTaskStorage(res)
      console.log("tasks: ", res)
    } catch (err) {
      setAlertMessage("Error: Failed to fetch tasks")
      handleOpenAlert()
    }
  }

  useEffect(() => {
      // setLoading(true)
      handleFetchConnections()
      handleFetchTasks()
      console.log("// DashBoard: userId", parseInt(userId));
  }, [])

  if (!tasks) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer maxWidth="lg" marginTop="0px" >

      {/* CHAT APP DEMO STUFF CHAT APP DEMO STUFF */}
      {/* <div>
        <List>
          {messages.map((message, index) => (
            <ListItem key={index}>
              <Box display="flex" gap="10px" alignItems="center">
                <Typography variant="h6">{message.profile_first_name}</Typography>
                <Typography>{message.text}</Typography>
              </Box>
            </ListItem>
          ))
          }
        </List>
        <TextField placehold="Send a message" value={messageText} onChange={e => setMessageText(e.target.value)} />
        <Button onClick={() => {
          sendMessage(messageText, userId)
          setMessageText('')
        }}>Send</Button>
      </div> */}

      {/*  END OF CHAT APP DEMO STUFF END OF CHAT APP DEMO STUFF */}

      <RowBox justifyContent='space-between' marginBottom='50px'>
        <Typography variant="h3" component="h2">
          Dashboard
        </Typography>
        <Button variant='contained' onClick={() => navigate('/task/new')}>Create Task</Button>
      </RowBox>
      <SearchBar taskStorage={taskStorage}/>
      <TaskList handleOpenAlert={handleOpenAlert} setAlertMessage={setAlertMessage} tasks={tasks} id={parseInt(userId)} rowNums={10} height='800'/>
      <Snackbar open={openAlert} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>

    </PageContainer>
  );
};

export default DashboardScreen;

