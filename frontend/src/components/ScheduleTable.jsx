import React, { useEffect, useState } from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch, useSelector } from 'react-redux';
import { changeTaskState, deleteTasks, setTasks } from '../actions';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import Cookies from 'js-cookie';
import { Box, Grid, Paper, Table, IconButton, Typography, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import formatDate from '../utils/formatDate';

const slotProps = {
  leftArrowIcon: { fontSize: 'large' },
  rightArrowIcon: { fontSize: 'large' },
  previousIconButton: {
    size: 'medium',
  },
  nextIconButton: {
    size: 'medium',
  },
};

export default function SmallTaskList(props) {
  const { schedule } = props
  const profile = useSelector(state => state.profileReducer)
  const token = Cookies.get('loginToken')
  const userId = Cookies.get('userId')
  const [page, setPage] = React.useState(0);
  const [displayDate, setDisplayDate] = React.useState([]);
  const [weekBatch, setWeekBatch] = React.useState(0);

  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
  };

  const computeTaskBoxHeight = (time) => {
    let height = 25
    height += time > 30 ? 0.4*(time-30) : 0
    height += time > 60 ? 0.2*(time-60) : 0
    height += time > 90 ? 0.1*(time-90) : 0
    height += time >= 120 ? 0.1 : 0

    return parseInt(height)
  };

  const getNext7Days = (week) => {
    const start = week*7
    const currentDate = new Date();
    const dates = [];
  
    for (let i = start; i < start+7; i++) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + i);
      dates.push(formatDate(nextDate));
    }
    return dates
  };

  const HandleArrowBack = () => {
    const week = weekBatch-1
    if (weekBatch > 0) {
      setWeekBatch(week)
      setDisplayDate(getNext7Days(week))
    }
  };

  const HandleArrowFW = () => {
    const week = weekBatch+1
    if (weekBatch < 10) {
      setWeekBatch(week)
      setDisplayDate(getNext7Days(week))
    }
  };

  useEffect(() => {
    setDisplayDate(getNext7Days(0))
    console.log(displayDate)
  }, [])

  return (
    <Box
      width='100%'
      height='610px'
      border={1}
      borderColor="black"
      borderRadius={1}
      marginLeft='25px'
      marginTop='10px'
    >
      <Box display="flex" alignItems="center" padding={1.2}>
        <Typography variant="h6" flexGrow={1}>
          {formatShortDate(displayDate[0])} - {formatShortDate(displayDate[6])}
        </Typography>
        <IconButton  size='small' onClick={HandleArrowBack}>
          <ArrowBackIcon fontSize='large'/>
        </IconButton>
        <IconButton  size='small' onClick={HandleArrowFW}>
          <ArrowForwardIcon fontSize='large'/>
        </IconButton>
      </Box>
      <Box
        display="flex"
        height="100%"
      >
        {displayDate.map((date, index) => (
          <Box key={index} display="flex" flexDirection="column" flexBasis='14.2857%' alignItems='center' height='100%'>
            <Grid style={{ height: '82%', width: '100%', display:'flex', alignItems:'flex-end'}}>
              <Stack padding='10px' flex={1} alignItems='flex-end' sx={{ marginTop: 'auto' }}>
                {schedule[date] && schedule[date].map((task, index) => (
                  <Box key={index} component="div"  sx={{
                    backgroundColor:'lightgray', 
                    border:1, 
                    borderColor:'darkgray', 
                    padding:'4px', 
                    display: 'flex',
                    alignItems: 'center',
                    textAlign: 'center',
                    width: '100%',
                    justifyContent: 'center',
                    height: `${computeTaskBoxHeight(task.mean)}px`,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}>
                    <Typography variant="caption">
                      {task.title}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>
            <Typography variant="body1" marginTop='10px'>
              {formatShortDate(date)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
    
  );
}
