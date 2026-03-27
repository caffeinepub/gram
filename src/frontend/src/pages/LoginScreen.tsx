import { motion } from "motion/react";

interface Props {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('/assets/generated/gram-login-bg.dim_800x1000.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/40" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-8 px-8 w-full max-w-[380px]"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl font-bold text-white tracking-tight">
            Gram
          </span>
          <p className="text-white/80 text-center text-sm">
            Share moments. Connect with people.
          </p>
        </div>

        <div className="w-full flex flex-col gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <button
            type="button"
            data-ocid="login.primary_button"
            onClick={onLogin}
            className="w-full gram-gradient text-white font-semibold py-3 rounded-full text-base shadow-lg hover:opacity-90 transition-opacity"
          >
            Sign in with Internet Identity
          </button>
          <p className="text-white/60 text-xs text-center">
            Secure, private authentication — no password needed.
          </p>
        </div>

        <p className="text-white/40 text-xs text-center">
          © {new Date().getFullYear()} Gram. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
