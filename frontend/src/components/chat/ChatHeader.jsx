import React, { useState } from 'react';
import {
  Box,
  Paper,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Call as CallIcon,
  Videocam as VideoIcon,
  Info as InfoIcon,
  Group as GroupIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LeaveIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { GroupMemberManager } from './GroupMemberManager';

export const ChatHeader = ({ 
  room, 
  currentUser,
  onLeaveRoom 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [groupManagerOpen, setGroupManagerOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenGroupManager = () => {
    handleClose();
    setGroupManagerOpen(true);
  };

  const handleCloseGroupManager = () => {
    setGroupManagerOpen(false);
  };

  const handleLeaveRoom = () => {
    handleClose();
    if (onLeaveRoom) {
      onLeaveRoom(room._id);
    }
  };

  return (
    <>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 2,
              bgcolor: room?.isGroup ? 'secondary.main' : 'primary.main'
            }}
          >
            {room?.name?.charAt(0) || 'C'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {room?.name || 'Chat'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {room?.isGroup 
                ? `${room.members?.length || 0} members` 
                : 'Online'}
            </Typography>
          </Box>
        </Box>
        
        <Box>
          <Tooltip title="Voice call">
            <IconButton size="small">
              <CallIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Video call">
            <IconButton size="small">
              <VideoIcon />
            </IconButton>
          </Tooltip>
          
          {room?.isGroup && (
            <Tooltip title="Group info">
              <IconButton size="small" onClick={handleOpenGroupManager}>
                <GroupIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="More options">
            <IconButton size="small" onClick={handleClick}>
              <MoreIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={handleClose} component="button">
          <ListItemIcon>
            <NotificationsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Notifications</ListItemText>
        </MenuItem>
        
        {room?.isGroup && (
          <MenuItem onClick={handleOpenGroupManager} component="button">
            <ListItemIcon>
              <GroupIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Group Info</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={handleLeaveRoom} component="button">
          <ListItemIcon>
            <LeaveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Leave Chat</ListItemText>
        </MenuItem>
      </Menu>
      
      {room?.isGroup && (
        <GroupMemberManager
          open={groupManagerOpen}
          onClose={handleCloseGroupManager}
          room={room}
          currentUser={currentUser}
        />
      )}
    </>
  );
};