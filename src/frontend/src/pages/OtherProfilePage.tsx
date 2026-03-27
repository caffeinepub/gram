import { ArrowLeft, Grid3X3, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { NavigateTo, Tab } from "../App";
import {
  useFollowUser,
  useIsFollowing,
  usePostsByUser,
  useUserByUsername,
} from "../hooks/useQueries";

interface Props {
  username: string;
  onNavigate: (to: NavigateTo) => void;
  onBack: () => void;
}

export default function OtherProfilePage({
  username,
  onNavigate,
  onBack,
}: Props) {
  const { data: profile, isLoading: profileLoading } =
    useUserByUsername(username);
  const { data: posts = [], isLoading: postsLoading } =
    usePostsByUser(username);
  const { data: isFollowing = false } = useIsFollowing(username);
  const followUser = useFollowUser();

  const handleFollow = () => {
    followUser.mutate(
      { username, following: isFollowing },
      {
        onSuccess: () =>
          toast.success(
            isFollowing ? `Unfollowed ${username}` : `Following ${username}`,
          ),
        onError: () => toast.error("Action failed"),
      },
    );
  };

  const avatarUrl = profile?.avatar?.getDirectURL();
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          type="button"
          data-ocid="other_profile.back_button"
          onClick={onBack}
          className="p-1"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="font-semibold">{username}</span>
      </div>

      {profileLoading ? (
        <div
          data-ocid="other_profile.loading_state"
          className="flex flex-col gap-4 p-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="w-24 h-4 bg-muted animate-pulse rounded" />
              <div className="w-32 h-3 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-5 pb-4 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
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

            <div className="flex flex-col gap-2">
              <button
                type="button"
                data-ocid="other_profile.toggle"
                onClick={handleFollow}
                disabled={followUser.isPending}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  isFollowing
                    ? "border border-border hover:bg-muted"
                    : "gram-gradient text-white"
                } disabled:opacity-60`}
              >
                {followUser.isPending
                  ? "..."
                  : isFollowing
                    ? "Following"
                    : "Follow"}
              </button>
              <button
                type="button"
                data-ocid="other_profile.secondary_button"
                onClick={() => onNavigate({ tab: "messages" as Tab })}
                className="flex items-center gap-1.5 border border-border rounded-full px-4 py-1.5 text-sm font-medium hover:bg-muted"
              >
                <MessageCircle size={14} />
                Message
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold">{username}</h2>
            {profile?.bio && <p className="text-sm">{profile.bio}</p>}
          </div>

          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <span className="font-bold text-base">{posts.length}</span>
              <span className="text-xs text-muted-foreground">posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base">
                {Number(profile?.followerCount ?? 0)}
              </span>
              <span className="text-xs text-muted-foreground">followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base">
                {Number(profile?.followingCount ?? 0)}
              </span>
              <span className="text-xs text-muted-foreground">following</span>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border flex items-center justify-center py-2">
        <Grid3X3 size={20} className="text-foreground" />
      </div>

      {/* Posts grid */}
      {postsLoading ? (
        <div
          data-ocid="other_profile.loading_state"
          className="grid grid-cols-3 gap-0.5"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div
          data-ocid="other_profile.empty_state"
          className="flex flex-col items-center justify-center py-12 gap-3"
        >
          <Grid3X3 size={24} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No posts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post, i) => (
            <div
              key={post.id.toString()}
              data-ocid={`other_profile.item.${i + 1}`}
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
    </div>
  );
}
