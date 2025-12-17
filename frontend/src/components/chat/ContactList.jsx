import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Typography,
  Divider
} from '@mui/material';
import { useChatStore } from '../../state/chatStore';

export const ContactList = ({ onSelectRoom, onShowInvitations, invitationCount = 0 }) => {
  const { rooms, selectedRoomId } = useChatStore();

  // Filter rooms to show only active chats
  const activeRooms = rooms.filter(room => 
    room.latestMessage || 
    room.members?.length > 0
  );

  return (
    <List sx={{ py: 0 }}>
      {/* Invitations Section */}
      <ListItem 
        component="button"
        onClick={onShowInvitations}
        sx={{ 
          py: 1.5,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
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
        <ListItemText
          primary={
            <Typography variant="subtitle2" fontWeight={600}>
              Invitations
            </Typography>
          }
        />
        {invitationCount > 0 && (
          <Badge badgeContent={invitationCount} color="error">
            <Avatar sx={{ width: 8, height: 8, bgcolor: 'transparent' }} />
          </Badge>
        )}
      </ListItem>
      
      <Divider />
      
      {activeRooms.map((room) => (
        <React.Fragment key={room._id}>
          <ListItem 
            component="button"
            selected={selectedRoomId === room._id}
            onClick={() => onSelectRoom(room._id)}
            sx={{
              py: 1.5,
              px: 2,
              width: '100%',
              textAlign: 'left',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                '&:hover': {
                  bgcolor: 'primary.light',
                }
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  room.isGroup ? (
                    <Avatar 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        fontSize: 8,
                        bgcolor: 'secondary.main',
                        color: 'secondary.contrastText'
                      }}
                    >
                      {room.members?.length || 0}
                    </Avatar>
                  ) : (
                    <Badge
                      variant="dot"
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: 'success.main',
                          border: '2px solid white',
                        }
                      }}
                    />
                  )
                }
              >
                <Avatar 
                  sx={{ 
                    width: 48, 
                    height: 48,
                    bgcolor: room.isGroup ? 'secondary.main' : 'primary.main'
                  }}
                >
                  {room.name?.charAt(0) || 'C'}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Typography 
                  variant="subtitle2" 
                  fontWeight={selectedRoomId === room._id ? 600 : 500}
                  noWrap
                >
                  {room.name}
                </Typography>
              }
              secondary={
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  noWrap
                  sx={{ 
                    maxWidth: '100%', 
                    textOverflow: 'ellipsis' 
                  }}
                >
                  {room.latestMessage?.content || 'No messages yet'}
                </Typography>
              }
            />
            
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ ml: 1 }}
            >
              {room.updatedAt 
                ? new Date(room.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : ''}
            </Typography>
          </ListItem>
          
          <Divider variant="inset" component="li" sx={{ ml: 10 }} />
        </React.Fragment>
      ))}
    </List>
  );
};