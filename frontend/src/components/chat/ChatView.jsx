import { useEffect, useMemo, useState } from "react";
import { LuMenu } from "react-icons/lu";
import { useAuthStore } from "../../state/authStore";
import { useChatStore } from "../../state/chatStore";
import { disconnectSocket, getSocket, initSocket } from "../../lib/socket";
import { uploadAttachments } from "../../lib/apiClient";

export const ChatView = () => {
  const [mobileView, setMobileView] = useState("sidebar");
  const { user, logout } = useAuthStore();
  const {
    rooms,
    fetchRooms,
    loadingRooms,
    selectedRoomId,
    selectRoom,
    messages,
  } = useChatStore((state) => state);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room._id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`${mobileView === "sidebar" ? "block" : "hidden"} md:block w-80 bg-white border-r`}
        >
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">AlgoChat</h2>
            <p className="text-sm text-gray-500">Real-time messaging</p>
          </div>
          <div className="p-4">
            <p className="text-gray-500 text-center">Sidebar content</p>
          </div>
        </div>
        <div
          className={`flex-1 ${mobileView === "chat" ? "block" : "hidden"} md:block`}
        >
          {selectedRoom ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-white">
                <h3 className="font-semibold">{selectedRoom.name}</h3>
                <p className="text-sm text-gray-500">Chat room</p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                <p className="text-gray-500 text-center">Messages will appear here</p>
              </div>
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Welcome to AlgoChat</h3>
                <p className="text-gray-500">Select a room to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
