interface Props {
  username: string;
  imageUrl?: string;
  hasStory?: boolean;
  isOwn?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export default function StoryAvatar({
  username,
  imageUrl,
  hasStory,
  isOwn,
  onClick,
  size = "md",
}: Props) {
  const sizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 min-w-0"
    >
      <div className={`${sizes[size]} relative flex-shrink-0`}>
        {hasStory ? (
          <div className="story-ring w-full h-full rounded-full">
            <div className="story-ring-inner w-full h-full rounded-full">
              <div className="w-full h-full rounded-full overflow-hidden bg-muted">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent">
                    <span className="font-semibold text-primary text-sm">
                      {initials}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-border bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent">
                <span className="font-semibold text-primary text-sm">
                  {initials}
                </span>
              </div>
            )}
          </div>
        )}
        {isOwn && (
          <div className="absolute bottom-0 right-0 w-5 h-5 gram-gradient rounded-full flex items-center justify-center border-2 border-white">
            <span className="text-white text-xs font-bold leading-none">+</span>
          </div>
        )}
      </div>
      <span className="text-xs text-foreground max-w-[60px] truncate">
        {isOwn ? "Your Story" : username}
      </span>
    </button>
  );
}
