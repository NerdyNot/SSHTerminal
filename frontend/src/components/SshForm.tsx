import React, { useState } from 'react';
import { Container, TextField, Button, Box, Typography } from '@mui/material';

const SshForm: React.FC = () => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (!host || !username || !password) {
      setError('모든 필드를 채워주세요.');
      return;
    }
    // SSH 접속 정보를 새 창에 전달하여 터미널을 띄우는 함수 호출
    const terminalWindow = window.open('/page/terminal', '_blank', 'width=800,height=600');
    if (terminalWindow) {
      terminalWindow.onload = () => {
        terminalWindow.postMessage({ host, port, username, password }, '*');
      };
    }
  };

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          SSH Manual Connect
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        <TextField
          label="Host"
          fullWidth
          value={host}
          onChange={(e) => setHost(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Port"
          fullWidth
          value={port}
          onChange={(e) => setPort(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Username"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={handleConnect} fullWidth>
          Connect
        </Button>
      </Box>
    </Container>
  );
};

export default SshForm;
