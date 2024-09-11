import React from 'react';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import TerminalIcon from '@mui/icons-material/Terminal';
import NotesIcon from '@mui/icons-material/Notes';

const Sidebar: React.FC = () => {
  return (
    <List>
      {/* 메인 페이지 링크 */}
      <ListItemButton component={Link} to="/">
        <ListItemIcon>
          <HomeIcon />
        </ListItemIcon>
        <ListItemText primary="Main Page" />
      </ListItemButton>

      {/* SSH 접속 페이지 링크 추가 */}
      <ListItemButton component={Link} to="/page/ssh-form">
        <ListItemIcon>
          <TerminalIcon />
        </ListItemIcon>
        <ListItemText primary="SSH Manual Connect" />
      </ListItemButton>

      {/* 로그뷰어 페이지 링크 추가 */}
      <ListItemButton component={Link} to="/page/logviewer">
        <ListItemIcon>
          <NotesIcon />
        </ListItemIcon>
        <ListItemText primary="Log Viewer" />
      </ListItemButton>
    </List>
  );
};

export default Sidebar;
