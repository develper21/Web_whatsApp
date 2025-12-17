import { useRef, useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import { IoSend } from "react-icons/io5";
import { LuPaperclip, LuPhone, LuVideo, LuArrowLeft, LuUsers, LuMic, LuSquare } from "react-icons/lu";
import dayjs from "../../lib/dayjs";

const resolveAttachmentUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const apiBase = import.meta.env.VITE_ASSET_BASE_URL
    || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/i, "") : "http://localhost:5000");

  if (url.startsWith("/")) {
    return `${apiBase}${url}`;
  }

  return `${apiBase}/${url}`;
};

const AttachmentList = ({ attachments = [], isOwn }) => {
  if (!attachments.length) return null;
  return (
    <Stack spacing={1} mt={1}>
      {attachments.map((file) => {
        const isImage = file.type?.startsWith("image/");
        const isAudio = file.type?.startsWith("audio/");
        const attachmentUrl = file.objectUrl || resolveAttachmentUrl(file.url || file.path);

        if (isImage) {
          return (
            <Box
              key={file.url}
              component="img"
              src={attachmentUrl}
              alt={file.originalName}
              sx={{
                borderRadius: 2,
                maxHeight: 260,
                objectFit: 'cover',
                border: 1,
                borderColor: isOwn ? 'rgba(255,255,255,0.3)' : 'grey.200',
              }}
            />
          );
        }

        if (isAudio) {
          return (
            <Box key={file.url}>
              <audio
                controls
                src={attachmentUrl}
                style={{ width: '100%' }}
              >
                Your browser does not support the audio element.
              </audio>
            </Box>
          );
        }

        return (
          <Box
            key={file.url}
            component="a"
            href={attachmentUrl}
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

  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

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

  const handleFileInputChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const cleanupRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleStartRecording = async () => {
    if (disabled || isRecording) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn("Media recording not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined;
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        if (blob.size > 0) {
          const extension = blob.type.includes("ogg")
            ? "ogg"
            : blob.type.includes("mp3")
              ? "mp3"
              : blob.type.includes("wav")
                ? "wav"
                : "webm";
          const fileName = `voice-${Date.now()}.${extension}`;
          const voiceFile = new File([blob], fileName, { type: blob.type || "audio/webm" });
          onSend({ content: "", files: [voiceFile] });
        }

        cleanupRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1000);
      }, 1000);
    } catch (error) {
      console.error("Failed to start audio recording", error);
      cleanupRecording();
    }
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

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack component="form" onSubmit={handleSubmit} direction="row" spacing={1}>
      <IconButton
        aria-label="Attach files"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isRecording}
      >
        <LuPaperclip />
      </IconButton>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />
      <IconButton
        aria-label={isRecording ? "Stop recording" : "Record voice message"}
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        color={isRecording ? "error" : "default"}
        disabled={disabled && !isRecording}
      >
        {isRecording ? <LuSquare /> : <LuMic />}
      </IconButton>
      <TextField
        placeholder="Type a message"
        value={value}
        onChange={handleChange}
        disabled={disabled || isRecording}
        fullWidth
        size="small"
        sx={{ bgcolor: 'background.paper', borderRadius: 8 }}
      />
      {isRecording && (
        <Chip
          label={`Recording ${formatDuration(recordingDuration)}`}
          color="error"
          variant="outlined"
        />
      )}
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
        members: room.members,
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

  // Function to get other members in a group chat
  const getOtherMembers = () => {
    if (!room || !room.isGroup || !room.members) return [];
    return room.members.filter(member => member._id !== currentUser?._id);
  };

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
            {room.isGroup && (
              <Stack direction="row" spacing={0.5} mt={0.5}>
                {getOtherMembers().slice(0, 3).map((member) => (
                  <Tooltip key={member._id} title={member.name}>
                    <Avatar 
                      src={member.avatar} 
                      sx={{ width: 24, height: 24, fontSize: 12 }}
                    >
                      {member.name?.[0]}
                    </Avatar>
                  </Tooltip>
                ))}
                {getOtherMembers().length > 3 && (
                  <Chip 
                    label={`+${getOtherMembers().length - 3}`} 
                    size="small" 
                    variant="outlined" 
                  />
                )}
              </Stack>
            )}
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
          {room.isGroup && (
            <IconButton aria-label="Group Info">
              <LuUsers />
            </IconButton>
          )}
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