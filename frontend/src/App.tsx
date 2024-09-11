import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import Sidebar from './components/Sidebar'; 
import Navbar from './components/Navbar';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import SshForm from './components/SshForm';
import LogViewer from './components/LogViewer';
import TerminalPage from './components/TerminalPage';

const theme = createTheme();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false); // 인증 상태 확인 여부
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // localStorage에서 토큰 및 사용자 정보 확인
    const token = localStorage.getItem('token');
    const userid = localStorage.getItem('userid');
    const username = localStorage.getItem('username');
    const userdescription = localStorage.getItem('userdescription');

    // 토큰과 사용자 정보가 있으면 인증 상태를 true로 설정
    if (token && userid && username && userdescription) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {isAuthenticated ? (
          <Routes>
            {/* 레이아웃 적용 경로 */}
            <Route
              path="/*"
              element={
                <Box display="flex" flexDirection="column" height="100vh">
                  <Navbar />
                  <Box display="flex" flexGrow={1}>
                    <Sidebar />
                    <Box flexGrow={1} p={2}>
                      <Routes>
                        <Route path="/" element={<MainPage />} />
                        <Route path="/page/ssh-form" element={<SshForm />} />
                        <Route path="/page/logviewer" element={<LogViewer />} />
                      </Routes>
                    </Box>
                  </Box>
                </Box>
              }
            />
            {/* 레이아웃이 적용되지 않는 경로 */}
            <Route path="/page/terminal" element={<TerminalPage />} />
          </Routes>
        ) : (
          <Routes>
            {/* 로그인 페이지 경로 */}
            <Route path="/page/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
            {/* 로그인하지 않은 사용자는 로그인 페이지로 리디렉션 */}
            <Route path="*" element={<Navigate to="/page/login" />} />
          </Routes>
        )}
      </Router>
    </ThemeProvider>
  );
};

export default App;
