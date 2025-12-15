import React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../state/authStore';

export const AppBar = ({ onDrawerToggle }) => {
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <MuiAppBar 
      position="static" 
      elevation={1}
      sx={{ 
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={onDrawerToggle}
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ 
            flexGrow: 1, 
            fontWeight: 700,
            color: 'primary.main'
          }}
        >
          AlgoChat
        </Typography>

        <IconButton
          color="inherit"
          onClick={handleNotificationOpen}
          sx={{ mr: 1 }}
        >
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
        >
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              fontSize: 14,
              bgcolor: 'primary.main'
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
        </IconButton>

        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 2,
            sx: {
              mt: 1,
              minWidth: 200,
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem>
            <ListItemIcon>
              <AccountIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="subtitle2" noWrap>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email || 'user@example.com'}
              </Typography>
            </ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem>
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>My Profile</ListItemText>
          </MenuItem>
          
          <MenuItem>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>

        {/* Notification Menu */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationClose}
          onClick={handleNotificationClose}
          PaperProps={{
            elevation: 2,
            sx: {
              mt: 1,
              minWidth: 300,
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem>
            <Typography variant="subtitle2">Notifications</Typography>
          </MenuItem>
          <Divider />
          <MenuItem>
            <ListItemText 
              primary="New message from John" 
              secondary="5 minutes ago" 
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
          <MenuItem>
            <ListItemText 
              primary="You have been added to a group" 
              secondary="1 hour ago" 
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
          <MenuItem>
            <ListItemText 
              primary="Server maintenance scheduled" 
              secondary="Yesterday" 
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        </Menu>
      </Toolbar>
    </MuiAppBar>
  );
};