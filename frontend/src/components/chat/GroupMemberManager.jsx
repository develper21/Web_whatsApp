import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  TextField,
  Chip,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useChatStore } from '../../state/chatStore';

export const GroupMemberManager = ({ 
  open, 
  onClose, 
  room,
  currentUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const { 
    userSearchResults, 
    searchingUsers, 
    searchUsers, 
    clearUserSearch,
    inviteMembers
  } = useChatStore();

  const isAdmin = room?.admin?._id === currentUser?._id;

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 2) {
      searchUsers(term);
    } else {
      clearUserSearch();
    }
  };

  const handleAddMember = (user) => {
    setSelectedMembers(prev => {
      if (!prev.find(member => member._id === user._id)) {
        return [...prev, user];
      }
      return prev;
    });
  };

  const handleRemoveSelectedMember = (userId) => {
    setSelectedMembers(prev => prev.filter(member => member._id !== userId));
  };

  const handleInviteMembers = async () => {
    try {
      await inviteMembers(room._id, selectedMembers.map(member => member._id));
      setSelectedMembers([]);
      setSearchTerm('');
      clearUserSearch();
      onClose();
    } catch (error) {
      console.error('Failed to invite members:', error);
    }
  };

  const filteredUsers = userSearchResults.filter(user => 
    !room?.members?.find(member => member._id === user._id) &&
    !selectedMembers.find(member => member._id === user._id)
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Manage Group Members</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Current Members
          </Typography>
          
          <List dense>
            {room?.members?.map((member) => (
              <ListItem 
                key={member._id}
                component="div"
                secondaryAction={
                  room?.admin?._id === member._id ? (
                    <AdminIcon fontSize="small" color="primary" />
                  ) : isAdmin ? (
                    <IconButton edge="end">
                      <MoreVertIcon />
                    </IconButton>
                  ) : null
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {member.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={member.name} 
                  secondary={room?.admin?._id === member._id ? "Admin" : "Member"}
                />
              </ListItem>
            ))}
          </List>
        </Box>
        
        {isAdmin && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Invite New Members
              </Typography>
              
              <TextField
                fullWidth
                size="small"
                placeholder="Search users to invite..."
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ mb: 2 }}
              />
              
              {selectedMembers.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Selected ({selectedMembers.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {selectedMembers.map((member) => (
                      <Chip
                        key={member._id}
                        label={member.name}
                        onDelete={() => handleRemoveSelectedMember(member._id)}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {searchingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : filteredUsers.length > 0 ? (
                <List dense>
                  {filteredUsers.map((user) => (
                    <ListItem 
                      key={user._id}
                      component="div"
                      secondaryAction={
                        <Button 
                          size="small" 
                          startIcon={<PersonAddIcon />}
                          onClick={() => handleAddMember(user)}
                        >
                          Add
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={user.name} secondary={user.email} />
                    </ListItem>
                  ))}
                </List>
              ) : searchTerm.length > 2 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No users found
                </Typography>
              ) : null}
            </Box>
          </>
        )}
      </DialogContent>
      
      {isAdmin && selectedMembers.length > 0 && (
        <DialogActions>
          <Button onClick={() => setSelectedMembers([])}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleInviteMembers}
            startIcon={<PersonAddIcon />}
          >
            Invite {selectedMembers.length} Member{selectedMembers.length > 1 ? 's' : ''}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};