import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./lib/supabase.js";

const MESSAGE_STORAGE_KEY = "ibra-homepage-messages";
const VISITOR_STORAGE_KEY = "ibra-homepage-visitor-count";
const VISITOR_SESSION_KEY = "ibra-homepage-visitor-counted";
const MAX_MESSAGES = 20;

const siteUpdates = [
  { id: "dogs", meta: "07/14/01 · Ibra", text: "I added two cool dachshunds!" },
  { id: "online", meta: "06/30/01 · Ibra", text: "Welcome page is finally online." },
];

function readLocalMessages() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(MESSAGE_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.slice(-MAX_MESSAGES) : [];
  } catch {
    return [];
  }
}

function mapMessage(row) {
  return {
    id: row.id,
    from: row.from_name,
    to: row.to_name,
    text: row.body,
    timestamp: row.created_at,
  };
}

function appendUnique(messages, message) {
  if (messages.some((item) => item.id === message.id)) return messages;
  return [...messages, message].slice(-MAX_MESSAGES);
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat([], {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function RetroPanel({ className = "", title, children, id }) {
  return (
    <section className={`retro-panel ${className}`.trim()} id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function WhatsNew({ messages, backendStatus }) {
  const statusText = {
    connecting: "Connecting to global message board...",
    global: "Global message board online",
    local: "Local mode — add Supabase keys to go global",
    error: "Supabase unavailable — using saved local messages",
  }[backendStatus];

  return (
    <RetroPanel className="news-panel" title="What's New?">
      <p className={`feed-status ${backendStatus}`}>● {statusText}</p>
      <div className="news-feed" aria-live="polite">
        {[...messages].reverse().map((message, index) => (
          <article
            className="news-message user-message"
            key={message.id || `${message.timestamp}-${index}`}
          >
            <p className="message-meta">
              <strong>{message.from} → {message.to}</strong> · {formatTime(message.timestamp)}
            </p>
            <p>{message.text}</p>
          </article>
        ))}

        {siteUpdates.map((update) => (
          <article className="news-message site-update" key={update.id}>
            <p className="message-meta"><strong>{update.meta}</strong></p>
            <p>{update.text}</p>
          </article>
        ))}
      </div>
      <p className="blink">More updates coming soon...</p>
    </RetroPanel>
  );
}

function Messenger({ isOpen, onClose, onSend, fromRef, chatRef, backendStatus }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("Ibra");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const messageRef = useRef(null);

  const submitMessage = async (event) => {
    event.preventDefault();
    const cleanMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from: from.trim(),
      to: to.trim(),
      text: message.trim(),
      timestamp: new Date().toISOString(),
    };

    if (!cleanMessage.from || !cleanMessage.to || !cleanMessage.text) return;

    setIsSending(true);
    setSendError("");

    try {
      await onSend(cleanMessage);
      setMessage("");
      messageRef.current?.focus();
    } catch (error) {
      console.error(error);
      setSendError("Message could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const addText = (addition) => {
    const input = messageRef.current;
    const start = input?.selectionStart ?? message.length;
    const end = input?.selectionEnd ?? message.length;
    const nextMessage = `${message.slice(0, start)}${addition}${message.slice(end)}`;

    setMessage(nextMessage);
    window.requestAnimationFrame(() => {
      const nextCaret = start + addition.length;
      messageRef.current?.focus();
      messageRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  if (!isOpen) return null;

  const isGlobal = backendStatus === "global";

  return (
    <section className="chat-box" id="chat" aria-labelledby="chat-title" ref={chatRef}>
      <div className="chat-titlebar">
        <span aria-hidden="true">✉</span>
        <h2 id="chat-title">Ibra's Instant Messenger (click)ha</h2>
        <span className={`online-dot ${isGlobal ? "global" : "local"}`}>
          ● {isGlobal ? "GLOBAL" : "LOCAL"}
        </span>
        <button className="chat-close" type="button" aria-label="Close messenger" onClick={onClose}>×</button>
      </div>

      <form id="chat-form" onSubmit={submitMessage}>
        <div className="address-fields">
          <label>
            <span>From:</span>
            <input
              ref={fromRef}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              maxLength={24}
              placeholder="Your name"
              required
            />
          </label>
          <label>
            <span>To:</span>
            <input
              value={to}
              onChange={(event) => setTo(event.target.value)}
              maxLength={24}
              required
            />
          </label>
        </div>

        <label className="message-field" htmlFor="chat-message">Message:</label>
        <textarea
          id="chat-message"
          ref={messageRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={280}
          placeholder="Type your message here..."
          required
        />

        {sendError && <p className="chat-status error" role="alert">{sendError}</p>}

        <div className="chat-toolbar">
          <div className="chat-tools" aria-label="Message tools">
            <button type="button" className="tiny-tool text-tool" title="Plain text">T</button>
            <button type="button" className="tiny-tool" title="Add smiley" onClick={() => addText(" :)")}>🙂</button>
            <button type="button" className="tiny-tool" title="Add sleepy text" onClick={() => addText(" Zzz")}>Z</button>
          </div>
          <span className="no-login">{isGlobal ? "Saved globally" : "Saved locally"}</span>
          <button className="send-button" type="submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FavoritesModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="favorite-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="favorite-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorite-modal-title"
      >
        <div className="favorite-modal-titlebar">
          <h2 id="favorite-modal-title">Ibra's Favorites</h2>
          <button type="button" aria-label="Close favorites" onClick={onClose}>×</button>
        </div>
        <div className="favorite-modal-body">
          <div className="favorites-grid">
            <section className="favorite-category">
              <h3>Games</h3>
              <ul>
                <li>Mobile Legends</li>
                <li>Roblox</li>
                <li>Growtopia</li>
                <li>Chess</li>
              </ul>
            </section>

            <section className="favorite-category">
              <h3>TV Shows</h3>
              <ul>
                <li>Breaking Bad</li>
                <li>Euphoria</li>
                <li>Reply 1988</li>
              </ul>
            </section>

            <section className="favorite-category">
              <h3>Music</h3>
              <ul>
                <li>Tame Impala</li>
                <li>Mac DeMarco</li>
                <li>Drake</li>
                <li>Lana Del Rey</li>
                <li>Payung Teduh</li>
              </ul>
            </section>

            <section className="favorite-category favorite-website">
              <h3>Favorite Website</h3>
              <a href="https://quran.com" target="_blank" rel="noreferrer">Quran.com</a>
            </section>
          </div>

          <section className="favorite-picture">
            <h3>Favorite Pic</h3>
            <img src="/assets/my-fav-pic.png" alt="A Roblox character standing in grass with a Grass Touch prompt" />
          </section>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState(readLocalMessages);
  const [backendStatus, setBackendStatus] = useState(
    isSupabaseConfigured ? "connecting" : "local",
  );
  const [visitorCount, setVisitorCount] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const launcherRef = useRef(null);
  const fromRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Messages remain available for the current session when storage is blocked.
    }
  }, [messages]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let isActive = true;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, from_name, to_name, body, created_at")
        .order("created_at", { ascending: false })
        .limit(MAX_MESSAGES);

      if (!isActive) return;

      if (error) {
        console.error(error);
        setBackendStatus("error");
        return;
      }

      setMessages(data.reverse().map(mapMessage));
      setBackendStatus("global");
    };

    loadMessages();

    const channel = supabase
      .channel("ibra-public-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((current) => appendUnique(current, mapMessage(payload.new)));
        },
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const loadVisitorCount = async () => {
      if (!isSupabaseConfigured) {
        const previous = Number(window.localStorage.getItem(VISITOR_STORAGE_KEY)) || 314;
        const counted = window.sessionStorage.getItem(VISITOR_SESSION_KEY);
        const next = counted ? previous : previous + 1;

        if (!counted) {
          window.localStorage.setItem(VISITOR_STORAGE_KEY, String(next));
          window.sessionStorage.setItem(VISITOR_SESSION_KEY, "yes");
        }

        setVisitorCount(next);
        return;
      }

      const counted = window.sessionStorage.getItem(VISITOR_SESSION_KEY);
      const functionName = counted ? "get_visitor_count" : "increment_visitor";

      if (!counted) window.sessionStorage.setItem(VISITOR_SESSION_KEY, "pending");

      const { data, error } = await supabase.rpc(functionName, { p_page_key: "home" });

      if (error) {
        console.error(error);
        if (!counted) window.sessionStorage.removeItem(VISITOR_SESSION_KEY);
        setVisitorCount(314);
        return;
      }

      window.sessionStorage.setItem(VISITOR_SESSION_KEY, "yes");
      setVisitorCount(Number(data));
    };

    loadVisitorCount();
  }, []);

  useEffect(() => {
    if (!isChatOpen) return;

    window.requestAnimationFrame(() => {
      chatRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      fromRef.current?.focus();
    });
  }, [isChatOpen]);

  const openChat = (event) => {
    event?.preventDefault();
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  };

  const sendMessage = async (message) => {
    if (!isSupabaseConfigured || backendStatus === "error") {
      setMessages((current) => appendUnique(current, message));
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        from_name: message.from,
        to_name: message.to,
        body: message.text,
      })
      .select("id, from_name, to_name, body, created_at")
      .single();

    if (error) throw error;
    setMessages((current) => appendUnique(current, mapMessage(data)));
  };

  const openFavorites = (event) => {
    event?.preventDefault();
    setIsFavoritesOpen(true);
  };

  const visitorDigits = String(visitorCount ?? 0).padStart(6, "0").slice(-6);

  return (
    <main className="homepage">
      <header className="site-header">
        <p className="welcome-strip">★ WELCOME, NET SURFER! ★</p>
        <h1>Ibra's Home Page</h1>
        <p className="location">Indonesia · Online Since 2026</p>
        <p className="tagline">&quot;Welcome to my little corner of the World Wide Web!&quot;</p>
      </header>

      <img className="dogs-banner" src="/assets/retro-dogs.png" alt="Two pixel-art dachshunds facing each other" />

      <p className="updated">
        <span className="new-label">NEW!</span>
        Last Updated: <time dateTime="2026-07-10">10/7/2026</time>
      </p>

      <div className="star-divider" aria-hidden="true">★ · ★ · ★ · ★ · ★ · ★ · ★</div>

      <RetroPanel className="intro" id="about" title="About Me">
        <p>
          Hi! My name is <strong>Ibra</strong>. I like computers, music, video games,
          dogs, and exploring the Internet. This is my personal home page, made by
          hand with lots of HTML and zero fancy web builders!
        </p>
        <p>Thanks for stopping by. Check out my favorite things before you leave.</p>
      </RetroPanel>

      <div className="columns">
        <RetroPanel className="links-panel" id="links" title="Cool Links">
          <ul>
            <li><a href="#about">About Ibra</a></li>
            <li><a href="#dog-zone">My Dog Zone</a></li>
            <li><a href="#chat" onClick={openChat}>Instant Message Me!</a></li>
            <li><a href="#my-favorites" onClick={openFavorites}>My Favorite</a></li>
          </ul>
        </RetroPanel>
        <WhatsNew messages={messages} backendStatus={backendStatus} />
      </div>

      <button
        className="web-button messenger-launcher"
        ref={launcherRef}
        type="button"
        aria-controls="chat"
        aria-expanded={isChatOpen}
        onClick={() => (isChatOpen ? closeChat() : setIsChatOpen(true))}
      >
        💬 Ibra's Instant Messenger
      </button>

      <Messenger
        isOpen={isChatOpen}
        onClose={closeChat}
        onSend={sendMessage}
        fromRef={fromRef}
        chatRef={chatRef}
        backendStatus={backendStatus}
      />

      <section className="dog-zone" id="dog-zone">
        <h2>★ Ibra's Dog Zone ★</h2>
        <div className="dog-track" role="img" aria-label="A pixel-art dachshund walking back and forth">
          <div className="walking-dog" aria-hidden="true" />
        </div>
        <p className="dog-caption">My internet dog is out for a walk...</p>
      </section>

      <div className="under-construction">
        <span aria-hidden="true">🚧</span>
        {" "}THIS PAGE IS ALWAYS UNDER CONSTRUCTION{" "}
        <span aria-hidden="true">🚧</span>
      </div>

      <section className="favorite-actions" id="my-favorites">
        <button className="web-button" type="button" onClick={openFavorites}>★ My Favorite</button>
        <a className="web-button" href="#links">↑ Back to Cool Links</a>
      </section>

      <footer className="site-footer">
        <p>You are visitor number:</p>
        <p className="counter" aria-label={`Visitor number ${visitorDigits}`}>
          {visitorDigits.split("").map((digit, index) => (
            <span key={`${digit}-${index}`}>{digit}</span>
          ))}
        </p>
        <p className="best-viewed">Best viewed in 800 × 600 with Netscape Navigator 4.0</p>
        <p className="modem">Optimized for a blazing fast 56k modem!</p>
        <p className="copyright">© 2026–2031 Ibra's Home Page · Made with Zed</p>
      </footer>

      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />
    </main>
  );
}

export default App;
