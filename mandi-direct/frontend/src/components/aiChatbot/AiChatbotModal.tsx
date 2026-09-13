import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, Bot, User, Volume2, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { voiceGuidanceService } from '../../services/voice/VoiceGuidanceService';
import { useNavigationMapper } from '../../context/NavigationMapperContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  actionPrompt?: {
    actionId: string;
    label: string;
  };
}

interface AiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiChatbotModal: React.FC<AiChatbotModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { startNavigation } = useNavigationMapper();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'bot',
      text:
        language === 'hi'
          ? 'नमस्ते! मैं आपका मंडी डायरेक्ट एआई सहायक हूँ। आप मुझसे मंडी भाव, फसल बिक्री, लॉजिस्टिक्स या किसी भी सुविधा के बारे में पूछ सकते हैं।'
          : language === 'te'
          ? 'నమస్కారం! నేను మీ మండి డైరెక్ట్ AI సహాయకుడిని. మీరు మార్కెట్ ధరలు, పంట అమ్మకం, లాజిస్టిక్స్ లేదా ప్లాట్‌ఫారమ్ వివరాల గురించి అడగవచ్చు.'
          : 'Hello! I am your Mandi Direct AI Assistant. Ask me anything about market prices, direct selling, payments, or logistics.',
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Process answer knowledgeably based on topic without starting a tour automatically
    setTimeout(() => {
      const lower = query.toLowerCase();
      let reply = '';
      let actionPrompt: { actionId: string; label: string } | undefined = undefined;

      if (lower.includes('price') || lower.includes('bhav') || lower.includes('dharalu') || lower.includes('rate') || lower.includes('दाम')) {
        reply =
          language === 'hi'
            ? 'मंडी भाव सरकारी एपीएमसी और वास्तविक बाज़ार आंकड़ों से लिए गए हैं। आप 6 श्रेणियों (अनाज, सब्जियां, फल, मसाले, दालें, तिलहन) के भाव देख सकते हैं।'
            : language === 'te'
            ? 'మార్కెట్ ధరలు అధికారిక ఏపీఎంసీ డేటా నుండి తీసుకున్నవి. మీరు 6 వర్గాల వారీగా తాజా మార్కెట్ రేట్లను తెలుసుకోవచ్చు.'
            : 'Market prices are sourced from official APMC Mandi benchmark data across grains, vegetables, fruits, spices, pulses, and oilseeds to help you set fair prices.';
        actionPrompt = {
          actionId: 'market_prices',
          label: language === 'te' ? 'మార్కెట్ ధరల గైడ్ చూడండి' : language === 'hi' ? 'मंडी भाव गाइड शुरू करें' : 'Open Market Prices Guide',
        };
      } else if (lower.includes('upload') || lower.includes('crop') || lower.includes('fasal') || lower.includes('panta') || lower.includes('बेच') || lower.includes('అమ్మ')) {
        reply =
          language === 'hi'
            ? 'मंडी डायरेक्ट पर आप अपनी कटी हुई फसल को सीधे खरीदारों को बेच सकते हैं। बस फोटो लें, भाव तय करें और मात्रा दर्ज करें।'
            : language === 'te'
            ? 'మండి డైరెక్ట్‌లో మీరు మీ పంటను నేరుగా కొనుగోలుదారులకు అమ్మవచ్చు. ఫోటో అప్‌లోడ్ చేసి, మీ ధర మరియు పరిమాణాన్ని నమోదు చేయండి.'
            : 'You can sell your crops directly to verified buyers on Mandi Direct with zero middlemen fees. Enter your crop details, quantity, and expected price.';
        actionPrompt = {
          actionId: 'upload_crop',
          label: language === 'te' ? 'పంట అప్‌లోడ్ గైడ్ ప్రారంభించండి' : language === 'hi' ? 'फसल अपलोड गाइड शुरू करें' : 'Guide Me: How to Upload Crop',
        };
      } else if (lower.includes('order') || lower.includes('ऑर्डर') || lower.includes('ఆర్డర్')) {
        reply =
          language === 'hi'
            ? 'जब कोई खरीदार आपकी फसल खरीदता है, तो वह आपके "मेरे ऑर्डर" सेक्शन में दिखता है जहां आप उसे स्वीकार कर सकते हैं।'
            : language === 'te'
            ? 'కొనుగోలుదారులు మీ పంటను ఆర్డర్ చేసినప్పుడు, అది మీ "నా ఆర్డర్లు" విభాగంలో కనిపిస్తుంది.'
            : 'Incoming purchase orders from verified buyers are listed in your Orders section where you can accept them and prepare for pickup.';
        actionPrompt = {
          actionId: 'farmer_orders',
          label: language === 'te' ? 'ఆర్డర్ల గైడ్ చూడండి' : language === 'hi' ? 'ऑर्डर गाइड शुरू करें' : 'Guide Me: View Orders',
        };
      } else if (lower.includes('earning') || lower.includes('payout') || lower.includes('kamai') || lower.includes('aadaayam') || lower.includes('कमाई') || lower.includes('పైసలు')) {
        reply =
          language === 'hi'
            ? 'आपकी फसल की बिक्री का भुगतान सीधे आपके बैंक खाते में सुरक्षित रूप से ट्रांसफर किया जाता है। आप अपनी कमाई का पूरा विवरण कभी भी देख सकते हैं।'
            : language === 'te'
            ? 'మీ పంట అమ్మకాల ఆదాయం నేరుగా మీ బ్యాంక్ ఖాతాలో జమ అవుతుంది. మీరు మొత్తం లావాదేవీల వివరాలను పరిశీలించవచ్చు.'
            : 'Earnings from completed deliveries are verified and transferred directly to your registered bank account with zero unfair deductions.';
        actionPrompt = {
          actionId: 'farmer_earnings',
          label: language === 'te' ? 'ఆదాయం గైడ్ చూడండి' : language === 'hi' ? 'कमाई गाइड शुरू करें' : 'Guide Me: View Earnings',
        };
      } else {
        reply =
          language === 'hi'
            ? 'मंडी डायरेक्ट किसानों को सीधे उपभोक्ताओं और थोक खरीदारों से जोड़ता है। क्या आप फसल अपलोड करने, भाव देखने या कमाई के बारे में जानना चाहते हैं?'
            : language === 'te'
            ? 'మండి డైరెక్ట్ రైతులను నేరుగా వినియోగదారులతో అనుసంధానిస్తుంది. పంట అప్‌లోడ్, ధరలు లేదా ఆర్డర్ల గురించి మరింత సమాచారం కావాలా?'
            : 'Mandi Direct connects farmers directly to consumers and bulk buyers across India. How can I help you today?';
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply,
        actionPrompt,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 350);
  };

  const handleVoiceResult = (text: string) => {
    setInput(text);
    handleSendMessage(text);
  };

  const { isListening, isSupported, startListening, stopListening } = useVoiceInput({
    onResult: handleVoiceResult,
  });

  const speakText = (text: string) => {
    voiceGuidanceService.speak(text, language);
  };

  const handleTriggerNavigationFromChat = (actionId: string) => {
    onClose();
    startNavigation(actionId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-emerald-500/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px] max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Bot className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                💬 AI Chatbot
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              </h3>
              <p className="text-[11px] text-emerald-100">
                {language === 'hi' ? 'सवाल पूछें और तुरंत जवाब पाएं' : language === 'te' ? 'మీ ప్రశ్నలకు తక్షణ సమాధానాలు' : 'Instant Q&A and Assistance'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Chatbot"
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-slate-950/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                <p>{msg.text}</p>

                {msg.sender === 'bot' && (
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => speakText(msg.text)}
                      title="Speak response"
                      className="text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Listen</span>
                    </button>

                    {msg.actionPrompt && (
                      <button
                        type="button"
                        onClick={() => handleTriggerNavigationFromChat(msg.actionPrompt!.actionId)}
                        className="text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        🧭 {msg.actionPrompt.label}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Query Input */}
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'अपना सवाल पूछें...'
                  : language === 'te'
                  ? 'మీ ప్రశ్నను ఇక్కడ అడగండి...'
                  : 'Ask a question...'
              }
              className="w-full pl-3 pr-20 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {isSupported && (
                <button
                  type="button"
                  onClick={() => (isListening ? stopListening() : startListening())}
                  aria-label="Start voice input"
                  className={`p-1.5 rounded-lg transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                  }`}
                  title={isListening ? 'Listening...' : 'Speak'}
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                title="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
