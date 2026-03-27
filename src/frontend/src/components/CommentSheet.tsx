import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Send, X } from "lucide-react";
import { useState } from "react";
import {
  formatTimestamp,
  useAddComment,
  useCommentsForPost,
} from "../hooks/useQueries";

interface Props {
  postId: bigint | null;
  onClose: () => void;
}

export default function CommentSheet({ postId, onClose }: Props) {
  const [text, setText] = useState("");
  const { data: comments = [], isLoading } = useCommentsForPost(postId);
  const addComment = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !postId) return;
    await addComment.mutateAsync({ postId, text: text.trim() });
    setText("");
  };

  return (
    <Sheet open={postId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[80vh] flex flex-col p-0"
        data-ocid="comments.sheet"
      >
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-base font-semibold">Comments</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-4">
          {isLoading ? (
            <div
              data-ocid="comments.loading_state"
              className="flex items-center justify-center py-8"
            >
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div
              data-ocid="comments.empty_state"
              className="flex items-center justify-center py-8 text-muted-foreground text-sm"
            >
              No comments yet. Be the first!
            </div>
          ) : (
            comments.map((c, i) => (
              <div
                key={c.id.toString()}
                data-ocid={`comments.item.${i + 1}`}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {c.author.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold mr-1">{c.author}</span>
                    {c.text}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(c.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-4 py-3 border-t border-border"
        >
          <input
            data-ocid="comments.input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            data-ocid="comments.submit_button"
            type="submit"
            disabled={!text.trim() || addComment.isPending}
            className="p-2 text-primary disabled:opacity-40"
          >
            <Send size={20} />
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
