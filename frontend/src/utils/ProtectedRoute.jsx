import React, {useState, useEffect} from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import SideBar from '../components/SideBar';
import Cookies from 'js-cookie';
import { apiCall } from './api';
import { setConnections, setProfile, setTasks } from '../actions';
import { useDispatch } from 'react-redux';

// This will protect the admin page from unauthenticated user passing url directly
// const ProtectedRoute = () => {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);

//   const setLoggedIn = () => {
//     setIsLoggedIn(true);
//   };

//   useEffect(() => {
//     const token = Cookies.get('loginToken');
//     setLoggedIn();
//   }, []);

//   return !isLoggedIn ? <Navigate to="/login" replace /> : <><SideBar/></>;
//   // return <><SideBar/></>
// };




const ProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch()
  const token = Cookies.get('loginToken')

  const handleFetchConnections = async () => {
    try {
      const res = await apiCall('/connections', {}, 'GET', `bearer ${token}`);
      dispatch(setConnections(res.connection_list))
    } catch (err) {
      // setAlertMessage("Error: Failed to fetch connections")
      // handleOpenAlert()
    }
  }
  
  const handleFetchProfile = async () => {
    try {
      const id = await apiCall('/token/id', {}, 'GET', `bearer ${token}`);
      const profile_data = await apiCall(`/profile?page=profile&profile_id=${id}`, {}, 'GET', `bearer ${token}`);
      // Cookies.set('userId', profile_data.profile_id);
      console.log("// LoginScreen: ", Cookies.get('userId'))
      dispatch(setProfile(profile_data))
    } catch (err) {
      // setHasError(false)
      // setError("Error: Fail to fetch id")
    }

  }
  
  
  
  const handleFetchTasks = async () => {
    try {
      const res = await apiCall('/tasks?page=dashboard', {}, 'GET', `bearer ${token}`);
      dispatch(setTasks(res))
      console.log("tasks: ", res)
    } catch (err) {
      // setAlertMessage("Error: Failed to fetch tasks")
      // handleOpenAlert()
    }
  }
  
  
  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        await handleFetchProfile();
        await handleFetchConnections();
        await handleFetchTasks();
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);  // Runs when component mounts and when token changes

  if (isLoading) {
    // You can replace this with a loading spinner or something similar
    return <div>Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <SideBar />;
};

export default ProtectedRoute;