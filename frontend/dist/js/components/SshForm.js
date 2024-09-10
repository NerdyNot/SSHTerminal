import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
const SshForm = ({ onConnect }) => {
    const [host, setHost] = useState('');
    const [port, setPort] = useState(22);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ host, port, username, password });
        onConnect();
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsx(Box, { mb: 2, children: _jsx(TextField, { label: "Host", variant: "outlined", fullWidth: true, required: true, value: host, onChange: (e) => setHost(e.target.value) }) }), _jsx(Box, { mb: 2, children: _jsx(TextField, { label: "Port", type: "number", variant: "outlined", fullWidth: true, required: true, value: port, onChange: (e) => setPort(Number(e.target.value)) }) }), _jsx(Box, { mb: 2, children: _jsx(TextField, { label: "Username", variant: "outlined", fullWidth: true, required: true, value: username, onChange: (e) => setUsername(e.target.value) }) }), _jsx(Box, { mb: 2, children: _jsx(TextField, { label: "Password", type: "password", variant: "outlined", fullWidth: true, required: true, value: password, onChange: (e) => setPassword(e.target.value) }) }), _jsx(Button, { type: "submit", variant: "contained", color: "primary", fullWidth: true, children: "Connect" })] }));
};
export default SshForm;
