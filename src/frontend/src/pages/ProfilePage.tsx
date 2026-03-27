import { Grid3X3, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import type { NavigateTo } from "../App";
import type { UserProfile } from "../backend.d";
import EditProfileModal from "../components/EditProfileModal";
import { useActor } from "../hooks/useActor";
import { usePostsByUser } from "../hooks/useQueries";

interface Props {
  myProfile: UserProfile;
  onLogout: () => void;
  onNavigate: (to: NavigateTo) => void;
  onProfileUpdated: () => void;
}

export default function ProfilePage({
  myProfile,
  onLogout,
  onNavigate: _onNavigate,
  onProfileUpdated,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const { data: posts = [], isLoading } = usePostsByUser(myProfile.username);
  const { actor } = useActor();

  const avatarUrl = myProfile.avatar?.getDirectURL();
  const initials = myProfile.username.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col">
      {/* Profile Header */}
      <div className="px-4 pt-6 pb-4 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={myProfile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent">
                <span className="text-2xl font-bold text-primary">
                  {initials}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="profile.edit_button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 border border-border rounded-full px-4 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Settings size={14} />
              Edit
            </button>
            <button
              type="button"
              data-ocid="profile.delete_button"
              onClick={onLogout}
              className="flex items-center gap-1.5 border border-border rounded-full px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
              title="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">{myProfile.username}</h2>
          {myProfile.bio && (
            <p className="text-sm text-foreground">{myProfile.bio}</p>
          )}
        </div>

        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <span className="font-bold text-base">
              {Number(myProfile.postCount)}
            </span>
            <span className="text-xs text-muted-foreground">posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-base">
              {Number(myProfile.followerCount)}
            </span>
            <span className="text-xs text-muted-foreground">followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-base">
              {Number(myProfile.followingCount)}
            </span>
            <span className="text-xs text-muted-foreground">following</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border flex items-center justify-center py-2">
        <Grid3X3 size={20} className="text-foreground" />
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div
          data-ocid="profile.loading_state"
          className="grid grid-cols-3 gap-0.5"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div
          data-ocid="profile.empty_state"
          className="flex flex-col items-center justify-center py-16 px-8 gap-3"
        >
          <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center">
            <Grid3X3 size={24} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-1">No posts yet</h3>
            <p className="text-sm text-muted-foreground">
              Share your first photo
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post, i) => (
            <div
              key={post.id.toString()}
              data-ocid={`profile.item.${i + 1}`}
              className="aspect-square overflow-hidden"
            >
              <img
                src={post.image.getDirectURL()}
                alt={post.caption}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {actor && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          actor={actor}
          profile={myProfile}
          onSaved={onProfileUpdated}
        />
      )}

      {/* Footer */}
      <footer className="text-center px-4 py-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
