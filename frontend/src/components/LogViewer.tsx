import React, { useState } from 'react';
import { Container, Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import axios from 'axios';
import { DateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

// 로그 데이터의 타입 정의
interface LogEntry {
  session_connect_timestamp: string;
  session_close_timestamp: string | null;
  session_id: string;
  user_info: {
    userid: string;
    username: string;
    userdescription: string;
  };
  data: string;
}

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [open, setOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  const handleClickOpen = (logData: string) => {
    setSelectedLog(logData);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const fetchLogs = async () => {
    if (startDate && endDate) {
      setLoading(true);
      try {
        const response = await axios.get<LogEntry[]>('/api/logs/time', {
          params: {
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
          },
        });
        setLogs(response.data);
      } catch (err) {
        setError('로그를 가져오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    } else {
      setError('시작일과 종료일을 모두 선택해 주세요.');
    }
  };

  // DataGrid의 컬럼 정의
  const columns: GridColDef[] = [
    { field: 'session_connect_timestamp', headerName: 'Connect Time', width: 180 },
    { field: 'session_close_timestamp', headerName: 'Close Time', width: 180 },
    { field: 'session_id', headerName: 'Session ID', width: 150 },
    { field: 'userid', headerName: 'User ID', width: 120 },
    { field: 'username', headerName: 'Username', width: 150 },
    { field: 'userdescription', headerName: 'Description', width: 200 },
    {
      field: 'data',
      headerName: 'Log Data',
      flex: 1,
      renderCell: (params) => (
        <Button onClick={() => handleClickOpen(params.value)}>
          View Log
        </Button>
      )
    },
  ];

  // DataGrid의 로우 데이터 변환
  const rows: GridRowsProp = logs.map((log, index) => ({
    id: index,
    session_connect_timestamp: dayjs(log.session_connect_timestamp).format('YYYY-MM-DD HH:mm:ss'),
    session_close_timestamp: log.session_close_timestamp
      ? dayjs(log.session_close_timestamp).format('YYYY-MM-DD HH:mm:ss')
      : 'Active',
    session_id: log.session_id,
    userid: log.user_info.userid,
    username: log.user_info.username,
    userdescription: log.user_info.userdescription,
    data: log.data,
  }));

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Log Viewer
        </Typography>
        {error && <Typography color="error">{error}</Typography>}

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box display="flex" mb={2} alignItems="center">
            <DateTimePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
            />
            <Box mx={2}>to</Box>
            <DateTimePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={fetchLogs}
              sx={{ ml: 2 }}
            >
              Fetch Logs
            </Button>
          </Box>
        </LocalizationProvider>

        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
          />
        </div>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Log Data</DialogTitle>
        <DialogContent>
          <Typography style={{ whiteSpace: 'pre-line', wordWrap: 'break-word' }}>
            {selectedLog}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LogViewer;
