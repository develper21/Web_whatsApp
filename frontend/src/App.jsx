import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import { ModernAuthView } from "./components/auth/ModernAuthView";
import { ModernChatView } from "./components/chat/ModernChatView";
import { ModernNotificationContainer } from "./components/notifications/ModernNotificationContainer";
import { useAuthStore } from "./state/authStore";

function App() {
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    // This will trigger a re-render with user set to null
    // which will show the auth view
  };

  const content = useMemo(() => {
    if (!user) {
      return <ModernAuthView />;
    }
    return <ModernChatView onLogout={handleLogout} />;
  }, [user]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {content}
      <ModernNotificationContainer />
    </Box>
  );
}

export default App;