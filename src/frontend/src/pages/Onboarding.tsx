import type { Identity } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile, backendInterface } from "../backend.d";

interface Props {
  actor: backendInterface;
  identity: Identity;
  onComplete: () => void;
}

export default function Onboarding({ actor, identity, onComplete }: Props) {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError(
        "Username must be 3-20 chars, lowercase letters, numbers, underscores only",
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const exists = await actor.checkUserExists(username);
      if (exists) {
        setError("Username already taken. Please choose another.");
        setLoading(false);
        return;
      }
      const profile: UserProfile = {
        username,
        bio: bio.trim(),
        postCount: 0n,
        followerCount: 0n,
        followingCount: 0n,
        principal: identity.getPrincipal() as unknown as Principal,
      };
      await actor.saveCallerUserProfile(profile);
      toast.success("Welcome to Gram!");
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px] bg-card rounded-2xl shadow-modal p-8"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <span className="text-4xl font-bold gram-gradient-text">Gram</span>
          <h2 className="text-xl font-semibold text-foreground">
            Create your profile
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Choose a username to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-sm font-medium text-foreground"
            >
              Username
            </label>
            <input
              id="username"
              data-ocid="onboarding.input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="e.g. yourname"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="bio"
              className="text-sm font-medium text-foreground"
            >
              Bio{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <textarea
              id="bio"
              data-ocid="onboarding.textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people a little about yourself..."
              rows={3}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
            />
          </div>
          {error && (
            <p
              data-ocid="onboarding.error_state"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <button
            data-ocid="onboarding.submit_button"
            type="submit"
            disabled={loading}
            className="w-full gram-gradient text-white font-semibold py-3 rounded-full hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Creating..." : "Join Gram"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
