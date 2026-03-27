# Gram - Instagram-Inspired Social App

## Current State
New project. Empty Motoko backend and no frontend code yet.

## Requested Changes (Diff)

### Add
- User profiles: username, bio, avatar (blob), follower/following counts
- Follow / unfollow other users
- Posts: image (blob), caption, timestamp, like count, comments
- Like and unlike posts
- Comments on posts (text, author, timestamp)
- Stories: short-lived image posts displayed at top of feed
- Feed: chronological posts from followed users + own posts
- Explore/Discover page: all users and trending posts
- Direct messaging: 1-to-1 conversations, message history
- Notifications: likes, comments, follows, DM messages
- Sample seed data for demo purposes

### Modify
N/A (new project)

### Remove
N/A

## Implementation Plan
1. Backend (Motoko):
   - User management: register/update profile, follow/unfollow, get followers/following
   - Posts: create post, get feed, get user posts, like/unlike, add comment
   - Stories: create story, get active stories (expire after 24h)
   - Direct messages: send message, get conversation, get inbox (list of conversations)
   - Notifications: generate on likes/comments/follows/DMs, mark read
   - Authorization integration for identity
   - Blob-storage for avatars, post images, story images

2. Frontend (React + Tailwind):
   - Mobile-first layout with bottom nav (Home, Explore, Post, Messages, Profile)
   - Home feed with stories row at top, then scrollable post cards
   - Post card: avatar, username, image, like/comment buttons, caption, comment count
   - Explore page: user grid + post grid
   - Stories viewer modal
   - Profile page: avatar, stats, post grid, follow button
   - DM inbox list + conversation thread view
   - Notifications page
   - Post creation flow
   - Login/auth screen using authorization component
