import React from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function LogoutButton(props) {
  const { open } = props;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // dispatch(logout())
      Cookies.remove('loginToken');
      Cookies.remove('userId');
      console.log("LOGGING OUT")
      navigate('/login')
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <ListItem key='logout' disablePadding sx={{ display: 'block' }}>
      <ListItemButton
        onClick={handleLogout}
        sx={{
          minHeight: 48,
          justifyContent: open ? 'initial' : 'center',
          px: 2.5,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : 'auto',
            justifyContent: 'center',
          }}
        >
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary='Log out' sx={{ opacity: open ? 1 : 0 }} />
      </ListItemButton>
    </ListItem>
  )
}
