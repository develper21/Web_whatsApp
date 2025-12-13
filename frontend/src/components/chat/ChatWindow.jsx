import { useRef, useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import { IoSend } from "react-icons/io5";
import { LuPaperclip, LuPhone, LuVideo, LuArrowLeft } from "react-icons/lu";
import dayjs from "../../lib/dayjs";

const AttachmentList = ({ attachments = [], isOwn }) => {
  if (!attachments.length) return null;
  return (
    <Stack spacing={1} mt={1}>
      {attachments.map((file) => {
        const isImage = file.type?.startsWith("image/");
        return isImage ? (
          <Box
            key={file.url}
            component="img"
            src={file.url}
            alt={file.originalName}
            sx={{
              borderRadius: 2,
              maxHeight: 260,
              objectFit: 'cover',
              border: 1,
              borderColor: isOwn ? 'rgba(255,255,255,0.3)' : 'grey.200',
            }}
          />
        ) : (
          <Box
            key={file.url}
            component="a"
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: isOwn ? 'white' : 'primary.main',
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {file.originalName || file.url}
          </Box>
        );
      })}
    </Stack>
  );
};

const MessageBubble = ({ message, isOwn }) => (
  <Box
    sx={{
      alignSelf: isOwn ? 'flex-end' : 'flex-start',
      bgcolor: isOwn ? 'primary.main' : 'grey.100',
      color: isOwn ? 'white' : 'grey.800',
      px: 2,
      py: 1.5,
      borderRadius: 4,
      maxWidth: '80%',
      boxShadow: 1,
    }}
  >
    {message.content && <Typography>{message.content}</Typography>}
    <AttachmentList attachments={message.attachments} isOwn={isOwn} />
    <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1}>
      <Typography variant="caption" sx={{ color: isOwn ? 'rgba(255,255,255,0.7)' : 'grey.500' }}>
        {dayjs(message.createdAt).format("HH:mm")}
      </Typography>
      {message.status === "pending" && (
        <Chip label="Sending…" color="warning" size="small" variant="outlined" />
      )}
      {message.status === "delivered" && (
        <Chip label="Sent" color="success" size="small" variant="outlined" />
      )}
    </Stack>
  </Box>
);

const MessageComposer = ({ onSend, onTyping, disabled }) => {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState([]);
  const typingRef = useRef();
  const fileInputRef = useRef(null);

  const emitTyping = (state) => {
    if (onTyping) {
      onTyping(state);
    }
  };

  const handleChange = (e) => {
    const next = e.target.value;
    setValue(next);
    emitTyping(true);
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => emitTyping(false), 900);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = value.trim();
    if (!content && !files.length) return;
    onSend({ content, files });
    setValue("");
    setFiles([]);
    emitTyping(false);
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} direction="row" spacing={1}>
      <IconButton
        aria-label="Attach files"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
      >
        <LuPaperclip />
      </IconButton>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
      />
      <TextField
        placeholder="Type a message"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        fullWidth
        size="small"
        sx={{ bgcolor: 'background.paper', borderRadius: 8 }}
      />
      {files.length > 0 && (
        <Chip
          label={`${files.length} file${files.length > 1 ? "s" : ""}`}
          color="primary"
          size="small"
        />
      )}
      <IconButton type="submit" disabled={disabled} sx={{ borderRadius: 8 }}>
        <IoSend />
      </IconButton>
    </Stack>
  );
};

export const ChatWindow = ({
  room,
  messages = [],
  loading,
  typingUsers = [],
  onSendMessage,
  onTyping,
  currentUser,
  onBack,
}) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const header = useMemo(() => {
    if (!room) return { title: "Select a chat", status: "" };
    if (room.isGroup) {
      return {
        title: room.name,
        status: `${room.members?.length || 0} members`,
      };
    }
    const counterpart = room.members?.find((member) => member._id !== currentUser?._id);
    return {
      title: counterpart?.name || "Conversation",
      status: counterpart?.onlineStatus
        ? "Online"
        : counterpart?.lastSeen
          ? `Last seen ${dayjs(counterpart.lastSeen).fromNow()}`
          : "",
      avatar: counterpart?.avatar,
      online: counterpart?.onlineStatus,
    };
  }, [room, currentUser?._id]);

  if (!room) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" color="text.secondary">
        <Typography variant="h5" fontWeight="semibold">
          Select a chat to get started
        </Typography>
        <Typography>Browse the sidebar to choose a conversation.</Typography>
      </Stack>
    );
  }

  return (
    <Stack flex={1} sx={{ bgcolor: 'background.paper', p: 3 }} spacing={3}>
      <Stack direction="row" justifyContent="space-between" sx={{ borderBottom: 1, borderColor: 'grey.100', pb: 2 }}>
        <Stack direction="row" spacing={2}>
          <Avatar src={header.avatar} alt={header.title} />
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography fontWeight="bold">{header.title}</Typography>
              {header.online && <Chip label="Online" color="success" size="small" />}
            </Stack>
            <Typography color="text.secondary" variant="body2">
              {header.status}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          {onBack && (
            <IconButton
              aria-label="Back"
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              onClick={onBack}
            >
              <LuArrowLeft />
            </IconButton>
          )}
          <IconButton aria-label="Voice Call">
            <LuPhone />
          </IconButton>
          <IconButton aria-label="Video Call">
            <LuVideo />
          </IconButton>
        </Stack>
      </Stack>

      <Stack flex={1} spacing={2} sx={{ overflowY: 'auto', pr: 1 }}>
        {loading ? (
          <Stack flex={1} alignItems="center" justifyContent="center">
            <CircularProgress />
          </Stack>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message._id || message.clientMessageId}
                message={message}
                isOwn={message.sender?._id === currentUser?._id}
              />
            ))}
            <Box ref={scrollRef} />
          </>
        )}
      </Stack>

      {!!typingUsers.length && (
        <Typography color="primary.main" variant="body2">
          {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
        </Typography>
      )}

      <MessageComposer
        onSend={onSendMessage}
        onTyping={onTyping}
        disabled={!room || loading}
      />
    </Stack>
  );
};
