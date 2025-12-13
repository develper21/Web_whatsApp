import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { LuUserPlus, LuMail } from "react-icons/lu";
import { useChatStore } from "../../state/chatStore";
import { useAuthStore } from "../../state/authStore";
import { useDebounce } from "../../hooks/useDebounce";
import { InvitationModal } from "./InvitationModal";

export const NewChatModal = ({ isOpen, onClose, onRoomCreated }) => {
  const { user } = useAuthStore();
  const {
    searchUsers,
    userSearchResults,
    searchingUsers,
    clearUserSearch,
    createRoom,
    roomActionLoading,
    selectRoom,
  } = useChatStore();

  const [query, setQuery] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [invitationOpen, setInvitationOpen] = useState(false);
  const debounced = useDebounce(query, 400);

  useEffect(() => {
    if (!debounced || !isOpen) return;
    searchUsers(debounced).catch(console.error);
  }, [debounced, clearUserSearch, isOpen, searchUsers]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setIsGroup(false);
      setSelected([]);
      setGroupName("");
      clearUserSearch();
    }
  }, [isOpen, clearUserSearch]);

  const candidates = useMemo(
    () => userSearchResults.filter((candidate) => candidate._id !== user?._id),
    [userSearchResults, user?._id]
  );

  const toggleSelect = (userId) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleDirectStart = async (userId) => {
    try {
      const room = await createRoom({ memberIds: [userId], isGroup: false });
      await selectRoom(room._id);
      onRoomCreated?.();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateGroup = async () => {
    if (selected.length < 2) return;
    if (!groupName.trim()) return;
    try {
      const room = await createRoom({
        memberIds: selected,
        name: groupName.trim(),
        isGroup: true,
      });
      await selectRoom(room._id);
      onRoomCreated?.();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleInviteUser = () => {
    setInvitationOpen(true);
  };

  const handleInvitationSent = () => {
    onRoomCreated?.();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <LuUserPlus />
          <Typography variant="h6">Start a conversation</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<LuMail />}
            onClick={handleInviteUser}
            fullWidth
          >
            Invite User by Email
          </Button>
          <Divider />
          <FormControlLabel
            control={
              <Checkbox
                checked={isGroup}
                onChange={(e) => setIsGroup(e.target.checked)}
              />
            }
            label="Create group chat"
          />
          {isGroup && (
            <TextField
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              fullWidth
            />
          )}
          <Divider />
          <TextField
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
          />
          {searchingUsers && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {userSearchResults.length > 0 ? (
            <List sx={{ maxHeight: 240, overflowY: 'auto' }}>
              {userSearchResults.map((u) => (
                <ListItem key={u._id} disablePadding>
                  <ListItemButton onClick={() => toggleSelect(u._id)}>
                    <Checkbox
                      checked={selected.includes(u._id)}
                      onChange={() => toggleSelect(u._id)}
                      sx={{ mr: 1 }}
                    />
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'grey.300' }}>
                        {u.name?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={u.name} />
                    {u.onlineStatus && (
                      <Chip label="Online" color="success" size="small" />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {query ? "No users found" : "Search to find teammates"}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {isGroup ? (
          <Button
            onClick={handleCreateGroup}
            disabled={roomActionLoading || selected.length < 2 || !groupName.trim()}
            variant="contained"
          >
            Create Group
          </Button>
        ) : (
          <Button
            onClick={() => selected[0] && handleDirectStart(selected[0])}
            disabled={roomActionLoading || selected.length === 0}
            variant="contained"
          >
            Start Chat
          </Button>
        )}
      </DialogActions>
      <InvitationModal
        isOpen={invitationOpen}
        onClose={() => setInvitationOpen(false)}
        onInvitationSent={handleInvitationSent}
      />
    </Dialog>
  );
};
