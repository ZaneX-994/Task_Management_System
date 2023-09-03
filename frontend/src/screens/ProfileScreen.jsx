import React, { useCallback, useEffect, useState } from 'react';
import SideBar from '../components/SideBar';
import PageContainer from '../components/PageContainer'
import TaskList from '../components/TaskList';
import { Box, Typography, CircularProgress, IconButton, TextField, Modal, Input, Snackbar  } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { apiCall } from '../utils/api';
import SearchBar from '../components/SearchBar';
import { useParams } from 'react-router-dom';
import { editProfileImg, editProfileNames, setTasks } from '../actions';
import WorkloadBar from '../components/WorkloadBar';
import { ColumnBox, RowBox } from '../components/FlexBox';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import Button from '../components/Button';
import LoadingButton from '@mui/lab/LoadingButton/LoadingButton';
import MuiAlert from '@mui/material/Alert';


const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: '16px',
  p: 4,
};


const ProfileScreen = () => {
  const dispatch = useDispatch()
  const token = Cookies.get('loginToken');
  const tasks = useSelector(state => state.taskReducer)
  // const profile = useSelector(state => state.profileReducer)
  const [taskStorage, setTaskStorage] = useState([])
  const [tasksProfile, setTasksProfile] = useState([])
  const [profile, setProfile] = useState([])
  const [score, setScore] = useState(0)
  const [openEdit, setOpenEdit] = useState(false)
  const handleOpenEdit = () => setOpenEdit(true)
  const handleCloseEdit = () => setOpenEdit(false)
  const [profileFirstNameS, setProfileFirstNameS ] = useState("")
  const [profileLastNameS, setProfileLastNameS ] = useState("")
  const [profileFirstName, setProfileFirstName ] = useState("")
  const [profileLastName, setProfileLastName ] = useState("")
  const [loadingImg, setLoadingImg] = useState(false)
  const [img, setImg] = useState("")
  const userId = Cookies.get('userId')
  const params = useParams()
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


  const handleFetchProfile = async () => {
    try {
      const profile_data = await apiCall(`/profile?profile_id=${params.id}`, {}, 'GET', `bearer ${token}`);
      const score_data = await apiCall(`/profile/score?profile_id=${params.id}`, {}, 'GET', `bearer ${token}`);
      setScore(score_data)
      setProfile(profile_data)
      setProfileFirstName(profile_data.first_name)
      setProfileLastName(profile_data.last_name)
      setProfileFirstNameS(profile_data.first_name)
      setProfileLastNameS(profile_data.last_name)

      console.log("User profile: ", profile_data);
    } catch (err) {
      setAlertMessage("Error: Unfound User")
      handleOpenAlert()
    }
  }

  const handleEditName = async () => {
    try {
      const object = {
        first_name: profileFirstName,
        last_name: profileLastName
      }
      await apiCall(`/edit_profile`, object, 'PUT', `bearer ${token}`);
      dispatch(editProfileNames(object))
      console.log("DONE", object);
      handleCloseEdit()
      setProfile({...profile, first_name:object.first_name, last_name:object.last_name })
      setProfileFirstName(object.first_name)
      setProfileLastName(object.last_name)
      setProfileFirstNameS(object.first_name)
      setProfileLastNameS(object.last_name)
    } catch (err) {
      setAlertMessage("Error: Failed to edit name")
      handleOpenAlert()
    }

  }

  const handleEditImg = async (res) => {
    try {
      const object = {
        image: res,
      }
      await apiCall(`/edit_profile`, object, 'PUT', `bearer ${token}`);
      dispatch(editProfileImg(object))
      console.log("DONE", object);
      setProfile({...profile, image:object.image, last_name:object.last_name })
    } catch (err) {
      setAlertMessage("Error: Failed to edit image")
      handleOpenAlert()
    }
  }

  const handleFileUpload = async (event) => {
    setLoadingImg(true)
    const file = event.target.files[0];
    console.log(file); // Do something with the uploaded file
    if (file.size >= 500000) {
      setAlertMessage("Error: Image is larger than 500KB")
      handleOpenAlert()
      setLoadingImg(false)
      return 
    }
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve, reject) => {
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    await dataUrlPromise.then((res) => 
    {
      console.log("// ProfileScreen.jsx [handleFileUpload] : res: ", res)
      handleEditImg(res)
    }
    )
    setLoadingImg(false)
  }

  const handleFetchTasks = async () => {
    try {
      const res = await apiCall(`/tasks?page=profile&profile_id=${params.id}`, {}, 'GET', `bearer ${token}`);
      console.log(res);
      setTasksProfile(res)
      setTaskStorage(res)
    } catch (err) {
      setAlertMessage("Error: Failed to fetch tasks")
      handleOpenAlert()
    }
  }


  useEffect(() => {
    handleFetchProfile()
    handleFetchTasks()
  }, [params.id])

  

  if (!tasksProfile) {
    return <>Loading...</>
  }

  return (
    <>
      {/* <SideBar/> */}
        <PageContainer marginTop="0px" maxWidth="lg">
        <RowBox justifyContent='space-between'>
          <Typography variant="h3" component="h2" marginBottom="15px">
            Profile
          </Typography>
        </RowBox>
        <RowBox sx={{
          display: 'flex',
          alignItems: 'flex-end',
        }}>
          
        <ColumnBox>
        <Box
          component="img"
          sx={{
            height: 150,
            width: 150,
            maxHeight: { xs: 250, md: 250 },
            maxWidth: { xs: 250, md: 250 },
          }}
          alt="profile image"
          src={profile.image}
          />
        {parseInt(userId) !== profile.profile_id ? <></> : <LoadingButton loading={loadingImg} sx={{borderRadius:'20px'}} size="small" component="label" variant='contained'>
          edit image <input onChange={handleFileUpload} type='file' accept="image/jpeg, image/png, image/jpg" hidden></input>
        </LoadingButton>}
          </ColumnBox>

        <RowBox >
        <WorkloadBar value={parseInt(score)} size={120}/>
        </RowBox>
        </RowBox>
          <RowBox alignItems='center' columnGap='20px'>
            <Typography variant="h6" component="h2" >
              Name: 
            </Typography>
            {openEdit ? (
            <RowBox columnGap='10px'>
              <TextField label="First Name" id="outlined-size-small" size="small" value={profileFirstName} onChange={(e) => setProfileFirstName(e.target.value)} />
              <TextField label="Last Name" id="outlined-size-small" size="small" value={profileLastName} onChange={(e) => setProfileLastName(e.target.value)} />
            </RowBox>
            ) 
            : (<Typography variant="h6" component="h2">
              {profile.first_name} {profile.last_name}
            </Typography>)}
            {parseInt(userId) !== profile.profile_id ? <></> : !openEdit ? (<IconButton onClick={handleOpenEdit}>
              <EditIcon />
            </IconButton>):
            <RowBox>

              <IconButton onClick={handleEditName}>
                <DoneIcon />
              </IconButton>
              <IconButton onClick={() => {handleCloseEdit(); setProfileFirstName(profileFirstNameS); setProfileLastName(profileLastNameS)}}>
                <CloseIcon />
              </IconButton>
            </RowBox>
            }
          </RowBox>
        <Typography variant="h6" component="h2">
          Email: {profile.email} 
        </Typography>
        <Typography variant="h6" component="h2" marginBottom="20px">
          Date of Birth: {profile.date_of_birth} 
        </Typography>
        <SearchBar taskStorage={taskStorage}/>
        <TaskList tasks={tasksProfile} id={parseInt(params.id)} rowNums={5} height='400'/>
        <Snackbar open={openAlert} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>

      </PageContainer>
    </>
  );
};

export default ProfileScreen
    ;