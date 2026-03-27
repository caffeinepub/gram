import { Bell } from "lucide-react";
import type { Notification, UserProfile } from "../backend.d";
import {
  formatTimestamp,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useQueries";

interface Props {
  myProfile: UserProfile;
}

export default function NotificationsPage({ myProfile }: Props) {
  const principal = myProfile.principal.toString();
  const { data: notifications = [], isLoading } = useNotifications(principal);
  const markRead = useMarkNotificationRead();

  const sorted = [...notifications].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  const getNotifText = (n: Notification) => {
    switch (n.notificationType) {
      case "like":
        return `${n.fromUser} liked your post`;
      case "comment":
        return `${n.fromUser} commented on your post`;
      case "follow":
        return `${n.fromUser} started following you`;
      case "message":
        return `${n.fromUser} sent you a message`;
      default:
        return `${n.fromUser} interacted with you`;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 py-4">
        <h2 className="text-xl font-bold">Notifications</h2>
      </div>

      {isLoading ? (
        <div
          data-ocid="notifications.loading_state"
          className="flex flex-col gap-0"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="w-48 h-3 bg-muted animate-pulse rounded" />
                <div className="w-16 h-2.5 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          data-ocid="notifications.empty_state"
          className="flex flex-col items-center justify-center py-16 px-8 gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Bell size={28} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-1">No notifications yet</h3>
            <p className="text-sm text-muted-foreground">
              When someone interacts with you, you'll see it here
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {sorted.map((notif, i) => (
            <button
              type="button"
              key={notif.id.toString()}
              data-ocid={`notifications.item.${i + 1}`}
              onClick={() => !notif.isRead && markRead.mutate(notif.id)}
              className={`flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors relative ${
                !notif.isRead ? "bg-accent/30" : ""
              }`}
            >
              {!notif.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
              )}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {notif.fromUser.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 flex flex-col items-start min-w-0">
                <p className="text-sm text-left">{getNotifText(notif)}</p>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(notif.createdAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
