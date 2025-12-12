import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import { LuX } from "react-icons/lu";
import { useAuthStore } from "../../state/authStore";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

export const ProfileDrawer = ({ isOpen, onClose }) => {
  const { user, updateProfile, profileUpdating } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const fileInput = useRef(null);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setAvatar(base64);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({ name, avatar });
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Drawer anchor="right" open={isOpen} onClose={onClose}>
      <Box sx={{ width: 320, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', position: 'relative', textAlign: 'center' }}>
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', left: 8, top: 8 }}
            size="small"
          >
            <LuX />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">Profile</Typography>
        </Box>
        <Box sx={{ p: 3, flex: 1 }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={avatar}
                sx={{ width: 128, height: 128, mx: 'auto', mb: 2, bgcolor: 'grey.300' }}
              >
                {!avatar && name?.[0]}
              </Avatar>
              <Button
                variant="outlined"
                onClick={() => fileInput.current?.click()}
              >
                Upload photo
              </Button>
              <input
                type="file"
                ref={fileInput}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleUpload}
              />
            </Box>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Avatar URL"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              fullWidth
            />
          </Stack>
        </Box>
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={profileUpdating}
              variant="contained"
            >
              Save
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};
