import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import { LuMail, LuUserPlus, LuX } from "react-icons/lu";
import api from "../../lib/apiClient";

export const InvitationModal = ({ isOpen, onClose, onInvitationSent }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Let's connect on AlgoChat!");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setMessage("Let's connect on AlgoChat!");
      setLoading(false);
    }
  }, [isOpen]);

  const handleSendInvitation = async () => {
    if (!email.trim()) return;

    setLoading(true);
    try {
      await api.post("/invitations", { recipientEmail: email.trim(), message });
      setEmail("");
      setMessage("Let's connect on AlgoChat!");
      onInvitationSent?.();
      onClose();
    } catch (error) {
      console.error("Failed to send invitation:", error);
      if (error.response?.status === 409) {
        // Conflict - invitation already exists or chat already exists
        const message = error.response?.data?.message || "Invitation already sent";
        alert(message);
      } else if (error.response?.status === 404) {
        alert("User not found with this email address");
      } else {
        alert("Failed to send invitation. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LuUserPlus />
            <Typography variant="h6">Invite User to Chat</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <LuX />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter user's email"
            fullWidth
            required
          />
          <TextField
            label="Message (optional)"
            multiline
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message..."
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSendInvitation}
          disabled={!email.trim() || loading}
          variant="contained"
        >
          {loading ? "Sending..." : "Send Invitation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const InvitationsList = ({ invitations, onAccept, onReject }) => {
  if (!invitations?.length) return null;

  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="medium">
        New Invitations
      </Typography>
      <List dense sx={{ p: 0 }}>
        {invitations.map((invitation) => (
          <ListItem 
            key={invitation._id} 
            disablePadding
            sx={{ 
              mb: 1, 
              p: 1, 
              bgcolor: 'grey.50', 
              borderRadius: 2,
              border: 1,
              borderColor: 'grey.200'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
              <Avatar src={invitation.sender.avatar} sx={{ width: 40, height: 40 }}>
                {invitation.sender.name?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight="medium" noWrap>
                  {invitation.sender.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {invitation.message}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => onAccept(invitation._id)}
                  sx={{ minWidth: 60, fontSize: '0.75rem', py: 0.5 }}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => onReject(invitation._id)}
                  sx={{ minWidth: 60, fontSize: '0.75rem', py: 0.5 }}
                >
                  Reject
                </Button>
              </Stack>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export const InvitationButton = ({ count = 0, onClick }) => (
  <IconButton onClick={onClick} size="small" color="primary">
    <Badge badgeContent={count} color="error" max={99}>
      <LuMail />
    </Badge>
  </IconButton>
);
