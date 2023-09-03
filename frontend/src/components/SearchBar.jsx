import React, { useEffect, useState } from 'react';
import { TextField, Button } from '@mui/material';
import styled from '@emotion/styled';
import { LocalizationProvider, DatePicker  } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useDispatch, useSelector } from 'react-redux';
import { setTasks } from '../actions';
import { RowBox } from './FlexBox';


const CustomTextField = styled(TextField)({
  height: '80px',
})
const CustomButton = styled(Button)({
  height: '55px',
  marginTop: '0px',
})

const SearchBar = (props) => {
  const {taskStorage} = props
  const [idValue, setIdValue] = useState('')
  const [nameValue, setNameValue] = useState('')
  const [descValue, setDescValue] = useState('')
  const [deadlineValue, setDeadlineValue] = useState('')

  const dispatch = useDispatch()

  const searchSubmit = async() => {
    dispatch(setTasks(taskStorage.filter((task) => {
      const taskDeadline = task.deadline ? new Date(task.deadline) : deadlineValue
      if (idValue && deadlineValue) {
        return (
          taskDeadline < deadlineValue &&
          task.task_id === Number(idValue) &&
          task.title.toLowerCase().includes(nameValue.toLowerCase()) && 
          task.description.toLowerCase().includes(descValue.toLowerCase())
        );
      }
      else if (idValue) {
        return task.task_id === Number(idValue) && task.title.toLowerCase().includes(nameValue.toLowerCase()) && task.description.toLowerCase().includes(descValue.toLowerCase())
      }
      else if (deadlineValue) {
        return (
          taskDeadline < deadlineValue &&
          task.title.toLowerCase().includes(nameValue.toLowerCase()) && 
          task.description.toLowerCase().includes(descValue.toLowerCase())
        );
      }
      else {
        return task.title.toLowerCase().includes(nameValue.toLowerCase()) && task.description.toLowerCase().includes(descValue.toLowerCase())
      }
    })));
  };

  const handleClear = () => {
    dispatch(setTasks(taskStorage))
    setIdValue("")
    setNameValue("")
    setDescValue("")
    setDeadlineValue("")
  }
  
  // tick for specific deadline (at this point always on), make it work on profile page
  // date range picker https://mui.com/x/react-date-pickers/date-range-picker/
  return (
  <div>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <RowBox columnGap="5px" justifyContent="space-between">

      <CustomTextField sx={{ flexGrow: 0, width: 70}} label="ID" variant="outlined" value={idValue} onKeyDown={(e) => {if (e.key === "Enter") {searchSubmit()}}} onChange={(event) => {
        const inputValue = event.target.value;
        const regex = /^[0-9]*$/;
        if (regex.test(inputValue)) {
          setIdValue(inputValue);
        }
      }}/>
      <CustomTextField sx={{ flexGrow: 0}} label="Name" variant="outlined" value={nameValue} onKeyDown={(e) => {if (e.key === "Enter") {searchSubmit()}}} onChange={(event) => {setNameValue(event.target.value)}}/>
      <CustomTextField sx={{ flexGrow: 5}} label="Description" variant="outlined" value={descValue} onKeyDown={(e) => {if (e.key === "Enter") {searchSubmit()}}} onChange={(event) => {setDescValue(event.target.value)}}/>
      <DatePicker sx={{ flexGrow: 0}} label="Deadline" slotProps={{ textField: { error: false, }, }} value={deadlineValue} onChange={(newValue) => {setDeadlineValue(newValue)}}/>
      <CustomButton variant='contained' onClick={() => searchSubmit()}>Search</CustomButton>
      <CustomButton variant='outlined' onClick={() => { handleClear() }}>Clear</CustomButton>
      </RowBox>
    </LocalizationProvider>
  </div>)
}

export default SearchBar