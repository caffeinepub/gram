import { ArrowLeft, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { NavigateTo } from "../App";
import type { DirectMessage } from "../backend.d";
import {
  formatTimestamp,
  useConversation,
  useInbox,
  useSendMessage,
} from "../hooks/useQueries";

interface Props {
  myUsername: string;
  onNavigate: (to: NavigateTo) => void;
}

export default function MessagesPage({
  myUsername,
  onNavigate: _onNavigate,
}: Props) {
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const { data: inbox = [], isLoading } = useInbox();

  // Derive conversations: group by partner, show latest message
  const conversations = (() => {
    const map = new Map<string, DirectMessage>();
    for (const msg of inbox) {
      const partner = msg.from === myUsername ? msg.to : msg.from;
      const existing = map.get(partner);
      if (!existing || Number(msg.createdAt) > Number(existing.createdAt)) {
        map.set(partner, msg);
      }
    }
    return Array.from(map.entries()).sort(
      ([, a], [, b]) => Number(b.createdAt) - Number(a.createdAt),
    );
  })();

  if (activeThread) {
    return (
      <ChatThread
        myUsername={myUsername}
        otherUsername={activeThread}
        onBack={() => setActiveThread(null)}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-4">
        <h2 className="text-xl font-bold">Messages</h2>
      </div>
      {isLoading ? (
        <div data-ocid="messages.loading_state" className="flex flex-col gap-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="w-24 h-3 bg-muted animate-pulse rounded" />
                <div className="w-40 h-2.5 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div
          data-ocid="messages.empty_state"
          className="flex flex-col items-center justify-center py-16 px-8 gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              Start a conversation by visiting someone's profile
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {conversations.map(([partner, latestMsg], i) => (
            <button
              type="button"
              key={partner}
              data-ocid={`messages.item.${i + 1}`}
              onClick={() => setActiveThread(partner)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center flex-shrink-0">
                <span className="font-semibold text-primary">
                  {partner.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 flex flex-col items-start min-w-0">
                <div className="flex justify-between w-full">
                  <span className="text-sm font-semibold">{partner}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(latestMsg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate w-full text-left">
                  {latestMsg.from === myUsername ? "You: " : ""}
                  {latestMsg.text}
                </p>
              </div>
              {!latestMsg.isRead && latestMsg.to === myUsername && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatThread({
  myUsername,
  otherUsername,
  onBack,
}: { myUsername: string; otherUsername: string; onBack: () => void }) {
  const [text, setText] = useState("");
  const { data: messages = [], isLoading } = useConversation(otherUsername);
  const sendMessage = useSendMessage();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesCount = messages.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesCount]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const t = text.trim();
    setText("");
    await sendMessage.mutateAsync({ to: otherUsername, text: t });
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ height: "calc(100vh - 120px)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0">
        <button
          type="button"
          data-ocid="chat.back_button"
          onClick={onBack}
          className="p-1"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">
            {otherUsername.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <span className="font-semibold">{otherUsername}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {isLoading ? (
          <div
            data-ocid="chat.loading_state"
            className="flex items-center justify-center py-8"
          >
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div
            data-ocid="chat.empty_state"
            className="flex items-center justify-center py-8 text-muted-foreground text-sm"
          >
            Start the conversation!
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => {
              const isMine = msg.from === myUsername;
              return (
                <motion.div
                  key={msg.id.toString()}
                  data-ocid={`chat.item.${i + 1}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 text-sm ${
                      isMine ? "chat-bubble-sent" : "chat-bubble-received"
                    }`}
                  >
                    {msg.text}
                    <div
                      className={`text-xs mt-1 ${
                        isMine ? "text-white/60" : "text-muted-foreground"
                      }`}
                    >
                      {formatTimestamp(msg.createdAt)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 px-4 py-3 border-t border-border bg-card"
      >
        <input
          data-ocid="chat.input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${otherUsername}...`}
          className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          data-ocid="chat.submit_button"
          type="submit"
          disabled={!text.trim() || sendMessage.isPending}
          className="w-10 h-10 gram-gradient rounded-full flex items-center justify-center text-white disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
