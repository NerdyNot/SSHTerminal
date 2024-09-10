import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Box, Button, Typography } from '@mui/material';

const TerminalPage: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xterm = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [websocket, setWebSocket] = useState<WebSocket | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('연결 대기 중...');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { host, port, username, password } = event.data;

      // 터미널 및 FitAddon 초기화
      xterm.current = new Terminal({ cursorBlink: true });
      fitAddon.current = new FitAddon();
      xterm.current.loadAddon(fitAddon.current);

      if (terminalRef.current) {
        xterm.current.open(terminalRef.current);
        fitAddon.current.fit();
        setStatusMessage('SSH 연결을 시도 중입니다...');
        xterm.current.writeln('SSH 연결을 시도 중입니다...');
      }

      // WebSocket 경로를 현재 도메인에 맞게 설정
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws`);

      setWebSocket(ws);

      ws.onopen = () => {
        ws.send(JSON.stringify({ host, port, username, password }));
        setStatusMessage('SSH 연결 성공!');
        xterm.current?.writeln(`서버: ${host}, 사용자: ${username}로 연결 성공!`);
      };

      ws.onmessage = (event) => {
        // WebSocket에서 받은 데이터를 터미널에 출력
        xterm.current?.write(event.data);
      };

      ws.onerror = () => {
        setStatusMessage('SSH 연결 오류가 발생했습니다.');
        xterm.current?.writeln('SSH 연결 오류가 발생했습니다.');
      };

      ws.onclose = () => {
        setStatusMessage('SSH 세션이 종료되었습니다.');
        xterm.current?.writeln('SSH 세션이 종료되었습니다.');
      };

      // 사용자가 입력한 데이터를 WebSocket으로 전송
      xterm.current?.onData((data) => {
        ws.send(data);
      });

      return () => {
        ws.close();
        xterm.current?.dispose();
      };
    };

    window.addEventListener('message', handleMessage, false);

    // 창 크기 변경 시 터미널 크기를 맞추기 위한 이벤트 리스너
    const handleResize = () => {
      fitAddon.current?.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 세션 종료 함수
  const closeSession = () => {
    websocket?.close();
    xterm.current?.writeln('세션이 종료되었습니다.');
    setStatusMessage('세션 종료');
  };

  return (
    <>
      {/* 상단 메뉴바 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#333',
          color: '#fff',
          padding: '4px 10px',
          height: '32px',
        }}
      >
        <Typography variant="subtitle1">SSH Terminal</Typography>
        <Box>
          <Button color="inherit" onClick={closeSession} sx={{ color: 'white', padding: '0 8px' }}>
            세션 종료
          </Button>
        </Box>
      </Box>

      {/* 터미널 화면 */}
      <Box
        ref={terminalRef}
        sx={{
          width: '100%',
          height: 'calc(100vh - 64px)',
          backgroundColor: 'black',
        }}
      />

      {/* 하단 상태창 */}
      <Box
        sx={{
          backgroundColor: '#333',
          color: '#fff',
          padding: '8px 10px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle2">{statusMessage}</Typography>
      </Box>
    </>
  );
};

export default TerminalPage;
