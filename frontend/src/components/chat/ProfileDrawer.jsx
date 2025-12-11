import { useRef, useState } from "react";
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
    <div open={isOpen} onClose={onClose} style={{ display: isOpen ? "block" : "none" }}>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white h-full w-80 max-w-sm shadow-xl overflow-auto">
          <div className="relative flex items-center justify-center p-4 border-b">
            <button onClick={onClose} className="absolute left-4 text-gray-500 hover:text-gray-700">
              ×
            </button>
            <p className="font-bold">Profile</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-500">Avatar</span>
                </div>
                <button
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  onClick={() => fileInput.current?.click()}
                >
                  Upload photo
                </button>
                <input type="file" ref={fileInput} className="hidden" accept="image/*" onChange={handleUpload} />
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="profile-avatar" className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                  <input
                    id="profile-avatar"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t p-4 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={profileUpdating} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
