import { DEFAULT_THEME } from "../constants";
import { Send } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-3xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="text-sm text-base-content/70">
            The interface is locked to our best performing theme, <span className="font-semibold">{DEFAULT_THEME}</span>.
          </p>
        </div>

        <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
          <div className="p-6 bg-base-200">
            <div className="max-w-lg mx-auto space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                  J
                </div>
                <div>
                  <h3 className="font-medium text-sm">John Doe</h3>
                  <p className="text-xs text-base-content/70">Online</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-xl p-3 bg-base-200">
                    <p className="text-sm">Hey! How's it going?</p>
                    <p className="text-[10px] mt-1.5 text-base-content/70">12:00 PM</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-xl p-3 bg-primary text-primary-content">
                    <p className="text-sm">I'm doing great! Just working on some new features.</p>
                    <p className="text-[10px] mt-1.5 text-primary-content/70">12:02 PM</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered flex-1 text-sm h-10"
                  placeholder="Type a message..."
                  value="This is a preview"
                  readOnly
                />
                <button className="btn btn-primary h-10 min-h-0">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
