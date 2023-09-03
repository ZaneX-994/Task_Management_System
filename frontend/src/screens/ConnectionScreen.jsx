import React, { useEffect, useState } from 'react';
import PageContainer from '../components/PageContainer';
import { AlertTitle, Badge, Box, Modal, Snackbar, TextField, Typography } from '@mui/material';
import Button from '../components/Button';
import { ColumnBox, RowBox } from '../components/FlexBox';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setConnections } from '../actions';
import Cookies from 'js-cookie';
import { apiCall } from '../utils/api';
import ConnectionList from '../components/ConnectionsList';
import ConnectionReqList from '../components/ConnectionsReqList';
import LoadingButton from '@mui/lab/LoadingButton';
import MuiAlert from '@mui/material/Alert';


const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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

const ConnectionsScreen = () => {
  const dispatch = useDispatch()
  const connections = useSelector(state => state.connectionsReducer)
  const [connectionsReqs, setConnectionsReqs] = useState([])
  const token = Cookies.get('loginToken')
  const [openReq, setOpenReq] = useState(false)
  const [openAdd, setOpenSend] = useState(false)
  const [email, setEmail] = useState("")
  const handleOpenAdd = () => setOpenSend(true)
  const handleCloseAdd = () => setOpenSend(false)
  const handleOpenReq = () => setOpenReq(true)
  const handleCloseReq = () => setOpenReq(false)
  const [isManaged, setIsManaged] = React.useState(false)
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

  const handleFetchConnections = async () => {
    try {
      const res = await apiCall('/connections', {}, 'GET', `bearer ${token}`);
      dispatch(setConnections(res.connection_list))
    } catch (err) {
      setAlertMessage("Error: Failed to fetch connection list")
      handleOpenAlert()
    }
  }

  const handleFetchConnectionsRequests = async () => {
    try {
      const res = await apiCall('/connection_requests', {}, 'GET', `bearer ${token}`);
      setConnectionsReqs(res.request_list)
      console.log(res.request_list);
    } catch (err) {
      setAlertMessage("Error: Failed to fetch connection request list")
      handleOpenAlert()
    }
  }


  const handleAddConnection = async () => {
    try {
      setIsManaged(true)
      const object = {
        email,
      }
      await apiCall(`/connection_request`, object, 'POST', `bearer ${token}`);
      setIsManaged(false)
      setOpenSend(false)
      setEmail("")
    } catch (err) {
      if (err === 409) {
        setAlertMessage("Error: The user is already in your connections")
        handleOpenAlert()
        setIsManaged(false)
        return
      }
      if (err === 405) {
        setAlertMessage("Error: Connection can not self directed")
        handleOpenAlert()
        setIsManaged(false)
        return
      }
      setAlertMessage("Error: No email address found")
      handleOpenAlert()
      setIsManaged(false)
    }
  }

  
  useEffect(() => {
    handleFetchConnections()
    handleFetchConnectionsRequests()
  }, [])

  if (!connections) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer maxWidth="md" marginTop="0px" sx={{ minHeight: "400px" }}>
      <RowBox justifyContent='space-between' marginBottom='50px'>
        <Typography variant="h3" component="h2">
          Connection
        </Typography>
        <RowBox columnGap='20px'>
          <Badge badgeContent={connectionsReqs.length} color="secondary">
          <Button variant='contained' onClick={handleOpenReq}>Show request</Button>
          </Badge>
          <Button variant='contained' onClick={handleOpenAdd}>Add connection</Button>
        </RowBox>
      </RowBox>
      <ConnectionList handleOpenAlert={handleOpenAlert} setAlertMessage={setAlertMessage} connections={connections} />
      <Snackbar open={openAlert} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>


      {/* ***************** Modal *********************** */}
      <Modal
          open={openReq}
          onClose={handleCloseReq}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Connection Request
            </Typography>
              <ConnectionReqList handleOpenAlert={handleOpenAlert} setAlertMessage={setAlertMessage} setConnectionsReqs={setConnectionsReqs} connections={connectionsReqs} />
            <Box display="flex" flexDirection="row-reverse" columnGap='20px'>
              <Button variant='contained' onClick={handleCloseReq}>Back</Button>
            </Box>
          </Box>
        </Modal>
        <Modal
          open={openAdd}
          onClose={handleCloseAdd}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          >
          <Box sx={style} rowGap='50px' display='flex' flexDirection="column">
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Add Connections
            </Typography>
            <TextField id="outlined-basic" value={email} onKeyDown={(e) => {if(e.key === "Enter") {handleAddConnection()} }} onChange={(e) => setEmail(e.target.value)} label="email" variant="standard" />
            <Box display="flex" flexDirection="row-reverse" columnGap='20px'>
              <LoadingButton sx={{ backgroundColor:'#4A4E69', borderRadius: 20 }} loading={isManaged} variant='contained' onClick={handleAddConnection}>Send Invitation</LoadingButton>
              <Button variant='outlined' onClick={handleCloseAdd}>Back</Button>
            </Box>
          </Box>
        </Modal>


    </PageContainer>
  );
};

export default ConnectionsScreen;

