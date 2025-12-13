import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { NewChatModal } from "./NewChatModal";
import { ProfileDrawer } from "./ProfileDrawer";
import { InvitationsList, InvitationButton } from "./InvitationModal";
import { useAuthStore } from "../../state/authStore";
import { useChatStore } from "../../state/chatStore";
import { disconnectSocket, getSocket, initSocket } from "../../lib/socket";
import { uploadAttachments } from "../../lib/apiClient";

export const ChatView = () => {
  const [mobileView, setMobileView] = useState("sidebar");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const {
    rooms,
    fetchRooms,
    loadingRooms,
    selectedRoomId,
    selectRoom,
    messages,
    loadingMessages,
    invitations,
    fetchInvitations,
    respondToInvitation,
  } = useChatStore();

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchInvitations();
      initSocket();
    }
    
    return () => {
      if (!user) {
        disconnectSocket();
      }
    };
  }, [fetchRooms, fetchInvitations, user]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room._id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  const selectedRoomMessages = messages[selectedRoomId] || [];

  const handleNewChat = () => {
    setNewChatOpen(true);
  };

  const handleOpenProfile = () => {
    setProfileOpen(true);
  };

  const handleRoomCreated = () => {
    fetchRooms();
  };

  const handleSelectRoom = (roomId) => {
    selectRoom(roomId);
    setMobileView("chat");
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
  };

  const handleBackToSidebar = () => {
    setMobileView("sidebar");
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await respondToInvitation(invitationId, "accepted");
      // Refresh rooms to get the newly created chat room
      fetchRooms();
    } catch (error) {
      console.error("Failed to accept invitation:", error);
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      await respondToInvitation(invitationId, "rejected");
    } catch (error) {
      console.error("Failed to reject invitation:", error);
    }
  };

  const handleShowInvitations = () => {
    // Scroll to top to show invitations list
    const invitationsList = document.querySelector('[data-invitations-list]');
    if (invitationsList) {
      invitationsList.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
          <Stack sx={{ height: '100%' }}>
            <InvitationsList
              data-invitations-list
              invitations={invitations}
              onAccept={handleAcceptInvitation}
              onReject={handleRejectInvitation}
            />
            <Sidebar
              user={user}
              rooms={rooms}
              loading={loadingRooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={handleSelectRoom}
              onLogout={handleLogout}
              onOpenProfile={handleOpenProfile}
              onNewChat={handleNewChat}
              invitationCount={invitations.length}
              onShowInvitations={handleShowInvitations}
            />
          </Stack>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: { xs: mobileView === "chat" ? 'block' : 'none', md: 'block' },
          }}
        >
          <ChatWindow
            room={selectedRoom}
            messages={selectedRoomMessages}
            loading={loadingMessages}
            currentUser={user}
            onBack={handleBackToSidebar}
            uploadAttachments={uploadAttachments}
          />
        </Box>
      </Box>
      <NewChatModal
        isOpen={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onRoomCreated={handleRoomCreated}
      />
      <ProfileDrawer
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
      />
    </Box>
  );
};
