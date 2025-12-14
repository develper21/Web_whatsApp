import React from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { notificationService } from "../../lib/notificationService";

export const NotificationDemo = () => {
  const testNotifications = () => {
    notificationService.success("Success notification", { description: "This is a success message" });
    
    setTimeout(() => {
      notificationService.error("Error notification", { description: "This is an error message" });
    }, 1000);
    
    setTimeout(() => {
      notificationService.warning("Warning notification", { description: "This is a warning message" });
    }, 2000);
    
    setTimeout(() => {
      notificationService.info("Info notification", { description: "This is an info message" });
    }, 3000);
    
    setTimeout(() => {
      notificationService.userEvents.signup("Test User");
    }, 4000);
    
    setTimeout(() => {
      notificationService.userEvents.login("Test User");
    }, 5000);
    
    setTimeout(() => {
      notificationService.chatEvents.groupCreated("Test Group");
    }, 6000);
    
    setTimeout(() => {
      notificationService.chatEvents.invitationSent("John Doe", "Test Group");
    }, 7000);
    
    setTimeout(() => {
      notificationService.chatEvents.invitationAccepted("Test Group");
    }, 8000);
    
    setTimeout(() => {
      notificationService.errorEvents.networkError();
    }, 9000);
  };

  return (
    <Box sx={{ p: 2, border: "1px dashed #ccc", borderRadius: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Notification System Demo
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Click the button below to test all notification types with a 1-second delay between each.
      </Typography>
      <Button variant="outlined" onClick={testNotifications}>
        Test All Notifications
      </Button>
    </Box>
  );
};
