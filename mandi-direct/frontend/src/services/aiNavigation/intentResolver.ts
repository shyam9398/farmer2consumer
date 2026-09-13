export interface ResolvedIntent {
  actionId: string;
  targetRoute: string;
  tourId?: string;
  confidence: number;
  label: {
    en: string;
    hi: string;
    te: string;
  };
}

interface IntentPattern {
  actionId: string;
  targetRoute: string;
  tourId?: string;
  label: {
    en: string;
    hi: string;
    te: string;
  };
  keywords: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    actionId: 'upload_crop',
    targetRoute: '/farmer/produce/new',
    tourId: 'upload_crop_tour',
    label: {
      en: 'Upload Crop for Sale',
      hi: 'फसल बिक्री के लिए जोड़ें',
      te: 'పంటను అమ్మకానికి చేర్చండి',
    },
    keywords: [
      'upload', 'crop', 'produce', 'sell', 'add crop', 'add produce', 'fasal', 'bechna',
      'becho', 'fasal jodna', 'panta', 'ammadam', 'ammandi', 'upload crop', 'new crop',
      'bechna chahta', 'ammali',
      'फसल', 'बेचना', 'बेचें', 'बेच', 'अपलोड', 'नया फसल',
      'పంట', 'అమ్మకం', 'అమ్మాలి', 'అమ్మడానికి', 'అప్‌లోడ్', 'అప్లోడ్'
    ],
  },
  {
    actionId: 'market_prices',
    targetRoute: '/farmer/market-prices',
    tourId: 'market_prices_tour',
    label: {
      en: 'Check Market Prices',
      hi: 'मंडी भाव देखें',
      te: 'మార్కెట్ ధరలు చూడండి',
    },
    keywords: [
      'price', 'prices', 'rate', 'market', 'mandi', 'bhav', 'mandi bhav', 'apmc',
      'kimat', 'dharalu', 'rate lu', 'mandi rate', 'market price', 'aaj ka bhav',
      'panta dharalu', 'crop price',
      'मंडी', 'भाव', 'दाम', 'मंडी भाव', 'रेट',
      'ధరలు', 'రేట్లు', 'మార్కెట్ ధర', 'ధర'
    ],
  },
  {
    actionId: 'farmer_orders',
    targetRoute: '/farmer/orders',
    tourId: 'orders_tour',
    label: {
      en: 'Check Customer Orders',
      hi: 'ग्राहकों के ऑर्डर देखें',
      te: 'కస్టమర్ ఆర్డర్లు చూడండి',
    },
    keywords: [
      'order', 'orders', 'my orders', 'customer', 'status', 'buyer order', 'order dekhna',
      'order status', 'grahak', 'kisan order', 'order lu', 'naa order',
      'ऑर्डर', 'ग्राहक',
      'ఆర్డర్లు', 'ఆర్డర్'
    ],
  },
  {
    actionId: 'earnings',
    targetRoute: '/farmer/earnings',
    tourId: 'earnings_tour',
    label: {
      en: 'Check My Earnings & Payouts',
      hi: 'मेरी कमाई और भुगतान देखें',
      te: 'నా ఆదాయం మరియు చెల్లింపులు',
    },
    keywords: [
      'earning', 'earnings', 'payout', 'payouts', 'money', 'balance', 'kamai', 'paisa',
      'aadaayam', 'rupaiye', 'khata', 'bank payment', 'kitna kamaya',
      'कमाई', 'पैसे', 'रुपये', 'भुगतान',
      'ఆదాయం', 'చెల్లింపులు', 'డబ్బులు', 'ఖాతా'
    ],
  },
  {
    actionId: 'profile',
    targetRoute: '/farmer/profile',
    tourId: 'profile_tour',
    label: {
      en: 'Update Farm Location & Profile',
      hi: 'खेत का पता और प्रोफाइल अपडेट करें',
      te: 'పొలం చిరునామా మరియు ప్రొఫైల్',
    },
    keywords: [
      'profile', 'address', 'farm', 'location', 'gps', 'khet', 'pata', 'sthan',
      'polam', 'address update', 'chirunaama', 'phone number', 'change address',
      'प्रोफाइल', 'खेत', 'पता', 'स्थान',
      'ప్రొఫైల్', 'పొలం', 'చిరునామా'
    ],
  },
  {
    actionId: 'notifications',
    targetRoute: '/notifications',
    label: {
      en: 'View Notifications',
      hi: 'सूचनाएं देखें',
      te: 'నోటిఫికేషన్లు చూడండి',
    },
    keywords: [
      'notification', 'notifications', 'alert', 'alerts', 'suchna', 'suchnaye',
      'samacharam', 'message', 'bell',
      'सूचनाएं', 'सूचना', 'संदेश',
      'నోటిఫికేషన్లు', 'సమాచారం'
    ],
  },
  {
    actionId: 'marketplace',
    targetRoute: '/marketplace',
    label: {
      en: 'Browse Marketplace',
      hi: 'मंडी बाज़ार देखें',
      te: 'మార్కెట్‌ప్లేస్ చూడండి',
    },
    keywords: [
      'marketplace', 'buy', 'market', 'all crops', 'kharidna', 'konadam', 'bazaar'
    ],
  },
];

export const resolveIntent = (query: string): ResolvedIntent | null => {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;

  let bestMatch: IntentPattern | null = null;
  let maxScore = 0;

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;
    for (const kw of pattern.keywords) {
      if (normalized === kw) {
        score += 10;
      } else if (normalized.includes(kw)) {
        score += 3 + kw.length / 5;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = pattern;
    }
  }

  if (bestMatch && maxScore >= 3) {
    return {
      actionId: bestMatch.actionId,
      targetRoute: bestMatch.targetRoute,
      tourId: bestMatch.tourId,
      confidence: Math.min(1.0, maxScore / 10),
      label: bestMatch.label,
    };
  }

  return null;
};

export const getAllAvailableIntents = (): IntentPattern[] => {
  return INTENT_PATTERNS;
};
