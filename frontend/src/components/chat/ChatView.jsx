import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { NewChatModal } from "./NewChatModal";
import { ProfileDrawer } from "./ProfileDrawer";
import { MessagesPage } from "./MessagesPage";
import { useAuthStore } from "../../state/authStore";
import { useChatStore } from "../../state/chatStore";
import { disconnectSocket, getSocket, initSocket, joinRoom, leaveRoom, sendMessage, emitTyping } from "../../lib/socket";
import { uploadAttachments } from "../../lib/apiClient";
import { notificationService } from "../../lib/notificationService";

export const ChatView = () => {
  const [mobileView, setMobileView] = useState("sidebar");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
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
      
      // Setup socket listeners
      const socket = getSocket();
      if (socket) {
        socket.on("connect", () => {
          console.log("Connected to socket server");
        });
        
        socket.on("disconnect", () => {
          console.log("Disconnected from socket server");
        });
      }
    }
    
    return () => {
      if (!user) {
        disconnectSocket();
      }
    };
  }, [fetchRooms, fetchInvitations, user]);

  // Join/leave room when selection changes
  useEffect(() => {
    if (selectedRoomId) {
      joinRoom(selectedRoomId);
    }
    
    return () => {
      if (selectedRoomId) {
        leaveRoom(selectedRoomId);
      }
    };
  }, [selectedRoomId]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room._id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  const selectedRoomMessages = messages[selectedRoomId] || [];

  // Get typing users for the current room
  const typingUsers = useMemo(() => {
    const typingStatus = useChatStore.getState().typingStatus;
    if (!selectedRoomId || !typingStatus[selectedRoomId]) return [];
    
    const currentUser = useAuthStore.getState().user;
    const roomTyping = typingStatus[selectedRoomId];
    
    return Object.entries(roomTyping)
      .filter(([userId, isTyping]) => isTyping && userId !== currentUser?._id)
      .map(([userId]) => {
        const room = rooms.find(r => r._id === selectedRoomId);
        const user = room?.members?.find(m => m._id === userId);
        return user?.name || "Someone";
      });
  }, [selectedRoomId, rooms]);

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

  const handleShowMessages = () => {
    setShowMessages(true);
  };

  const handleBackFromMessages = () => {
    setShowMessages(false);
  };

  const handleSendMessage = async ({ content, files }) => {
    if (!selectedRoomId) return;
    
    const clientMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add pending message immediately for better UX
    useChatStore.getState().addPendingMessage(selectedRoomId, {
      _id: null,
      content,
      sender: user,
      roomId: selectedRoomId,
      clientMessageId,
      createdAt: new Date().toISOString(),
      attachments: files.map(file => ({
        originalName: file.name,
        type: file.type,
        size: file.size,
      })),
    });

    try {
      let uploadedFiles = [];
      if (files?.length) {
        uploadedFiles = await uploadAttachments(files);
      }

      sendMessage({
        roomId: selectedRoomId,
        content,
        attachments: uploadedFiles,
        clientMessageId,
      });
    } catch (error) {
      notificationService.error(
        "Failed to send message",
        { description: "Please try again." }
      );
      console.error("Failed to send message:", error);
    }
  };

  const handleTyping = (isTyping) => {
    if (!selectedRoomId) return;
    emitTyping({ roomId: selectedRoomId, isTyping });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showMessages ? (
        <MessagesPage 
          onBack={handleBackFromMessages}
          onSelectRoom={handleSelectRoom}
        />
      ) : (
        <>
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
              <Sidebar
                user={user}
                rooms={rooms}
                loading={loadingRooms}
                selectedRoomId={selectedRoomId}
                onSelectRoom={handleSelectRoom}
                onLogout={handleLogout}
                onOpenProfile={handleOpenProfile}
                onNewChat={handleNewChat}
                invitationCount={invitations.filter(inv => inv.status === 'pending').length}
                onShowInvitations={handleShowMessages}
              />
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
                typingUsers={typingUsers}
                currentUser={user}
                onBack={handleBackToSidebar}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
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
        </>
      )}
    </Box>
  );
};