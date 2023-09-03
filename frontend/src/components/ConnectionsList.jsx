import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { Box, IconButton, ListItemButton, ListItemIcon, Modal } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiCall } from '../utils/api';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import { deleteConnection } from '../actions';

import { useEffect, useState } from 'react';
import WorkloadBar from './WorkloadBar';
import Button from './Button';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: '16px',
  p: 4,
};

export default function ConnectionList(props) {
    const navigate = useNavigate()
    const { connections } = props
    const n = connections.length - 1
    const token = Cookies.get('loginToken')
    const dispatch = useDispatch()
    const [scores, setScores] = useState([]);
    const [openDelete, setOpenDelete] = React.useState(false)
    const handleCloseDelete = () => {setOpenDelete(false); setTargetDelete({})}
    const handleOpenDelete = () => setOpenDelete(true)
    const [targetDelete, setTargetDelete] = React.useState(0)  

    useEffect(() => {
      fetchScores();
    }, []);

    const fetchScores = async () => {
      try {
        const response = await apiCall(`/profile/scores?get_connected=true`, {}, 'GET', `bearer ${token}`);
        setScores(response.scores);
      } catch (err) {
        props.handleOpenAlert()
        props.setAlertMessage("Error: Failed to fetch scores")
      }
    };


    const handleProfile = (id) => {
      navigate(`/profile/${id}`)
    }
    
    const handleDeleteConnection = React.useCallback(
      (id) => () => {
        handleOpenDelete();
        setTargetDelete({id}); // ensure targetDelete is an object with an id property
      },
      [],
    );
      
    const handleDeleteConnectionAPI = async () => {
      try {
        await apiCall(`/delete_connection?profile_id=${targetDelete.id}`, {}, 'DELETE', `bearer ${token}`);
        dispatch(deleteConnection(targetDelete.id))
      } catch (err) {
        props.handleOpenAlert();
        props.setAlertMessage("Error: Failed to delete connection");
      }
      handleCloseDelete()
    }
    
    const getScore = (id) => {
      const profileScore = scores.find(score => score.profile_id === id);
      return profileScore ? profileScore.score : 0;
    }
  

  return (
    <>
      <List sx={{ width: '100%', maxWidth: 700, bgcolor: 'background.paper', margin: 'auto' }}>
    {
        connections.map((con, index) => (
        <Box key={index}>
          <ListItem             
            secondaryAction = {
                <IconButton edge="end" aria-label="comments" onClick={handleDeleteConnection(con.u_id)}>
                  <DeleteIcon />
                </IconButton>
            }
            disablePadding
            >
            <ListItemButton onClick={() => handleProfile(con.u_id)}>
              <ListItemIcon>
                <Avatar src={con.image}></Avatar>
              </ListItemIcon>
              <ListItemIcon sx={{position: 'relative', bottom:'-15px', right: '20px'}}>
                <WorkloadBar handleOpenAlert={props.handleOpenAlert} setAlertMessage={props.setAlertMessage} value={getScore(con.u_id)} size={48} />
              </ListItemIcon>
              <ListItemText primary={`${con.first_name} ${con.last_name}`} />
            </ListItemButton>
              {/* <WorkloadBar value={100} /> */}
          </ListItem>
            
            
          {index !== n ? <Divider />: <></>}
        </Box>

        ))
    }
        </List>
        <Modal
        open={openDelete}
        onClose={handleCloseDelete}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        >
          <Box sx={style} display='flex' flexDirection='column' rowGap='20px'>
            <Typography id="modal-modal-title" variant="h4" component="h2">
              Confirmation
            </Typography>
            <Typography id="modal-modal-title" variant="h6" component="h4">
              Are you sure you want to delete this connection?
            </Typography>
            <Box display="flex" flexDirection="row-reverse" columnGap='20px'>
              <Button variant='contained' color='error' onClick={handleDeleteConnectionAPI}>Confirm</Button>
              <Button variant='contained' onClick={handleCloseDelete}>Back</Button>
            </Box>
          </Box>
        </Modal>

        </>
  )
}
