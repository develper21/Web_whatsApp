import { useEffect, useMemo, useState } from "react";
import { LuUserPlus, LuUsers } from "react-icons/lu";
import { useChatStore } from "../../state/chatStore";
import { useAuthStore } from "../../state/authStore";
import { useDebounce } from "../../hooks/useDebounce";

export const NewChatModal = ({ isOpen, onClose, onRoomCreated }) => {
  const { user } = useAuthStore();
  const {
    searchUsers,
    userSearchResults,
    searchingUsers,
    clearUserSearch,
    createRoom,
    roomActionLoading,
    selectRoom,
  } = useChatStore();

  const [query, setQuery] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const debounced = useDebounce(query, 400);

  useEffect(() => {
    if (!debounced || !isOpen) return;
    searchUsers(debounced).catch(console.error);
  }, [debounced, clearUserSearch, isOpen, searchUsers]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setIsGroup(false);
      setSelected([]);
      setGroupName("");
      clearUserSearch();
    }
  }, [isOpen, clearUserSearch]);

  const candidates = useMemo(
    () => userSearchResults.filter((candidate) => candidate._id !== user?._id),
    [userSearchResults, user?._id]
  );

  const toggleSelect = (userId) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleDirectStart = async (userId) => {
    try {
      const room = await createRoom({ memberIds: [userId], isGroup: false });
      await selectRoom(room._id);
      onRoomCreated?.();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateGroup = async () => {
    if (selected.length < 2) return;
    if (!groupName.trim()) return;
    try {
      const room = await createRoom({
        memberIds: selected,
        name: groupName.trim(),
        isGroup: true,
      });
      await selectRoom(room._id);
      onRoomCreated?.();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div open={isOpen} onClose={onClose} style={{ display: isOpen ? "block" : "none" }}>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LuUserPlus />
              <span>Start a conversation</span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isGroup}
                  onChange={(e) => setIsGroup(e.target.checked)}
                />
                <span>Create group chat</span>
              </label>
              {isGroup && (
                <input
                  placeholder="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              <hr className="my-4 border-gray-200" />
              <input
                placeholder="Search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchingUsers && <div className="text-sm text-gray-500">Searching...</div>}
              {userSearchResults.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userSearchResults.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSelect(u._id)}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(u._id)}
                        onChange={() => toggleSelect(u._id)}
                      />
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-500">{u.name[0]}</span>
                      </div>
                      <span>{u.name}</span>
                      {u.onlineStatus && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Online</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {query ? "No users found" : "Search to find teammates"}
                </div>
              )}
            </div>
          </div>
          <div className="border-t px-6 py-4 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            {isGroup ? (
              <button onClick={handleCreateGroup} disabled={roomActionLoading} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                Create Group
              </button>
            ) : (
              <button
                onClick={() => selected[0] && handleDirectStart(selected[0])}
                disabled={roomActionLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Start Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
