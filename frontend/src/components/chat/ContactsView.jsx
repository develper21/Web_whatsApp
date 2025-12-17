import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { LuMailPlus, LuMessageCircle, LuRefreshCw, LuUsers2 } from "react-icons/lu";
import { useChatStore } from "../../state/chatStore";
import { useAuthStore } from "../../state/authStore";
import { useDebounce } from "../../hooks/useDebounce";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const resolveId = (entity) => {
  if (!entity) return undefined;
  if (typeof entity === "string") return entity;
  if (entity._id) return entity._id;
  return undefined;
};

export const ContactsView = ({ onStartChat, onShowInvitations }) => {
  const {
    contacts,
    loadingContacts,
    fetchContacts,
    sendInvitation,
    rooms,
    createRoom,
    selectRoom,
    sentInvitations,
    invitations,
  } = useChatStore((state) => ({
    contacts: state.contacts,
    loadingContacts: state.loadingContacts,
    fetchContacts: state.fetchContacts,
    sendInvitation: state.sendInvitation,
    rooms: state.rooms,
    createRoom: state.createRoom,
    selectRoom: state.selectRoom,
    sentInvitations: state.sentInvitations,
    invitations: state.invitations,
  }));
  const currentUser = useAuthStore((state) => state.user);

  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    fetchContacts(debouncedQuery).catch((error) =>
      console.error("Contact search failed", error)
    );
  }, [debouncedQuery, fetchContacts]);

  const outboundInvitationsByUser = useMemo(() => {
    return sentInvitations.reduce((map, invitation) => {
      const recipientId = resolveId(invitation.recipient);
      if (recipientId) {
        map.set(recipientId, invitation);
      }
      return map;
    }, new Map());
  }, [sentInvitations]);

  const inboundInvitationsByUser = useMemo(() => {
    return invitations.reduce((map, invitation) => {
      const senderId = resolveId(invitation.sender);
      if (senderId) {
        map.set(senderId, invitation);
      }
      return map;
    }, new Map());
  }, [invitations]);

  const roomByMember = useMemo(() => {
    return rooms.reduce((map, room) => {
      if (room.isGroup) return map;
      room.members?.forEach((member) => {
        const memberId = resolveId(member);
        if (memberId && memberId !== currentUser?._id) {
          map.set(memberId, room);
        }
      });
      return map;
    }, new Map());
  }, [rooms, currentUser?._id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchContacts(query.trim());
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartChat = async (contact) => {
    const existingRoom = roomByMember.get(contact._id);
    if (existingRoom) {
      await selectRoom(existingRoom._id);
      onStartChat?.(existingRoom._id);
      return;
    }

    try {
      const newRoom = await createRoom({ memberIds: [contact._id], isGroup: false });
      await selectRoom(newRoom._id);
      onStartChat?.(newRoom._id);
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  const handleSendInvitation = async (contact) => {
    try {
      await sendInvitation({
        recipientEmail: contact.email,
        message: "Let's connect on AlgoChat",
        type: "direct",
        recipientProfile: contact,
      });
    } catch (error) {
      console.error("Failed to send invitation", error);
    }
  };

  const renderContactCard = (contact) => {
    const isSelf = contact._id === currentUser?._id;
    const outboundInvitation = outboundInvitationsByUser.get(contact._id);
    const inboundInvitation = inboundInvitationsByUser.get(contact._id);
    const existingRoom = roomByMember.get(contact._id);

    const inviteDisabled = isSelf || Boolean(outboundInvitation) || Boolean(existingRoom);

    return (
      <Grid item xs={12} sm={6} md={4} key={contact._id}>
        <Card
          elevation={0}
          onMouseEnter={() => setHoveredId(contact._id)}
          onMouseLeave={() => setHoveredId(null)}
          sx={{
            border: 1,
            borderColor: "divider",
            height: "100%",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            '&:hover': {
              transform: "translateY(-4px)",
              boxShadow: 3,
            },
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: contact.onlineStatus ? "success.main" : "primary.main" }}>
                {getInitials(contact.name)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {contact.name || contact.email}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {contact.email}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={contact.onlineStatus ? "Online" : "Offline"}
                    color={contact.onlineStatus ? "success" : "default"}
                    variant={contact.onlineStatus ? "filled" : "outlined"}
                  />
                  {existingRoom && (
                    <Chip size="small" color="primary" label="Chat available" />
                  )}
                  {outboundInvitation && (
                    <Chip size="small" color="warning" label="Invitation sent" />
                  )}
                  {inboundInvitation && (
                    <Chip size="small" color="info" label="Invited you" />
                  )}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
          <CardActions
            sx={{
              px: 2,
              pb: 2,
              justifyContent: "space-between",
              opacity: hoveredId === contact._id ? 1 : 0,
              pointerEvents: hoveredId === contact._id ? "auto" : "none",
              transition: "opacity 0.2s ease",
            }}
          >
            <Tooltip title={existingRoom ? "Open chat" : "Start chat"}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<LuMessageCircle />}
                  onClick={() => handleStartChat(contact)}
                  disabled={isSelf}
                >
                  {existingRoom ? "Open Chat" : "Start Chat"}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={inviteDisabled ? "Invitation unavailable" : "Send chat invitation"}>
              <span>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<LuMailPlus />}
                  onClick={() => handleSendInvitation(contact)}
                  disabled={inviteDisabled}
                >
                  Invite
                </Button>
              </span>
            </Tooltip>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 2,
          px: { xs: 2, md: 3 },
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Contacts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {contacts.length} teammates found
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<LuUsers2 />}
            onClick={onShowInvitations}
          >
            View invitations
          </Button>
          <Tooltip title="Refresh contacts">
            <span>
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <LuRefreshCw />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        <TextField
          fullWidth
          placeholder="Search teammates by name or email"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          size="small"
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: "auto", px: { xs: 2, md: 3 }, pb: 3 }}>
        {loadingContacts ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : contacts.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 6 }}>
            <Typography variant="subtitle1" gutterBottom>
              No teammates found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ask your teammates to create an account or send them an invitation.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {contacts.map((contact) => renderContactCard(contact))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};
