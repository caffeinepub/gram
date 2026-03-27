import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { UserProfile, backendInterface } from "../backend.d";

interface Props {
  open: boolean;
  onClose: () => void;
  actor: backendInterface;
  profile: UserProfile;
  onSaved: () => void;
}

export default function EditProfileModal({
  open,
  onClose,
  actor,
  profile,
  onSaved,
}: Props) {
  const [bio, setBio] = useState(profile.bio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const handleAvatarChange = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build updated profile; only replace avatar if a new file was selected
      const updatedProfile: UserProfile = {
        ...profile,
        bio: bio.trim(),
      };
      if (avatarFile) {
        const bytes = new Uint8Array(await avatarFile.arrayBuffer());
        updatedProfile.avatar = ExternalBlob.fromBytes(
          bytes,
        ) as UserProfile["avatar"];
      }
      await actor.saveCallerUserProfile(updatedProfile);
      toast.success("Profile updated!");
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
      onSaved();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setLoading(false);
    }
  };

  const initials = profile.username.slice(0, 2).toUpperCase();
  const currentAvatar = avatarPreview || profile.avatar?.getDirectURL();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[400px]" data-ocid="edit_profile.dialog">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent">
                    <span className="text-xl font-bold text-primary">
                      {initials}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center hover:bg-black/40 transition-colors"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (ev) => {
                    const file = (ev.target as HTMLInputElement).files?.[0];
                    if (file) handleAvatarChange(file);
                  };
                  input.click();
                }}
              >
                <span className="text-white text-xs font-medium">Change</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Tap to change photo</p>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-bio" className="text-sm font-medium">
              Bio
            </label>
            <textarea
              id="edit-bio"
              data-ocid="edit_profile.textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself..."
              rows={3}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background"
            />
          </div>

          <div className="flex gap-3">
            <button
              data-ocid="edit_profile.cancel_button"
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-border rounded-full py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              data-ocid="edit_profile.save_button"
              type="submit"
              disabled={loading}
              className="flex-1 gram-gradient text-white rounded-full py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
