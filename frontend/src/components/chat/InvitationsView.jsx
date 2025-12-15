import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Toolbar
} from '@mui/material';
import {
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { InvitationList } from './InvitationList';
import { useChatStore } from '../../state/chatStore';

export const InvitationsView = ({ onBack }) => {
  const { invitations, loadingInvitations } = useChatStore();

  const handleRespond = async (invitationId, status) => {
    try {
      await useChatStore.getState().respondToInvitation(invitationId, status);
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    }
  };

  const pendingCount = invitations.filter(inv => inv.status === 'pending').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <IconButton onClick={onBack} sx={{ mr: 1 }}>
          <BackIcon />
        </IconButton>
        
        <Typography variant="h6" fontWeight={600}>
          Invitations
        </Typography>
        
        {pendingCount > 0 && (
          <Typography 
            variant="caption" 
            sx={{ 
              ml: 2, 
              px: 1, 
              py: 0.5, 
              bgcolor: 'warning.light', 
              color: 'warning.dark',
              borderRadius: 1
            }}
          >
            {pendingCount} pending
          </Typography>
        )}
      </Paper>

      {/* Invitations List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {loadingInvitations ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography>Loading invitations...</Typography>
          </Box>
        ) : (
          <InvitationList onRespond={handleRespond} />
        )}
      </Box>
    </Box>
  );
};