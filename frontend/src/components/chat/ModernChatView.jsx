import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  Fab,
  IconButton,
  Toolbar,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../state/authStore';
import { useChatStore } from '../../state/chatStore';
import { AppBar } from '../layout/AppBar';
import { Sidebar } from '../layout/Sidebar';
import { ContactList } from './ContactList';
import { ModernChatWindow } from './ModernChatWindow';
import { NewChatModal } from './NewChatModal';
import { InvitationsView } from './InvitationsView';
import { disconnectSocket, getSocket, initSocket, joinRoom, leaveRoom, sendMessage, emitTyping } from '../../lib/socket';
import { uploadAttachments } from '../../lib/apiClient';

export const ModernChatView = ({ onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const { user, logout } = useAuthStore();
  const {
    rooms,
    selectedRoomId,
    selectRoom,
    messages,
    loadingMessages,
    typingStatus,
    invitations
  } = useChatStore();

  useEffect(() => {
    // Initialize chat store and socket if needed
    if (user) {
      useChatStore.getState().fetchRooms();
      useChatStore.getState().fetchInvitations();
      initSocket();
    }
    
    return () => {
      if (!user) {
        disconnectSocket();
      }
    };
  }, [user]);

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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNewChat = () => {
    setNewChatOpen(true);
  };

  const handleRoomCreated = () => {
    useChatStore.getState().fetchRooms();
  };

  const handleSelectRoom = (roomId) => {
    selectRoom(roomId);
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    if (onLogout) {
      onLogout();
    }
  };

  const handleLeaveRoom = (roomId) => {
    // We'll implement this later
    console.log('Leaving room:', roomId);
  };

  const handleShowInvitations = () => {
    setShowInvitations(true);
  };

  const handleHideInvitations = () => {
    setShowInvitations(false);
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
      console.error("Failed to send message:", error);
    }
  };

  const handleTyping = (isTyping) => {
    if (!selectedRoomId) return;
    emitTyping({ roomId: selectedRoomId, isTyping });
  };

  const selectedRoom = rooms.find((room) => room._id === selectedRoomId);
  const selectedRoomMessages = messages[selectedRoomId] || [];
  
  // Get typing users for the current room
  const typingUsers = selectedRoomId && typingStatus[selectedRoomId] 
    ? Object.entries(typingStatus[selectedRoomId])
        .filter(([userId, isTyping]) => isTyping && userId !== user?._id)
        .map(([userId]) => {
          const room = rooms.find(r => r._id === selectedRoomId);
          const user = room?.members?.find(m => m._id === userId);
          return user?.name || "Someone";
        })
    : [];

  const pendingInvitationsCount = invitations.filter(inv => inv.status === 'pending').length;

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar onDrawerToggle={handleDrawerToggle} />
      
      {/* Sidebar */}
      <Sidebar 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle}
        onNewChat={handleNewChat}
      />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { xs: '100%', md: `calc(100% - 280px)` },
          ml: { md: '280px' }
        }}
      >
        <Toolbar /> {/* Spacer for fixed app bar */}
        
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* Contact List Sidebar */}
          <Box
            sx={{
              width: { xs: '100%', md: 320 },
              borderRight: 1,
              borderColor: 'divider',
              display: { xs: selectedRoomId ? 'none' : 'block', md: 'block' }
            }}
          >
            <ContactList 
              onSelectRoom={handleSelectRoom} 
              onShowInvitations={handleShowInvitations}
              invitationCount={pendingInvitationsCount}
            />
          </Box>
          
          {/* Main View */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: selectedRoomId ? 'block' : 'none', md: 'block' }
            }}
          >
            {showInvitations ? (
              <InvitationsView onBack={handleHideInvitations} />
            ) : selectedRoom ? (
              <ModernChatWindow
                room={selectedRoom}
                messages={selectedRoomMessages}
                currentUser={user}
                typingUsers={typingUsers}
                onLeaveRoom={handleLeaveRoom}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  p: 2,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  Welcome to AlgoChat
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Select a chat or start a new conversation
                </Typography>
                <Fab 
                  color="primary" 
                  onClick={handleNewChat}
                  sx={{ boxShadow: 3 }}
                >
                  <AddIcon />
                </Fab>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* New Chat Modal */}
      <NewChatModal
        isOpen={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onRoomCreated={handleRoomCreated}
      />
    </Box>
  );
};