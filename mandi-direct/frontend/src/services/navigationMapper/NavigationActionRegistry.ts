export type ActionStepType = 'input' | 'click' | 'change' | 'file';
export type ArrowPosition = 'top' | 'bottom' | 'left' | 'right';

export interface LocalizedText {
  en: string;
  hi: string;
  te: string;
}

export interface NavigationStep {
  stepId: string;
  targetId: string; // matches [data-tour-id="${targetId}"]
  route: string;
  arrowPosition: ArrowPosition;
  actionType: ActionStepType;
  instruction: LocalizedText;
  spokenPrompt: LocalizedText;
}

export interface NavigationActionDefinition {
  actionId: string;
  title: LocalizedText;
  description: LocalizedText;
  requiresAuth: boolean;
  steps: NavigationStep[];
}

export const LOGIN_STEPS: NavigationStep[] = [
  {
    stepId: 'login_username',
    targetId: 'login-username',
    route: '/login',
    arrowPosition: 'bottom',
    actionType: 'input',
    instruction: {
      en: 'Enter your username.',
      hi: 'अपना यूज़रनेम दर्ज करें।',
      te: 'మీ యూజర్నేమ్ నమోదు చేయండి.',
    },
    spokenPrompt: {
      en: 'Enter your username.',
      hi: 'अपना यूज़रनेम दर्ज करें।',
      te: 'మీ యూజర్నేమ్ నమోదు చేయండి.',
    },
  },
  {
    stepId: 'login_password',
    targetId: 'login-password',
    route: '/login',
    arrowPosition: 'bottom',
    actionType: 'input',
    instruction: {
      en: 'Enter your secret password.',
      hi: 'अपना पासवर्ड दर्ज करें।',
      te: 'మీ పాస్వర్డ్ నమోదు చేయండి.',
    },
    spokenPrompt: {
      en: 'Enter your password.',
      hi: 'अपना पासवर्ड दर्ज करें।',
      te: 'మీ పాస్వర్డ్ నమోదు చేయండి.',
    },
  },
  {
    stepId: 'login_submit',
    targetId: 'login-submit',
    route: '/login',
    arrowPosition: 'top',
    actionType: 'click',
    instruction: {
      en: 'Click the Sign In button to continue.',
      hi: 'आगे बढ़ने के लिए साइन इन पर क्लिक करें।',
      te: 'కొనసాగడానికి సైన్ ఇన్ బటన్ పై క్లిక్ చేయండి.',
    },
    spokenPrompt: {
      en: 'Click Sign In.',
      hi: 'साइन इन पर क्लिक करें।',
      te: 'సైన్ ఇన్ చేయడానికి ఈ బటన్పై క్లిక్ చేయండి.',
    },
  },
];

export const NAVIGATION_ACTIONS: Record<string, NavigationActionDefinition> = {
  upload_crop: {
    actionId: 'upload_crop',
    title: {
      en: 'How do I upload a crop?',
      hi: 'मैं अपनी फसल कैसे अपलोड करूं?',
      te: 'నా పంటను ఎలా అప్లోడ్ చేయాలి?',
    },
    description: {
      en: 'Step-by-step physical guide to list and sell your harvest on Mandi Direct',
      hi: 'मंडी डायरेक्ट पर अपनी फसल सूचीबद्ध करने और बेचने का चरण-दर-चरण मार्गदर्शन',
      te: 'మండి డైరెక్ట్‌లో మీ పంటను లిస్ట్ చేసి విక్రయించడానికి దశలవారీ మార్గదర్శకం',
    },
    requiresAuth: true,
    steps: [
      {
        stepId: 'dashboard_upload_crop_btn',
        targetId: 'upload-crop',
        route: '/farmer/dashboard',
        arrowPosition: 'bottom',
        actionType: 'click',
        instruction: {
          en: 'Click the Upload Crop button to begin listing your harvest.',
          hi: 'अपनी फसल दर्ज करने के लिए फसल अपलोड करें बटन पर क्लिक करें।',
          te: 'మీ పంటను జోడించడానికి పంటను అప్లోడ్ చేయండి బటన్ పై క్లిక్ చేయండి.',
        },
        spokenPrompt: {
          en: 'To add your crop, click Upload Crop.',
          hi: 'अपनी फसल जोड़ने के लिए फसल अपलोड करें पर क्लिक करें।',
          te: 'మీ పంటను జోడించడానికి పంటను అప్లోడ్ చేయండి పై క్లిక్ చేయండి.',
        },
      },
      {
        stepId: 'produce_photo_step',
        targetId: 'upload-crop-photo',
        route: '/farmer/produce/new',
        arrowPosition: 'bottom',
        actionType: 'file',
        instruction: {
          en: 'Take a clear photo of your harvested produce or select from gallery.',
          hi: 'अपनी कटी हुई फसल की स्पष्ट फोटो लें या गैलरी से चुनें।',
          te: 'మీ తాజా పంట స్పష్టమైన ఫోటో తీయండి లేదా గ్యాలరీ నుండి ఎంచుకోండి.',
        },
        spokenPrompt: {
          en: 'Take a photo of your crop.',
          hi: 'अपनी फसल की फोटो लें।',
          te: 'మీ పంట ఫోటో తీయండి.',
        },
      },
      {
        stepId: 'produce_location_step',
        targetId: 'upload-crop-location',
        route: '/farmer/produce/new',
        arrowPosition: 'bottom',
        actionType: 'click',
        instruction: {
          en: 'Allow location or check farm address for logistics pickup.',
          hi: 'लॉजिस्टिक्स पिकअप के लिए लोकेशन की अनुमति दें या खेत का पता जांचें।',
          te: 'పంట పికప్ కోసం లొకేషన్ అనుమతించండి లేదా చిరునామాను తనిఖీ చేయండి.',
        },
        spokenPrompt: {
          en: 'Allow location so we can use your crop location.',
          hi: 'अपनी फसल की जगह के लिए लोकेशन की अनुमति दें।',
          te: 'మీ పంట ఉన్న ప్రదేశాన్ని ఉపయోగించడానికి లొకేషన్ అనుమతించండి.',
        },
      },
      {
        stepId: 'produce_category_step',
        targetId: 'upload-crop-category',
        route: '/farmer/produce/new',
        arrowPosition: 'bottom',
        actionType: 'change',
        instruction: {
          en: 'Select the category: Grains, Vegetables, Fruits, Spices, or Pulses.',
          hi: 'श्रेणी चुनें: अनाज, सब्जियां, फल, मसाले या दालें।',
          te: 'వర్గాన్ని ఎంచుకోండి: తృణధాన్యాలు, కూరగాయలు, పండ్లు, మసాలాలు లేదా పప్పుధాన్యాలు.',
        },
        spokenPrompt: {
          en: 'Select your crop category.',
          hi: 'अपनी फसल की श्रेणी चुनें।',
          te: 'మీ పంట వర్గాన్ని ఎంచుకోండి.',
        },
      },
      {
        stepId: 'produce_name_step',
        targetId: 'upload-crop-name',
        route: '/farmer/produce/new',
        arrowPosition: 'bottom',
        actionType: 'input',
        instruction: {
          en: 'Enter your crop name, or tap the microphone to speak.',
          hi: 'अपनी फसल का नाम लिखें, या बोलने के लिए माइक दबाएं।',
          te: 'మీ పంట పేరు నమోదు చేయండి లేదా మాట్లాడటానికి మైక్ నొక్కండి.',
        },
        spokenPrompt: {
          en: 'Enter your crop name.',
          hi: 'अपनी फसल का नाम दर्ज करें।',
          te: 'మీ పంట పేరు నమోదు చేయండి.',
        },
      },
      {
        stepId: 'produce_price_step',
        targetId: 'upload-crop-price',
        route: '/farmer/produce/new',
        arrowPosition: 'top',
        actionType: 'input',
        instruction: {
          en: 'Enter your expected selling price in rupees per unit.',
          hi: 'प्रति इकाई अपना अपेक्षित विक्रय मूल्य दर्ज करें।',
          te: 'యూనిట్ చొప్పున మీరు ఆశిస్తున్న విక్రయ ధరను నమోదు చేయండి.',
        },
        spokenPrompt: {
          en: 'Enter your expected price.',
          hi: 'अपनी अपेक्षित कीमत दर्ज करें।',
          te: 'మీరు ఆశిస్తున్న ధరను నమోదు చేయండి.',
        },
      },
      {
        stepId: 'produce_quantity_step',
        targetId: 'upload-crop-quantity',
        route: '/farmer/produce/new',
        arrowPosition: 'top',
        actionType: 'input',
        instruction: {
          en: 'Enter the total available quantity ready for sale.',
          hi: 'बिक्री के लिए तैयार कुल उपलब्ध मात्रा दर्ज करें।',
          te: 'అమ్మకానికి సిద్ధంగా ఉన్న పంట మొత్తం పరిమాణాన్ని నమోదు చేయండి.',
        },
        spokenPrompt: {
          en: 'Enter how much crop you have.',
          hi: 'आपके पास कितनी फसल है, वह दर्ज करें।',
          te: 'మీ దగ్గర ఉన్న పంట పరిమాణాన్ని నమోదు చేయండి.',
        },
      },
      {
        stepId: 'produce_harvest_date_step',
        targetId: 'upload-crop-harvest-date',
        route: '/farmer/produce/new',
        arrowPosition: 'top',
        actionType: 'change',
        instruction: {
          en: 'Select the date when this crop was harvested.',
          hi: 'वह तारीख चुनें जब इस फसल की कटाई की गई थी।',
          te: 'ఈ పంటను ఎప్పుడు కోత కోశారో ఆ తేదీని ఎంచుకోండి.',
        },
        spokenPrompt: {
          en: 'Select the harvest date.',
          hi: 'कटाई की तारीख चुनें।',
          te: 'కోత కోసిన తేదీని ఎంచుకోండి.',
        },
      },
      {
        stepId: 'produce_submit_step',
        targetId: 'upload-crop-submit',
        route: '/farmer/produce/new',
        arrowPosition: 'top',
        actionType: 'click',
        instruction: {
          en: 'Review all crop details and click the button to upload.',
          hi: 'सभी जानकारी जांचें और अपलोड करने के लिए बटन पर क्लिक करें।',
          te: 'అన్ని వివరాలను పరిశీలించి అప్‌లోడ్ చేయడానికి బటన్ పై క్లిక్ చేయండి.',
        },
        spokenPrompt: {
          en: 'Check your details and click Upload Crop.',
          hi: 'अपनी जानकारी जांचें और फसल अपलोड करें पर क्लिक करें।',
          te: 'మీ వివరాలను పరిశీలించి పంటను అప్లోడ్ చేయండి పై క్లిక్ చేయండి.',
        },
      },
    ],
  },

  farmer_orders: {
    actionId: 'farmer_orders',
    title: {
      en: 'Where are my orders?',
      hi: 'मेरे ऑर्डर कहाँ हैं?',
      te: 'నా ఆర్డర్లు ఎక్కడ ఉన్నాయి?',
    },
    description: {
      en: 'Find and review purchase requests placed by buyers for your crops',
      hi: 'अपनी फसलों के लिए खरीदारों द्वारा किए गए ऑर्डर देखें और प्रबंधित करें',
      te: 'మీ పంటల కోసం కొనుగోలుదారులు ఇచ్చిన ఆర్డర్లను పరిశీలించి ఆమోదించండి',
    },
    requiresAuth: true,
    steps: [
      {
        stepId: 'dashboard_orders_action',
        targetId: 'orders-action',
        route: '/farmer/dashboard',
        arrowPosition: 'bottom',
        actionType: 'click',
        instruction: {
          en: 'Click My Orders on your dashboard to see customer purchases.',
          hi: 'ग्राहकों के ऑर्डर देखने के लिए डैशबोर्ड पर मेरे ऑर्डर पर क्लिक करें।',
          te: 'కొనుగోలుదారుల ఆర్డర్లను చూడటానికి డాష్‌బోర్డ్‌లో నా ఆర్డర్లు పై క్లిక్ చేయండి.',
        },
        spokenPrompt: {
          en: 'Click My Orders to view purchases.',
          hi: 'खरीदारी देखने के लिए मेरे ऑर्डर पर क्लिक करें।',
          te: 'కొనుగోళ్లు చూడటానికి నా ఆర్డర్లు పై క్లిక్ చేయండి.',
        },
      },
      {
        stepId: 'orders_list_section',
        targetId: 'orders-list-section',
        route: '/farmer/orders',
        arrowPosition: 'bottom',
        actionType: 'click',
        instruction: {
          en: 'Your incoming wholesale buyer orders are listed here with Accept/Reject actions.',
          hi: 'आपके खरीदारों के ऑर्डर यहाँ सूचीबद्ध हैं। आप उन्हें स्वीकार या अस्वीकार कर सकते हैं।',
          te: 'మీ కొనుగోలుదారుల ఆర్డర్లు ఇక్కడ జాబితా చేయబడ్డాయి. మీరు వాటిని ఆమోదించవచ్చు.',
        },
        spokenPrompt: {
          en: 'Your buyer orders are shown here.',
          hi: 'आपके खरीदारों के ऑर्डर यहाँ दिखाए गए हैं।',
          te: 'మీ కొనుగోలుదారుల ఆర్డర్లు ఇక్కడ చూపబడ్డాయి.',
        },
      },
    ],
  },

  farmer_earnings: {
    actionId: 'farmer_earnings',
    title: {
      en: 'Where can I see my earnings?',
      hi: 'मेरी कमाई कहाँ है?',
      te: 'నా ఆదాయం ఎక్కడ చూడాలి?',
    },
    description: {
      en: 'Track total sales revenue, payouts, and bank transfers',
      hi: 'कुल बिक्री आय, बैंक भुगतान और शेष राशि ट्रैक करें',
      te: 'మొత్తం అమ్మకాల ఆదాయం మరియు బ్యాంక్ చెల్లింపులను ట్రాక్ చేయండి',
    },
    requiresAuth: true,
    steps: [
      {
        stepId: 'dashboard_earnings_action',
        targetId: 'earnings-action',
        route: '/farmer/dashboard',
        arrowPosition: 'bottom',
        actionType: 'click',
        instruction: {
          en: 'Click My Earnings to see your payouts and account balance.',
          hi: 'अपनी कुल कमाई और भुगतान देखने के लिए मेरी कमाई पर क्लिक करें।',
          te: 'మీ చెల్లింపులు మరియు బ్యాలెన్స్ చూడటానికి నా ఆదాయం పై క్లిక్ చేయండి.',
        },
        spokenPrompt: {
          en: 'Click My Earnings to see payouts.',
          hi: 'भुगतान देखने के लिए मेरी कमाई पर क्लिक करें।',
          te: 'చెల్లింపులు చూడటానికి నా ఆదాయం పై క్లిక్ చేయండి.',
        },
      },
      {
        stepId: 'earnings_summary_card',
        targetId: 'earnings-summary-card',
        route: '/farmer/earnings',
        arrowPosition: 'bottom',
        actionType: 'click',
        instruction: {
          en: 'Here you can track your verified earnings and bank payout records.',
          hi: 'यहाँ आप अपनी कुल कमाई और बैंक हस्तांतरण का विवरण देख सकते हैं।',
          te: 'ఇక్కడ మీరు మీ మొత్తం ఆదాయం మరియు బ్యాంక్ చెల్లింపుల వివరాలను చూడవచ్చు.',
        },
        spokenPrompt: {
          en: 'Here you can track your verified earnings and bank transfers.',
          hi: 'यहाँ आप अपनी कुल कमाई और बैंक हस्तांतरण देख सकते हैं।',
          te: 'ఇక్కడ మీరు మీ ఆదాయం మరియు బ్యాంక్ బదిలీలను ట్రాక్ చేయవచ్చు.',
        },
      },
    ],
  },

  market_prices: {
    actionId: 'market_prices',
    title: {
      en: 'How do I check market price?',
      hi: 'मंडी भाव कैसे देखें?',
      te: 'మార్కెట్ ధర ఎలా చూడాలి?',
    },
    description: {
      en: 'View verified APMC Mandi benchmark rates for agricultural commodities',
      hi: 'सरकारी एपीएमसी मंडियों के आधिकारिक न्यूनतम, मॉडल और अधिकतम भाव देखें',
      te: 'వ్యవసాయ ఉత్పత్తుల కోసం అధికారిక ఏపీఎంసీ మార్కెట్ ధరలను తెలుసుకోండి',
    },
    requiresAuth: false,
    steps: [
      {
        stepId: 'market_category_tabs',
        targetId: 'market-category-filters',
        route: '/farmer/market-prices',
        arrowPosition: 'bottom',
        actionType: 'click',
        instruction: {
          en: 'Select the crop category: Grains, Vegetables, Fruits, Spices, Pulses, or Oilseeds.',
          hi: 'अनाज, सब्जियां, फल, मसाले, दालें या तिलहन जैसी श्रेणी चुनें।',
          te: 'తృణధాన్యాలు, కూరగాయలు, పండ్లు, మసాలాలు లేదా పప్పుధాన్యాల వర్గాన్ని ఎంచుకోండి.',
        },
        spokenPrompt: {
          en: 'Select the crop category.',
          hi: 'फसल की श्रेणी चुनें।',
          te: 'పంట వర్గాన్ని ఎంచుకోండి.',
        },
      },
      {
        stepId: 'market_price_table_view',
        targetId: 'market-prices-table',
        route: '/farmer/market-prices',
        arrowPosition: 'top',
        actionType: 'click',
        instruction: {
          en: 'Check the modal, minimum, and maximum mandi rates reported from official markets.',
          hi: 'सत्यापित मंडियों से प्राप्त मॉडल, न्यूनतम और अधिकतम मंडी दरें यहाँ देखें।',
          te: 'అధికారిక మార్కెట్ల నుండి సేకరించిన సగటు, కనిష్ట మరియు గరిష్ట ధరలను ఇక్కడ చూడండి.',
        },
        spokenPrompt: {
          en: 'Check the modal mandi benchmark price for your harvest.',
          hi: 'अपनी फसल के लिए आधिकारिक मंडी मॉडल भाव देखें।',
          te: 'మీ పంట కోసం అధికారిక మార్కెట్ సగటు ధరను తనిఖీ చేయండి.',
        },
      },
    ],
  },

  farmer_profile: {
    actionId: 'farmer_profile',
    title: {
      en: 'How do I update my profile?',
      hi: 'मैं अपनी प्रोफाइल कैसे अपडेट करूं?',
      te: 'నా ప్రొఫైల్ ఎలా నవీకరించాలి?',
    },
    description: {
      en: 'Update your contact details, village, district, and farm GPS coordinates',
      hi: 'अपना संपर्क, गांव, ज़िला और खेत के जीपीएस निर्देशांक अपडेट करें',
      te: 'మీ ఫోన్ నంబర్, గ్రామం, జిల్లా మరియు పొలం జీపీఎస్ వివరాలను అప్‌డేట్ చేయండి',
    },
    requiresAuth: true,
    steps: [
      {
        stepId: 'profile_fullname_step',
        targetId: 'profile-fullname',
        route: '/farmer/profile',
        arrowPosition: 'bottom',
        actionType: 'input',
        instruction: {
          en: 'Enter your full name or use the microphone to speak it.',
          hi: 'अपना पूरा नाम दर्ज करें या बोलने के लिए माइक दबाएं।',
          te: 'మీ పూర్తి పేరు నమోదు చేయండి లేదా మైక్‌తో మాట్లాడండి.',
        },
        spokenPrompt: {
          en: 'Check and update your personal details.',
          hi: 'अपनी व्यक्तिगत जानकारी जांचें और अपडेट करें।',
          te: 'మీ వ్యక్తిగత వివరాలను పరిశీలించి నవీకరించండి.',
        },
      },
      {
        stepId: 'profile_gps_detect_step',
        targetId: 'profile-detect-gps',
        route: '/farmer/profile',
        arrowPosition: 'bottom',
        actionType: 'click',
        instruction: {
          en: 'Click Detect Current Location to automatically capture your farm GPS coordinates.',
          hi: 'खेत के जीपीएस निर्देशांक दर्ज करने के लिए वर्तमान स्थान पर क्लिक करें।',
          te: 'మీ పొలం జీపీఎస్ వివరాలు నమోదు చేయడానికి ప్రస్తుత స్థానాన్ని గుర్తించండి పై క్లిక్ చేయండి.',
        },
        spokenPrompt: {
          en: 'Click Detect Location to capture your farm GPS.',
          hi: 'खेत का जीपीएस दर्ज करने के लिए वर्तमान स्थान पर क्लिक करें।',
          te: 'మీ పొలం జీపీఎస్ నమోదు చేయడానికి ప్రస్తుత స్థానాన్ని గుర్తించండి పై క్లిక్ చేయండి.',
        },
      },
    ],
  },

  notifications: {
    actionId: 'notifications',
    title: {
      en: 'Where can I see notifications?',
      hi: 'मैं सूचनाएं कहाँ देखूं?',
      te: 'నోటిఫికేషన్లు ఎక్కడ చూడాలి?',
    },
    description: {
      en: 'View order alerts, price changes, verification updates, and pickup schedules',
      hi: 'ऑर्डर अलर्ट, मूल्य परिवर्तन और सत्यापन अपडेट देखें',
      te: 'ఆర్డర్ అలర్ట్‌లు, మార్కెట్ ధర మార్పులు మరియు ధృవీకరణ వివరాలు చూడండి',
    },
    requiresAuth: true,
    steps: [
      {
        stepId: 'nav_notification_bell_step',
        targetId: 'nav-notification-bell',
        route: '/farmer/dashboard',
        arrowPosition: 'bottom',
        actionType: 'click',
        instruction: {
          en: 'Click the notification bell icon in the top navigation bar to open alerts.',
          hi: 'सूचनाएं देखने के लिए शीर्ष नेविगेशन बार में घंटी आइकन पर क्लिक करें।',
          te: 'అలర్ట్‌లను చూడటానికి పై భాగంలో ఉన్న గంట చిహ్నంపై క్లిక్ చేయండి.',
        },
        spokenPrompt: {
          en: 'Click the bell icon to view live alerts.',
          hi: 'ताजा सूचनाएं देखने के लिए घंटी आइकन पर क्लिक करें।',
          te: 'తాజా అలర్ట్‌లను చూడటానికి గంట చిహ్నంపై క్లిక్ చేయండి.',
        },
      },
    ],
  },
};

// Aliases for convenient access from query intent resolvers
NAVIGATION_ACTIONS.earnings = NAVIGATION_ACTIONS.farmer_earnings;
NAVIGATION_ACTIONS.profile = NAVIGATION_ACTIONS.farmer_profile;
NAVIGATION_ACTIONS.orders = NAVIGATION_ACTIONS.farmer_orders;

export const getActionDefinition = (actionId: string): NavigationActionDefinition | null => {
  return NAVIGATION_ACTIONS[actionId] || null;
};
