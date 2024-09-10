import React, { useState } from 'react';
import { Container, TextField, Button, Box, Typography } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // useNavigate 훅 사용

  const handleLogin = async () => {
    try {
      const response = await axios.post('/api/token', {
        username,
        password,
      });

      // 토큰 및 사용자 정보 저장
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('userid', response.data.userid);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('userdescription', response.data.userdescription);

      setIsAuthenticated(true);

      // 로그인 성공 후 메인 페이지로 이동
      navigate('/');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Login
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
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
        <Button variant="contained" color="primary" onClick={handleLogin} fullWidth>
          Login
        </Button>
      </Box>
    </Container>
  );
};

export default LoginPage;
