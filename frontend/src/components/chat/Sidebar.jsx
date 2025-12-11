import { LuLogOut, LuMessageSquarePlus, LuSettings } from "react-icons/lu";
import dayjs from "../../lib/dayjs";
import { useMemo, useState } from "react";

export const Sidebar = ({
  user,
  rooms,
  loading,
  selectedRoomId,
  onSelectRoom,
  onLogout,
  onOpenProfile,
  onNewChat,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return rooms;
    return rooms.filter((room) => {
      const name = room.isGroup
        ? room.name
        : room.members?.find((member) => member._id !== user?._id)?.name || "Chat";
      return name.toLowerCase().includes(query.toLowerCase());
    });
  }, [query, rooms, user?._id]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm text-gray-500">{user?.name[0]}</span>
            </div>
            <div>
              <h3 className="font-semibold">{user?.name}</h3>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onNewChat} className="p-2 text-gray-500 hover:text-gray-700">
              <LuMessageSquarePlus />
            </button>
            <button onClick={onOpenProfile} className="p-2 text-gray-500 hover:text-gray-700">
              <LuSettings />
            </button>
            <button onClick={onLogout} className="p-2 text-gray-500 hover:text-gray-700">
              <LuLogOut />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-b">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search chats..."
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading rooms...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {query ? "No rooms found" : "No rooms yet"}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filtered.map((room) => (
              <div
                key={room._id}
                onClick={() => onSelectRoom(room._id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedRoomId === room._id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm text-gray-500">
                        {room.name[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{room.name}</h4>
                      <p className="text-sm text-gray-500">
                        {room.isGroup ? `${room.members?.length || 0} members` : "Direct message"}
                      </p>
                    </div>
                  </div>
                  {room.isGroup && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Group
                    </span>
                  )}
                </div>
                {room.latestMessage && (
                  <div className="mt-2 text-sm text-gray-500 truncate">
                    {room.latestMessage.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
