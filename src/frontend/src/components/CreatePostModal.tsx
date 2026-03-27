import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { backendInterface } from "../backend.d";

interface Props {
  open: boolean;
  onClose: () => void;
  actor: backendInterface;
}

export default function CreatePostModal({ open, onClose, actor }: Props) {
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleFile = (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Please select an image");
      return;
    }
    setLoading(true);
    try {
      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      let blob = ExternalBlob.fromBytes(bytes);
      blob = blob.withUploadProgress((p) => setUploadProgress(p));
      await actor.createPost(blob, caption.trim());
      toast.success("Post shared!");
      qc.invalidateQueries({ queryKey: ["allPosts"] });
      setCaption("");
      setImageFile(null);
      setPreview("");
      setUploadProgress(0);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCaption("");
      setImageFile(null);
      setPreview("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-[400px] p-0 overflow-hidden"
        data-ocid="create_post.dialog"
      >
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle className="text-base font-semibold">
            Create Post
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          {/* Image area */}
          <button
            type="button"
            className="w-full aspect-square bg-muted flex items-center justify-center cursor-pointer overflow-hidden relative"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus size={48} strokeWidth={1.2} />
                <span className="text-sm">Tap to add photo</span>
              </div>
            )}
          </button>
          <input
            data-ocid="create_post.upload_button"
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
          />

          {/* Caption */}
          <div className="px-4 py-3 border-b border-border">
            <textarea
              data-ocid="create_post.textarea"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={3}
              className="w-full text-sm focus:outline-none resize-none bg-transparent"
            />
          </div>

          {loading && (
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full gram-gradient transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 px-4 py-4">
            <button
              data-ocid="create_post.cancel_button"
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 border border-border rounded-full py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              data-ocid="create_post.submit_button"
              type="submit"
              disabled={loading || !imageFile}
              className="flex-1 gram-gradient text-white rounded-full py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              {loading ? "Sharing..." : "Share"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
