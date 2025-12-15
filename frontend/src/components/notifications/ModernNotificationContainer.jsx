import React from 'react';
import { Snackbar, Alert, Slide, Typography } from '@mui/material';
import { useNotificationStore } from '../../state/notificationStore';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="left" ref={ref} {...props} />;
});

export const ModernNotificationContainer = () => {
  const { notifications, removeNotification } = useNotificationStore();

  const handleClose = (notificationId) => {
    removeNotification(notificationId);
  };

  return (
    <div>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open
          autoHideDuration={notification.duration || 5000}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={Transition}
          sx={{ mt: notification.index * 8 }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ 
              width: '100%',
              maxWidth: 400,
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
              {notification.title}
            </Typography>
            {notification.description && (
              <Typography variant="body2">
                {notification.description}
              </Typography>
            )}
          </Alert>
        </Snackbar>
      ))}
    </div>
  );
};