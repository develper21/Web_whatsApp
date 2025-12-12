import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import { LuLogOut, LuMessageSquarePlus, LuSettings } from "react-icons/lu";
import dayjs from "../../lib/dayjs";
import { useMemo, useState } from "react";

export const Sidebar = ({
  user,
  rooms,
  loading,
  selectedRoomId,
  onSelectRoom,
  onLogout,
  onOpenProfile,
  onNewChat,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return rooms;
    return rooms.filter((room) => {
      const name = room.isGroup
        ? room.name
        : room.members?.find((member) => member._id !== user?._id)?.name || "Chat";
      return name.toLowerCase().includes(query.toLowerCase());
    });
  }, [query, rooms, user?._id]);

  return (
    <Stack sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'grey.300' }}>
              {user?.name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="semibold">{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">Online</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <IconButton onClick={onNewChat} size="small">
              <LuMessageSquarePlus />
            </IconButton>
            <IconButton onClick={onOpenProfile} size="small">
              <LuSettings />
            </IconButton>
            <IconButton onClick={onLogout} size="small">
              <LuLogOut />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats..."
          size="small"
          fullWidth
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {query ? "No rooms found" : "No rooms yet"}
            </Typography>
          </Box>
        ) : (
          <List>
            {filtered.map((room) => (
              <ListItem key={room._id} disablePadding>
                <ListItemButton
                  onClick={() => onSelectRoom(room._id)}
                  selected={selectedRoomId === room._id}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'grey.300' }}>
                      {room.name?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight="medium">
                          {room.name}
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
    </Stack>
  );
};
