'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MessageCircleQuestion,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { HelpChatMessage } from '@/types';
import { VoiceAssistant } from '@/lib/services/ai-service';

interface ArunaHelpWidgetProps {
  // Currently open tab key in the cooperative dashboard (e.g. 'kasir', 'stok').
  // Sent to the API as extra context so answers can be more relevant, but the
  // assistant is still restricted to the product-knowledge scope server-side.
  activeTab?: string | null;
}

const GREETING: HelpChatMessage = {
  role: 'assistant',
  content:
    'Halo! Saya Aruna Help. Saya bisa membantu menjelaskan cara memakai fitur-fitur di Portal Mitra ARUNA, seperti Kasir POS, Stok & Opname, Pembelian, Anggota, Laporan Keuangan, Permintaan Pasar, Connector & Pengadaan, hingga Bagi Hasil (SHU). Ada yang ingin Anda ketahui?',
};

export default function ArunaHelpWidget({ activeTab }: ArunaHelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<HelpChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const assistantRef = useRef<VoiceAssistant | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    assistantRef.current = new VoiceAssistant(
      (text) => setInput(text),
      () => setIsListening(false),
      () => setIsListening(false)
    );
    return () => {
      assistantRef.current?.stop();
      if (speechSupported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const toggleListening = () => {
    if (!assistantRef.current?.isSupported()) return;
    if (isListening) {
      assistantRef.current.stop();
      setIsListening(false);
    } else {
      setInput('');
      assistantRef.current.start();
      setIsListening(true);
    }
  };

  const speak = (text: string, index: number) => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (isListening) {
      assistantRef.current?.stop();
      setIsListening(false);
    }

    const nextMessages: HelpChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(0, -1),
          activeTab: activeTab ?? null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Rate-limit responses (429) carry a friendly, ready-to-show message.
        const friendly = res.status === 429 && data.error
          ? data.error
          : 'Maaf, terjadi gangguan saat menghubungi asisten. Silakan coba lagi sebentar.';
        setMessages((prev) => [...prev, { role: 'assistant', content: friendly }]);
        return;
      }

      const replyIndex = nextMessages.length;
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);

      if (voiceReplyEnabled) {
        speak(data.reply, replyIndex);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Maaf, terjadi gangguan saat menghubungi asisten. Silakan coba lagi sebentar.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating trigger button — positioned left of the AI Command Center mic
          bubble so the two floating actions don't overlap. */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-24 h-14 w-14 rounded-full bg-brand-orange hover:bg-brand-orange/95 text-white shadow-2xl flex items-center justify-center cursor-pointer z-40 transition-transform active:scale-95 group"
        title="Buka Aruna Help"
        aria-label="Buka Aruna Help"
      >
        <MessageCircleQuestion className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative flex flex-col w-full sm:w-[420px] bg-white h-full shadow-2xl animate-slide-in-right z-50">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-brand-orange text-white flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-900 block leading-tight">Aruna Help</span>
                  <span className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider block">
                    Asisten Fitur Dashboard Koperasi
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {speechSupported && (
                  <button
                    onClick={() => {
                      if (voiceReplyEnabled) stopSpeaking();
                      setVoiceReplyEnabled((v) => !v);
                    }}
                    title={voiceReplyEnabled ? 'Matikan suara jawaban' : 'Aktifkan suara jawaban'}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${voiceReplyEnabled ? 'bg-brand-orange/10 text-brand-orange' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                  >
                    {voiceReplyEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scope disclaimer */}
            <div className="px-5 pt-3 pb-1 shrink-0">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Aruna Help hanya menjawab pertanyaan seputar cara memakai fitur dashboard koperasi ARUNA.
              </p>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${m.role === 'user'
                        ? 'bg-brand-navy text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                      }`}
                  >
                    {m.content}
                    {m.role === 'assistant' && speechSupported && (
                      <button
                        onClick={() => (speakingIndex === i ? stopSpeaking() : speak(m.content, i))}
                        className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-brand-orange hover:underline cursor-pointer"
                      >
                        {speakingIndex === i ? (
                          <>
                            <VolumeX className="h-3 w-3" /> Hentikan
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3" /> Dengarkan
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <div className="h-7 w-7 rounded-lg bg-brand-navy/10 text-brand-navy flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-3 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-semibold">Aruna Help mengetik...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-slate-100 p-4 shrink-0 space-y-2">
              {isListening && (
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-red">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" /> Mendengarkan...
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tanyakan cara memakai fitur dashboard, cth: 'Bagaimana cara input barang baru?'"
                  rows={1}
                  className="flex-1 resize-none px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy max-h-24"
                />
                {assistantRef.current?.isSupported() && (
                  <button
                    onClick={toggleListening}
                    title={isListening ? 'Hentikan rekaman suara' : 'Tanya dengan suara'}
                    className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${isListening ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  title="Kirim"
                  className="h-10 w-10 shrink-0 rounded-xl bg-brand-orange hover:bg-brand-orange/95 text-white flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
