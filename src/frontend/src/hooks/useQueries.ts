import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Comment,
  DirectMessage,
  Notification,
  Post,
  Story,
  UserProfile,
  Username,
} from "../backend.d";
import { useActor } from "./useActor";

export type { Post, Comment, Story, UserProfile, Notification, DirectMessage };

export function useAllPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["allPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllStories() {
  const { actor, isFetching } = useActor();
  return useQuery<Story[]>({
    queryKey: ["allStories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostsByUser(username: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["postsByUser", username],
    queryFn: async () => {
      if (!actor || !username) return [];
      return actor.getPostsByUser(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useUserByUsername(username: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userByUsername", username],
    queryFn: async () => {
      if (!actor || !username) return null;
      try {
        return await actor.getUserByUsername(username);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useCommentsForPost(postId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", postId?.toString()],
    queryFn: async () => {
      if (!actor || postId === null) return [];
      return actor.getCommentsForPost(postId);
    },
    enabled: !!actor && !isFetching && postId !== null,
  });
}

export function useInbox() {
  const { actor, isFetching } = useActor();
  return useQuery<DirectMessage[]>({
    queryKey: ["inbox"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInbox();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useConversation(otherUsername: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<DirectMessage[]>({
    queryKey: ["conversation", otherUsername],
    queryFn: async () => {
      if (!actor || !otherUsername) return [];
      return actor.getConversation(otherUsername);
    },
    enabled: !!actor && !isFetching && !!otherUsername,
    refetchInterval: 3000,
  });
}

export function useNotifications(principal: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["notifications", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getNotificationsForUser(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
    refetchInterval: 10000,
  });
}

export function useIsFollowing(username: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isFollowing", username],
    queryFn: async () => {
      if (!actor || !username) return false;
      return actor.isFollowingUser(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      liked,
    }: { postId: bigint; liked: boolean }) => {
      if (!actor) throw new Error("No actor");
      if (liked) {
        return actor.unlikePost(postId);
      }
      return actor.likePost(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allPosts"] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, text }: { postId: bigint; text: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.addComment(postId, text);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.postId.toString()] });
      qc.invalidateQueries({ queryKey: ["allPosts"] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ to, text }: { to: Username; text: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.sendMessage(to, text);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["conversation", vars.to] });
      qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      following,
    }: { username: string; following: boolean }) => {
      if (!actor) throw new Error("No actor");
      if (following) {
        return actor.unfollowUser(username);
      }
      return actor.followUser(username);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["isFollowing", vars.username] });
      qc.invalidateQueries({ queryKey: ["userByUsername", vars.username] });
    },
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function formatTimestamp(ts: bigint): string {
  const date = new Date(Number(ts) / 1_000_000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}
