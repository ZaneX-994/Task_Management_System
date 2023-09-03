import React, { useEffect, useState } from 'react';
import SideBar from '../components/SideBar';
import PageContainer from '../components/PageContainer'
import AssigneeTransferList from '../components/AssigneeTransferList'
import TaskList from '../components/TaskList';
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Snackbar, TextField, Typography } from '@mui/material';
import { ColumnBox, RowBox } from '../components/FlexBox';
import Button from '../components/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { addTask, editTask, setTasks } from '../actions';
import Cookies from 'js-cookie';
import MuiAlert from '@mui/material/Alert';


const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const EditTaskScreen = () => {
    const tasks = useSelector(state => state.taskReducer)
    const params = useParams()
    const targetTask = tasks.filter((x) => x.task_id === parseInt(params.id))
    const [title, setTitle] = useState(targetTask.length ? targetTask[0].title : "")
    const [description, setDescription] = useState(targetTask.length ? targetTask[0].description : "")
    const [deadlineDate, setDeadlineDate] = useState(targetTask.length && targetTask[0].deadline ? targetTask[0].deadline : "")
    const [deadlineType, setDeadlineType] = useState(targetTask.length && targetTask[0].deadline ? "deadline" : "noDeadline");
    const [assignType, setAssignType] = useState(targetTask.length && targetTask[0].assignees ? "assignToOther" : "assignToMe")
    const [assignees, setAssignees] = useState(targetTask.length ? targetTask[0].assignees : [])
    const dispatch = useDispatch()
    const token = Cookies.get('loginToken');
    const profile = useSelector(state => state.profileReducer)
    const navigate = useNavigate()
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
  
  

    const handleEdit = async () => {
        const deadline = deadlineType === "noDeadline" ? null : deadlineDate
        const userDetails = {
            u_id: profile.profile_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
        }
        const ass = assignType === "assignToMe" ? [userDetails] : assignees
        console.log(profile);
        const object = {
            task_id: parseInt(params.id),
            title,
            assignees : ass,
            description,
            deadline,
            progress: targetTask[0].progress
          }
          try {
            console.log(object)
            await apiCall('/edit_task', object, 'PUT', `bearer ${token}`, );
            navigate(`/task/${params.id}`)
            dispatch(editTask(object))
          } catch (err) {
            setAlertMessage("Error: Failed to edit task")
            handleOpenAlert()
          }
    }


    useEffect(() => {
        console.log(title);
    }, [deadlineType, deadlineDate, assignType, assignees, tasks, params.id])


    if (!(tasks.filter((x) => x.task_id === parseInt(params.id)).length)) {
        return (
            <Box>No Such Task</Box>
        )
    }

  return (
    <>
      {/* <SideBar/> */}
        <PageContainer marginTop="0px" maxWidth="lg">
            <Typography variant="h3" component="h2" marginBottom="15px">
            Edit Task
            </Typography>
        <ColumnBox rowGap='40px' padding='0px 100px'>

            <TextField id="outlined-basic" value={title} onChange={(e) => setTitle(e.target.value)} label="Title" variant="standard" />
            <TextField id="outlined-basic" value={description} onChange={(e) => setDescription(e.target.value)} label="Description" variant="standard" />
          <FormControl>
            <FormLabel id="demo-radio-buttons-group-label">Deadline</FormLabel>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue={deadlineType}
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
              defaultValue={assignType}
              name="radio-buttons-group"
              onChange={(e) => setAssignType(e.target.value)}
            >
              <FormControlLabel value="assignToMe" control={<Radio />} label="Myself" />
              <FormControlLabel value="assignToOther" control={<Radio />} label={<AssigneeTransferList right={assignees} setRight={setAssignees}/>} />
            </RadioGroup>
          </FormControl>


          <Box display="flex" flexDirection="row-reverse" columnGap='20px'>
                <Button variant='contained' onClick={() => handleEdit()}>Edit Task</Button>
                <Button variant='contained' onClick={() => navigate(`/task/${params.id}`)} >Back</Button>
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

export default EditTaskScreen