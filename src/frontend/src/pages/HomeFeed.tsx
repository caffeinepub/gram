import { useState } from "react";
import type { NavigateTo } from "../App";
import type { UserProfile } from "../backend.d";
import CommentSheet from "../components/CommentSheet";
import PostCard from "../components/PostCard";
import StoryAvatar from "../components/StoryAvatar";
import StoryViewer from "../components/StoryViewer";
import { useAllPosts, useAllStories } from "../hooks/useQueries";

interface Props {
  myProfile: UserProfile;
  onNavigate: (to: NavigateTo) => void;
}

export default function HomeFeed({ myProfile, onNavigate }: Props) {
  const { data: posts = [], isLoading: postsLoading } = useAllPosts();
  const { data: stories = [], isLoading: storiesLoading } = useAllStories();
  const [commentPostId, setCommentPostId] = useState<bigint | null>(null);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);

  const sortedPosts = [...posts].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  const storyGroups: Array<{ username: string; index: number }> = [];
  const seenAuthors = new Set<string>();
  stories.forEach((s, i) => {
    if (!seenAuthors.has(s.author)) {
      seenAuthors.add(s.author);
      storyGroups.push({ username: s.author, index: i });
    }
  });

  return (
    <div className="flex flex-col">
      {/* Stories Row */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div
          className="flex gap-4 overflow-x-auto scrollbar-none pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          <StoryAvatar
            username={myProfile.username}
            imageUrl={myProfile.avatar?.getDirectURL()}
            isOwn
            onClick={() => {}}
          />
          {storiesLoading ? (
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                  <div className="w-12 h-2.5 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            storyGroups.map(({ username, index }) => (
              <StoryAvatar
                key={username}
                username={username}
                hasStory
                onClick={() => setStoryViewerIndex(index)}
              />
            ))
          )}
        </div>
      </div>

      {/* Feed */}
      {postsLoading ? (
        <div data-ocid="feed.loading_state" className="flex flex-col gap-0">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border-b border-border">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="w-24 h-3 bg-muted animate-pulse rounded" />
                  <div className="w-16 h-2 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-4 flex flex-col gap-2">
                <div className="w-32 h-3 bg-muted animate-pulse rounded" />
                <div className="w-48 h-3 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        <div
          data-ocid="feed.empty_state"
          className="flex flex-col items-center justify-center py-16 px-8 gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">📸</span>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-1">
              Your feed is empty
            </h3>
            <p className="text-sm text-muted-foreground">
              Follow people to see their posts here
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {sortedPosts.map((post, i) => (
            <div key={post.id.toString()} data-ocid={`feed.item.${i + 1}`}>
              <PostCard
                post={post}
                myUsername={myProfile.username}
                onCommentClick={(id) => setCommentPostId(id)}
                onNavigate={onNavigate}
              />
            </div>
          ))}
        </div>
      )}

      <CommentSheet
        postId={commentPostId}
        onClose={() => setCommentPostId(null)}
      />

      {storyViewerIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={storyViewerIndex}
          onClose={() => setStoryViewerIndex(null)}
        />
      )}
    </div>
  );
}
