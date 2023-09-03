import React, {useState, useEffect} from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Cookies from 'js-cookie';

// This will prevent the logged in users from having to login again when passing login/register page url
const LoggedInRoute = () => {
  if (Cookies.get('loginToken')) {
    return <Navigate to="/home" replace />;
  }
  return <><Navbar/><Outlet/></>;
};

export default LoggedInRoute;