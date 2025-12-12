import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { LuMenu } from "react-icons/lu";
import { useAuthStore } from "../../state/authStore";
import { useChatStore } from "../../state/chatStore";
import { disconnectSocket, getSocket, initSocket } from "../../lib/socket";
import { uploadAttachments } from "../../lib/apiClient";

export const ChatView = () => {
  const [mobileView, setMobileView] = useState("sidebar");
  const { user, logout } = useAuthStore();
  const {
    rooms,
    fetchRooms,
    loadingRooms,
    selectedRoomId,
    selectRoom,
    messages,
  } = useChatStore((state) => state);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room._id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            display: { xs: mobileView === "sidebar" ? 'block' : 'none', md: 'block' },
            width: 320,
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="semibold">AlgoChat</Typography>
            <Typography variant="body2" color="text.secondary">Real-time messaging</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography color="text.secondary" textAlign="center">Sidebar content</Typography>
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: { xs: mobileView === "chat" ? 'block' : 'none', md: 'block' },
          }}
        >
          {selectedRoom ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Paper sx={{ p: 2, borderBottom: 1, borderColor: 'divider', borderRadius: 0 }}>
                <Typography variant="h6" fontWeight="semibold">{selectedRoom.name}</Typography>
                <Typography variant="body2" color="text.secondary">Chat room</Typography>
              </Paper>
              <Box sx={{ flex: 1, p: 2, overflowY: 'auto', bgcolor: 'grey.50' }}>
                <Typography color="text.secondary" textAlign="center">Messages will appear here</Typography>
              </Box>
              <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider', borderRadius: 0 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    placeholder="Type a message..."
                    size="small"
                    fullWidth
                  />
                  <Button variant="contained">Send</Button>
                </Box>
              </Paper>
            </Box>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="semibold" color="text.primary" mb={1}>
                  Welcome to AlgoChat
                </Typography>
                <Typography color="text.secondary">Select a room to start chatting</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
