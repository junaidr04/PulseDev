import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { emitInstantNotification, triggerNotificationRefresh } from '../utils/notificationBus';
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Bot,
  AtSign,
  Smile,
  Image as ImageIcon,
  FileText,
  Download,
  ExternalLink,
  Reply,
} from 'lucide-react';

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  url: string;
  size: string;
}

interface ChatMessage {
  _id: string;
  userId?: string;
  senderId?: string;
  userName?: string;
  senderName?: string;
  userRole?: string;
  senderRole?: string;
  userAvatar?: string;
  senderAvatar?: string;
  channel: string;
  text: string;
  isAiResponse?: boolean;
  isAi?: boolean;
  attachments?: ChatAttachment[];
  replyTo?: {
    messageId: string;
    userName: string;
    text: string;
  };
  createdAt: string;
}

const TEAM_MEMBERS = [
  {
    id: '1',
    name: 'Alex Chen',
    handle: 'Alex Chen',
    shortHandle: 'Alex',
    role: 'Principal Architect',
    badge: 'Architect',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80',
  },
  {
    id: '2',
    name: 'Priya Patel',
    handle: 'Priya Patel',
    shortHandle: 'Priya',
    role: 'Staff Backend Lead',
    badge: 'Staff Lead',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=128&h=128&q=80',
  },
  {
    id: '3',
    name: 'Marcus Vance',
    handle: 'Marcus Vance',
    shortHandle: 'Marcus',
    role: 'Senior Software Engineer',
    badge: 'Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80',
  },
  {
    id: '4',
    name: 'Sophia Laurent',
    handle: 'Sophia Laurent',
    shortHandle: 'Sophia',
    role: 'QA Automation Lead',
    badge: 'QA Lead',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=128&h=128&q=80',
  },
  {
    id: '5',
    name: 'Jordan Blake',
    handle: 'Jordan Blake',
    shortHandle: 'Jordan',
    role: 'Product Manager',
    badge: 'Product',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&h=128&q=80',
  },
  {
    id: 'ai',
    name: 'PulseDev AI Copilot',
    handle: 'ai',
    shortHandle: 'ai',
    role: 'Automated Engineering Assistant',
    badge: 'AI Copilot',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&h=128&q=80',
  },
];

const EMOJI_LIST = [
  '👍', '🔥', '🚀', '✅', '🎉', '❤️', '👀', '💯',
  '⚡', '🛠️', '🐛', '📈', '🙌', '👏', '🤔', '🎯',
  '🔒', '✨', '💻', '☕', '🙏', '😄', '😎', '🥳',
  '🤩', '💡', '📌', '🏆', '⏱️', '📦', '🔍', '🤝',
];

const CHAT_STORAGE_KEY = 'pulsedev_chat_history_v2';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    _id: 'seed-msg-1',
    userId: '66a1bf9823e4d5c6b7a89001',
    userName: 'Alex Chen',
    userRole: 'admin',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80',
    channel: 'engineering-sync',
    text: 'Good morning engineering team! Sprint 44 is live. Marcus, please prioritize the MongoDB compound indexing for PAY-103.',
    attachments: [
      {
        id: 'att-init-pdf',
        name: 'Sprint-44-Payment-Engine-Spec.pdf',
        type: 'pdf',
        url: 'data:application/pdf;base64,JVBERi0xLjQKJcfs...',
        size: '420 KB',
      },
    ],
    createdAt: '2026-10-07T10:21:00.000Z',
  },
  {
    _id: 'seed-msg-2',
    userId: '66a1bf9823e4d5c6b7a89003',
    userName: 'Marcus Vance',
    userRole: 'developer',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80',
    channel: 'engineering-sync',
    text: 'On it, Alex! The compound index { projectId: 1, column: 1, priority: 1 } reduced query latency down to 2ms in staging.',
    createdAt: '2026-10-07T10:51:00.000Z',
  },
  {
    _id: 'seed-msg-3',
    userId: '66a1bf9823e4d5c6b7a89004',
    userName: 'Sophia Laurent',
    userRole: 'qa',
    userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=128&h=128&q=80',
    channel: 'engineering-sync',
    text: 'Automated Playwright & Jest test suites have passed on the PR. Ready for review.',
    createdAt: '2026-10-07T11:21:00.000Z',
  },
];

function loadSavedMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return INITIAL_MESSAGES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return mergeMessageLists(INITIAL_MESSAGES, parsed);
    }
  } catch {
    // ignore storage read error
  }
  return INITIAL_MESSAGES;
}

function saveMessagesToStorage(list: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
}

// Merge existing messages and incoming server messages without EVER deleting previous history
function mergeMessageLists(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();

  const normalizeKey = (m: ChatMessage) =>
    `${(m.userName || m.senderName || '').toLowerCase()}::${(m.text || '').trim()}`;

  // First add all existing messages
  for (const msg of existing) {
    if (!msg || !msg._id) continue;
    byId.set(msg._id, msg);
  }

  // Next merge incoming messages; if an incoming server message matches an optimistic `local-*` message, replace the temp id cleanly
  for (const inc of incoming) {
    if (!inc || !inc._id) continue;
    for (const [key, cur] of byId.entries()) {
      if (
        key.startsWith('local-') &&
        !inc._id.startsWith('local-') &&
        normalizeKey(cur) === normalizeKey(inc)
      ) {
        byId.delete(key);
      }
      // Also deduplicate legacy m1/m2/m3 seed IDs against seed-msg-1/2/3
      if (
        (key === 'm1' || key === 'm2' || key === 'm3') &&
        normalizeKey(cur) === normalizeKey(inc)
      ) {
        byId.delete(key);
      }
    }
    const prev = byId.get(inc._id);
    byId.set(inc._id, {
      ...prev,
      ...inc,
      attachments:
        inc.attachments && inc.attachments.length > 0
          ? inc.attachments
          : prev?.attachments,
    });
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function renderMessageWithMentions(text: string, isMe: boolean) {
  if (!text) return null;
  const parts = text.split(/(@(?:Alex Chen|Priya Patel|Marcus Vance|Sophia Laurent|Jordan Blake|Alex|Priya|Marcus|Sophia|Jordan|ai\b))/gi);

  return parts.map((part, idx) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={idx}
          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold mx-0.5 ${
            isMe
              ? 'bg-[#0b0c0e]/15 text-[#0b0c0e] underline decoration-[#0b0c0e]/40'
              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
          }`}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function getRoleBadgeLabel(role?: string, isBot?: boolean) {
  if (isBot) return 'AI Copilot';
  switch (role) {
    case 'admin':
      return 'Architect';
    case 'lead':
      return 'Staff Lead';
    case 'developer':
      return 'Engineer';
    case 'qa':
      return 'QA Lead';
    case 'guest':
      return 'Product';
    default:
      return 'Engineer';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const TeamChatWidget: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadSavedMessages());
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Per-user read message IDs so every member sees accurate unread badge count
  const [readMsgIdsByUser, setReadMsgIdsByUser] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('pulsedev_chat_read_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Popovers & Media State
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [previewImageModal, setPreviewImageModal] = useState<ChatAttachment | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const prevUserEmailRef = useRef<string | undefined>(user?.email);

  const currentUserKey = user?.email || user?._id || 'default';

  const markMessagesReadForCurrentUser = (msgList: ChatMessage[]) => {
    if (!currentUserKey) return;
    const ids = msgList.map((m) => m._id);
    setReadMsgIdsByUser((prev) => {
      const existing = prev[currentUserKey] || [];
      const merged = Array.from(new Set([...existing, ...ids]));
      if (merged.length === existing.length) return prev;
      const updated = { ...prev, [currentUserKey]: merged };
      try {
        localStorage.setItem('pulsedev_chat_read_map', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // When switching to a different account, close the chat drawer so they clearly see their unread badge count
  useEffect(() => {
    if (prevUserEmailRef.current && user?.email && prevUserEmailRef.current !== user.email) {
      setIsOpen(false);
    }
    prevUserEmailRef.current = user?.email;
  }, [user?.email]);

  const fetchMessages = async () => {
    try {
      const res = await api.messages.getAll();
      if (res.success && Array.isArray(res.messages) && res.messages.length > 0) {
        setMessages((prev) => {
          const cached = loadSavedMessages();
          const combinedBase = mergeMessageLists(cached, prev);
          const merged = mergeMessageLists(combinedBase, res.messages);
          saveMessagesToStorage(merged);
          return merged;
        });
      }
    } catch {
      // Keep existing messages smoothly
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 2500);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (isOpen) {
      markMessagesReadForCurrentUser(messages);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, currentUserKey]);

  // Compute unread count for the active user (all messages not sent by current user and not yet read by current user)
  const userReadList = readMsgIdsByUser[currentUserKey] || [];
  const unreadCount = isOpen
    ? 0
    : messages.filter((m) => {
        const sender = (m.userName || m.senderName || '').toLowerCase();
        const me = (user?.name || '').toLowerCase();
        if (sender && me && sender === me) return false;
        return !userReadList.includes(m._id);
      }).length;

  if (!isAuthenticated) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const match = val.match(/@([a-zA-Z]*)$/);
    if (match) {
      setMentionPickerOpen(true);
      setEmojiPickerOpen(false);
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionPickerOpen(false);
      setMentionQuery('');
    }
  };

  const handleInsertMention = (memberHandle: string) => {
    if (/@([a-zA-Z]*)$/.test(input)) {
      setInput((prev) => prev.replace(/@([a-zA-Z]*)$/, `@${memberHandle} `));
    } else {
      setInput((prev) => `${prev}${prev.endsWith(' ') || !prev ? '' : ' '}@${memberHandle} `);
    }
    setMentionPickerOpen(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const handleInsertEmoji = (emoji: string) => {
    setInput((prev) => `${prev}${emoji}`);
    inputRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        const newAtt: ChatAttachment = {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: 'image',
          url: dataUrl,
          size: formatFileSize(file.size),
        };
        setPendingAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        const newAtt: ChatAttachment = {
          id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: 'pdf',
          url: dataUrl,
          size: formatFileSize(file.size),
        };
        setPendingAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || sending) return;

    const textToSend = input.trim();
    const attachmentsToSend = [...pendingAttachments];
    const replyTo = replyingTo
      ? {
          messageId: replyingTo._id,
          userName: replyingTo.userName || replyingTo.senderName || 'Teammate',
          text: replyingTo.text || 'Attachment',
        }
      : undefined;

    setInput('');
    setPendingAttachments([]);
    setReplyingTo(null);
    setMentionPickerOpen(false);
    setEmojiPickerOpen(false);
    setSending(true);

    const attachmentSummary =
      attachmentsToSend.length > 0
        ? ` [Attached: ${attachmentsToSend.map((a) => a.name).join(', ')}]`
        : '';

    const optimisticMsg: ChatMessage = {
      _id: `local-${Date.now()}`,
      userId: user?._id || '1',
      userName: user?.name || 'Alex Chen',
      userRole: user?.role || 'admin',
      userAvatar:
        user?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80',
      channel: 'engineering-sync',
      text: textToSend,
      attachments: attachmentsToSend,
      replyTo,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => {
      const next = mergeMessageLists(prev, [optimisticMsg]);
      saveMessagesToStorage(next);
      markMessagesReadForCurrentUser(next);
      return next;
    });

    try {
      const res = await api.messages.send(textToSend, 'engineering-sync', attachmentsToSend, replyTo);
      if (res.success) {
        if (res.message) {
          setMessages((prev) => {
            const merged = mergeMessageLists(prev, [res.message]);
            saveMessagesToStorage(merged);
            markMessagesReadForCurrentUser(merged);
            return merged;
          });
        }
        await fetchMessages();
        setTimeout(() => {
          fetchMessages();
        }, 1050);
      }
    } catch {
      // Keep optimistic message in localStorage & state
    } finally {
      setSending(false);
    }
  };

  const filteredMentions = TEAM_MEMBERS.filter(
    (m) =>
      !mentionQuery ||
      m.name.toLowerCase().includes(mentionQuery) ||
      m.role.toLowerCase().includes(mentionQuery)
  );

  return (
    <>
      {/* Full-Screen Image Lightbox Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] rounded-2xl border border-white/[0.12] bg-[#111317] p-3 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 px-1 border-b border-white/[0.08]">
              <span className="text-xs font-medium text-white truncate">
                {previewImageModal.name} ({previewImageModal.size})
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageModal.url}
                  download={previewImageModal.name}
                  className="flex items-center gap-1 rounded-lg bg-white/[0.08] px-2.5 py-1 text-[11px] text-neutral-200 hover:bg-white/[0.15]"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewImageModal(null)}
                  className="text-neutral-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <img
              src={previewImageModal.url}
              alt={previewImageModal.name}
              className="mt-2 max-h-[74vh] w-auto object-contain rounded-lg mx-auto"
            />
          </div>
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-50">
        {/* Minimized Trigger Button (Floating Glass Layer with >=44x44px Touch Target) */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open Team Chat"
            className="group flex min-h-[48px] min-w-[48px] items-center justify-center gap-2.5 rounded-full border border-white/[0.16] bg-[#121621]/80 p-2.5 sm:pl-3 sm:pr-4 sm:py-2.5 text-xs font-medium text-neutral-100 backdrop-blur-xl shadow-[0_12px_36px_-4px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)_inset,0_0_24px_rgba(16,185,129,0.14)] hover:border-emerald-400/40 hover:bg-[#171c29]/90 transition-all cursor-pointer"
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-[#090b10] shadow-sm">
              <MessageSquare className="h-3.5 w-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#121621]">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-semibold tracking-tight">Team Chat</span>
          </button>
        )}

        {/* Open Chat Window */}
        {isOpen && (
          <div
            className={`relative flex flex-col rounded-2xl border border-white/[0.14] bg-[#111317] shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_36px_rgba(16,185,129,0.15)] overflow-hidden transition-all duration-200 animate-modal-pop ${
              isExpanded
                ? 'w-[94vw] sm:w-[540px] h-[640px]'
                : 'w-[92vw] sm:w-[420px] h-[540px]'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 z-10" />
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#14161b] px-4 py-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-xs text-white">#engineering-sync</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Share PDFs, pictures, emojis & <span className="font-mono text-neutral-300">@mention</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex -space-x-1.5 mr-1">
                  {TEAM_MEMBERS.slice(0, 4).map((m) => (
                    <img
                      key={m.id}
                      src={m.avatar}
                      alt={m.name}
                      title={`${m.name} (${m.role})`}
                      className="h-5.5 w-5.5 rounded-full object-cover ring-2 ring-[#14161b]"
                    />
                  ))}
                </div>

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="rounded-md p-1.5 text-neutral-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                  title={isExpanded ? 'Compact size' : 'Expand'}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1.5 text-neutral-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const senderName = msg.userName || msg.senderName || 'Alex Chen';
                const senderRole = msg.userRole || msg.senderRole || 'developer';
                const isBot = Boolean(
                  msg.isAiResponse || msg.isAi || senderRole === 'bot' || senderName.includes('AI')
                );
                const matchedMember = TEAM_MEMBERS.find(
                  (m) => m.name.toLowerCase() === senderName.toLowerCase()
                );
                const senderAvatar =
                  msg.userAvatar ||
                  msg.senderAvatar ||
                  matchedMember?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80';

                const isMe = senderName === user?.name && !isBot;
                const roleBadge = getRoleBadgeLabel(senderRole, isBot);

                const rawTime = msg.createdAt ? new Date(msg.createdAt) : new Date();
                const validTime = isNaN(rawTime.getTime()) ? new Date() : rawTime;

                return (
                  <div
                    key={msg._id}
                    className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Sender Profile Picture */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      {isBot ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                          <Bot className="h-4 w-4" />
                        </div>
                      ) : (
                        <img
                          src={senderAvatar}
                          alt={senderName}
                          className="h-8 w-8 rounded-full object-cover border border-white/[0.12]"
                        />
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#111317] ${
                          isBot ? 'bg-indigo-400' : 'bg-emerald-400'
                        }`}
                      />
                    </div>

                    {/* Message Content & Attachments */}
                    <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`flex items-center gap-1.5 mb-1 ${
                          isMe ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <span className="text-xs font-semibold text-white">
                          {senderName}
                        </span>
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.2 text-[10px] text-neutral-400 font-medium">
                          {roleBadge}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {validTime.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {(msg.text || msg.replyTo) && (
                        <div
                          className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            isBot
                              ? 'bg-indigo-500/10 border border-indigo-500/25 text-neutral-100'
                              : isMe
                              ? 'bg-white text-[#0b0c0e] font-medium'
                              : 'bg-[#171a21] border border-white/[0.07] text-neutral-200'
                          }`}
                        >
                          {msg.replyTo && (
                            <div
                              className={`mb-2 rounded-lg border-l-[3px] px-2.5 py-1.5 ${
                                isMe
                                  ? 'border-[#0b0c0e]/50 bg-black/[0.06] text-[#0b0c0e]/75'
                                  : 'border-indigo-400 bg-white/[0.06] text-neutral-300'
                              }`}
                            >
                              <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold">
                                <Reply className="h-3 w-3 shrink-0" />
                                <span>
                                  Replying to {msg.replyTo.userName || 'Teammate'}
                                </span>
                              </div>
                              <div className="line-clamp-2 break-words text-[11px] opacity-80">
                                {msg.replyTo.text || 'Attachment'}
                              </div>
                            </div>
                          )}
                          {renderMessageWithMentions(msg.text, isMe)}
                        </div>
                      )}

                      {/* Rendered Image & PDF Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2 w-full">
                          {msg.attachments.map((att) =>
                            att.type === 'image' ? (
                              <div
                                key={att.id}
                                onClick={() => setPreviewImageModal(att)}
                                className="group relative overflow-hidden rounded-xl border border-white/[0.12] bg-[#161920] cursor-pointer max-w-[240px]"
                              >
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="max-h-44 w-full object-cover group-hover:scale-[1.02] transition-transform"
                                />
                                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0e1014]/90 text-[10px] text-neutral-300">
                                  <span className="truncate max-w-[160px]">{att.name}</span>
                                  <span className="text-neutral-500 font-mono">{att.size}</span>
                                </div>
                              </div>
                            ) : (
                              <div
                                key={att.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.1] bg-[#161920] px-3 py-2.5 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex-shrink-0">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-white truncate max-w-[165px]">
                                      {att.name}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 font-mono">
                                      PDF Document · {att.size}
                                    </div>
                                  </div>
                                </div>

                                <a
                                  href={att.url}
                                  download={att.name}
                                  className="flex items-center gap-1 rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-[11px] font-medium text-neutral-200 hover:bg-white hover:text-[#0b0c0e] transition-colors flex-shrink-0"
                                  title="Download PDF"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>PDF</span>
                                </a>
                              </div>
                            )
                          )}
                        </div>
                      )}
                      {!isBot && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(msg);
                            inputRef.current?.focus();
                          }}
                          className="mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200"
                          title={`Reply to ${senderName}`}
                        >
                          <Reply className="h-3 w-3" />
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Picker Popover */}
            {emojiPickerOpen && (
              <div className="border-t border-white/[0.08] bg-[#161920] p-3">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                  <span className="text-[11px] font-medium text-neutral-300">
                    Insert Emoji
                  </span>
                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen(false)}
                    className="text-neutral-500 hover:text-white text-xs cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-base hover:bg-white/[0.1] transition-colors cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive @Mention Popover Menu */}
            {mentionPickerOpen && (
              <div className="border-t border-white/[0.08] bg-[#161920] p-2 max-h-44 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-medium text-neutral-400 flex items-center justify-between">
                  <span>Mention a teammate or assistant</span>
                  <button
                    type="button"
                    onClick={() => setMentionPickerOpen(false)}
                    className="text-neutral-500 hover:text-white cursor-pointer"
                  >
                    Esc
                  </button>
                </div>
                <div className="space-y-0.5 mt-1">
                  {filteredMentions.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleInsertMention(member.handle)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.07] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                        <div>
                          <span className="font-medium text-white">{member.name}</span>
                          <span className="ml-1.5 text-[11px] text-neutral-400">
                            @{member.shortHandle}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-500">{member.badge}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Attachments Preview Strip (Before Sending) */}
            {pendingAttachments.length > 0 && (
              <div className="border-t border-white/[0.08] bg-[#161920] px-3 py-2 flex items-center gap-2 overflow-x-auto">
                {pendingAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#0e1014] pl-2 pr-1.5 py-1 text-xs flex-shrink-0"
                  >
                    {att.type === 'image' ? (
                      <img
                        src={att.url}
                        alt={att.name}
                        className="h-6 w-6 rounded object-cover"
                      />
                    ) : (
                      <FileText className="h-4 w-4 text-rose-400 flex-shrink-0" />
                    )}
                    <div className="max-w-[120px] truncate">
                      <div className="text-[11px] text-white truncate">{att.name}</div>
                      <div className="text-[9px] text-neutral-500 font-mono">{att.size}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendingAttachment(att.id)}
                      className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick @Mention Chips Bar */}
            <div className="border-t border-white/[0.06] bg-[#131519] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] text-neutral-500 whitespace-nowrap mr-0.5">
                Mention:
              </span>
              {TEAM_MEMBERS.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleInsertMention(member.handle)}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#181b22] pl-1 pr-2 py-0.5 text-[11px] text-neutral-300 hover:border-white/[0.18] hover:text-white whitespace-nowrap cursor-pointer flex-shrink-0"
                  title={`Mention ${member.name} (${member.role})`}
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                  <span>@{member.shortHandle}</span>
                </button>
              ))}
            </div>

            {/* Hidden Native File Inputs for Picture and PDF */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf,.doc,.docx,.txt"
              multiple
              onChange={handlePdfUpload}
              className="hidden"
            />

            {/* Chat Input & Rich Toolbar Form */}
            {replyingTo && (
              <div className="flex items-center justify-between gap-3 border-t border-indigo-400/20 bg-indigo-500/[0.06] px-3 py-2">
                <div className="min-w-0 border-l-2 border-indigo-400 pl-2">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300">
                    <Reply className="h-3 w-3 shrink-0" />
                    <span>
                      Replying to {replyingTo.userName || replyingTo.senderName || 'Teammate'}
                    </span>
                  </div>
                  <div className="truncate text-[11px] text-neutral-400">
                    {replyingTo.text || 'Attachment'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="flex-shrink-0 rounded p-1 text-neutral-500 hover:text-white"
                  aria-label="Cancel reply"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <form
              onSubmit={handleSend}
              className="border-t border-white/[0.07] bg-[#14161b] p-2.5 flex items-center gap-1.5"
            >
              {/* Upload Picture Button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0e1014] text-neutral-400 hover:border-white/[0.18] hover:text-emerald-400 transition-colors cursor-pointer flex-shrink-0"
                title="Add Picture / Screenshot"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>

              {/* Upload PDF Document Button */}
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0e1014] text-neutral-400 hover:border-white/[0.18] hover:text-rose-400 transition-colors cursor-pointer flex-shrink-0"
                title="Attach PDF Document"
              >
                <FileText className="h-3.5 w-3.5" />
              </button>

              {/* Emoji Picker Button */}
              <button
                type="button"
                onClick={() => {
                  setEmojiPickerOpen(!emojiPickerOpen);
                  setMentionPickerOpen(false);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer flex-shrink-0 ${
                  emojiPickerOpen
                    ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                    : 'border-white/[0.08] bg-[#0e1014] text-neutral-400 hover:border-white/[0.18] hover:text-amber-300'
                }`}
                title="Add Emoji"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>

              {/* @Mention Button */}
              <button
                type="button"
                onClick={() => {
                  setMentionPickerOpen(!mentionPickerOpen);
                  setEmojiPickerOpen(false);
                  inputRef.current?.focus();
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer flex-shrink-0 ${
                  mentionPickerOpen
                    ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/[0.08] bg-[#0e1014] text-neutral-400 hover:border-white/[0.18] hover:text-indigo-300'
                }`}
                title="Mention a team member (@)"
              >
                <AtSign className="h-3.5 w-3.5" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Message, add PDF/pic, emoji, or @mention..."
                className="flex-1 min-w-0 rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none"
              />

              <button
                type="submit"
                disabled={(!input.trim() && pendingAttachments.length === 0) || sending}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0b0c0e] hover:bg-neutral-200 disabled:opacity-40 cursor-pointer flex-shrink-0"
                title="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default TeamChatWidget;
