import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface DirectMessage {
    id: MessageId;
    to: Username;
    from: Username;
    createdAt: bigint;
    text: string;
    isRead: boolean;
}
export type CommentId = bigint;
export interface Comment {
    id: CommentId;
    createdAt: bigint;
    text: string;
    author: Username;
    postId: PostId;
}
export interface Story {
    id: StoryId;
    createdAt: bigint;
    author: Username;
    image: ExternalBlob;
}
export type StoryId = bigint;
export type PostId = bigint;
export type MessageId = bigint;
export type NotificationId = bigint;
export interface Notification {
    id: NotificationId;
    notificationType: string;
    createdAt: bigint;
    referenceId: bigint;
    isRead: boolean;
    toUser: Username;
    fromUser: Username;
}
export interface Post {
    id: PostId;
    createdAt: bigint;
    author: Username;
    caption: string;
    commentsCount: bigint;
    image: ExternalBlob;
    likesCount: bigint;
}
export type Username = string;
export interface UserProfile {
    bio: string;
    postCount: bigint;
    principal: Principal;
    username: Username;
    followerCount: bigint;
    followingCount: bigint;
    avatar?: ExternalBlob;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(postId: PostId, text: string): Promise<CommentId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkUserExists(username: Username): Promise<boolean>;
    createPost(image: ExternalBlob, caption: string): Promise<PostId>;
    createStory(image: ExternalBlob): Promise<StoryId>;
    deletePost(postId: PostId): Promise<void>;
    followUser(targetUsername: Username): Promise<void>;
    getAllPosts(): Promise<Array<Post>>;
    getAllStories(): Promise<Array<Story>>;
    getAllUserPosts(user: Principal): Promise<Array<Post>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentsForPost(postId: PostId): Promise<Array<Comment>>;
    getConversation(otherUsername: Username): Promise<Array<DirectMessage>>;
    getFeedForUser(user: Principal): Promise<Array<Post>>;
    getFollowing(): Promise<Array<Username>>;
    getInbox(): Promise<Array<DirectMessage>>;
    getMyFollowers(): Promise<Array<Principal>>;
    getNotificationsForUser(user: Principal): Promise<Array<Notification>>;
    getPostById(postId: PostId): Promise<Post>;
    getPostsByUser(username: Username): Promise<Array<Post>>;
    getStoriesByUser(username: Username): Promise<Array<Story>>;
    getStoriesForUser(user: Principal): Promise<Array<Story>>;
    getUserByUsername(username: Username): Promise<UserProfile>;
    getUserFeed(userFrom: Principal): Promise<Array<Post>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isFollowingUser(target: Username): Promise<boolean>;
    likePost(postId: PostId): Promise<void>;
    markMessageAsRead(messageId: MessageId): Promise<void>;
    markNotificationAsRead(notificationId: NotificationId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(toUsername: Username, text: string): Promise<MessageId>;
    unfollowUser(targetUsername: Username): Promise<void>;
    unlikePost(postId: PostId): Promise<void>;
}
