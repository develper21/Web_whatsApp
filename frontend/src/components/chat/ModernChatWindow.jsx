import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Avatar,
  Typography,
  Divider,
  Chip,
  Tooltip,
  Fab,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { FileAttachment } from './FileAttachment';
import { TypingIndicator } from './TypingIndicator';
import { ChatHeader } from './ChatHeader';

export const ModernChatWindow = ({ 
  room, 
  messages = [], 
  currentUser, 
  onSendMessage,
  onTyping,
  typingUsers = [],
  onLeaveRoom
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || !onSendMessage) return;
    
    try {
      setUploading(true);
      await onSendMessage({ content: message, files: attachments });
      setMessage('');
      setAttachments([]);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Notify parent component about typing
    if (!isTyping && onTyping) {
      onTyping(true);
      setIsTyping(true);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && onTyping) {
        onTyping(false);
        setIsTyping(false);
      }
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const isOwnMessage = (msg) => msg.sender?._id === currentUser?._id;

  const handleDownloadAttachment = (attachment) => {
    // We'll implement this later
    console.log('Downloading attachment:', attachment);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        style={{ display: 'none' }}
      />
      
      {/* Chat Header */}
      <ChatHeader 
        room={room} 
        currentUser={currentUser}
        onLeaveRoom={onLeaveRoom}
      />

      {/* Messages Area */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 2,
          bgcolor: 'grey.50'
        }}
      >
        <List sx={{ py: 0 }}>
          {messages.map((msg) => (
            <ListItem 
              key={msg._id} 
              sx={{ 
                flexDirection: isOwnMessage(msg) ? 'row-reverse' : 'row',
                px: 0,
                py: 1
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  ml: isOwnMessage(msg) ? 0 : 1,
                  mr: isOwnMessage(msg) ? 1 : 0
                }}
              >
                {msg.sender?.name?.charAt(0) || 'U'}
              </Avatar>
              
              <Box 
                sx={{ 
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwnMessage(msg) ? 'flex-end' : 'flex-start'
                }}
              >
                {!isOwnMessage(msg) && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ mb: 0.5 }}
                  >
                    {msg.sender?.name}
                  </Typography>
                )}
                
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: isOwnMessage(msg) 
                      ? 'primary.main' 
                      : 'background.paper',
                    color: isOwnMessage(msg) 
                      ? 'primary.contrastText' 
                      : 'text.primary',
                    borderBottomRightRadius: isOwnMessage(msg) ? 4 : 16,
                    borderBottomLeftRadius: isOwnMessage(msg) ? 16 : 4,
                  }}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                  
                  {msg.attachments?.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {msg.attachments.map((attachment, index) => (
                        <FileAttachment 
                          key={index}
                          attachment={attachment}
                          onDownload={handleDownloadAttachment}
                        />
                      ))}
                    </Box>
                  )}
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 0.5,
                      color: isOwnMessage(msg) 
                        ? 'rgba(255, 255, 255, 0.7)' 
                        : 'text.secondary'
                    }}
                  >
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </Typography>
                </Paper>
              </Box>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
        
        {/* Typing Indicator */}
        <TypingIndicator users={typingUsers} />
      </Box>

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <Box sx={{ p: 2, pt: 1, bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Attachments ({attachments.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {attachments.map((file, index) => (
              <Chip
                key={index}
                label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                onDelete={() => removeAttachment(index)}
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Message Input */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
          <IconButton size="small" onClick={triggerFileSelect}>
            <AttachFileIcon />
          </IconButton>
          
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            sx={{ mx: 1 }}
            disabled={uploading}
          />
          
          {uploading ? (
            <CircularProgress size={24} />
          ) : message || attachments.length > 0 ? (
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={uploading}
            >
              <SendIcon />
            </IconButton>
          ) : (
            <IconButton disabled={uploading}>
              <MicIcon />
            </IconButton>
          )}
        </Box>
      </Paper>
    </Box>
  );
};