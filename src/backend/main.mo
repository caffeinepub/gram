import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Types
  type Username = Text;
  type PostId = Nat;
  type CommentId = Nat;
  type StoryId = Nat;
  type NotificationId = Nat;
  type MessageId = Nat;

  public type UserProfile = {
    principal : Principal;
    username : Username;
    bio : Text;
    avatar : ?Storage.ExternalBlob;
    followerCount : Nat;
    followingCount : Nat;
    postCount : Nat;
  };

  type Post = {
    id : PostId;
    author : Username;
    image : Storage.ExternalBlob;
    caption : Text;
    likesCount : Nat;
    commentsCount : Nat;
    createdAt : Int;
  };

  type Comment = {
    id : CommentId;
    postId : PostId;
    author : Username;
    text : Text;
    createdAt : Int;
  };

  type Story = {
    id : StoryId;
    author : Username;
    image : Storage.ExternalBlob;
    createdAt : Int;
  };

  type DirectMessage = {
    id : MessageId;
    from : Username;
    to : Username;
    text : Text;
    createdAt : Int;
    isRead : Bool;
  };

  type Notification = {
    id : NotificationId;
    toUser : Username;
    fromUser : Username;
    notificationType : Text;
    referenceId : Nat;
    isRead : Bool;
    createdAt : Int;
  };

  // Storage
  let users = Map.empty<Principal, UserProfile>();
  let followers = Map.empty<Username, List.List<(Principal, Time.Time)>>();
  let following = Map.empty<Username, List.List<(Principal, Time.Time)>>();
  let posts = Map.empty<PostId, Post>();
  let postLikes = Map.empty<PostId, List.List<Username>>();
  let comments = Map.empty<CommentId, Comment>();
  let stories = Map.empty<StoryId, Story>();
  let directMessages = Map.empty<MessageId, DirectMessage>();
  let notifications = Map.empty<NotificationId, Notification>();

  var nextPostId : Nat = 0;
  var nextCommentId : Nat = 0;
  var nextStoryId : Nat = 0;
  var nextMessageId : Nat = 0;
  var nextNotificationId : Nat = 0;

  func filterAndMap<T, U>(source : Iter.Iter<T>, filterFn : (T) -> Bool, mapFn : (T) -> U) : List.List<U> {
    let result = List.empty<U>();
    for (item in source) {
      if (filterFn(item)) {
        result.add(mapFn(item));
      };
    };
    result;
  };

  // User Profile Management (Required by frontend)

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile unless admin");
    };
    users.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    // Ensure the profile principal matches the caller
    let updatedProfile = {
      principal = caller;
      username = profile.username;
      bio = profile.bio;
      avatar = profile.avatar;
      followerCount = profile.followerCount;
      followingCount = profile.followingCount;
      postCount = profile.postCount;
    };
    users.add(caller, updatedProfile);
  };

  // User Functions

  func getUserProfileInternal(caller : Principal) : UserProfile {
    switch (users.get(caller)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("User profile not found!") };
    };
  };

  func getUserByUsernameInternal(username : Text) : UserProfile {
    switch (users.values().find(func(p) { p.username == username })) {
      case (?profile) { profile };
      case (null) { Runtime.trap("User profile not found!") };
    };
  };

  public query ({ caller }) func getUserByUsername(username : Username) : async UserProfile {
    // Public read access - any authenticated user can view profiles
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    getUserByUsernameInternal(username);
  };

  public query ({ caller }) func checkUserExists(username : Username) : async Bool {
    // Public read access - guests can check if username exists
    switch (users.values().find(func(p) { p.username == username })) {
      case (?p) { true };
      case (null) { false };
    };
  };

  public shared ({ caller }) func followUser(targetUsername : Username) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };

    let followerProfile = getUserProfileInternal(caller);

    if (followerProfile.username == targetUsername) {
      Runtime.trap("Cannot follow yourself");
    };

    let followingProfile = getUserByUsernameInternal(targetUsername);

    // Update follower & following lists
    switch (followers.get(targetUsername)) {
      case (?followerList) {
        followerList.add((caller, Time.now()));
      };
      case (null) {
        let newFollowerList = List.singleton((caller, Time.now()));
        followers.add(targetUsername, newFollowerList);
      };
    };

    switch (following.get(followerProfile.username)) {
      case (?followingList) {
        followingList.add((followingProfile.principal, Time.now()));
      };
      case (null) {
        let newFollowingList = List.singleton((followingProfile.principal, Time.now()));
        following.add(followerProfile.username, newFollowingList);
      };
    };

    // Update counts
    let updatedTarget = {
      principal = followingProfile.principal;
      username = followingProfile.username;
      bio = followingProfile.bio;
      avatar = followingProfile.avatar;
      followerCount = followingProfile.followerCount + 1;
      followingCount = followingProfile.followingCount;
      postCount = followingProfile.postCount;
    };
    users.add(followingProfile.principal, updatedTarget);

    let updatedFollower = {
      principal = followerProfile.principal;
      username = followerProfile.username;
      bio = followerProfile.bio;
      avatar = followerProfile.avatar;
      followerCount = followerProfile.followerCount;
      followingCount = followerProfile.followingCount + 1;
      postCount = followerProfile.postCount;
    };
    users.add(caller, updatedFollower);
  };

  public shared ({ caller }) func unfollowUser(targetUsername : Username) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };

    let followerUsername = getUserProfileInternal(caller).username;
    let followingProfile = getUserByUsernameInternal(targetUsername);

    switch (followers.get(targetUsername)) {
      case (?followerList) {
        let newFollowersList = filterAndMap(
          followerList.values(),
          func(entry) { entry.0 != caller },
          func(entry) { entry },
        );
        followers.add(targetUsername, newFollowersList);
      };
      case (null) { Runtime.trap("User profile not found!") };
    };

    switch (following.get(followerUsername)) {
      case (?followingList) {
        let newFollowingList = filterAndMap(
          followingList.values(),
          func(entry) { entry.0 != followingProfile.principal },
          func(entry) { entry },
        );
        following.add(followerUsername, newFollowingList);
      };
      case (null) { Runtime.trap("User profile not found!") };
    };

    let updatedUser = {
      principal = followingProfile.principal;
      username = followingProfile.username;
      bio = followingProfile.bio;
      avatar = followingProfile.avatar;
      followerCount = if (followingProfile.followerCount == 0) { followingProfile.followerCount } else { followingProfile.followerCount - 1 };
      followingCount = followingProfile.followingCount;
      postCount = followingProfile.postCount;
    };
    users.add(followingProfile.principal, updatedUser);

    let callerProfile = getUserProfileInternal(caller);
    let updatedCaller = {
      principal = callerProfile.principal;
      username = callerProfile.username;
      bio = callerProfile.bio;
      avatar = callerProfile.avatar;
      followerCount = callerProfile.followerCount;
      followingCount = if (callerProfile.followingCount == 0) { callerProfile.followingCount } else { callerProfile.followingCount - 1 };
      postCount = callerProfile.postCount;
    };
    users.add(caller, updatedCaller);
  };

  public query ({ caller }) func isFollowingUser(target : Username) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check following status");
    };

    let followerUsername = getUserProfileInternal(caller).username;
    switch (following.get(followerUsername)) {
      case (?followingList) {
        followingList.values().any(
          func(entry) {
            let targetProfile = getUserByUsernameInternal(target);
            entry.0 == targetProfile.principal
          }
        );
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getMyFollowers() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view followers");
    };

    let username = getUserProfileInternal(caller).username;
    switch (followers.get(username)) {
      case (?followerList) { filterAndMap<(Principal, Time.Time), Principal>(followerList.values(), func(entry) { true }, func(entry) { entry.0 }).toArray() };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getFollowing() : async [Username] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view following list");
    };

    let username = getUserProfileInternal(caller).username;
    switch (following.get(username)) {
      case (?followingList) {
        filterAndMap<(Principal, Time.Time), Username>(
          followingList.values(),
          func(entry) { true },
          func(entry) {
            switch (users.get(entry.0)) {
              case (?profile) { profile.username };
              case (null) { "" };
            }
          },
        ).toArray();
      };
      case (null) { [] };
    };
  };

  // Posts

  func comparePostsByDate(postA : Post, postB : Post) : Order.Order {
    Int.compare(postB.createdAt, postA.createdAt);
  };

  public shared ({ caller }) func createPost(image : Storage.ExternalBlob, caption : Text) : async PostId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };

    let profile = getUserProfileInternal(caller);
    let postId = nextPostId;
    nextPostId += 1;

    let newPost : Post = {
      id = postId;
      author = profile.username;
      image = image;
      caption = caption;
      likesCount = 0;
      commentsCount = 0;
      createdAt = Time.now();
    };

    posts.add(postId, newPost);
    postLikes.add(postId, List.empty<Username>());

    // Update user post count
    let updatedProfile = {
      principal = profile.principal;
      username = profile.username;
      bio = profile.bio;
      avatar = profile.avatar;
      followerCount = profile.followerCount;
      followingCount = profile.followingCount;
      postCount = profile.postCount + 1;
    };
    users.add(caller, updatedProfile);

    postId;
  };

  public shared ({ caller }) func deletePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete posts");
    };

    let profile = getUserProfileInternal(caller);

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist!") };
      case (?post) {
        // Only post author or admin can delete
        if (post.author != profile.username and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only post author or admin can delete posts");
        };

        posts.remove(postId);
        postLikes.remove(postId);

        // Update user post count if caller is the author
        if (post.author == profile.username) {
          let updatedProfile = {
            principal = profile.principal;
            username = profile.username;
            bio = profile.bio;
            avatar = profile.avatar;
            followerCount = profile.followerCount;
            followingCount = profile.followingCount;
            postCount = if (profile.postCount == 0) { profile.postCount } else { profile.postCount - 1 };
          };
          users.add(caller, updatedProfile);
        };
      };
    };
  };

  public shared ({ caller }) func likePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };

    let profile = getUserProfileInternal(caller);

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist!") };
      case (?post) {
        switch (postLikes.get(postId)) {
          case (null) {
            let newLikes = List.singleton(profile.username);
            postLikes.add(postId, newLikes);
          };
          case (?likes) {
            // Check if already liked
            let alreadyLiked = likes.values().any(func(u) { u == profile.username });
            if (not alreadyLiked) {
              likes.add(profile.username);
            };
          };
        };

        // Update post likes count
        let likeCount = switch (postLikes.get(postId)) {
          case (null) { 0 };
          case (?likes) { likes.size() };
        };

        let updatedPost = {
          id = post.id;
          author = post.author;
          image = post.image;
          caption = post.caption;
          likesCount = likeCount;
          commentsCount = post.commentsCount;
          createdAt = post.createdAt;
        };
        posts.add(postId, updatedPost);
      };
    };
  };

  public shared ({ caller }) func unlikePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unlike posts");
    };

    let profile = getUserProfileInternal(caller);

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist!") };
      case (?post) {
        switch (postLikes.get(postId)) {
          case (null) { };
          case (?likes) {
            let newLikes = filterAndMap(
              likes.values(),
              func(u) { u != profile.username },
              func(u) { u },
            );
            postLikes.add(postId, newLikes);
          };
        };

        // Update post likes count
        let likeCount = switch (postLikes.get(postId)) {
          case (null) { 0 };
          case (?likes) { likes.size() };
        };

        let updatedPost = {
          id = post.id;
          author = post.author;
          image = post.image;
          caption = post.caption;
          likesCount = likeCount;
          commentsCount = post.commentsCount;
          createdAt = post.createdAt;
        };
        posts.add(postId, updatedPost);
      };
    };
  };

  public query ({ caller }) func getFeedForUser(user : Principal) : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view feeds");
    };

    // Users can only view their own feed unless admin
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own feed");
    };

    let followingUser = getUserProfileInternal(user).username;
    switch (following.get(followingUser)) {
      case (?followingList) {
        let followedUsernames = filterAndMap(
          followingList.values(),
          func(entry) { true },
          func(entry) {
            switch (users.get(entry.0)) {
              case (?profile) { profile.username };
              case (null) { "" };
            }
          },
        );

        let filteredPosts = filterAndMap<Post, Post>(
          posts.values(),
          func(post) {
            followedUsernames.values().any(func(u) { u == post.author });
          },
          func(post) { post },
        );

        filteredPosts.toArray().sort(comparePostsByDate);
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getAllUserPosts(user : Principal) : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };

    let username = getUserProfileInternal(user).username;
    filterAndMap<Post, Post>(
      posts.values(),
      func(post) { post.author == username },
      func(post) { post },
    ).toArray();
  };

  public query ({ caller }) func getPostById(postId : PostId) : async Post {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist!") };
      case (?post) { post };
    };
  };

  public query ({ caller }) func getAllPosts() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };

    posts.values().toArray().sort(comparePostsByDate);
  };

  public query ({ caller }) func getPostsByUser(username : Username) : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };

    filterAndMap<Post, Post>(
      posts.values(),
      func(post) { post.author == username },
      func(post) { post },
    ).toArray();
  };

  // Comments

  public shared ({ caller }) func addComment(postId : PostId, text : Text) : async CommentId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };

    let profile = getUserProfileInternal(caller);

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist!") };
      case (?post) {
        let commentId = nextCommentId;
        nextCommentId += 1;

        let newComment : Comment = {
          id = commentId;
          postId = postId;
          author = profile.username;
          text = text;
          createdAt = Time.now();
        };

        comments.add(commentId, newComment);

        // Update post comment count
        let updatedPost = {
          id = post.id;
          author = post.author;
          image = post.image;
          caption = post.caption;
          likesCount = post.likesCount;
          commentsCount = post.commentsCount + 1;
          createdAt = post.createdAt;
        };
        posts.add(postId, updatedPost);

        commentId;
      };
    };
  };

  public query ({ caller }) func getCommentsForPost(postId : PostId) : async [Comment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view comments");
    };

    filterAndMap<Comment, Comment>(
      comments.values(),
      func(comment) { comment.postId == postId },
      func(comment) { comment },
    ).toArray();
  };

  // Stories
  func compareStoriesByDate(storyA : Story, storyB : Story) : Order.Order {
    Int.compare(storyB.createdAt, storyA.createdAt);
  };

  public shared ({ caller }) func createStory(image : Storage.ExternalBlob) : async StoryId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create stories");
    };

    let profile = getUserProfileInternal(caller);
    let storyId = nextStoryId;
    nextStoryId += 1;

    let newStory : Story = {
      id = storyId;
      author = profile.username;
      image = image;
      createdAt = Time.now();
    };

    stories.add(storyId, newStory);
    storyId;
  };

  public query ({ caller }) func getStoriesForUser(user : Principal) : async [Story] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stories");
    };

    // Users can only view their own stories feed unless admin
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own stories feed");
    };

    let username = getUserProfileInternal(user).username;
    let twentyFourHoursAgo = Time.now() - (24 * 60 * 60 * 1_000_000_000);

    switch (following.get(username)) {
      case (?followingList) {
        let followedUsernames = followingList.values().map(func(entry) {
          switch (users.get(entry.0)) {
            case (?profile) { profile.username };
            case (null) { "" };
          }
        }).toArray();

        filterAndMap<Story, Story>(
          stories.values(),
          func(story) {
            story.createdAt >= twentyFourHoursAgo and
            followedUsernames.values().any(func(u) { u == story.author });
          },
          func(story) { story },
        ).toArray().sort(compareStoriesByDate);
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getAllStories() : async [Story] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stories");
    };

    let twentyFourHoursAgo = Time.now() - (24 * 60 * 60 * 1_000_000_000);
    filterAndMap<Story, Story>(
      stories.values(),
      func(story) { story.createdAt >= twentyFourHoursAgo },
      func(story) { story },
    ).toArray().sort(compareStoriesByDate);
  };

  public query ({ caller }) func getStoriesByUser(username : Username) : async [Story] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stories");
    };

    let twentyFourHoursAgo = Time.now() - (24 * 60 * 60 * 1_000_000_000);
    filterAndMap<Story, Story>(
      stories.values(),
      func(story) { story.author == username and story.createdAt >= twentyFourHoursAgo },
      func(story) { story },
    ).toArray().sort(compareStoriesByDate);
  };

  // Direct Messages

  public shared ({ caller }) func sendMessage(toUsername : Username, text : Text) : async MessageId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let fromProfile = getUserProfileInternal(caller);
    let _ = getUserByUsernameInternal(toUsername); // Verify recipient exists

    let messageId = nextMessageId;
    nextMessageId += 1;

    let newMessage : DirectMessage = {
      id = messageId;
      from = fromProfile.username;
      to = toUsername;
      text = text;
      createdAt = Time.now();
      isRead = false;
    };

    directMessages.add(messageId, newMessage);
    messageId;
  };

  public query ({ caller }) func getConversation(otherUsername : Username) : async [DirectMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };

    let myUsername = getUserProfileInternal(caller).username;

    filterAndMap<DirectMessage, DirectMessage>(
      directMessages.values(),
      func(msg) {
        (msg.from == myUsername and msg.to == otherUsername) or
        (msg.from == otherUsername and msg.to == myUsername)
      },
      func(msg) { msg },
    ).toArray();
  };

  public query ({ caller }) func getInbox() : async [DirectMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inbox");
    };

    let myUsername = getUserProfileInternal(caller).username;

    // Get all messages involving the user
    let myMessages = filterAndMap<DirectMessage, DirectMessage>(
      directMessages.values(),
      func(msg) { msg.from == myUsername or msg.to == myUsername },
      func(msg) { msg },
    );

    // Group by contact and get latest message per contact
    // This is a simplified version - returns all messages sorted by date
    myMessages.toArray().sort(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
  };

  public shared ({ caller }) func markMessageAsRead(messageId : MessageId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark messages as read");
    };

    let myUsername = getUserProfileInternal(caller).username;

    switch (directMessages.get(messageId)) {
      case (null) { Runtime.trap("Message does not exist!") };
      case (?msg) {
        // Only recipient can mark as read
        if (msg.to != myUsername) {
          Runtime.trap("Unauthorized: Only message recipient can mark as read");
        };

        let updatedMessage = {
          id = msg.id;
          from = msg.from;
          to = msg.to;
          text = msg.text;
          createdAt = msg.createdAt;
          isRead = true;
        };
        directMessages.add(messageId, updatedMessage);
      };
    };
  };

  // Notifications
  func compareNotificationsByDate(notificationA : Notification, notificationB : Notification) : Order.Order {
    Int.compare(notificationB.createdAt, notificationA.createdAt);
  };

  public query ({ caller }) func getNotificationsForUser(user : Principal) : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };

    // Users can only view their own notifications unless admin
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own notifications");
    };

    let username = getUserProfileInternal(user).username;
    filterAndMap<Notification, Notification>(
      notifications.values(),
      func(notification) { notification.toUser == username },
      func(notification) { notification },
    ).toArray().sort(compareNotificationsByDate);
  };

  public shared ({ caller }) func markNotificationAsRead(notificationId : NotificationId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };

    let myUsername = getUserProfileInternal(caller).username;

    switch (notifications.get(notificationId)) {
      case (null) { Runtime.trap("Notification does not exist!") };
      case (?notif) {
        // Only notification recipient can mark as read
        if (notif.toUser != myUsername) {
          Runtime.trap("Unauthorized: Only notification recipient can mark as read");
        };

        let updatedNotification = {
          id = notif.id;
          toUser = notif.toUser;
          fromUser = notif.fromUser;
          notificationType = notif.notificationType;
          referenceId = notif.referenceId;
          isRead = true;
          createdAt = notif.createdAt;
        };
        notifications.add(notificationId, updatedNotification);
      };
    };
  };

  // Feed
  public query ({ caller }) func getUserFeed(userFrom : Principal) : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view feeds");
    };

    // Users can only view their own feed unless admin
    if (caller != userFrom and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own feed");
    };

    let user = getUserProfileInternal(userFrom);
    let followingUsernames = switch (following.get(user.username)) {
      case (?followingList) {
        followingList.values().map(func(entry) {
          switch (users.get(entry.0)) {
            case (?profile) { profile.username };
            case (null) { "" };
          }
        }).toArray();
      };
      case (null) { [] };
    };

    let feedPosts = filterAndMap<Post, Post>(
      posts.values(),
      func(post) {
        followingUsernames.values().any(func(u) { u == post.author });
      },
      func(post) { post },
    );

    feedPosts.toArray().sort(comparePostsByDate);
  };
};
