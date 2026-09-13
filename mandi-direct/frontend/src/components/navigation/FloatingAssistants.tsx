import React, { useState } from 'react';
import { Bot, Compass } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { NavigationMapperPanel } from '../navigationMapper/NavigationMapperPanel';
import { AiChatbotModal } from '../aiChatbot/AiChatbotModal';

export const FloatingAssistants: React.FC = () => {
  const { language } = useLanguage();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isNavMapperOpen, setIsNavMapperOpen] = useState(false);

  return (
    <>
      {/* Floating Action Buttons in bottom-right */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Button 1: 💬 AI Chatbot */}
        <button
          type="button"
          onClick={() => {
            setIsNavMapperOpen(false);
            setIsChatbotOpen(true);
          }}
          aria-label="Open AI Chatbot"
          title={language === 'hi' ? 'एआई चैटबॉट (सवाल पूछें)' : language === 'te' ? 'AI చాట్‌బాట్ (ప్రశ్నలు అడగండి)' : 'AI Chatbot (Q&A)'}
          className="group flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/30"
        >
          <Bot className="h-5 w-5 text-white" />
          <span className="text-xs font-bold whitespace-nowrap">
            {language === 'hi' ? '💬 एआई चैटबॉट' : language === 'te' ? '💬 AI చాట్‌బాట్' : '💬 AI Chatbot'}
          </span>
        </button>

        {/* Button 2: 🧭 Navigation Mapper */}
        <button
          type="button"
          onClick={() => {
            setIsChatbotOpen(false);
            setIsNavMapperOpen(true);
          }}
          aria-label="Open Navigation Mapper"
          title={language === 'hi' ? 'नेविगेशन मैपर (मार्गदर्शन)' : language === 'te' ? 'నావిగేషన్ మ్యాపర్ (మార్గదర్శకత్వం)' : 'Navigation Mapper (Guided Step-by-Step)'}
          className="group relative flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-600 to-emerald-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/30"
        >
          <Compass className="h-5 w-5 text-amber-200 animate-spin-slow" />
          <span className="text-xs font-bold whitespace-nowrap">
            {language === 'hi' ? '🧭 नेविगेशन मैपर' : language === 'te' ? '🧭 నావిగేషన్ మ్యాపర్' : '🧭 Navigation Mapper'}
          </span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </button>
      </div>

      {/* Navigation Mapper Panel */}
      <NavigationMapperPanel
        isOpen={isNavMapperOpen}
        onClose={() => setIsNavMapperOpen(false)}
      />

      {/* Standalone AI Chatbot Modal */}
      <AiChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </>
  );
};
