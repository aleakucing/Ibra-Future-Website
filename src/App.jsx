import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ibra-homepage-messages";
const MAX_MESSAGES = 20;

const siteUpdates = [
  { id: "dogs", meta: "07/14/01 · Ibra", text: "I added two cool dachshunds!" },
  { id: "online", meta: "06/30/01 · Ibra", text: "Welcome page is finally online." },
];

function readMessages() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.slice(-MAX_MESSAGES) : [];
  } catch {
    return [];
  }
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

function WhatsNew({ messages }) {
  return (
    <RetroPanel className="news-panel" title="What's New?">
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

function Messenger({ isOpen, onClose, onSend, fromRef, chatRef }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("Ibra");
  const [message, setMessage] = useState("");
  const messageRef = useRef(null);

  const submitMessage = (event) => {
    event.preventDefault();
    const cleanMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from: from.trim(),
      to: to.trim(),
      text: message.trim(),
      timestamp: Date.now(),
    };

    if (!cleanMessage.from || !cleanMessage.to || !cleanMessage.text) return;

    onSend(cleanMessage);
    setMessage("");
    messageRef.current?.focus();
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

  return (
    <section className="chat-box" id="chat" aria-labelledby="chat-title" ref={chatRef}>
      <div className="chat-titlebar">
        <span aria-hidden="true">✉</span>
        <h2 id="chat-title">Ibra's Instant Messenger</h2>
        <span className="online-dot">● ONLINE</span>
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

        <div className="chat-toolbar">
          <div className="chat-tools" aria-label="Message tools">
            <button type="button" className="tiny-tool text-tool" title="Plain text">T</button>
            <button type="button" className="tiny-tool" title="Add smiley" onClick={() => addText(" :)")}>🙂</button>
            <button type="button" className="tiny-tool" title="Add sleepy text" onClick={() => addText(" Zzz")}>Z</button>
          </div>
          <span className="no-login">No login required</span>
          <button className="send-button" type="submit">Send</button>
        </div>
      </form>
    </section>
  );
}

function App() {
  const [messages, setMessages] = useState(readMessages);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const launcherRef = useRef(null);
  const fromRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Messages remain available for the current session when storage is blocked.
    }
  }, [messages]);

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

  const sendMessage = (message) => {
    setMessages((current) => [...current, message].slice(-MAX_MESSAGES));
  };

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
        <p>Thanks for stopping by. Please sign my guestbook before you leave.</p>
      </RetroPanel>

      <div className="columns">
        <RetroPanel className="links-panel" id="links" title="Cool Links">
          <ul>
            <li><a href="#about">About Ibra</a></li>
            <li><a href="#dog-zone">My Dog Zone</a></li>
            <li><a href="#guestbook">Sign My Guestbook</a></li>
            <li><a href="#chat" onClick={openChat}>Instant Message Me!</a></li>
          </ul>
        </RetroPanel>
        <WhatsNew messages={messages} />
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
        {' '}THIS PAGE IS ALWAYS UNDER CONSTRUCTION{' '}
        <span aria-hidden="true">🚧</span>
      </div>

      <section className="guestbook" id="guestbook">
        <a className="web-button" href="#chat" onClick={openChat}>✎ Sign My Guestbook</a>
        <a className="web-button" href="#guestbook">☞ View My Guestbook</a>
      </section>

      <footer className="site-footer">
        <p>You are visitor number:</p>
        <p className="counter" aria-label="Visitor number 000314">
          {"000314".split("").map((digit, index) => <span key={`${digit}-${index}`}>{digit}</span>)}
        </p>
        <p className="best-viewed">Best viewed in 800 × 600 with Netscape Navigator 4.0</p>
        <p className="modem">Optimized for a blazing fast 56k modem!</p>
        <p className="copyright">© 2026–2031 Ibra's Home Page · Made with Zed</p>
      </footer>
    </main>
  );
}

export default App;
