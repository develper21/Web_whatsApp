import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Badge,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Chat as ChatIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  ExpandLess,
  ExpandMore,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';

export const Sidebar = ({
  mobileOpen,
  handleDrawerToggle,
  onNewChat,
  onNavigate,
  activeSection = "welcome",
  pendingInvitationCount = 0,
}) => {
  const [contactsMenuOpen, setContactsMenuOpen] = useState(true);

  const handleContactsClick = () => {
    setContactsMenuOpen((prev) => !prev);
  };

  const handleSelect = (section) => {
    onNavigate?.(section);
  };

  const drawer = (
    <div>
      <div style={{ padding: '16px 16px 8px' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </div>
      
      <List>
        <ListItem 
          component="button"
          selected={activeSection === "chat"}
          onClick={() => handleSelect("chat")}
          sx={{ 
            py: 1,
            width: '100%',
            textAlign: 'left',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <ListItemIcon>
            <ChatIcon />
          </ListItemIcon>
          <ListItemText primary="Chats" />
        </ListItem>
        
        <ListItem 
          component="button"
          onClick={handleContactsClick}
          sx={{ 
            py: 1,
            width: '100%',
            textAlign: 'left',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <ListItemIcon>
            <Badge 
              badgeContent={pendingInvitationCount}
              color="primary"
              invisible={pendingInvitationCount === 0}
            >
              <PeopleIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Contacts" />
          {contactsMenuOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        
        <Collapse in={contactsMenuOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem 
              component="button"
              selected={activeSection === "contacts"}
              onClick={() => handleSelect("contacts")}
              sx={{ 
                pl: 4,
                py: 1,
                width: '100%',
                textAlign: 'left',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ListItemText primary="All Contacts" />
            </ListItem>
            <ListItem 
              component="button"
              selected={activeSection === "groups"}
              onClick={() => handleSelect("groups")}
              sx={{ 
                pl: 4,
                py: 1,
                width: '100%',
                textAlign: 'left',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ListItemText primary="Groups" />
            </ListItem>
            <ListItem 
              component="button"
              selected={activeSection === "favorites"}
              onClick={() => handleSelect("favorites")}
              sx={{ 
                pl: 4,
                py: 1,
                width: '100%',
                textAlign: 'left',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ListItemText primary="Favorites" />
            </ListItem>
          </List>
        </Collapse>
        
        <ListItem 
          component="button"
          onClick={onNewChat}
          sx={{ 
            py: 1,
            width: '100%',
            textAlign: 'left',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText primary="New Chat" />
        </ListItem>
        
        <Divider />
        
        <ListItem 
          component="button"
          onClick={() => {}}
          sx={{ 
            py: 1,
            width: '100%',
            textAlign: 'left',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        
        <ListItem 
          component="button"
          onClick={() => {}}
          sx={{ 
            py: 1,
            width: '100%',
            textAlign: 'left',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText primary="Help & Feedback" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <nav>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': { 
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>
      
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            width: 280,
            boxSizing: 'border-box',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </nav>
  );
};