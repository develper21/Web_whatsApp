import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Button,
  Chip,
  Box
} from '@mui/material';
import { useChatStore } from '../../state/chatStore';

export const InvitationList = ({ onRespond }) => {
  const { invitations } = useChatStore();

  const handleResponse = async (invitationId, status) => {
    if (onRespond) {
      await onRespond(invitationId, status);
    }
  };

  if (invitations.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No pending invitations
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ py: 0 }}>
      {invitations.map((invitation) => (
        <ListItem 
          key={invitation._id}
          component="div"
          sx={{ 
            flexDirection: 'column',
            alignItems: 'flex-start',
            py: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
            <ListItemAvatar>
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40,
                  bgcolor: invitation.room?.isGroup ? 'secondary.main' : 'primary.main'
                }}
              >
                {invitation.room?.name?.charAt(0) || 'C'}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Typography variant="subtitle2">
                  {invitation.room?.isGroup 
                    ? `Group invitation: ${invitation.room.name}` 
                    : `Chat invitation from ${invitation.sender?.name}`}
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {invitation.message || 'You have been invited to join this chat.'}
                </Typography>
              }
            />
            
            <Chip 
              label={invitation.status} 
              size="small" 
              color={invitation.status === 'pending' ? 'warning' : invitation.status === 'accepted' ? 'success' : 'default'}
            />
          </Box>
          
          {invitation.status === 'pending' && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, ml: 6 }}>
              <Button 
                variant="contained" 
                size="small"
                onClick={() => handleResponse(invitation._id, 'accepted')}
              >
                Accept
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => handleResponse(invitation._id, 'rejected')}
              >
                Decline
              </Button>
            </Box>
          )}
        </ListItem>
      ))}
    </List>
  );
};