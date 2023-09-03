import React, { useEffect, useState } from 'react';
import SideBar from '../components/SideBar';
import PageContainer from '../components/PageContainer'
import AssigneeTransferList from '../components/AssigneeTransferList'
import TaskList from '../components/TaskList';
import { Avatar, Box, Divider, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, TextField, Typography } from '@mui/material';
import { ColumnBox, RowBox } from '../components/FlexBox';
import Button from '../components/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { addTask, setTasks } from '../actions';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const TaskScreen = () => {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [deadline, setDeadline] = useState("")
    const [assignees, setAssignees] = useState([])
    const dispatch = useDispatch()
    const tasks = useSelector(state => state.taskReducer)
    const params = useParams()
    let targetTask = tasks.find((a) => a.task_id === parseInt(params.id))
    const n = tasks.length - 1
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
        navigate(`/task/${params.id}/edit`)
    }
    const handleProfile = (id) => {
        navigate(`/profile/${id}`)
      }
  

    useEffect(() => {
        // console.log(tasks, targetTask, params.id);
    }, [])
  return (
    <>
      {/* <SideBar/> */}
        <PageContainer marginTop="0px" maxWidth="lg">
            <Typography variant="h3" component="h2" marginBottom="15px">
            Task
            </Typography>
        <ColumnBox rowGap='40px' padding='0px 100px'>

            <Typography variant="h5" component="h5" marginBottom="15px">
                Title: {targetTask.title}
            </Typography>
            <Typography variant="h5" component="h5" marginBottom="15px">
                Description: {targetTask.description}
            </Typography>
            <Typography variant="h5" component="h5" marginBottom="15px">
                Deadline: {targetTask.deadline}
            </Typography>
            <Typography variant="h5" component="h5" marginBottom="15px">
                State: {targetTask.progress}
            </Typography>

            <RowBox columnGap="50px">
                <Typography variant="h5" component="h5" marginBottom="15px">
                    Assignees: 
                </Typography>
                <List dense sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper'}}>
                    {targetTask.assignees.map((assignee, index) => (
                        <Box key={index}>
                        <ListItem
                            disablePadding
                        >
                            <ListItemButton onClick={() => handleProfile(assignee.u_id)}>
                            <ListItemAvatar>
                                <Avatar
                                alt={`Avatar n°${index + 1}`}
                                src={assignee.image}
                                />
                            </ListItemAvatar>
                            <ListItemText id={index} primary={`${assignee.first_name} ${assignee.last_name}`} />
                            </ListItemButton>
                        </ListItem>
                        {n === index && <Divider/>}
                        </Box>
                    ))}
            </List>
            </RowBox>

            <Box display="flex" flexDirection="row-reverse" columnGap='20px'>
                <Button variant='contained' onClick={() => handleEdit()}>Edit Task</Button>
                <Button variant='contained' onClick={() => navigate('/home')} >Back</Button>
            </Box>

        </ColumnBox>
      </PageContainer>
    </>
  );
};

export default TaskScreen