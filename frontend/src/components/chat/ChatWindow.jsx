import { useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { LuPaperclip } from "react-icons/lu";
import dayjs from "../../lib/dayjs";

const AttachmentList = ({ attachments = [], isOwn }) => {
  if (!attachments.length) return null;
  return (
    <VStack align="stretch" spacing={2} mt={2}>
      {attachments.map((file) => {
        const isImage = file.type?.startsWith("image/");
        return isImage ? (
          <Image
            key={file.url}
            src={file.url}
            alt={file.originalName}
            borderRadius="lg"
            maxH="260px"
            objectFit="cover"
            borderWidth="1px"
            borderColor={isOwn ? "whiteAlpha.300" : "gray.200"}
          />
        ) : (
          <Link
            key={file.url}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            color={isOwn ? "white" : "brand.600"}
            fontWeight="semibold"
          >
            {file.originalName || file.url}
          </Link>
        );
      })}
    </VStack>
  );
};

const MessageBubble = ({ message, isOwn }) => (
  <Box
    alignSelf={isOwn ? "flex-end" : "flex-start"}
    bg={isOwn ? "brand.500" : "gray.100"}
    color={isOwn ? "white" : "gray.800"}
    px={4}
    py={3}
    borderRadius="2xl"
    maxW="80%"
    boxShadow="soft"
  >
    {message.content && <Text>{message.content}</Text>}
    <AttachmentList attachments={message.attachments} isOwn={isOwn} />
    <HStack justify="flex-end" spacing={2} mt={2}>
      <Text fontSize="xs" color={isOwn ? "whiteAlpha.700" : "gray.500"}>
        {dayjs(message.createdAt).format("HH:mm")}
      </Text>
      {message.status === "pending" && (
        <Badge colorScheme="yellow" variant="subtle">
          Sending…
        </Badge>
      )}
      {message.status === "delivered" && (
        <Badge colorScheme="green" variant="subtle">
          Sent
        </Badge>
      )}
    </HStack>
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
    <HStack as="form" onSubmit={handleSubmit} spacing={3}>
      <IconButton
        aria-label="Attach files"
        icon={<LuPaperclip />}
        variant="ghost"
        onClick={() => fileInputRef.current?.click()}
        isDisabled={disabled}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
      />
      <Input
        placeholder="Type a message"
        value={value}
        onChange={handleChange}
        borderRadius="full"
        bg="white"
        disabled={disabled}
      />
      {files.length > 0 && (
        <Badge colorScheme="blue" variant="subtle">
          {files.length} file{files.length > 1 ? "s" : ""}
        </Badge>
      )}
      <Button type="submit" colorScheme="brand" borderRadius="full" disabled={disabled}>
        Send
      </Button>
    </HStack>
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
      <Flex flex="1" align="center" justify="center" direction="column" color="gray.500">
        <Text fontSize="xl" fontWeight="semibold">
          Select a chat to get started
        </Text>
        <Text>Browse the sidebar to choose a conversation.</Text>
      </Flex>
    );
  }

  return (
    <Flex flex="1" direction="column" bg="whiteAlpha.900" p={6} gap={6}>
      <HStack justify="space-between" borderBottomWidth="1px" borderColor="gray.100" pb={4}>
        <HStack spacing={3}>
          <Avatar size="md" name={header.title} src={header.avatar} />
          <Box>
            <HStack spacing={2}>
              <Text fontWeight="bold">{header.title}</Text>
              {header.online && <Badge colorScheme="green">Online</Badge>}
            </HStack>
            <Text color="gray.500" fontSize="sm">
              {header.status}
            </Text>
          </Box>
        </HStack>
        <HStack spacing={2}>
          {onBack && (
            <IconButton
              aria-label="Back"
              icon={<LuArrowLeft />}
              display={{ base: "inline-flex", md: "none" }}
              variant="ghost"
              onClick={onBack}
            />
          )}
          <IconButton aria-label="Voice Call" icon={<LuPhone />} variant="ghost" />
          <IconButton aria-label="Video Call" icon={<LuVideo />} variant="ghost" />
        </HStack>
      </HStack>

      <VStack flex="1" align="stretch" spacing={4} overflowY="auto" pr={2}>
        {loading ? (
          <Flex flex="1" align="center" justify="center">
            <Spinner size="lg" />
          </Flex>
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
      </VStack>

      {!!typingUsers.length && (
        <Text color="brand.500" fontSize="sm">
          {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
        </Text>
      )}

      <MessageComposer
        onSend={onSendMessage}
        onTyping={onTyping}
        disabled={!room || loading}
      />
    </Flex>
  );
};
