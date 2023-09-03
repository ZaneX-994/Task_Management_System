import React, { useEffect, useState } from 'react';
import PageContainer from '../components/PageContainer'
import { Box, Typography, Button, FormControlLabel, Switch, Grid, Paper, Snackbar, Alert, AlertTitle } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { apiCall } from '../utils/api';
import { setTasks } from '../actions';
import SmallTaskList from '../components/SmallTaskList';
import ScheduleTable from '../components/ScheduleTable';


import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton/LoadingButton';


const ProfileScreen = () => {
  const dispatch = useDispatch()
  const token = Cookies.get('loginToken');
  const userId = Cookies.get('userId');
  const tasks = useSelector(state => state.taskReducer)
  const [removedTaskStorage, setRemovedTaskStorage] = useState([])
  const [taskStorage, setTaskStorage] = useState([])
  const [schedule, setSchedule] = useState({})
  const [dailyTime, setDailyTime] = useState(5)
  const [shortestPossible, setShortestPossible] = useState(false);
  const [insufficientTime, setInsufficientTime] = useState(false);
  const [isReschedule, setIsReschedule] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbarOpen(false)
  }
  

  const handleReschedule = async (reschedule = true) => {
    setIsReschedule(true)
    try {
      const removedTasks = removedTaskStorage.join(',');
      // setRemovedTaskStorage([])
      const time = 60 * dailyTime
      const params = new URLSearchParams({
        removedTasks,
        time,
        reschedule,
        shortestPossible,
      });
  
      console.log(params.toString())
      const schedule_data = await apiCall(`/schedule?${params.toString()}`, {}, 'GET', `bearer ${token}`);
      setTaskStorage(schedule_data.daily_tasks)
      setSchedule(schedule_data.schedule)
      setDailyTime(parseFloat(parseInt((schedule_data.time/60)*10))/10 )
      setInsufficientTime(schedule_data.failure)
      if (schedule_data.failure) {
        setSnackbarOpen(true);
      }
      console.log("Schedule: ", schedule_data);

    } catch (err) {
      console.error(err);
    }
    setIsReschedule(false)
  }

  const setNewDailyTime = (adding) => {
    if (dailyTime + adding > 0 && dailyTime + adding <= 24 ) {
      setDailyTime(dailyTime + adding)
    }
  }

  // In case you need it
  const handleDeleteTaskAPI = async (id) => {
    try {
      const res = await apiCall(`/task?task_id=${id}`, {}, 'DELETE', `bearer ${token}`);
      console.log(res);
    } catch (err) {
      console.error(err);
    }
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const openDeleteDialog = (taskId) => {
    setTaskToDelete(taskId);
    setDialogOpen(true);
  }

  const handleClose = () => {
    setDialogOpen(false);
  };
  
  const handleConfirmDeletion = () => {
    setTaskStorage(taskStorage.filter(item => item.task_id !== taskToDelete));
    setRemovedTaskStorage([...removedTaskStorage, taskToDelete]);
    setDialogOpen(false);
  };

  const handleDeleteTask = (id, deadline) => {
    const today = new Date();
    const taskDate = new Date(deadline);
    console.log(today)
    console.log(taskDate)
    if (
      today.getDate() === taskDate.getDate() 
    ) {
      openDeleteDialog(id);
    } else {
    console.log(id)
    setTaskStorage(taskStorage.filter(item => item.task_id !== id))
    setRemovedTaskStorage([...removedTaskStorage, id])
    }
  }

  useEffect(() => {
    console.log(removedTaskStorage);
  }, [removedTaskStorage]);

  useEffect(() => {
    handleReschedule(false)
  }, [])

  if (!tasks) {
    return <>Loading...</>
  }

  return (
    <>
      <PageContainer marginTop="0px" maxWidth="lg">
        <Box
          sx={{ display: 'flex', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}
        >
          <Box sx={{ flexGrow: 1 }}>
          <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center">
            <Typography variant="h5" component="h3" marginBottom="15px">
              Daily Tasks
            </Typography>
            
            <Button sx={{
                height: '62px',
                marginLeft: '15px',
                marginRight: '5px',
              }}
              variant="outlined">{dailyTime} hours</Button>
            <Box display="flex" flexDirection="column" spacing={2}>
              <Button sx={{
                width: '100px',
                height: '30px',
                marginBottom: '2px',
              }}
              variant="contained" color="success" onClick={() => setNewDailyTime(1)}>
                +1 hour
              </Button>
              <Button sx={{
                width: '100px',
                height: '30px',
              }}
              variant="contained" color="error" onClick={() => setNewDailyTime(-1)}>
                -1 hour
              </Button>
            </Box>
          </Box>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            marginTop="10px"
            marginBottom="10px"
          >
            <FormControlLabel
              control={
              <Switch
                checked={shortestPossible}
                onChange={() => setShortestPossible(!shortestPossible)}
                name="checkedB"
                color="primary"
              />}
              label="Shortest Possible Schedule"
            />
            <LoadingButton 
              loading={isReschedule}
              sx={{
                width: '90%',
              }}
              variant="contained"
              onClick={() => handleReschedule(true)}
            >
              Reschedule
            </LoadingButton>
          </Box>
          
          <SmallTaskList tasks={taskStorage} handleDeleteTask={handleDeleteTask} id={parseInt(userId)} rowNums={10} height='800px'/>
          </Box>
          <Box sx={{
            flexGrow: 10, 
            display:"flex", 
            flexDirection:"column",
            alignItems:"center",
            }}>
            <Typography variant="h5" component="h3" marginBottom="15px">
              Projected Weekly Schedule
            </Typography>
            <ScheduleTable schedule={schedule} />
          </Box>
        </Box>
        <Snackbar open={snackbarOpen} autoHideDuration={10000} onClose={handleCloseSnackbar}>
          <Alert variant='filled' onClose={handleCloseSnackbar} severity="warning">
            <AlertTitle>Insufficient Hours</AlertTitle>
            You will not be able to meet all your deadlines, either some of them have already passed,<br/> or you have set an insufficient number of hours to complete your schedule
          </Alert>
        </Snackbar>
        <Dialog
          open={dialogOpen}
          onClose={handleClose}
          >
          <DialogTitle>
          {"Delete Task"}
          </DialogTitle>
          <DialogContent>
          <DialogContentText>
            This task is due today. Are you sure you want to delete it? Deletion will make it impossible for us to generate an optimal schedule for you.
          </DialogContentText>
          </DialogContent>
          <DialogActions>
          <Button onClick={handleClose}>
          Cancel
          </Button>
          <Button onClick={handleConfirmDeletion} color="primary">
          Delete
          </Button>
          </DialogActions>
        </Dialog>

      </PageContainer>
    </>
  );
};

export default ProfileScreen;