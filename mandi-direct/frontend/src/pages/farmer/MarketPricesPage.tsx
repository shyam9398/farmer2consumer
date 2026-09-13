import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, MapPin, Calendar, AlertCircle, Volume2, Search } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { useLanguage } from '@/context/LanguageContext';

interface MarketPriceItem {
  id: string;
  commodity: string;
  category: string;
  variety?: string;
  market?: string;
  district?: string;
  state?: string;
  modal_price: number;
  min_price?: number;
  max_price?: number;
  price_unit: string;
  reported_date: string;
  source_name: string;
}

export const MarketPricesPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = [
    { id: 'all', label: t.marketPrices.categories.all, icon: '🏷️' },
    { id: 'grains', label: t.marketPrices.categories.grains, icon: '🌾' },
    { id: 'vegetables', label: t.marketPrices.categories.vegetables, icon: '🥬' },
    { id: 'fruits', label: t.marketPrices.categories.fruits, icon: '🍎' },
    { id: 'spices', label: t.marketPrices.categories.spices, icon: '🌶' },
    { id: 'pulses', label: t.marketPrices.categories.pulses, icon: '🫘' },
    { id: 'oilseeds', label: t.marketPrices.categories.oilseeds, icon: '🌻' },
  ];

  const { data, isLoading, error } = useQuery<{ items: MarketPriceItem[]; total: number }>({
    queryKey: ['marketPrices', selectedCategory],
    queryFn: async () => {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const res = await apiClient.get('/market-prices', { params });
      return res.data;
    },
  });

  const speakPrice = (item: MarketPriceItem) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      let text = '';
      if (language === 'hi') {
        text = `${item.commodity} का मंडी भाव ₹${item.modal_price} प्रति ${item.price_unit === 'PER_KG' ? 'किलो' : 'क्विंटल'} है।`;
      } else if (language === 'te') {
        text = `${item.commodity} మార్కెట్ ధర ₹${item.modal_price} ప్రతి ${item.price_unit === 'PER_KG' ? 'కిలోకు' : 'క్వింటాల్‌కు'}.`;
      } else {
        text = `The modal market price for ${item.commodity} is ₹${item.modal_price} per ${item.price_unit === 'PER_KG' ? 'kg' : 'quintal'}.`;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  const filteredItems = (data?.items || []).filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.commodity.toLowerCase().includes(term) ||
      (item.variety && item.variety.toLowerCase().includes(term)) ||
      (item.market && item.market.toLowerCase().includes(term))
    );
  });

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="border-b border-border/40 pb-5">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
          <TrendingUp className="h-4 w-4" />
          <span>APMC AGMARKNET & MANDI BENCHMARKS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {t.marketPrices.title}
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl">
          {t.marketPrices.subtitle}
        </p>
      </div>

      {/* Category Tabs */}
      <div data-tour-id="market-category-filters" className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-500'
                  : 'bg-secondary/40 text-slate-300 hover:bg-secondary/70 border border-border/40'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search Filter Box */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.common.search + ' commodity...'}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-background/50 border border-border/60 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
        <AlertCircle className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
        <span>{t.marketPrices.notice}</span>
      </div>

      {/* Price Table / Cards */}
      <div data-tour-id="market-prices-table">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="animate-spin inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
            <p>{t.common.loading}</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-amber-400 text-sm">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-400" />
            <p>{t.common.error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border/80 bg-secondary/10 p-8">
            <AlertCircle className="h-10 w-10 text-amber-400/80 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">
              {t.marketPrices.unavailable}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Verified market observations have not yet been posted for this category in your selected filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border/80 bg-secondary/20 p-5 space-y-4 hover:border-emerald-500/40 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {item.commodity}
                    </h3>
                    {item.variety && (
                      <p className="text-xs text-slate-400">{item.variety}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => speakPrice(item)}
                    title="Speak price"
                    aria-label="Speak price"
                    className="p-2 rounded-xl bg-secondary/50 text-slate-300 hover:text-emerald-400 hover:bg-secondary transition-colors"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Price Display */}
                <div className="bg-background/60 rounded-xl p-3 border border-border/50 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">
                      {t.marketPrices.modalPrice}
                    </span>
                    <span className="text-xl font-extrabold text-emerald-400">
                      ₹{item.modal_price}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">
                      / {item.price_unit === 'PER_KG' ? t.common.kg : item.price_unit.toLowerCase()}
                    </span>
                  </div>

                  {item.min_price && item.max_price && (
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">
                        {t.marketPrices.minMax}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        ₹{item.min_price} - ₹{item.max_price}
                      </span>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {item.market || item.district || 'Mandi'} ({item.state || 'India'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>
                      {t.marketPrices.updated}: {item.reported_date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPricesPage;
