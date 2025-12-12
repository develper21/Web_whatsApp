import Box from "@mui/material/Box";
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {content}
    </Box>
  );
}

export default App;
