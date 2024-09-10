import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import SshForm from './components/SshForm';
const App = () => {
    const [connected, setConnected] = useState(false);
    return (_jsx(Container, { maxWidth: "sm", children: _jsxs(Box, { my: 4, children: [_jsx(Typography, { variant: "h3", component: "h1", gutterBottom: true, children: "Welcome to SSH Terminal" }), !connected && (_jsx(SshForm, { onConnect: () => setConnected(true) })), connected && (_jsxs(Box, { children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: "SSH Terminal Connected" }), _jsx("div", { id: "terminal-container" })] }))] }) }));
};
export default App;
