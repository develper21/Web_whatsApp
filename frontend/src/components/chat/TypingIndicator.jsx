import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

export const TypingIndicator = ({ users = [] }) => {
  if (users.length === 0) return null;

  const typingText = users.length === 1 
    ? `${users[0]} is typing...` 
    : users.length === 2 
      ? `${users[0]} and ${users[1]} are typing...`
      : `${users[0]} and ${users.length - 1} others are typing...`;

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2,
        pt: 0
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
        {[...Array(Math.min(3, users.length))].map((_, i) => (
          <Avatar 
            key={i}
            sx={{ 
              width: 20, 
              height: 20, 
              fontSize: 10,
              mr: -0.5,
              border: '2px solid white',
              zIndex: 3 - i
            }}
          >
            {users[i]?.charAt(0) || 'U'}
          </Avatar>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {typingText}
      </Typography>
    </Box>
  );
};