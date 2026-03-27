import { Bell, Compass, Home, PlusSquare, User } from "lucide-react";
import type { Tab } from "../App";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onCreatePost: () => void;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  onCreatePost,
}: Props) {
  const tabs: Array<{ id: Tab; icon: typeof Home; label: string }> = [
    { id: "home", icon: Home, label: "Home" },
    { id: "explore", icon: Compass, label: "Explore" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border bottom-nav-safe z-50">
      <div className="flex items-center justify-around py-2">
        {tabs.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}_link`}
              onClick={() => onTabChange(item.id)}
              className="p-2 flex flex-col items-center gap-0.5"
            >
              <Icon
                size={24}
                className={isActive ? "text-primary" : "text-muted-foreground"}
                strokeWidth={isActive ? 2.5 : 1.8}
                fill={isActive && item.id === "home" ? "currentColor" : "none"}
              />
            </button>
          );
        })}

        <button
          type="button"
          data-ocid="nav.create_button"
          onClick={onCreatePost}
          className="p-2 flex flex-col items-center gap-0.5"
        >
          <PlusSquare size={28} className="text-primary" strokeWidth={1.8} />
        </button>

        {tabs.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}_link`}
              onClick={() => onTabChange(item.id)}
              className="p-2 flex flex-col items-center gap-0.5"
            >
              <Icon
                size={24}
                className={isActive ? "text-primary" : "text-muted-foreground"}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
