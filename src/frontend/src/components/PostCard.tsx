import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { useState } from "react";
import type { NavigateTo } from "../App";
import type { Post } from "../backend.d";
import { formatTimestamp, useLikePost } from "../hooks/useQueries";
import StoryAvatar from "./StoryAvatar";

interface Props {
  post: Post;
  myUsername: string;
  onCommentClick: (postId: bigint) => void;
  onNavigate: (to: NavigateTo) => void;
}

export default function PostCard({
  post,
  myUsername: _myUsername,
  onCommentClick,
  onNavigate,
}: Props) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const likePost = useLikePost();

  const handleLike = () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    likePost.mutate({ postId: post.id, liked: wasLiked });
  };

  const imageUrl = post.image.getDirectURL();
  const likesCount = Number(post.likesCount) + (liked ? 1 : 0);
  const commentsCount = Number(post.commentsCount);

  return (
    <article className="bg-card border-b border-border animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => onNavigate({ username: post.author })}
          className="flex items-center gap-3"
        >
          <StoryAvatar username={post.author} size="sm" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-foreground">
              {post.author}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(post.createdAt)}
            </span>
          </div>
        </button>
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Image */}
      <div className="w-full aspect-square bg-muted overflow-hidden">
        <img
          src={imageUrl}
          alt={post.caption}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            data-ocid="post.toggle"
            onClick={handleLike}
            className="transition-transform active:scale-110"
          >
            <Heart
              size={26}
              className={liked ? "text-primary" : "text-foreground"}
              fill={liked ? "currentColor" : "none"}
              strokeWidth={liked ? 0 : 1.8}
            />
          </button>
          <button
            type="button"
            data-ocid="post.secondary_button"
            onClick={() => onCommentClick(post.id)}
          >
            <MessageCircle
              size={26}
              className="text-foreground"
              strokeWidth={1.8}
            />
          </button>
          <button type="button">
            <Send size={24} className="text-foreground" strokeWidth={1.8} />
          </button>
        </div>
        <button type="button" onClick={() => setBookmarked(!bookmarked)}>
          <Bookmark
            size={24}
            className={bookmarked ? "text-primary" : "text-foreground"}
            fill={bookmarked ? "currentColor" : "none"}
            strokeWidth={bookmarked ? 0 : 1.8}
          />
        </button>
      </div>

      {/* Likes + Caption */}
      <div className="px-4 pb-4 flex flex-col gap-1">
        {likesCount > 0 && (
          <p className="text-sm font-semibold text-foreground">
            {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
          </p>
        )}
        {post.caption && (
          <p className="text-sm text-foreground">
            <span className="font-semibold mr-1">{post.author}</span>
            {post.caption}
          </p>
        )}
        {commentsCount > 0 && (
          <button
            type="button"
            data-ocid="post.secondary_button"
            onClick={() => onCommentClick(post.id)}
            className="text-sm text-muted-foreground text-left"
          >
            View all {commentsCount} comment{commentsCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    </article>
  );
}
