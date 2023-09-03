import * as React from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch, useSelector } from 'react-redux';
import { changeTaskState, deleteTasks, setTasks } from '../actions';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import Cookies from 'js-cookie';
import { Box, Table, IconButton } from '@mui/material';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';


export default function SmallTaskList(props) {
  const { tasks, handleDeleteTask, id, rowNums } = props
  const userId = Cookies.get('userId')
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(rowNums);



  const columnsDetail = [
    { 
      id: 'title', 
      label: 'Task Name', 
      width: '75%',
    },
    {
      id: 'deadline',
      label: 'Deadline',
      type: 'Date',
      minWidth: '20%',
    },
    {
      id: 'delete',
      minWidth: '5%',
    },
  ]

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };


  if (parseInt(userId) !== id) {
    columnsDetail.splice(4,1)
    columnsDetail.splice(4,1)
  }


  const columns = React.useMemo(
    () => columnsDetail,
    [tasks, handleDeleteTask],
  );
  if (!tasks) {
    return <>Loading</>
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columnsDetail.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.task_id}>
                    {columnsDetail.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}
                        sx={{maxWidth: '175px',
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"}}>
                          {column.id === 'delete' && (
                            <IconButton  size='small' onClick={() => handleDeleteTask(row.task_id, row.deadline)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                          {column.format && typeof value === 'number'
                            ? column.format(value)
                            : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={tasks.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}
