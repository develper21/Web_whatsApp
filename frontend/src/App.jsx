import { Box } from "@chakra-ui/react";
import { useMemo } from "react";
import { AuthView } from "./components/auth/AuthView";
import { ChatView } from "./components/chat/ChatView";
import { useAuthStore } from "./state/authStore";

function App() {
  const user = useAuthStore((state) => state.user);

  const content = useMemo(() => {
    if (!user) {
      return <AuthView />;
    }
    return <ChatView />;
  }, [user]);

  return (
    <Box minH="100vh" className="bg-transparent">
      {content}
    </Box>
  );
}

export default App;
