import { Search } from "lucide-react";
import { useState } from "react";
import type { NavigateTo } from "../App";
import type { Post } from "../backend.d";
import CommentSheet from "../components/CommentSheet";
import PostCard from "../components/PostCard";
import { useAllPosts } from "../hooks/useQueries";

interface Props {
  onNavigate: (to: NavigateTo) => void;
  myUsername: string;
}

export default function ExplorePage({ onNavigate, myUsername }: Props) {
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentPostId, setCommentPostId] = useState<bigint | null>(null);
  const { data: posts = [], isLoading } = useAllPosts();

  const uniqueAuthors = Array.from(
    new Map(posts.map((p) => [p.author, p])).values(),
  ).filter((p) =>
    search ? p.author.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const filteredPosts = search
    ? posts.filter(
        (p) =>
          p.author.toLowerCase().includes(search.toLowerCase()) ||
          p.caption.toLowerCase().includes(search.toLowerCase()),
      )
    : posts;

  return (
    <div className="flex flex-col">
      {/* Search */}
      <div className="px-4 py-3 sticky top-0 bg-card border-b border-border z-10">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            data-ocid="explore.search_input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users or posts..."
            className="w-full bg-muted rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* People */}
      {uniqueAuthors.length > 0 && (
        <div className="border-b border-border">
          <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            People
          </h3>
          <div className="flex flex-col">
            {uniqueAuthors.slice(0, 6).map((post, i) => (
              <button
                type="button"
                key={post.author}
                data-ocid={`explore.item.${i + 1}`}
                onClick={() => onNavigate({ username: post.author })}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center flex-shrink-0">
                  <span className="font-semibold text-primary text-sm">
                    {post.author.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold">{post.author}</span>
                  <span className="text-xs text-muted-foreground">
                    Tap to view profile
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts grid */}
      <div>
        <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Posts
        </h3>
        {isLoading ? (
          <div
            data-ocid="explore.loading_state"
            className="grid grid-cols-3 gap-0.5 px-0.5"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div
            data-ocid="explore.empty_state"
            className="flex items-center justify-center py-12 text-muted-foreground text-sm"
          >
            No posts found
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {filteredPosts.map((post, i) => (
              <button
                type="button"
                key={post.id.toString()}
                data-ocid={`explore.item.${i + 1}`}
                onClick={() => setSelectedPost(post)}
                className="aspect-square overflow-hidden"
              >
                <img
                  src={post.image.getDirectURL()}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Post detail modal */}
      {selectedPost && (
        <dialog
          open
          className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center m-0 p-0 max-w-none max-h-none w-full h-full border-0"
          onClick={() => setSelectedPost(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelectedPost(null)}
        >
          <div
            className="w-full max-w-[430px] bg-card rounded-t-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <PostCard
              post={selectedPost}
              myUsername={myUsername}
              onCommentClick={(id) => setCommentPostId(id)}
              onNavigate={(to) => {
                setSelectedPost(null);
                onNavigate(to);
              }}
            />
          </div>
        </dialog>
      )}

      <CommentSheet
        postId={commentPostId}
        onClose={() => setCommentPostId(null)}
      />
    </div>
  );
}
