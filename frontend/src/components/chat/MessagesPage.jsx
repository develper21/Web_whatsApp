import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import { LuArrowLeft, LuUserPlus, LuCheck, LuX } from "react-icons/lu";
import { useChatStore } from "../../state/chatStore";
import { useAuthStore } from "../../state/authStore";
import { notificationService } from "../../lib/notificationService";

export const MessagesPage = ({ onBack, onSelectRoom }) => {
  const { user } = useAuthStore();
  const { 
    invitations, 
    loadingInvitations, 
    fetchInvitations, 
    respondToInvitation,
    rooms 
  } = useChatStore();
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleRespondToInvitation = async (invitationId, status) => {
    setRespondingTo(invitationId);
    try {
      await respondToInvitation(invitationId, status);
      
      if (status === "accepted") {
        const invitation = invitations.find(inv => inv._id === invitationId);
        if (invitation) {
          notificationService.success(
            "Chat started!",
            { description: `You can now chat with ${invitation.sender.name}.` }
          );
          onSelectRoom(invitation.room._id);
        }
      }
    } catch (error) {
      notificationService.error(
        "Failed to respond to invitation",
        { description: "Please try again." }
      );
    } finally {
      setRespondingTo(null);
    }
  };

  const pendingInvitations = invitations.filter(inv => inv.status === "pending");
  const acceptedInvitations = invitations.filter(inv => inv.status === "accepted");
  const declinedInvitations = invitations.filter(inv => inv.status === "declined");

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={onBack} size="small">
            <LuArrowLeft />
          </IconButton>
          <Typography variant="h6" fontWeight="medium">
            Messages & Invitations
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
              Pending Invitations ({pendingInvitations.length})
            </Typography>
            <Stack spacing={1}>
              {pendingInvitations.map((invitation) => (
                <Paper key={invitation._id} sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'grey.300' }}>
                      {invitation.sender.name?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {invitation.sender.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {invitation.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invitation.isGroup ? "Group invitation" : "Chat invitation"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<LuCheck />}
                        onClick={() => handleRespondToInvitation(invitation._id, "accepted")}
                        disabled={respondingTo === invitation._id}
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<LuX />}
                        onClick={() => handleRespondToInvitation(invitation._id, "declined")}
                        disabled={respondingTo === invitation._id}
                      >
                        Decline
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {/* Recent Chats */}
        <Box>
          <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
            Recent Chats
          </Typography>
          {rooms.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No chats yet. Start by inviting users from the sidebar!
              </Typography>
            </Box>
          ) : (
            <List>
              {rooms.map((room) => (
                <ListItem key={room._id} disablePadding>
                  <ListItemButton onClick={() => onSelectRoom(room._id)}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'grey.300' }}>
                        {room.isGroup ? room.name?.[0] : 
                          room.members?.find(m => m._id !== user?._id)?.name?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" fontWeight="medium">
                            {room.isGroup ? room.name : 
                              room.members?.find(m => m._id !== user?._id)?.name}
                          </Typography>
                          {room.isGroup && (
                            <Chip label="Group" color="primary" size="small" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary">
                            {room.isGroup ? `${room.members?.length || 0} members` : "Direct message"}
                          </Typography>
                          {room.latestMessage && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {room.latestMessage.content}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Loading State */}
        {loadingInvitations && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Empty State */}
        {!loadingInvitations && pendingInvitations.length === 0 && rooms.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No messages or invitations yet
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
