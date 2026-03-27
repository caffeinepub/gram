import { Bell, Camera, MessageCircle } from "lucide-react";
import type { Tab } from "../App";

interface Props {
  activeTab: Tab;
  onCreatePost: () => void;
  onNavigate: (tab: Tab) => void;
}

export default function Header({ activeTab, onCreatePost, onNavigate }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border flex items-center justify-between px-4 py-3">
      <span className="text-2xl font-bold gram-gradient-text select-none">
        Gram
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          data-ocid="header.create_button"
          onClick={onCreatePost}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          title="Create post"
        >
          <Camera size={24} className="text-foreground" />
        </button>
        <button
          type="button"
          data-ocid="header.messages_link"
          onClick={() => onNavigate("messages")}
          className={`p-2 rounded-full hover:bg-muted transition-colors ${
            activeTab === "messages" ? "text-primary" : "text-foreground"
          }`}
          title="Messages"
        >
          <MessageCircle size={24} />
        </button>
        <button
          type="button"
          data-ocid="header.notifications_link"
          onClick={() => onNavigate("notifications")}
          className={`p-2 rounded-full hover:bg-muted transition-colors ${
            activeTab === "notifications" ? "text-primary" : "text-foreground"
          }`}
          title="Notifications"
        >
          <Bell size={24} />
        </button>
      </div>
    </header>
  );
}
