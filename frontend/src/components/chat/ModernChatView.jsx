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
import { ContactsView } from './ContactsView';
import { disconnectSocket, getSocket, initSocket, joinRoom, leaveRoom, sendMessage, emitTyping } from '../../lib/socket';
import { uploadAttachments, uploadEncryptedAttachments } from '../../lib/apiClient';
import { encryptMessageForRecipients, encryptFileBuffer, arrayBufferToBase64 } from '../../lib/cryptoUtils';
import { useNotificationStore } from '../../state/notificationStore';

export const ModernChatView = ({ onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [activeSection, setActiveSection] = useState("chat");
  const { user, logout, ensureEncryptionKeys } = useAuthStore();
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

  const handleNavigate = (section) => {
    setActiveSection(section);
    if (section !== "contacts") {
      setShowInvitations(false);
    }
  };

  const handleNewChat = () => {
    setNewChatOpen(true);
  };

  const handleRoomCreated = () => {
    useChatStore.getState().fetchRooms();
  };

  const handleSelectRoom = (roomId) => {
    selectRoom(roomId);
    setActiveSection("chat");
    setMobileOpen(false);
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
    const room = rooms.find((r) => r._id === selectedRoomId);

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
      let encryptionPayload = null;
      let messageAesKey = null;

      if (room && content?.trim()) {
        try {
          await ensureEncryptionKeys();
          const authState = useAuthStore.getState();
          const normalizedMembers = room.members || [];

          const recipients = normalizedMembers.map((member) => ({
            userId: member._id,
            publicKey: member.encryptionPublicKey,
          }));

          const missingKeys = recipients.filter((recipient) => !recipient.publicKey);

          if (!authState.encryptionPublicKey || missingKeys.length) {
            useNotificationStore.getState().showError("Encryption unavailable", {
              description: "One or more participants are missing encryption keys. Message not sent.",
            });
            return;
          }

          encryptionPayload = await encryptMessageForRecipients({
            plaintext: content,
            recipients,
          });

          messageAesKey = encryptionPayload.aesKey;
        } catch (encryptionError) {
          console.error("Failed to encrypt direct message", encryptionError);
          useNotificationStore.getState().showError("Encryption failed", {
            description: "We couldn't secure this message. Please try again.",
          });
          return;
        }
      }

      if (files?.length) {
        if (messageAesKey) {
          const encryptedFiles = await Promise.all(
            files.map(async (file) => {
              const fileBuffer = await file.arrayBuffer();
              const { encryptedBuffer, iv } = await encryptFileBuffer({
                fileBuffer,
                aesKey: messageAesKey,
              });
              const encryptedBlob = new Blob([encryptedBuffer], { type: file.type });
              const encryptedFile = new File([encryptedBlob], file.name, { type: file.type });
              return encryptedFile;
            })
          );

          const attachmentIv = window.crypto.getRandomValues(new Uint8Array(12));
          uploadedFiles = await uploadEncryptedAttachments({
            files: encryptedFiles,
            aesKey: messageAesKey,
            iv: arrayBufferToBase64(attachmentIv.buffer),
          });
        } else {
          uploadedFiles = await uploadAttachments(files);
        }
      }

      let outgoingContent = content;
      if (encryptionPayload) {
        outgoingContent = encryptionPayload.ciphertext;
      }

      sendMessage({
        roomId: selectedRoomId,
        content: outgoingContent,
        attachments: uploadedFiles,
        clientMessageId,
        encryption: encryptionPayload
          ? {
              algorithm: encryptionPayload.algorithm,
              iv: encryptionPayload.iv,
              recipients: encryptionPayload.recipients,
            }
          : undefined,
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
  const contactListDisplay = activeSection === "contacts"
    ? 'none'
    : { xs: selectedRoomId ? 'none' : 'block', md: 'block' };

  const renderMainContent = () => {
    if (showInvitations) {
      return <InvitationsView onBack={handleHideInvitations} />;
    }

    if (activeSection === "contacts") {
      return (
        <ContactsView
          onStartChat={handleSelectRoom}
          onShowInvitations={handleShowInvitations}
        />
      );
    }

    if (selectedRoom) {
      return (
        <ModernChatWindow
          room={selectedRoom}
          messages={selectedRoomMessages}
          currentUser={user}
          typingUsers={typingUsers}
          onLeaveRoom={handleLeaveRoom}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
        />
      );
    }

    return (
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
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar onDrawerToggle={handleDrawerToggle} />
      
      {/* Sidebar */}
      <Sidebar 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle}
        onNewChat={handleNewChat}
        onNavigate={handleNavigate}
        activeSection={activeSection}
        pendingInvitationCount={pendingInvitationsCount}
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
              display: contactListDisplay
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
              display: activeSection === "contacts"
                ? 'block'
                : { xs: selectedRoomId ? 'block' : 'none', md: 'block' }
            }}
          >
            {renderMainContent()}
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