import React, { useEffect, useState } from 'react';
import SideBar from '../components/SideBar';
import PageContainer from '../components/PageContainer'
import AssigneeTransferList from '../components/AssigneeTransferList'
import TaskList from '../components/TaskList';
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Snackbar, TextField, Typography } from '@mui/material';
import { ColumnBox, RowBox } from '../components/FlexBox';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { addTask, setTasks } from '../actions';
import Cookies from 'js-cookie';
import formatDate from '../utils/formatDate';
import ParameterSlider from '../components/ParameterSlider';
import NormalDistribution from '../components/NormalDistribution';
import LoadingButton from '@mui/lab/LoadingButton';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const CreateTaskScreen = () => {
    const [mean, setMean] = useState(45);
    const [stddev, setStddev] = useState(15);
    const [isLoading, setIsLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [deadlineDate, setDeadlineDate] = useState(formatDate(new Date()))
    const [deadlineType, setDeadlineType] = useState("noDeadline");
    const [assignType, setAssignType] = useState("assignToMe")
    const [assignees, setAssignees] = useState([])
    const dispatch = useDispatch()
    const tasks = useSelector(state => state.taskReducer)
    const token = Cookies.get('loginToken');
    const profile = useSelector(state => state.profileReducer)
    const navigate = useNavigate()
    const [openAlert, setOpenAlert] = React.useState(false)
    const [alertMessage, setAlertMessage] = React.useState("")
    const [openErrorTitle, setOpenErrorTitle] = React.useState(false)
    const [openErrorDes, setOpenErrorDes] = React.useState(false)
    const [alertMessageCreateTask, setAlertMessageCreateTask] = React.useState("")
  
    const handleOpenAlert = () => {
      setOpenAlert(true)
    }
  
    const handleCloseAlert = (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }
      setOpenAlert(false);
    };
  

    useEffect(() => {
      const dateRegEx = /\b(\d{4})[-/](\d{2})[-/](\d{2})\b/;
      const match = title.match(dateRegEx);

      if (match) {
        const formattedDate = match[0].replace(/[/]/g, '-');
        setDeadlineDate(formattedDate);
        setDeadlineType('deadline')  } 
      // else {
      //   setDeadlineType('noDeadline'); // Add this line to set 'noDeadline' when date is not detected
      // }
      
    }, [title]);

    const getEstimate = async () => {
      console.log("getting estimate")
      setIsLoading(true)
      try {
      const estimate = await apiCall(`/task_estimation?title=${title}&desc=${description}`, undefined, 'GET', `bearer ${token}`);
      console.log(estimate.mean)
      console.log(estimate.std_dev)
      setMean(parseInt(estimate.mean))
      setStddev(parseInt(estimate.std_dev))
      setIsLoading(false)
    } catch (err) {
      setAlertMessage("Error: Failed to get estimation")
      handleOpenAlert()
      setIsLoading(false)
    }
  }

    const handleSubmit = async () => {
      handleCloseAllError()
      if (title === '') {
        setOpenErrorTitle(true)
        setAlertMessageCreateTask("Title can not be empty")
        return
      }
      if (description === '') {
        setOpenErrorDes(true)
        setAlertMessageCreateTask("Description can not be empty")
        return
      }
      const deadline = deadlineType === "noDeadline" ? null : deadlineDate
      const userDetails = {
        u_id: profile.profile_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        image: profile.image
    }

      const ass = assignType === "assignToMe" ? [userDetails] : assignees
      console.log(profile);
      const object = {
          title,
          assignees : ass,
          description,
          deadline,
          mean,
          stddev
        }
        try {
          console.log(object)
          const data = await apiCall('/task', object, 'POST', `bearer ${token}`, );
          navigate('/home')
          object.task_id = data.task_id
          dispatch(addTask(object))
        } catch (err) {
          setAlertMessage("Error: Failed to create task")
          handleOpenAlert()      
        }
    }

    const handleCloseAllError = () => {
      setOpenErrorDes(false)
      setOpenErrorTitle(false)
    }

    const handleFetchTasks = async () => {
      try {
        const tasks = await apiCall('/tasks', undefined, 'GET', token);
        dispatch(setTasks(tasks))
      } catch (err) {
        console.error(err);
      }

    }

    useEffect(() => {
        // handleFetchTasks()
        console.log('deadline', deadlineType);
        console.log('deadlineDate', deadlineDate);
        console.log('assignType', assignType);
        console.log('assignees', assignees);
      }, [deadlineType, deadlineDate, assignType, assignees])
  return (
    <>
      {/* <SideBar/> */}
        <PageContainer marginTop="0px" maxWidth="lg">
            <Typography variant="h3" component="h2" marginBottom="15px">
            Create Task
            </Typography>
        <ColumnBox rowGap='40px' padding='0px 100px'>
            <TextField error={openErrorTitle} id="outlined-basic" value={title} onChange={(e) => setTitle(e.target.value)} label="Title" variant="standard" helperText={openErrorTitle ? "Title can not be empty" : ""} />
            <TextField error={openErrorDes} id="outlined-basic" value={description} onChange={(e) => setDescription(e.target.value)} label="Description" variant="standard" helperText={openErrorDes ? "Description can not be empty" : ""} />
          <FormControl>
            <FormLabel id="demo-radio-buttons-group-label">Deadline</FormLabel>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              // defaultValue="noDeadline"
              value={deadlineType}
              name="radio-buttons-group"
              onChange={(e) => setDeadlineType(e.target.value)}
            >
              <FormControlLabel value="noDeadline" control={<Radio />} label="No Deadline" />
              <FormControlLabel value="deadline" control={<Radio />} label={<TextField value={deadlineDate} type='date' onChange={(e) => setDeadlineDate(e.target.value)}/>} />
            </RadioGroup>
          </FormControl>
          <FormControl>
            <FormLabel id="demo-radio-buttons-group-label">Assign</FormLabel>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue="assignToMe"
              name="radio-buttons-group"
              onChange={(e) => setAssignType(e.target.value)}
            >
              <FormControlLabel value="assignToMe" control={<Radio />} label="Myself" />
              <FormControlLabel value="assignToOther" control={<Radio />} label={<AssigneeTransferList right={assignees} setRight={setAssignees}/>} />
            </RadioGroup>
          </FormControl>

            <NormalDistribution mean={mean} stddev={stddev} />
            <LoadingButton loading={isLoading} variant="contained" color="primary" onClick={() => getEstimate()}>Get Mean & Standard Deviation Estimate</LoadingButton>
            <Box display="flex" columnGap='20px'>
              <ColumnBox rowGap='5px' padding='0px 15px'>
                    <Typography gutterBottom>       Mean task time (minutes) </Typography>
                    <ParameterSlider name="Mean" min={1} max={120} value={mean} onChange={setMean} />
              </ColumnBox>
              <ColumnBox rowGap='5px' padding='0px 100px'>
                    <Typography gutterBottom> Standard Deviation (minutes) </Typography>
                    <ParameterSlider name="Standard Deviation" min={1} max={20} value={stddev} onChange={setStddev}/>
              </ColumnBox>
            </Box>
          {openErrorDes || openErrorTitle ? <Alert severity="error">{alertMessageCreateTask}</Alert> : <></>}
          <Box display="flex" flexDirection="row-reverse" columnGap='20px'>
                <Button variant='contained' onClick={() => handleSubmit()}>Create Task</Button>
                <Button variant='contained' onClick={() => navigate('/home')} >Back</Button>
          </Box>
          <Snackbar open={openAlert} autoHideDuration={6000} onClose={handleCloseAlert}>
            <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
              {alertMessage}
            </Alert>
          </Snackbar>

        </ColumnBox>
      </PageContainer>
    </>
  );
};

export default CreateTaskScreen