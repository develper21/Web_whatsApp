import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import { LuLogOut, LuSettings, LuMail, LuUserPlus } from "react-icons/lu";
import dayjs from "../../lib/dayjs";
import { useMemo, useState, useEffect } from "react";
import { useChatStore } from "../../state/chatStore";
import { notificationService } from "../../lib/notificationService";

export const Sidebar = ({
  user,
  rooms,
  loading,
  selectedRoomId,
  onSelectRoom,
  onLogout,
  onOpenProfile,
  onNewChat,
  invitationCount = 0,
  onShowInvitations,
}) => {
  const [hoveredUserId, setHoveredUserId] = useState(null);
  const { searchUsers, userSearchResults, searchingUsers, createRoom } = useChatStore();

  // Fetch all users on component mount
  useEffect(() => {
    searchUsers("");
  }, []);

  const handleInviteUser = async (targetUser) => {
    try {
      await createRoom({
        name: `${user.name} & ${targetUser.name}`,
        isDirect: true,
        members: [targetUser._id]
      });
      
      notificationService.success(
        "Chat invitation sent!",
        { description: `You've invited ${targetUser.name} to chat.` }
      );
    } catch (error) {
      notificationService.error(
        "Failed to send invitation",
        { description: error.response?.data?.message || "Please try again." }
      );
    }
  };

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
            <Badge badgeContent={invitationCount} color="error">
              <IconButton onClick={onShowInvitations} size="small">
                <LuMail />
              </IconButton>
            </Badge>
            <IconButton onClick={onNewChat} size="small">
              <LuUserPlus />
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

      <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'row' }}>
        {/* Chat Rooms List - Left Side */}
        <Box sx={{ flex: 1, borderRight: 1, borderColor: 'divider' }}>
          {loading ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : rooms.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No chats yet
              </Typography>
            </Box>
          ) : (
            <List>
              {rooms.map((room) => (
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

        {/* Users List - Right Side */}
        <Box sx={{ width: 250, bgcolor: 'background.default' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight="medium">
              All Users
            </Typography>
          </Box>
          {searchingUsers ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <List dense>
              {userSearchResults
                .filter(searchUser => searchUser._id !== user?._id)
                .map((searchUser) => (
                  <ListItem 
                    key={searchUser._id} 
                    disablePadding
                    onMouseEnter={() => setHoveredUserId(searchUser._id)}
                    onMouseLeave={() => setHoveredUserId(null)}
                  >
                    <ListItemButton>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'grey.300', width: 32, height: 32 }}>
                          {searchUser.name?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                            {searchUser.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Online
                          </Typography>
                        }
                      />
                      {hoveredUserId === searchUser._id && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<LuUserPlus size={14} />}
                          onClick={() => handleInviteUser(searchUser)}
                          sx={{ ml: 1, minWidth: 'auto' }}
                        >
                          Invite
                        </Button>
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          )}
        </Box>
      </Box>
    </Stack>
  );
};
