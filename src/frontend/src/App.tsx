import { Toaster } from "@/components/ui/sonner";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import BottomNav from "./components/BottomNav";
import CreatePostModal from "./components/CreatePostModal";
import Header from "./components/Header";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import ExplorePage from "./pages/ExplorePage";
import HomeFeed from "./pages/HomeFeed";
import LoginScreen from "./pages/LoginScreen";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import Onboarding from "./pages/Onboarding";
import OtherProfilePage from "./pages/OtherProfilePage";
import ProfilePage from "./pages/ProfilePage";

export type Tab = "home" | "explore" | "messages" | "notifications" | "profile";

export interface NavigateTo {
  tab?: Tab;
  username?: string;
  postId?: bigint;
}

export default function App() {
  const { identity, isInitializing, login, clear } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [viewingUsername, setViewingUsername] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["callerProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorLoading && !!identity,
  });

  const handleNavigate = (to: NavigateTo) => {
    if (to.username) {
      setViewingUsername(to.username);
    } else if (to.tab) {
      setActiveTab(to.tab);
      setViewingUsername(null);
    }
  };

  if (isInitializing || (!!identity && actorLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="text-3xl font-bold gram-gradient-text">Gram</span>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginScreen onLogin={login} />;
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="text-3xl font-bold gram-gradient-text">Gram</span>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (profileQuery.data === null || profileQuery.data === undefined) {
    return (
      <Onboarding
        actor={actor!}
        identity={identity}
        onComplete={() => profileQuery.refetch()}
      />
    );
  }

  const myProfile = profileQuery.data;

  const renderPage = () => {
    if (viewingUsername && viewingUsername !== myProfile.username) {
      return (
        <OtherProfilePage
          username={viewingUsername}
          onNavigate={handleNavigate}
          onBack={() => setViewingUsername(null)}
        />
      );
    }
    switch (activeTab) {
      case "home":
        return <HomeFeed myProfile={myProfile} onNavigate={handleNavigate} />;
      case "explore":
        return (
          <ExplorePage
            onNavigate={handleNavigate}
            myUsername={myProfile.username}
          />
        );
      case "messages":
        return (
          <MessagesPage
            myUsername={myProfile.username}
            onNavigate={handleNavigate}
          />
        );
      case "notifications":
        return <NotificationsPage myProfile={myProfile} />;
      case "profile":
        return (
          <ProfilePage
            myProfile={myProfile}
            onLogout={clear}
            onNavigate={handleNavigate}
            onProfileUpdated={() => profileQuery.refetch()}
          />
        );
      default:
        return <HomeFeed myProfile={myProfile} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] bg-card flex flex-col min-h-screen shadow-modal relative">
        <Header
          activeTab={activeTab}
          onCreatePost={() => setCreatePostOpen(true)}
          onNavigate={(tab) => handleNavigate({ tab })}
        />
        <main className="flex-1 overflow-y-auto pb-20">{renderPage()}</main>
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setViewingUsername(null);
            setActiveTab(tab);
          }}
          onCreatePost={() => setCreatePostOpen(true)}
        />
        <CreatePostModal
          open={createPostOpen}
          onClose={() => setCreatePostOpen(false)}
          actor={actor!}
        />
        <Toaster position="top-center" />
      </div>
    </div>
  );
}
