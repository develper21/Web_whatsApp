import { useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import { FaComments } from "react-icons/fa6";
import { useAuthStore } from "../../state/authStore";

const initialLogin = { email: "", password: "" };
const initialRegister = { name: "", email: "", password: "" };

export const AuthView = () => {
  const [loginValues, setLoginValues] = useState(initialLogin);
  const [registerValues, setRegisterValues] = useState(initialRegister);
  const [activeTab, setActiveTab] = useState(0);
  const { login, register, loading, error } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(loginValues);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register(registerValues);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #ecfeff 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 2,
            }}
          >
            <FaComments size={32} />
          </Avatar>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            AlgoChat
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time messaging for modern teams
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 ? (
              <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={loginValues.email}
                  onChange={(e) => setLoginValues({ ...loginValues, email: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  value={loginValues.password}
                  onChange={(e) => setLoginValues({ ...loginValues, password: e.target.value })}
                  required
                  fullWidth
                />
                {error && <Alert severity="error">{error}</Alert>}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Name"
                  value={registerValues.name}
                  onChange={(e) => setRegisterValues({ ...registerValues, name: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={registerValues.email}
                  onChange={(e) => setRegisterValues({ ...registerValues, email: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  value={registerValues.password}
                  onChange={(e) => setRegisterValues({ ...registerValues, password: e.target.value })}
                  required
                  fullWidth
                />
                {error && <Alert severity="error">{error}</Alert>}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
