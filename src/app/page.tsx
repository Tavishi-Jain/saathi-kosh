"use client";

import {
  Activity, ArrowDownLeft, ArrowDownToLine, ArrowLeftRight, ArrowUpRight,
  BadgeCheck, Bell, Check, CheckCheck, ChevronDown, CircleHelp, ClipboardCheck,
  Clock3, FileAudio2, FileCheck2, FileClock, FileText, HandCoins, History,
  Home, IndianRupee, Landmark, LoaderCircle, LockKeyhole, Mic, Mic2,
  MoreHorizontal, Pause, PhoneCall, PhoneOff, Play, Plus, RefreshCw, Send, Settings2, ShieldCheck,
  Sparkles, Users, Vote, Wallet, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Children, Fragment, cloneElement, createContext, isValidElement, useCallback, useContext,
  useEffect, useRef, useState, useSyncExternalStore,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { CallCenter } from "@/components/CallCenter";
import { parseLoanVoteResponse } from "@/lib/domain";

type Language = "hi" | "en";
const LanguageContext = createContext<Language>("hi");
const languageChangeEvent = "saathi-kosh-language-change";

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener(languageChangeEvent, onChange);
  return () => window.removeEventListener(languageChangeEvent, onChange);
}

function getLanguageSnapshot(): Language {
  return window.localStorage.getItem("saathi-kosh-language") === "en" ? "en" : "hi";
}

function setLanguage(language: Language) {
  window.localStorage.setItem("saathi-kosh-language", language);
  window.dispatchEvent(new Event(languageChangeEvent));
}

const englishCopy: Record<string, string> = {
  "साथी": "Saathi",
  "कोष": "Kosh",
  "सखी समूह का डिजिटल साथी": "Your group's digital companion",
  "सखी स्वयं सहायता समूह": "Sakhi Self-Help Group",
  "12 सदस्य · सीहोर, मध्य प्रदेश": "12 members · Sehore, Madhya Pradesh",
  "आपका समूह": "Your group",
  "मुख्य पटल": "Overview",
  "आवाज़ से दर्ज करें": "Voice entry",
  "डिजिटल बही": "Digital ledger",
  "बैंक मिलान": "Bank reconciliation",
  "ऋण और मतदान": "Loans & voting",
  "साप्ताहिक समीक्षा": "Weekly review",
  "लेखा इतिहास": "Audit history",
  "समूह सेटिंग": "Group settings",
  "आपकी बचत, आपकी समझ।": "Your savings, your understanding.",
  "यह एक अभ्यास डेमो है।": "This is a practice demo.",
  "डेमो भूमिका": "Demo role",
  "डेमो भूमिका चुनें": "Choose demo role",
  "डेमो में सूचनाएं उपलब्ध नहीं": "Notifications are unavailable in this demo",
  "पटल फिर से लोड करें": "Refresh dashboard",
  "मोबाइल नेविगेशन": "Mobile navigation",
  "सिम्युलेटेड डेमो डेटा": "SIMULATED DEMO DATA",
  " — समूह, लेन-देन, बैंक फ़ीड और वॉलेट सभी काल्पनिक हैं। वास्तविक बैंक से जुड़ा नहीं है।": " — Group, transactions, bank feed and wallet are fictional. Not connected to a real bank.",
  "डेमो": "Demo",
  "भाषा / Language": "Language",
  "भाषा बदलें / Change language": "Change language",
  "त्रुटि बंद करें": "Dismiss error",
  "संदेश बंद करें": "Dismiss message",
  " समूह की बही खुल रही है…": " Opening the group ledger…",
  "लोड हो रहा है": "Loading",
  "Mock Mode": "Mock Mode",
  "Voice API Connected": "Voice API connected",
  "Voice API Error": "Voice API error",
  "आपकी पुष्टि ज़रूरी है": "Your confirmation is required",
  "आसान और सुरक्षित": "Simple and secure",
  "बोलें, जाँचें, फिर सहेजें": "Speak, review, then save",
  "आवाज़ से लेन-देन का मसौदा बनाएं। आपकी स्पष्ट पुष्टि से पहले कुछ भी बही में नहीं जुड़ता।": "Draft transactions by voice. Nothing enters the ledger until you explicitly confirm.",
  "कदम 1": "Step 1",
  "अपना लेन-देन बताएं": "Describe a transaction",
  "हिंदी या Hinglish में बोलें। अधिकतम ": "Speak in Hindi or Hinglish. Up to ",
  " सेकंड।": " seconds.",
  "रिकॉर्डिंग रोकें": "Stop recording",
  "रिकॉर्डिंग शुरू करें": "Start recording",
  "रिकॉर्डिंग तैयार है": "Recording is ready",
  "बोलने के लिए दबाएं": "Tap to speak",
  "रोकने के लिए फिर दबाएं": "Tap again to stop",
  "माइक्रोफ़ोन अनुमति केवल रिकॉर्ड करते समय माँगी जाएगी": "Microphone access is requested only while recording",
  "बोलना रोकें": "Stop speaking",
  " ऑडियो फ़ाइल चुनें": " Choose an audio file",
  "हटाएं": "Remove",
  "या डेमो में लिखें": "Or type for the demo",
  "आपने क्या कहा?": "What did you say?",
  "उदाहरण: Aaj Sunita ne paanch sau jama kiye…": "Example: Sunita deposited five hundred today…",
  "आपकी आवाज़ तभी भेजी जाती है जब आप जाँचें दबाते हैं।": "Audio is sent only when you choose to review it.",
  "उदाहरण भरें": "Use example",
  "जाँचने पर ऑडियो ElevenLabs को भेजा जाएगा।": "Audio will be sent to ElevenLabs when you choose to review it.",
  "Mock Mode: टाइप किया पाठ आपके डिवाइस से बाहर नहीं जाता।": "Mock Mode: typed text stays on your device.",
  "पहले सुनें और जाँचें": "Review the draft",
  "साथी कोष सिर्फ मसौदा बनाता है। राशि और सदस्य का नाम जाँचें, फिर सहेजने की अनुमति दें।": "Saathi Kosh only drafts entries. Check the member and amount before confirming.",
  "बोलें या लिखें": "Speak or type",
  "लेन-देन जाँचें": "Review transactions",
  "खुद पुष्टि करें": "Confirm yourself",
  "अस्पष्ट आवाज़?": "Was that unclear?",
  "राशि या नाम साफ़ न हो तो हम पूछेंगे। आप टेक्स्ट में सुधार कर सकते हैं। कोई अनुमान से पैसा दर्ज नहीं होता।": "If the amount or name is unclear, we will ask. You can edit the text; no amount is guessed.",
  "बही देखें": "View ledger",
  "कदम 2": "Step 2",
  "सहेजने से पहले जाँचें": "Review before saving",
  "हर प्रस्तावित प्रविष्टि संपादन योग्य है।": "Every proposed entry can be edited.",
  "सुनें": "Listen",
  "अभी सहेजा नहीं": "Not saved yet",
  "सुना गया वाक्य": "Heard",
  "सदस्य": "Member",
  "प्रकार": "Type",
  "राशि ₹": "Amount ₹",
  "तारीख़": "Date",
  "प्रविष्टि हटाएं": "Remove entry",
  "पुष्टि तक कोई लेन-देन सहेजा नहीं गया": "No transaction is saved until you confirm",
  "पुष्टि करें और बही में सहेजें": "Confirm and save to ledger",
  "साफ़ हिसाब, सबके सामने": "Clear records, shared openly",
  "समूह की डिजिटल बही": "Group digital ledger",
  "हर प्रविष्टि का स्रोत, पुष्टि और बैंक मिलान यहाँ देखें।": "See each entry's source, confirmation and bank match status.",
  "गणना किया बैलेंस": "Calculated balance",
  "बैलेंस कैसे निकला?": "How is the balance calculated?",
  "शुरुआती ": "Opening ",
  " + बचत जमा + ऋण किस्तें − निकासी − दिए गए ऋण। सुधार भी अलग से दर्ज होते हैं।": " + savings deposits + loan repayments − withdrawals − loans disbursed. Corrections are recorded separately.",
  "सभी प्रविष्टियाँ ": "All entries ",
  "बही में बदलाव का इतिहास मिटाया नहीं जाता।": "Ledger changes are never silently erased.",
  "नई प्रविष्टि": "New entry",
  "सभी सदस्य": "All members",
  "लेन-देन": "Transaction",
  "सभी प्रकार": "All types",
  "से": "From",
  "तक": "To",
  "सभी": "All",
  "मिलान बाकी": "Unmatched",
  "मिलान हुआ": "Matched",
  "हाथ से प्रविष्टि जोड़ें": "Add an entry manually",
  "सहेजते ही पुष्टि और ऑडिट इतिहास दर्ज होगा।": "Saving confirms the entry and adds it to the audit history.",
  "लेन-देन का प्रकार": "Transaction type",
  "राशि (₹)": "Amount (₹)",
  "सुधार दिशा": "Correction direction",
  "बैलेंस में जोड़ें": "Add to balance",
  "बैलेंस से घटाएं": "Subtract from balance",
  "विवरण": "Description",
  "इस प्रविष्टि का कारण": "Reason for this entry",
  "सुधार किस प्रविष्टि का?": "Which entry is being corrected?",
  "कोई नहीं": "None",
  "बही में जोड़ें": "Add to ledger",
  "वास्तविक बैंक से नहीं जुड़ा": "Not connected to a real bank",
  "बैंक लेन-देन मिलाएं": "Reconcile bank transactions",
  "राशि, दिशा, तारीख और संदर्भ से बही की जाँच करें। हर नतीजे का कारण दिखता है।": "Compare ledger entries by amount, direction, date and reference. Every result is explained.",
  "SIMULATED BANK DATA · केवल उदाहरण": "SIMULATED BANK DATA · DEMO ONLY",
  "यह काल्पनिक बैंक फ़ीड है। कोई वास्तविक बैंक खाता या स्टेटमेंट नहीं जोड़ा गया।": "This is a fictional bank feed. No real bank account or statement is connected.",
  "नमूना CSV जोड़ें": "Import sample CSV",
  "मिलान हुए": "Matched",
  "संदर्भ सहित": "Including reference",
  "बैंक में अनजान जमा": "Unrecognized bank credits",
  "बही में नहीं मिला": "Not found in ledger",
  "बही में अनमिली": "Unmatched ledger entries",
  "बैंक प्रमाण बाकी": "Bank evidence pending",
  "राशि अंतर": "Amount mismatches",
  "संभावित दोहराव": "Possible duplicates",
  "समीक्षा की ज़रूरत": "Needs review",
  "मिले हुए लेन-देन": "Matched transactions",
  "सिर्फ बराबर राशि नहीं — संदर्भ और तारीख भी।": "Not just equal amounts — references and dates matter too.",
  "ठीक": "Matched",
  "अभी कोई मिलान नहीं मिला।": "No matches yet.",
  "जाँच की ज़रूरत": "Needs review",
  "यहाँ दिखी विसंगतियों को हाथ से जाँचें।": "Review these discrepancies manually.",
  "ध्यान दें": "Review",
  "संभावित डुप्लिकेट": "Possible duplicate",
  "नहीं मिला": "Unmatched",
  "बैंक बाकी": "Bank evidence pending",
  "राशि अलग": "Amount differs",
  "जाँचें": "Review",
  "सभी प्रविष्टियाँ मिल गईं।": "All entries are matched.",
  "हर रविवार, साथ बैठकर": "A shared Sunday review",
  "इस हफ़्ते का समूह हिसाब": "This week's group summary",
  "सभी रकम बही से अपने-आप जुड़ी हैं। समूह में साथ मिलकर समीक्षा करें।": "All totals come from the ledger. Review them together as a group.",
  "सखी स्वयं सहायता समूह · साप्ताहिक समीक्षा": "Sakhi Self-Help Group · Weekly review",
  "इस सप्ताह ": "This week ",
  " की कुल आवक": " total received this week",
  "शुरुआती बैलेंस ": "Opening balance ",
  " → वर्तमान गणना ": " → calculated balance now ",
  "इस सप्ताह का हिसाब": "This week's figures",
  "साप्ताहिक बचत जमा": "Weekly savings deposits",
  "ऋण किस्तें वापस": "Loan repayments",
  "निकासी और ऋण दिए": "Withdrawals and loans disbursed",
  "आज का गणना बैलेंस": "Calculated balance today",
  "योगदान की याद": "Contribution reminders",
  "इस सप्ताह की तय बचत के अनुसार।": "Based on this week's expected savings.",
  "जमा ": "Deposited ",
  "बाकी ": "Remaining ",
  "सभी तय योगदान दर्ज हैं।": "All expected contributions are recorded.",
  "आने वाली ऋण किस्तें": "Upcoming loan instalments",
  "समूह के दर्ज ऋण और तय भुगतान से।": "Based on recorded group loans and scheduled repayments.",
  " तक": " due",
  " · बकाया ": " · outstanding ",
  "अभी कोई किस्त तय नहीं है।": "No instalments are scheduled yet.",
  "समूह से पूछें": "Ask the group",
  "तय सवालों के जवाब बही और बैंक मिलान से।": "Answers come from the ledger and bank reconciliation.",
  "जाँच योग्य जवाब": "Explainable answers",
  "पूछें": "Ask",
  "आवाज़ वाला सवाल चुनने पर ऑडियो ElevenLabs को भेजा जाएगा। Mock Mode में सवाल लिखकर पूछें।": "If you record a spoken question, audio is sent to ElevenLabs. In Mock Mode, type your question.",
  "जवाब पढ़कर सुनें": "Read answer aloud",
  "बैंक मिलान बाकी": "Unmatched bank entries",
  "बकाया समूह ऋण": "Outstanding group loans",
  "इस महीने की बचत": "Savings this month",
  "समूह का बैलेंस": "Group balance",
  "गणना · आज तक": "Calculated · to date",
  "बही में दर्ज जमा": "Deposits recorded in ledger",
  "दिए गए ऋण − किस्तें": "Loans disbursed − repayments",
  "जाँचने योग्य प्रविष्टियाँ": "Entries to review",
  "आपके समूह का हाल": "Your group's overview",
  "बही साफ़ हो तो हर सदस्य को अपना हिसाब समझ आए।": "Clear records help every member understand the group's finances.",
  "लेन-देन बोलकर दर्ज करें": "Record a transaction by voice",
  "हाल की बही गतिविधि": "Recent ledger activity",
  "नया लेन-देन और जमा": "Recent transactions and deposits",
  "पूरी बही": "Full ledger",
  "इस रविवार की समीक्षा": "This Sunday's review",
  "एक नज़र में": "At a glance",
  "इस हफ़्ते का हिसाब": "This week's summary",
  "बचत जमा": "Savings deposits",
  "ऋण किस्तें": "Loan repayments",
  "मौजूदा समूह बैलेंस": "Current group balance",
  "पूरा हिसाब देखें": "View full summary",
  "ऋण प्रस्ताव": "Loan proposals",
  "मतदान से पहले समूह की मंज़ूरी": "Group approval before voting",
  "लंबित": "Pending",
  " वोट": " votes",
  "सभी प्रस्ताव देखें": "View all proposals",
  "पहले आपकी पुष्टि, फिर बही में एंट्री": "Your confirmation comes before a ledger entry",
  "हर बचत और किस्त का हिसाब समूह के सामने। गलती होने पर पुरानी प्रविष्टि मिटाए बिना सुधार जोड़ें।": "Every deposit and repayment is visible to the group. Correct errors without deleting the original entry.",
  "हिसाब देखें": "View audit history",
  "समूह की बचत, सबकी समझ": "Group savings, understood by everyone",
  "डेमो — आधिकारिक बैंक रिकॉर्ड का विकल्प नहीं": "Demo — not a replacement for official bank records",
  "सदस्य / विवरण": "Member / description",
  "राशि": "Amount",
  "बैंक / स्रोत": "Bank / source",
  "दर्ज किया": "Recorded by",
  "पुष्टि": "Confirmation",
  "पुष्टि हुई": "Confirmed",
  "बैंक मिला": "Bank matched",
  "अभी प्रमाण बाकी": "Evidence pending",
  "आवाज़": "Voice",
  "मैनुअल": "Manual",
  "समूह का हिसाब साफ़ रखें": "Keep the group records clear",
  "आवाज़ से लेन-देन": "Voice transaction",
  "बोलें, जाँचें": "Speak and review",
  "ऑडियो सेवा उपलब्ध नहीं है; पाठ पढ़ें।": "Audio service is unavailable; please read the text.",
  "इस ब्राउज़र में आवाज़ उपलब्ध नहीं; पाठ पढ़ें।": "Speech is unavailable in this browser; please read the text.",
  "समूह के नियम": "Group rules",
  "नियम बदलने पर तारीख़ सहित ऑडिट इतिहास बनेगा।": "Rule changes are recorded in the dated audit history.",
  "ऋण स्वीकृति नियम": "Loan approval rules",
  "बिना समूह मतदान की अधिकतम राशि (₹)": "Maximum amount without a group vote (₹)",
  "सामान्य मतदान का कोरम (सदस्य)": "Regular voting quorum (members)",
  "मंज़ूरी के लिए हाँ (%)": "Yes votes needed for approval (%)",
  "आपात मतदान का कम कोरम": "Reduced emergency quorum",
  "साप्ताहिक तय बचत (₹)": "Expected weekly contribution (₹)",
  "आपात मतदान की अनुमति": "Allow emergency voting",
  "आपात प्रस्ताव के लिए तभी कम कोरम लगेगा।": "A reduced quorum applies only to emergency proposals.",
  "नियम सहेजें": "Save rules",
  "समूह की जानकारी": "Group details",
  "शुरुआती बैंक बैलेंस": "Opening bank balance",
  "गोपनीयता और सुरक्षा": "Privacy and security",
  "यह डेमो भूमिका पहचान सत्यापन नहीं है। आवाज़ का नमूना यहाँ संग्रहित नहीं होता। API कुंजी सिर्फ सर्वर पर रहती है।": "The demo role is not identity verification. Audio is not stored here; the API key stays on the server.",
  "डेमो डेटा हटाने के लिए README में SQLite फ़ाइल हटाने के चरण देखें।": "See the README for steps to delete the SQLite demo database.",
  "समूह का नाम": "Group name",
  "मुख्य नेविगेशन": "Main navigation",
  "लेन-देन प्रकार": "Transaction type",
  "निकासी": "Withdrawal",
  "ऋण दिया": "Loan disbursed",
  "ऋण किस्त": "Loan repayment",
  "सुधार": "Adjustment",
  "इस फ़िल्टर में कोई प्रविष्टि नहीं।": "No entries match these filters.",
  "बोलकर प्रस्ताव बताएं": "Describe the loan request",
  "किस सदस्य के लिए?": "For which member?",
  "ऋण का उद्देश्य": "Loan purpose",
  "जैसे: दुकान के लिए सामान": "Example: stock for a small shop",
  "आवाज़ का वाक्य या उसका पाठ": "Speak or type the request",
  "जैसे: Meena ko pandrah hazaar ka loan chahiye, dukaan ke liye.": "Example: Meena needs a ₹15,000 loan for her shop.",
  "आवाज़ / वाक्य समझें": "Understand voice / text",
  "लाइव बोलकर अनुरोध दर्ज करें": "Speak loan request live",
  "उदाहरण: Sunita ko emergency mein bees hazaar rupaye ka loan chahiye, ilaaj ke liye.": "Example: Sunita needs an emergency loan of ₹20,000 for treatment.",
  "बोलकर या लिखकर अनुरोध दें। पहले नाम, राशि और उद्देश्य जाँचें; प्रस्ताव जोड़ने पर आपातकालीन समूह मतदान शुरू होगा। लाइव पहचान ब्राउज़र पर निर्भर है।": "Speak or type the request. Review the member, amount and purpose; submitting an emergency proposal starts the group vote. Live recognition depends on your browser.",
  "पुष्टि करें और प्रस्ताव जोड़ें": "Confirm and submit proposal",
  "ऑडियो ElevenLabs को तभी भेजा जाएगा जब उसे चुनकर समझने के लिए कहें। Mock Mode में वाक्य टाइप करें। यह मसौदा प्रस्ताव सहेजने से पहले नहीं जुड़ता।": "Audio is sent to ElevenLabs only after you select it and ask to interpret it. Type the sentence in Mock Mode. This draft is not saved until you add the proposal.",
  "आपातकालीन प्रस्ताव": "Emergency proposal",
  "केवल समूह सेटिंग चालू होने पर कम कोरम लगेगा।": "A reduced quorum applies only when enabled in group settings.",
  "प्रस्ताव जोड़ें": "Add proposal",
  "स्वीकृति का अर्थ असली भुगतान नहीं है। Mock wallet transfer अभी सक्षम नहीं।": "Approval does not mean a real payment. Mock wallet transfers are not enabled.",
  "समूह का फैसला, सबकी आवाज़": "Group decisions, everyone's voice",
  "ऋण अनुरोध और मतदान": "Loan requests & voting",
  "नियम सर्वर पर जाँचे जाते हैं। वोटिंग का नतीजा आने पर भी असली पैसा ट्रांसफ़र नहीं होता।": "Rules are checked on the server. Even an approved vote never transfers real money.",
  " तक:": " and below:",
  " कोषाध्यक्ष + अधिकृत सह-हस्ताक्षरकर्ता। ": " Treasurer + authorized co-signer. ",
  "इससे ऊपर:": "Above that:",
  " सदस्यों का कोरम और ": " members for quorum and ",
  "% हाँ।": "% yes votes.",
  "नियम बदलें": "Change rules",
  "नया ऋण प्रस्ताव": "New loan proposal",
  "सदस्य और समूह के लिए प्रस्ताव दर्ज करें।": "Record a request for a group member.",
  "डेमो मोड:": "Demo mode:",
  "किसी और को जोड़ें": "Add another member",
  "प्रस्ताव राशि": "Requested amount",
  "समूह मतदान": "Group vote",
  "2 हस्ताक्षर": "2 signatures",
  " वोट पड़े": " votes cast",
  " कोरम": " quorum",
  "हाँ": "Yes",
  "ना": "No",
  " मंज़ूरी ज़रूरी": " approval required",
  "वोट देने वाला": "Voter",
  "हाँ वोट दर्ज हुआ।": "Yes vote recorded.",
  "ना वोट दर्ज हुआ।": "No vote recorded.",
  "दूसरा हस्ताक्षर बाकी": "Second signature pending",
  "कोषाध्यक्ष और सह-हस्ताक्षरकर्ता ज़रूरी": "Treasurer and co-signer required",
  "सदस्य अनुमोदन कॉल": "Member approval calls",
  "फोन कॉल नहीं — यह स्क्रीन पर चलने वाला डेमो है।": "Not a phone call — this is an in-app demo.",
  "सदस्यों को क्रम से कॉल करें": "Call members one by one",
  "कॉल डेमो शुरू करें": "Start call demo",
  "Saathi Kosh का डेमो कॉल": "Saathi Kosh demo call",
  "मंज़ूरी दें": "Approve",
  "मंज़ूरी न दें": "Decline",
  "कॉल समाप्त करें": "End call",
  "आवाज़ फिर सुनें": "Play voice prompt",
  "वोट आवाज़ से दें": "Vote by voice",
  "बोलें: Yes/No या हाँ/नहीं": "Say: Yes/No or Haan/Nahin",
  "सुन रहा है… अपना जवाब बोलें": "Listening… say your response",
  "माइक्रोफ़ोन बंद करें": "Stop microphone",
  "आवाज़ पहचान उपलब्ध नहीं। डेमो बंद करके नीचे मैन्युअल वोट दें।": "Speech recognition is unavailable. Close the demo to cast a manual vote below.",
  "समझ नहीं आया": "I couldn't understand that",
  "हाँ और ना दोनों सुनाई दिए। कृपया एक उत्तर साफ़ बोलें।": "I heard both yes and no. Please say one clearly.",
  "आपका उत्तर:": "Your response:",
  "माइक्रोफ़ोन अनुमति नहीं मिली। डेमो बंद करके मैन्युअल वोट दें।": "Microphone permission was denied. Close the demo to vote manually.",
  "आवाज़ पहचान विफल हुई। फिर कोशिश करें या डेमो बंद करके मैन्युअल वोट दें।": "Speech recognition failed. Try again or close the demo to vote manually.",
  "माइक्रोफ़ोन शुरू नहीं हो सका। फिर कोशिश करें या डेमो बंद करके मैन्युअल वोट दें।": "Could not start the microphone. Try again or close the demo to vote manually.",
  "समूह का फैसला": "Group decision",
  "अनुमोदित": "Approved",
  "अभी निर्णय नहीं हुआ": "No decision yet",
  "कोरम पूरा नहीं हुआ": "Quorum was not reached",
  "आपातकालीन ऋण अनुरोध": "Emergency loan request",
  "ने आपातकालीन ऋण मांगा है": "requested an emergency loan",
  "उद्देश्य": "Purpose",
  "क्या आप इस ऋण को मंज़ूरी देते हैं?": "Do you approve this loan?",
  "आपका उत्तर दर्ज हो रहा है…": "Recording your response…",
  "क्रमवार कॉल रोकें": "Stop the call sequence",
  "नतीजे की सूचना": "Decision notification",
  "के लिए मांगा गया ऋण": "loan requested for",
  "सभी उपलब्ध सदस्य अपनी राय दे चुके हैं।": "All available members have responded.",
  "डेमो कॉल केवल प्रस्तुति के लिए है। इससे कोई फोन नंबर नहीं डायल होता।": "Demo calls are for presentation only. No phone number is dialed.",
  "परिणाम": "Result",
  "सभी उपलब्ध सदस्यों ने जवाब दिया, लेकिन तय कोरम पूरा नहीं हुआ। अनुरोध लंबित है; इसे मंज़ूर या अस्वीकृत नहीं माना गया।": "All available members responded, but quorum was not reached. The request remains pending; it is neither approved nor rejected.",
  "आपातकालीन मंज़ूरी कॉल": "Emergency approval calls",
  "फोन पर नहीं—यह प्रस्तुति के लिए इन-ऐप क्रमवार कॉल डेमो है।": "Not over the phone—this is an in-app sequential-call demo for presentations.",
  "नतीजे की सूचना फिर सुनें": "Replay decision notification",
  "अभी उत्तर दे रहे हैं:": "Responding as:",
  "डेमो में प्रत्येक सदस्य का चयन आप करते हैं।": "You select each member in this demo.",
  "समूह ने मंज़ूरी दी": "Group approved",
  "समूह ने मंज़ूरी नहीं दी": "Group did not approve",
  "डेमो बंद करें": "Close demo",
  "यह केवल इन-ऐप सिमुलेशन है। कोई फ़ोन नंबर डायल नहीं हुआ और कोई पैसा ट्रांसफ़र नहीं हुआ।": "This is an in-app simulation only. No phone number was dialed and no money was transferred.",
  "साथी कोष · डेमो कॉल": "Saathi Kosh · demo call",
  "से अधिकृत मंज़ूरी": "Authorize approval as ",
  "हर सदस्य एक प्रस्ताव पर एक ही बार वोट कर सकता है। वोट बदलने की सुविधा डेमो में बंद है; बदलाव का इतिहास ऑडिट में रहता है।": "Each member can vote once per proposal. Vote changes are disabled in this demo; history is retained in the audit trail.",
  "हर बदलाव का सबूत": "A record of every change",
  "लेखा इतिहास और भरोसे की जाँच": "Audit history and integrity check",
  "SHA-256 से जुड़े रिकॉर्ड। यह tamper-evident है, पूर्ण रूप से immutable या blockchain नहीं।": "Records are linked with SHA-256. This is tamper-evident, not immutable or a blockchain.",
  "ऑडिट चेन सत्यापन": "Audit chain verification",
  "सभी रिकॉर्ड की कड़ी सही है": "All records in the chain are valid",
  " घटनाएँ जाँचीं · SHA-256 linked events": " events checked · SHA-256 linked events",
  "फिर जाँचें": "Verify again",
  "हाल की घटनाएँ": "Recent events",
  "नया लेन-देन, वोट या नियम बदलने पर इतिहास जुड़ता है।": "Transactions, votes and rule changes are added to this history.",
  " घटनाएँ": " events",
  "सिस्टम के बाहर अधिकार रखने वाला व्यक्ति पूरा SQLite डेटाबेस फिर से लिख सकता है। यह रिकॉर्ड में बदलाव पकड़ने में मदद करता है, पूर्ण सुरक्षा की गारंटी नहीं।": "A privileged operator could rewrite the entire SQLite database. This trail can detect changes, but it is not an absolute security guarantee.",
  "आपके समूह के नियम": "Your group rules",
  "सखी समूह सेटिंग": "Sakhi group settings",
  "नीचे के नियम डेमो के लिए हैं, हर समूह इन्हें अपने अनुसार बदले।": "These are demo defaults; each group should set its own rules.",
  "आपातकालीन मतदान की अनुमति": "Allow emergency voting",
  "कोषाध्यक्ष और सह-हस्ताक्षरकर्ता की मंज़ूरी पूरी हुई। पैसा अपने-आप ट्रांसफ़र नहीं हुआ।": "Treasurer and co-signer approvals are complete. No money was transferred.",
  "पहली अधिकृत मंज़ूरी दर्ज हुई। दूसरे हस्ताक्षरकर्ता की पुष्टि बाकी है।": "The first authorized approval is recorded. The second signer's approval is still needed.",
  "इस राशि के लिए समूह मतदान आवश्यक है।": "This amount requires a group vote.",
  "केवल अधिकृत कोषाध्यक्ष या सह-हस्ताक्षरकर्ता अनुमोदित कर सकते हैं।": "Only an authorized treasurer or co-signer can approve this request.",
  "यह प्रस्ताव अब लंबित नहीं है।": "This proposal is no longer pending.",
  "इस प्रस्ताव पर वोटिंग बंद है।": "Voting is closed for this proposal.",
  "अभी कोई ऋण प्रस्ताव नहीं।": "There are no loan proposals yet.",
  "अभी कोई ऋण प्रस्ताव नहीं है।": "There are no loan proposals yet.",
  "समूह का गणना किया हुआ बैलेंस ": "Calculated group balance: ",
  "इस हफ्ते ": "This week ",
  " की बचत जमा हुई है।": " in savings was deposited.",
  " के दर्ज ऋण की बाकी राशि ": "'s recorded outstanding loan is ",
  " है।": ".",
  "बैंक फ़ीड में ": "There are ",
  " प्रविष्टियाँ मेल नहीं खातीं: ": " unmatched bank entries: ",
  "सभी बैंक प्रविष्टियाँ बही से मिल गई हैं।": "All bank entries match the ledger.",
  " का ": " · ",
  " का नवीनतम ऋण प्रस्ताव ": "'s latest loan proposal ",
  "अभी लंबित है": "is pending",
  "स्वीकृत हुआ": "was approved",
  "अस्वीकृत हुआ": "was rejected",
  " हाँ और ": " yes and ",
  " ना वोट दर्ज हैं।": " no votes are recorded.",
  "मैं बैलेंस, इस हफ्ते की जमा, सदस्य का ऋण, बैंक मिलान या ऋण प्रस्ताव के बारे में बता सकती हूँ।": "Ask me about the balance, this week's deposits, a member's loan, bank reconciliation, or a loan proposal.",
  "किस सदस्य के ऋण की जानकारी चाहिए? नाम बताएं।": "Which member's loan would you like to check? Please give their name.",
  "अभी मैं सिर्फ इस हफ्ते की बचत बता सकती हूँ। क्या आप इस हफ्ते की जमा पूछ रहे हैं?": "I can currently report this week's savings only. Did you mean this week's deposits?",
  "राशि रुपये में सही भरें।": "Enter a valid amount in rupees.",
  "नई प्रविष्टि बही में जुड़ गई है।": "The new entry was added to the ledger.",
  "समूह के नियम सुरक्षित हो गए हैं।": "The group rules have been saved.",
  "पुष्टि हो गई — प्रविष्टियाँ बही में सुरक्षित हैं।": "Confirmed — entries are saved in the ledger.",
  "आपका सवाल सुनकर उसका जवाब बही से निकाला गया।": "Your question was transcribed and answered from the ledger.",
  "लाइव आवाज़ पहचान": "Live speech recognition",
  "सुन रहा है… बोलते रहें": "Listening… keep speaking",
  "बोलना शुरू करें": "Start speaking",
  "इस ब्राउज़र में लाइव आवाज़ पहचान उपलब्ध नहीं है। नीचे वाक्य टाइप करें या Chrome/Edge इस्तेमाल करें।": "Live speech recognition is unavailable in this browser. Type below or use Chrome/Edge.",
  "बोलते समय पहचाने गए शब्द यहाँ दिखेंगे। रोककर मसौदा जाँचें।": "Recognized words appear here as you speak. Stop and review the draft.",
  "ब्राउज़र की आवाज़ पहचान सेवा इस्तेमाल होती है; उपलब्धता और गोपनीयता ब्राउज़र पर निर्भर है। बही में कुछ भी आपकी पुष्टि से पहले नहीं जुड़ता।": "Uses your browser's speech-recognition service; availability and privacy depend on the browser. Nothing is added to the ledger before you confirm.",
  "पहचान अभी पूरी नहीं हुई": "Recognition is still in progress",
  "यह वाक्य स्पष्ट नहीं है। फिर बोलें या टाइप करें।": "The sentence was unclear. Speak again or type it.",
  "अभी सुनाई दे रहा है:": "Hearing now:",
  "माइक्रोफ़ोन अनुमति नहीं मिली। साइट सेटिंग में अनुमति दें या वाक्य टाइप करें।": "Microphone permission was denied. Allow it in site settings or type the sentence.",
  "ब्राउज़र की आवाज़ सेवा उपलब्ध नहीं है। नेटवर्क जाँचें या वाक्य टाइप करें।": "The browser speech service is unavailable. Check your network or type the sentence.",
  "लाइव आवाज़ पहचान शुरू नहीं हो सकी। फिर कोशिश करें।": "Could not start live speech recognition. Please try again.",
  "रीफ़्रेश करें": "Refresh",
  "रिकॉर्डिंग या लिखा हुआ वाक्य जोड़ें।": "Add a recording or type the sentence.",
  "कुछ गलत हुआ। फिर कोशिश करें।": "Something went wrong. Please try again.",
  "ऋण राशि सही भरें।": "Enter a valid loan amount.",
  "ऋण अनुरोध साफ़ नहीं है।": "The loan request is unclear.",
  "मसौदा तैयार:": "Draft ready:",
  "पुष्टि और प्रस्ताव जोड़ने से पहले जाँचें।": "Review before confirming and adding the proposal.",
  "सत्यापन सही है — सभी कड़ियाँ मिलती हैं।": "Verification passed — all links are valid.",
  "पहली गड़बड़ी घटना #": "First invalid event: #",
  " पर है।": ".",
  "स्वीकृत": "Approved",
  "अस्वीकृत": "Rejected",
  "दिया गया": "Disbursed",
  "फिर से कोशिश करें": "Try again",
  "बैंक डेटा लोड हो रहा है…": "Loading bank data…",
  " CSV जोड़ें": " Import CSV",
  "बैंक फ़ीड नमूना": "Sample bank feed",
  "सभी डेटा सिम्युलेटेड है।": "All data is simulated.",
};

function translateText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (englishCopy[trimmed]) return text.replace(trimmed, englishCopy[trimmed]!);
  const replacements = Object.entries(englishCopy).sort((a, b) => b[0].length - a[0].length);
  return replacements.reduce((value, [hindi, english]) => value.replaceAll(hindi, english), text);
}

function translateNode(node: ReactNode): ReactNode {
  if (typeof node === "string") return translateText(node);
  if (Array.isArray(node)) return Children.map(node, translateNode);
  if (!isValidElement(node)) return node;
  if (node.type === Fragment) {
    const fragment = node as ReactElement<{ children?: ReactNode }>;
    return cloneElement(fragment, { children: translateNode(fragment.props.children) });
  }
  if (typeof node.type !== "string") return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(element.props)) {
    if (key === "children") {
      props.children = translateNode(value as ReactNode);
    } else if (typeof value === "string" && (
      key === "placeholder" || key === "title" || key === "aria-label" || key === "aria-description" || key === "alt"
    )) {
      props[key] = translateText(value);
    } else {
      props[key] = value;
    }
  }
  return cloneElement(element, props);
}

function Localized({ children }: { children: ReactNode }) {
  const language = useContext(LanguageContext);
  return language === "en" ? translateNode(children) : children;
}

type Transaction = {
  id: string;
  occurredAt: string;
  member: { name: string };
  memberName?: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "LOAN_DISBURSEMENT" | "LOAN_REPAYMENT" | "ADJUSTMENT";
  amountPaise: number;
  description: string;
  source: string;
  actor?: string;
  bankReference?: string | null;
  correctionOfId?: string | null;
  adjustmentDirection?: "IN" | "OUT" | null;
};
type Member = { id: string; name: string; role?: string; authorized?: boolean };
type VoteCount = { yes: number; no: number; cast: number; quorum: number; reachedQuorum: boolean; passed: boolean };
type Loan = {
  id: string;
  memberName: string;
  amountPaise: number;
  purpose: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "DISBURSED";
  emergency: boolean;
  votes: { memberName?: string; member?: Member; choice: string }[];
  approvals?: { member: Member }[];
  decision: VoteCount;
};
type LoanCallSequence = {
  loanId: string;
  recipients: string[];
  index: number;
  phase: "member" | "result" | "pending";
  resultStatus?: "APPROVED" | "REJECTED";
};
type Dashboard = {
  group: { name: string; memberCount: number };
  settings: {
    openingBalancePaise: number;
    approvalLimitPaise: number;
    quorumCount: number;
    approvalPercent: number;
    emergencyVoting: boolean;
    emergencyQuorumCount: number;
    expectedContributionPaise: number;
  };
  members: Member[];
  balancePaise: number;
  depositsThisMonthPaise: number;
  outstandingLoansPaise: number;
  pendingLoanCount: number;
  unmatchedBankCount: number;
  latestTransactions: Transaction[];
  weekly: { depositsPaise: number; repaymentsPaise: number; outflowsPaise: number; openingPaise: number; closingPaise: number };
  expectedContributions: { memberName: string; paidPaise: number; expectedPaise: number }[];
  pendingInstallments: { memberName: string; amountPaise: number; dueAt: string; outstandingPaise: number }[];
  reconciliation: {
    matches: { bank: { id: string }; ledger: { id: string }; reason: string }[];
    unmatchedBank: { bank: { id: string; amountPaise: number; description: string; occurredAt: string }; reason: string }[];
    unmatchedLedger: { ledger: { id: string; amountPaise: number; description: string; occurredAt: string }; reason: string }[];
    mismatches: { bank: { id: string }; ledger: { id: string }; reason: string }[];
    potentialDuplicates: { first: { id: string }; duplicate: { id: string }; reason: string }[];
  };
  pendingLoans: Loan[];
  voiceStatus: string;
  maxAudioSeconds: number;
  currentDateIso: string;
};
type PageId = "home" | "voice" | "ledger" | "bank" | "loans" | "review" | "audit" | "settings";
type ParsedEntry = {
  memberName: string;
  type: Transaction["type"];
  amountPaise: number;
  occurredAt?: string;
  description: string;
  adjustmentDirection?: "IN" | "OUT";
  correctionOfId?: string;
};
type LiveSpeechResult = { isFinal: boolean; [index: number]: { transcript: string } };
type LiveSpeechEvent = { resultIndex: number; results: ArrayLike<LiveSpeechResult> };
type LiveSpeechError = { error: string };
type LiveSpeechRecognizer = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: LiveSpeechEvent) => void) | null;
  onerror: ((event: LiveSpeechError) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type LiveSpeechWindow = Window & {
  SpeechRecognition?: new () => LiveSpeechRecognizer;
  webkitSpeechRecognition?: new () => LiveSpeechRecognizer;
};

const navigation: { id: PageId; label: string; icon: LucideIcon; english: string }[] = [
  { id: "home", label: "मुख्य पटल", english: "Overview", icon: Home },
  { id: "voice", label: "आवाज़ से दर्ज करें", english: "Voice entry", icon: Mic2 },
  { id: "ledger", label: "डिजिटल बही", english: "Ledger", icon: FileText },
  { id: "bank", label: "बैंक मिलान", english: "Reconciliation", icon: ArrowLeftRight },
  { id: "loans", label: "ऋण और मतदान", english: "Loans & voting", icon: Vote },
  { id: "review", label: "साप्ताहिक समीक्षा", english: "Weekly review", icon: ClipboardCheck },
  { id: "audit", label: "लेखा इतिहास", english: "Audit trail", icon: History },
  { id: "settings", label: "समूह सेटिंग", english: "Group settings", icon: Settings2 },
];
const presentationNavigation = navigation.filter(({ id }) =>
  ["home", "voice", "ledger", "loans", "review"].includes(id),
);

const typeLabels: Record<Transaction["type"], string> = {
  DEPOSIT: "बचत जमा",
  WITHDRAWAL: "निकासी",
  LOAN_DISBURSEMENT: "ऋण दिया",
  LOAN_REPAYMENT: "ऋण किस्त",
  ADJUSTMENT: "सुधार",
};
const typeColors: Record<Transaction["type"], string> = {
  DEPOSIT: "green",
  WITHDRAWAL: "rose",
  LOAN_DISBURSEMENT: "amber",
  LOAN_REPAYMENT: "blue",
  ADJUSTMENT: "violet",
};
const sampleNote = "Aaj Sunita ne paanch sau jama kiye, Rekha ne apne loan ki ek hazaar ki kist di, aur Meena ne teen sau jama kiye.";

function inr(paise = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}
function dateLabel(date: string, language: Language = "hi") {
  return new Date(date).toLocaleDateString(language === "en" ? "en-IN" : "hi-IN", { day: "numeric", month: "short" });
}
function amountFromField(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [rupees, fraction = ""] = normalized.split(".");
  return Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
}
function amountField(paise: number) {
  return (paise / 100).toFixed(paise % 100 === 0 ? 0 : 2);
}
function transactionEffect(entry: Transaction) {
  return entry.type === "DEPOSIT" || entry.type === "LOAN_REPAYMENT" ||
    (entry.type === "ADJUSTMENT" && entry.adjustmentDirection !== "OUT")
    ? entry.amountPaise
    : -entry.amountPaise;
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "कुछ गलत हुआ। फिर कोशिश करें।");
  return result as T;
}

export default function HomePage() {
  const language = useSyncExternalStore(subscribeToLanguage, getLanguageSnapshot, (): Language => "hi");
  const [page, setPage] = useState<PageId>("home");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [ledger, setLedger] = useState<Transaction[]>([]);
  const [bankData, setBankData] = useState<Dashboard["reconciliation"] | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [audit, setAudit] = useState<{ events: { id: string; sequence: number; occurredAt: string; actor: string; eventType: string; entityRef: string; payload: string; eventHash: string }[]; verification: { valid: boolean; checked: number; firstInvalidSequence: number | null } } | null>(null);
  const [activeActor, setActiveActor] = useState("Sunita");
  const [callInProgress, setCallInProgress] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [transcriptInput, setTranscriptInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [proposedEntries, setProposedEntries] = useState<ParsedEntry[]>([]);
  const confirmationRequestId = useRef<string | null>(null);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [clarificationAttempts, setClarificationAttempts] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [recording, setRecording] = useState(false);
  const [liveSpeechActive, setLiveSpeechActive] = useState(false);
  const [liveSpeechSupported, setLiveSpeechSupported] = useState(false);
  const [interimSpeechText, setInterimSpeechText] = useState("");
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [ledgerType, setLedgerType] = useState("ALL");
  const [ledgerMember, setLedgerMember] = useState("ALL");
  const [ledgerFrom, setLedgerFrom] = useState("");
  const [ledgerTo, setLedgerTo] = useState("");
  const [ledgerBankFilter, setLedgerBankFilter] = useState("ALL");
  const [manual, setManual] = useState({ memberName: "Sunita", type: "DEPOSIT" as Transaction["type"], amount: "", description: "", correctionOfId: "", adjustmentDirection: "IN" as "IN" | "OUT" });
  const [queryText, setQueryText] = useState("");
  const [queryAnswer, setQueryAnswer] = useState("");
  const [settingsDraft, setSettingsDraft] = useState<Dashboard["settings"] | null>(null);
  const actorLoaded = useRef(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const recordInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerValue = useRef(0);
  const liveSpeechRecognizer = useRef<LiveSpeechRecognizer | null>(null);
  const liveSpeechFinalText = useRef("");

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    const browserWindow = window as LiveSpeechWindow;
    const timer = window.setTimeout(() =>
      setLiveSpeechSupported(Boolean(browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition)), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (page !== "voice") liveSpeechRecognizer.current?.stop();
  }, [page]);

  const refresh = useCallback(async () => {
    try {
      const [home, ledgerResult, bankResult, loanResult, auditResult] = await Promise.all([
        api<Dashboard>("/api/dashboard"),
        api<{ transactions: Transaction[] }>("/api/transactions"),
        api<Dashboard["reconciliation"]>("/api/reconciliation"),
        api<{ loans: Loan[] }>("/api/loans"),
        api<NonNullable<typeof audit>>("/api/audit"),
      ]);
      setDashboard(home);
      setLedger(ledgerResult.transactions);
      setBankData(bankResult);
      setLoans(loanResult.loans);
      setAudit(auditResult);
      setSettingsDraft(home.settings);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "डेटाबेस तैयार नहीं है। पहले README के setup चरण चलाएं।");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
      const savedActor = window.localStorage.getItem("saathi-demo-actor");
      if (savedActor) setActiveActor(savedActor);
      else window.localStorage.setItem("saathi-demo-actor", "Sunita");
      actorLoaded.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    if (actorLoaded.current) window.localStorage.setItem("saathi-demo-actor", activeActor);
  }, [activeActor]);
  useEffect(() => () => {
    if (recordInterval.current) clearInterval(recordInterval.current);
    liveSpeechRecognizer.current?.stop();
    mediaStream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "कुछ गलत हुआ। फिर कोशिश करें।");
    } finally {
      setBusy(false);
    }
  };

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        const file = new File(chunks, `saathi-note-${Date.now()}.webm`, { type: recorder.mimeType || "audio/webm" });
        setAudioFile(file);
        setAudioDuration(timerValue.current);
        setTranscriptInput("");
        setTranscript("");
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorder.current = recorder;
      timerValue.current = 0;
      setRecordedSeconds(0);
      setRecording(true);
      recordInterval.current = setInterval(() => {
        timerValue.current += 1;
        setRecordedSeconds(timerValue.current);
        if (timerValue.current >= (dashboard?.maxAudioSeconds ?? 30)) stopRecording();
      }, 1000);
    } catch {
      setError("माइक्रोफ़ोन अनुमति नहीं मिली। आप वाक्य टाइप कर सकते हैं या ऑडियो फ़ाइल चुनें।");
    }
  }
  function stopRecording() {
    if (recordInterval.current) clearInterval(recordInterval.current);
    recordInterval.current = null;
    if (mediaRecorder.current?.state === "recording") mediaRecorder.current.stop();
    setRecording(false);
  }
  function startLiveSpeech() {
    const browserWindow = window as LiveSpeechWindow;
    const SpeechRecognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("इस ब्राउज़र में लाइव आवाज़ से लिखना उपलब्ध नहीं है। Chrome/Edge में खोलें या नीचे वाक्य टाइप करें।");
      return;
    }
    setError("");
    setMessage("");
    setAudioFile(null);
    setTranscript("");
    setTranscriptInput("");
    setProposedEntries([]);
    setInterimSpeechText("");
    liveSpeechFinalText.current = "";
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === "en" ? "en-IN" : "hi-IN";
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const alternative = result?.[0];
        if (!alternative?.transcript) continue;
        if (result.isFinal) finalTranscript += `${alternative.transcript} `;
        else interimTranscript += `${alternative.transcript} `;
      }
      liveSpeechFinalText.current = finalTranscript.trim();
      setTranscriptInput(`${finalTranscript}${interimTranscript}`.trim());
      setInterimSpeechText(interimTranscript.trim());
    };
    recognition.onerror = (event) => {
      setLiveSpeechActive(false);
      liveSpeechRecognizer.current = null;
      setInterimSpeechText("");
      setTranscriptInput(liveSpeechFinalText.current);
      if (event.error === "aborted") return;
      const errorMessage = event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "माइक्रोफ़ोन अनुमति नहीं मिली। साइट सेटिंग में अनुमति दें या वाक्य टाइप करें।"
        : event.error === "network"
          ? "ब्राउज़र की आवाज़ सेवा उपलब्ध नहीं है। नेटवर्क जाँचें या वाक्य टाइप करें।"
          : `लाइव आवाज़ पहचान विफल हुई (${event.error})। फिर कोशिश करें या वाक्य टाइप करें।`;
      setError(errorMessage);
    };
    recognition.onend = () => {
      setLiveSpeechActive(false);
      setInterimSpeechText("");
      setTranscriptInput(liveSpeechFinalText.current);
      if (liveSpeechRecognizer.current === recognition) liveSpeechRecognizer.current = null;
    };
    try {
      liveSpeechRecognizer.current = recognition;
      recognition.start();
      setLiveSpeechActive(true);
    } catch (cause) {
      liveSpeechRecognizer.current = null;
      setLiveSpeechActive(false);
      setError(cause instanceof Error ? cause.message : "लाइव आवाज़ पहचान शुरू नहीं हो सकी। फिर कोशिश करें।");
    }
  }
  function stopLiveSpeech() {
    liveSpeechRecognizer.current?.stop();
  }
  async function transcribe() {
    await runAction(async () => {
      const form = new FormData();
      form.append("text", transcriptInput);
      const result = await api<{ transcript: string; entries: ParsedEntry[]; unresolved: string[] }>("/api/voice/transcribe", { method: "POST", body: form });
      setTranscript(result.transcript);
      setProposedEntries(result.entries);
      setUnresolved(result.unresolved);
      confirmationRequestId.current = null;
      setClarificationAttempts(result.unresolved.length ? (attempts) => attempts + 1 : 0);
      setMessage(result.entries.length ? `${result.entries.length} प्रविष्टियों का मसौदा तैयार है। पुष्टि से पहले कोई बचत नहीं हुई है।` : "");
    });
  }
  async function confirmVoiceEntries() {
    if (!proposedEntries.length) return;
    await runAction(async () => {
      await api("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-actor": activeActor },
        body: JSON.stringify({
          requestId: confirmationRequestId.current ?? (confirmationRequestId.current = crypto.randomUUID()),
          entries: proposedEntries,
        }),
      });
      setProposedEntries([]);
      confirmationRequestId.current = null;
      setTranscript("");
      setTranscriptInput("");
      setAudioFile(null);
      setUnresolved([]);
      setMessage("पुष्टि हो गई — प्रविष्टियाँ बही में सुरक्षित हैं।");
      await refresh();
    });
  }
  async function speak(text: string) {
    await runAction(async () => {
      if (dashboard?.voiceStatus !== "Voice API Connected") {
        if (!("speechSynthesis" in window)) throw new Error("इस ब्राउज़र में आवाज़ उपलब्ध नहीं; पाठ पढ़ें।");
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === "en" ? "en-IN" : "hi-IN";
        window.speechSynthesis.speak(utterance);
        return;
      }
      const result = await api<{ audioBase64: string }>("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const audio = new Audio(`data:audio/mpeg;base64,${result.audioBase64}`);
      await audio.play();
    });
  }
  async function saveManual() {
    const amountPaise = amountFromField(manual.amount);
    if (!amountPaise) throw new Error("राशि रुपये में सही भरें।");
    await api("/api/transactions/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-actor": activeActor },
      body: JSON.stringify({
        memberName: manual.memberName,
        type: manual.type,
        amountPaise,
        description: manual.description,
        ...(manual.type === "ADJUSTMENT" ? { adjustmentDirection: manual.adjustmentDirection } : {}),
        ...(manual.correctionOfId ? { correctionOfId: manual.correctionOfId } : {}),
      }),
    });
    setManual({ ...manual, amount: "", description: "", correctionOfId: "" });
    setMessage("नई प्रविष्टि बही में जुड़ गई है।");
    await refresh();
  }
  async function submitQuery() {
    await runAction(async () => {
      const result = await api<{ answer: string }>("/api/voice/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, language }),
      });
      setQueryAnswer(result.answer);
    });
  }
  async function transcribeQueryAudio() {
    if (!audioFile) return;
    await runAction(async () => {
      const form = new FormData();
      form.append("audio", audioFile);
      form.append("duration", String(audioDuration));
      const result = await api<{ transcript: string }>("/api/voice/transcribe", { method: "POST", body: form });
      setQueryText(result.transcript);
      const answer = await api<{ answer: string }>("/api/voice/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: result.transcript, language }),
      });
      setQueryAnswer(answer.answer);
      setAudioFile(null);
      setMessage("आपका सवाल सुनकर उसका जवाब बही से निकाला गया।");
    });
  }
  async function saveSettings() {
    if (!settingsDraft) return;
    const result = {
      ...settingsDraft,
      approvalLimitPaise: amountFromField(String(settingsDraft.approvalLimitPaise / 100)) ?? settingsDraft.approvalLimitPaise,
      expectedContributionPaise: amountFromField(String(settingsDraft.expectedContributionPaise / 100)) ?? settingsDraft.expectedContributionPaise,
    };
    await api("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-demo-actor": activeActor },
      body: JSON.stringify(result),
    });
    setMessage("समूह के नियम सुरक्षित हो गए हैं।");
    await refresh();
  }

  const selectedPage = navigation.find((item) => item.id === page)!;
  const voiceStatusLabel = dashboard?.voiceStatus ?? "लोड हो रहा है";
  const closingBalance = dashboard?.weekly.closingPaise ?? 0;
  const weeklySummary = dashboard
    ? language === "en"
      ? `Hello. This week the group received ${inr(dashboard.weekly.depositsPaise)} in savings and ${inr(dashboard.weekly.repaymentsPaise)} in loan repayments. ${inr(dashboard.weekly.outflowsPaise)} went out. ${dashboard.pendingInstallments.length ? `${dashboard.pendingInstallments.length} loan instalments are due soon.` : "No loan instalments are scheduled."} ${dashboard.unmatchedBankCount} bank entries still need matching. The calculated group balance is ${inr(closingBalance)}.`
      : `नमस्ते। इस हफ्ते समूह में ${inr(dashboard.weekly.depositsPaise)} बचत जमा हुई और ${inr(dashboard.weekly.repaymentsPaise)} की ऋण किस्त आई। ${inr(dashboard.weekly.outflowsPaise)} निकले। ${dashboard.pendingInstallments.length ? `${dashboard.pendingInstallments.length} ऋण किस्त आने वाली है।` : "अभी कोई किस्त तय नहीं है।"} बैंक रिकॉर्ड में ${dashboard.unmatchedBankCount} प्रविष्टि अभी मिलनी बाकी है। समूह का गणना किया हुआ बैलेंस ${inr(closingBalance)} है।`
    : "";
  const unmatchedIds = new Set([
    ...(bankData?.unmatchedLedger ?? []).map((item) => item.ledger.id),
    ...(bankData?.mismatches ?? []).map((item) => item.ledger.id),
  ]);
  const proposalReadback = proposedEntries.map((entry) =>
    `${entry.memberName} · ${typeLabels[entry.type]} · ${inr(entry.amountPaise)}`,
  ).join(". ");
  const filteredLedger = ledger.filter((entry) => {
    const typeMatches = ledgerType === "ALL" || entry.type === ledgerType;
    const memberMatches = ledgerMember === "ALL" || (entry.member.name ?? entry.memberName) === ledgerMember;
    const date = new Date(entry.occurredAt).toISOString().slice(0, 10);
    const dateMatches = (!ledgerFrom || date >= ledgerFrom) && (!ledgerTo || date <= ledgerTo);
    const bankMatches = ledgerBankFilter === "ALL" || (ledgerBankFilter === "UNMATCHED" ? unmatchedIds.has(entry.id) : !unmatchedIds.has(entry.id));
    return typeMatches && memberMatches && dateMatches && bankMatches;
  });

  return (
    <LanguageContext.Provider value={language}>
    <Localized>
    <main className={`app-shell ${language === "en" ? "lang-en" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><HandCoins size={23} /></div>
          <div><strong>साथी <span>कोष</span></strong><small>सखी समूह का डिजिटल साथी</small></div>
        </div>
        <div className="group-switch">
          <div className="group-avatar">स</div>
          <div><strong>सखी स्वयं सहायता समूह</strong><small>12 सदस्य · सीहोर, मध्य प्रदेश</small></div>
          <ChevronDown size={15} />
        </div>
        <p className="nav-caption">आपका समूह</p>
        <nav className="side-nav" aria-label="मुख्य नेविगेशन">
          {presentationNavigation.map(({ id, label, icon: Icon, english }) => (
            <button key={id} onClick={() => { setPage(id); setError(""); setMessage(""); }} className={`nav-link ${page === id ? "active" : ""}`}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}<small>{english}</small></span>
              {id === "loans" && dashboard?.pendingLoanCount ? <i className="nav-count">{dashboard.pendingLoanCount}</i> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><ShieldCheck size={17} /><span>आपकी बचत, आपकी समझ।<small>यह एक अभ्यास डेमो है।</small></span></div>
          <div className="profile-row"><div className="profile-avatar">{activeActor.slice(0, 1)}</div><div><strong>{activeActor}</strong><small>डेमो भूमिका</small></div><select aria-label="डेमो भूमिका चुनें" disabled={callInProgress} value={activeActor} onChange={(event) => setActiveActor(event.target.value)}>{dashboard?.members.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}</select></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>सखी स्वयं सहायता समूह</span><span className="crumb-slash">/</span><strong>{selectedPage.label}</strong></div>
          <div className="topbar-right">
            <label className="language-switch" title="भाषा बदलें / Change language">
              <span aria-hidden="true">文</span>
              <select aria-label="भाषा / Language" value={language} onChange={(event) => {
                const selected = event.target.value;
                if (selected === "hi" || selected === "en") setLanguage(selected);
              }}>
                <option value="hi">हिन्दी</option>
                <option value="en">English</option>
              </select>
            </label>
            <span className={`provider-pill ${voiceStatusLabel === "Voice API Connected" ? "provider-connected" : ""}`}><span className="status-dot" />{voiceStatusLabel}</span>
            <button className="icon-button" aria-label="पटल फिर से लोड करें" onClick={() => void refresh()}><RefreshCw size={17} /></button>
            <button className="icon-button notification-button" aria-label="डेमो में सूचनाएं उपलब्ध नहीं" title="डेमो में सूचनाएं उपलब्ध नहीं" disabled><Bell size={17} /><i /></button>
            <div className="top-avatar">{activeActor.slice(0, 1)}</div>
          </div>
        </header>

        <div className="mobile-nav" aria-label="मोबाइल नेविगेशन">
          {presentationNavigation.map(({ id, label, icon: Icon }) => <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)} aria-label={label}><Icon size={18} /><span>{label}</span></button>)}
        </div>

        <div className="page-content">
          <div className="demo-banner"><span className="demo-icon"><Sparkles size={14} /></span><span><strong>सिम्युलेटेड डेमो डेटा</strong><span> — समूह, लेन-देन, बैंक फ़ीड और वॉलेट सभी काल्पनिक हैं। वास्तविक बैंक से जुड़ा नहीं है।</span></span>          <span className="demo-tag">डेमो <CircleHelp size={14} /></span></div>
          {error && <div className="alert alert-error" role="alert"><X size={17} />{error}<button onClick={() => setError("")} aria-label="त्रुटि बंद करें"><X size={15} /></button></div>}
          {message && <div className="alert alert-success" role="status"><Check size={17} />{message}<button onClick={() => setMessage("")} aria-label="संदेश बंद करें"><X size={15} /></button></div>}
          {!dashboard && !error ? <div className="loading-card"><LoaderCircle className="spin" /> समूह की बही खुल रही है…</div> : null}
          {dashboard && (
            <>
              {page === "home" && <DashboardView data={dashboard} actor={activeActor} onSpeak={() => void speak(weeklySummary)} onNavigate={setPage} onReview={() => setPage("review")} />}
              {page === "voice" && <section className="page-section">
                <div className="page-heading"><div><p className="eyebrow">आसान और सुरक्षित</p><h1>बोलें, जाँचें, फिर सहेजें</h1><p className="subheading">आवाज़ से लेन-देन का मसौदा बनाएं। आपकी स्पष्ट पुष्टि से पहले कुछ भी बही में नहीं जुड़ता।</p></div><span className="page-icon"><Mic2 size={24} /></span></div>
                <div className="voice-layout">
                  <div className="panel voice-panel">
                    <div className="panel-heading"><div><span className="step-chip">कदम 1</span><h2>अपना लेन-देन बताएं</h2><p>हिंदी या Hinglish में बोलें। अधिकतम {dashboard.maxAudioSeconds} सेकंड।</p></div><div className="voice-spark"><Mic size={20} /></div></div>
                    <div className={`record-box ${liveSpeechActive ? "is-recording" : ""}`}>
                      <button className={`record-button ${liveSpeechActive ? "recording" : ""}`} type="button" disabled={busy} onClick={() => liveSpeechActive ? stopLiveSpeech() : startLiveSpeech()} aria-label={liveSpeechActive ? "बोलना रोकें" : "लाइव आवाज़ पहचान शुरू करें"}>
                        {liveSpeechActive ? <Pause size={21} fill="currentColor" /> : <Mic size={23} />}
                      </button>
                      <strong>{liveSpeechActive ? "सुन रहा है… बोलते रहें" : liveSpeechSupported ? "बोलना शुरू करें" : "इस ब्राउज़र में लाइव आवाज़ पहचान उपलब्ध नहीं है। नीचे वाक्य टाइप करें या Chrome/Edge इस्तेमाल करें।"}</strong>
                      <span>बोलते समय पहचाने गए शब्द यहाँ दिखेंगे। रोककर मसौदा जाँचें।</span>
                    </div>
                    <div className="or-divider"><span>या डेमो में लिखें</span></div>
                    <label className="field-label" htmlFor="voice-note">आपने क्या कहा?</label>
                    <textarea id="voice-note" rows={3} value={transcriptInput} onChange={(event) => { setTranscriptInput(event.target.value); if (event.target.value) setAudioFile(null); }} placeholder="उदाहरण: Aaj Sunita ne paanch sau jama kiye…" aria-live="polite" />
                    {interimSpeechText && <p className="live-transcript-preview" aria-live="polite"><span>अभी सुनाई दे रहा है:</span> {interimSpeechText}</p>}
                    <div className="field-foot"><span>आपकी आवाज़ तभी भेजी जाती है जब आप जाँचें दबाते हैं।</span><button className="text-button" onClick={() => { setTranscriptInput(sampleNote); setAudioFile(null); }}>उदाहरण भरें</button></div>
                    <div className="provider-note"><LockKeyhole size={14} /><span>ब्राउज़र की आवाज़ पहचान सेवा इस्तेमाल होती है; उपलब्धता और गोपनीयता ब्राउज़र पर निर्भर है। बही में कुछ भी आपकी पुष्टि से पहले नहीं जुड़ता।</span></div>
                    <button className="button button-primary button-wide" disabled={busy || liveSpeechActive || !transcriptInput.trim()} onClick={() => void transcribe()}>{busy ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}पहले सुनें और जाँचें</button>
                  </div>
                  <div className="voice-help">
                    <div className="help-card"><div className="help-heading"><ShieldCheck size={18} /><strong>आपकी पुष्टि ज़रूरी है</strong></div><p>साथी कोष सिर्फ मसौदा बनाता है। राशि और सदस्य का नाम जाँचें, फिर सहेजने की अनुमति दें।</p><div className="help-step"><span>1</span>बोलें या लिखें</div><div className="help-step"><span>2</span>लेन-देन जाँचें</div><div className="help-step"><span>3</span>खुद पुष्टि करें</div></div>
                    <div className="help-card soft-card"><div className="help-heading"><CircleHelp size={18} /><strong>अस्पष्ट आवाज़?</strong></div><p>राशि या नाम साफ़ न हो तो हम पूछेंगे। आप टेक्स्ट में सुधार कर सकते हैं। कोई अनुमान से पैसा दर्ज नहीं होता।</p></div>
                    <button className="button button-outline button-wide" onClick={() => setPage("ledger")}><FileText size={16} />बही देखें</button>
                  </div>
                </div>
                {(transcript || proposedEntries.length || unresolved.length > 0) && <div className="panel proposal-panel">
                  <div className="panel-heading proposal-heading"><div><span className="step-chip">कदम 2</span><h2>सहेजने से पहले जाँचें</h2><p>हर प्रस्तावित प्रविष्टि संपादन योग्य है।</p></div><div className="proposal-head-actions"><button className="text-button" disabled={!proposedEntries.length} onClick={() => void speak(proposalReadback)}><Play size={13} />सुनें</button><span className="pending-pill"><Clock3 size={13} />अभी सहेजा नहीं</span></div></div>
                  {transcript && <div className="transcript-box"><span>सुना गया वाक्य</span><p>“{transcript}”</p></div>}
                  {unresolved.map((item) => <div key={item} className="unresolved-row"><CircleHelp size={16} />{item}</div>)}
                  {clarificationAttempts >= 2 && unresolved.length > 0 && <div className="unresolved-row"><FileText size={16} />दो बार स्पष्ट न होने पर सीधे नीचे वाक्य टाइप करके आगे बढ़ें।</div>}
                  {proposedEntries.map((entry, index) => <div className="entry-editor" key={`${entry.memberName}-${index}`}>
                    <div className="entry-index">{String(index + 1).padStart(2, "0")}</div>
                    <label><span>सदस्य</span><select value={entry.memberName} onChange={(event) => setProposedEntries((old) => old.map((row, i) => i === index ? { ...row, memberName: event.target.value } : row))}>{dashboard.members.map((member) => <option key={member.id}>{member.name}</option>)}</select></label>
                    <label><span>प्रकार</span><select value={entry.type} onChange={(event) => setProposedEntries((old) => old.map((row, i) => i === index ? { ...row, type: event.target.value as Transaction["type"] } : row))}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label><span>राशि ₹</span><input value={amountField(entry.amountPaise)} inputMode="decimal" onChange={(event) => { const amountPaise = amountFromField(event.target.value); if (amountPaise !== null) setProposedEntries((old) => old.map((row, i) => i === index ? { ...row, amountPaise } : row)); }} /></label>
                    <label><span>तारीख़</span><input type="date" value={(entry.occurredAt ?? new Date().toISOString()).slice(0, 10)} onChange={(event) => setProposedEntries((old) => old.map((row, i) => i === index ? { ...row, occurredAt: new Date(`${event.target.value}T00:00:00`).toISOString() } : row))} /></label>
                    <button className="entry-remove" aria-label="प्रविष्टि हटाएं" onClick={() => setProposedEntries((old) => old.filter((_, i) => i !== index))}><X size={16} /></button>
                  </div>)}
                  {proposedEntries.length > 0 && <div className="confirm-row"><span><LockKeyhole size={14} />पुष्टि तक कोई लेन-देन सहेजा नहीं गया</span><button className="button button-primary" disabled={busy} onClick={() => void confirmVoiceEntries()}>{busy ? <LoaderCircle className="spin" size={16} /> : <CheckCheck size={17} />}पुष्टि करें और बही में सहेजें</button></div>}
                </div>}
              </section>}
              {page === "ledger" && <section className="page-section">
                <div className="page-heading"><div><p className="eyebrow">साफ़ हिसाब, सबके सामने</p><h1>समूह की डिजिटल बही</h1><p className="subheading">हर प्रविष्टि का स्रोत, पुष्टि और बैंक मिलान यहाँ देखें।</p></div><div className="balance-chip"><span>गणना किया बैलेंस</span><strong>{inr(dashboard.balancePaise)}</strong></div></div>
                <div className="explain-strip"><IndianRupee size={17} /><span><strong>बैलेंस कैसे निकला?</strong> शुरुआती {inr(dashboard.settings.openingBalancePaise)} + बचत जमा + ऋण किस्तें − निकासी − दिए गए ऋण। सुधार भी अलग से दर्ज होते हैं।</span></div>
                <div className="panel ledger-panel">
                  <div className="table-toolbar"><div><h2>सभी प्रविष्टियाँ <span className="count-pill">{filteredLedger.length}</span></h2><p>बही में बदलाव का इतिहास मिटाया नहीं जाता।</p></div><button className="button button-outline" onClick={() => document.getElementById("manual-form")?.scrollIntoView({ behavior: "smooth" })}><Plus size={16} />नई प्रविष्टि</button></div>
                  <div className="filters">
                    <label><span>सदस्य</span><select value={ledgerMember} onChange={(event) => setLedgerMember(event.target.value)}><option value="ALL">सभी सदस्य</option>{dashboard.members.map((member) => <option key={member.id}>{member.name}</option>)}</select></label>
                    <label><span>लेन-देन</span><select value={ledgerType} onChange={(event) => setLedgerType(event.target.value)}><option value="ALL">सभी प्रकार</option>{Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                    <label><span>से</span><input type="date" value={ledgerFrom} onChange={(event) => setLedgerFrom(event.target.value)} /></label>
                    <label><span>तक</span><input type="date" value={ledgerTo} onChange={(event) => setLedgerTo(event.target.value)} /></label>
                    <label><span>बैंक मिलान</span><select value={ledgerBankFilter} onChange={(event) => setLedgerBankFilter(event.target.value)}><option value="ALL">सभी</option><option value="UNMATCHED">मिलान बाकी</option><option value="MATCHED">मिलान हुआ</option></select></label>
                  </div>
                  <TransactionTable transactions={filteredLedger} unmatchedIds={unmatchedIds} />
                </div>
                <div className="panel manual-panel" id="manual-form"><div className="panel-heading"><div><h2>हाथ से प्रविष्टि जोड़ें</h2><p>सहेजते ही पुष्टि और ऑडिट इतिहास दर्ज होगा।</p></div><span className="manual-icon"><Plus size={18} /></span></div>
                  <div className="manual-grid">
                    <label>सदस्य<select value={manual.memberName} onChange={(event) => setManual({ ...manual, memberName: event.target.value })}>{dashboard.members.map((member) => <option key={member.id}>{member.name}</option>)}</select></label>
                    <label>लेन-देन का प्रकार<select value={manual.type} onChange={(event) => setManual({ ...manual, type: event.target.value as Transaction["type"] })}>{Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                    <label>राशि (₹)<input type="number" min="0.01" step="0.01" value={manual.amount} onChange={(event) => setManual({ ...manual, amount: event.target.value })} placeholder="500" /></label>
                    {manual.type === "ADJUSTMENT" && <label>सुधार दिशा<select value={manual.adjustmentDirection} onChange={(event) => setManual({ ...manual, adjustmentDirection: event.target.value as "IN" | "OUT" })}><option value="IN">बैलेंस में जोड़ें</option><option value="OUT">बैलेंस से घटाएं</option></select></label>}
                    <label className="manual-description">विवरण<input value={manual.description} onChange={(event) => setManual({ ...manual, description: event.target.value })} placeholder="इस प्रविष्टि का कारण" /></label>
                    <label>सुधार किस प्रविष्टि का?<select value={manual.correctionOfId} onChange={(event) => { const original = ledger.find((row) => row.id === event.target.value); setManual({ ...manual, correctionOfId: event.target.value, type: original ? "ADJUSTMENT" : manual.type, memberName: original?.member.name ?? manual.memberName }); }}><option value="">कोई नहीं</option>{ledger.map((entry) => <option key={entry.id} value={entry.id}>{entry.member.name} · {typeLabels[entry.type]} · {inr(entry.amountPaise)}</option>)}</select></label>
                    <button className="button button-primary" onClick={() => void runAction(saveManual)} disabled={busy}><Plus size={16} />बही में जोड़ें</button>
                  </div>
                </div>
              </section>}
              {page === "bank" && <section className="page-section">
                <div className="page-heading"><div><p className="eyebrow">वास्तविक बैंक से नहीं जुड़ा</p><h1>बैंक लेन-देन मिलाएं</h1><p className="subheading">राशि, दिशा, तारीख और संदर्भ से बही की जाँच करें। हर नतीजे का कारण दिखता है।</p></div><span className="page-icon amber-icon"><Landmark size={23} /></span></div>
                <div className="bank-warning"><Landmark size={18} /><div><strong>SIMULATED BANK DATA · केवल उदाहरण</strong><span>यह काल्पनिक बैंक फ़ीड है। कोई वास्तविक बैंक खाता या स्टेटमेंट नहीं जोड़ा गया।</span></div><button className="button button-dark" disabled={busy} onClick={() => void runAction(async () => { const result = await api<{ imported: number }>("/api/reconciliation/import", { method: "POST" }); setMessage(`${result.imported} नमूना बैंक रिकॉर्ड आयात हुए।`); await refresh(); })}><ArrowDownToLine size={16} />नमूना CSV जोड़ें</button></div>
                <div className="recon-stats"><StatCard label="मिलान हुए" value={String(bankData?.matches.length ?? 0)} note="संदर्भ सहित" icon={BadgeCheck} tone="green" /><StatCard label="बैंक में अनजान जमा" value={String(bankData?.unmatchedBank.length ?? 0)} note="बही में नहीं मिला" icon={ArrowDownLeft} tone="amber" /><StatCard label="बही में अनमिली" value={String(bankData?.unmatchedLedger.length ?? 0)} note="बैंक प्रमाण बाकी" icon={FileClock} tone="rose" /><StatCard label="राशि अंतर" value={String(bankData?.mismatches.length ?? 0)} note="जाँच की ज़रूरत" icon={ArrowLeftRight} tone="blue" /><StatCard label="संभावित दोहराव" value={String(bankData?.potentialDuplicates.length ?? 0)} note="समीक्षा की ज़रूरत" icon={Activity} tone="violet" /></div>
                <div className="recon-grid">
                  <div className="panel"><div className="table-toolbar"><div><h2><CheckCheck size={17} />मिले हुए लेन-देन</h2><p>सिर्फ बराबर राशि नहीं — संदर्भ और तारीख भी।</p></div><span className="status-badge status-match">मिलान हुआ</span></div><div className="match-list">{bankData?.matches.map((item) => { const entry = ledger.find((row) => row.id === item.ledger.id); return <div key={item.bank.id} className="recon-item"><div className="recon-check"><Check size={15} /></div><div><strong>{entry?.member.name ?? "समूह"} · {inr(entry?.amountPaise ?? 0)}</strong><p>{entry?.description}</p><small>{item.reason}</small></div><span className="status-badge status-match">ठीक</span></div>; })}{!bankData?.matches.length && <EmptyState text="अभी कोई मिलान नहीं मिला।" />}</div></div>
                  <div className="panel"><div className="table-toolbar"><div><h2><CircleHelp size={17} />जाँच की ज़रूरत</h2><p>यहाँ दिखी विसंगतियों को हाथ से जाँचें।</p></div><span className="status-badge status-review">ध्यान दें</span></div><div className="match-list">{bankData?.unmatchedBank.map((item) => <div key={item.bank.id} className="recon-item"><div className="recon-alert"><ArrowDownLeft size={15} /></div><div><strong>बैंक में जमा · {inr(item.bank.amountPaise)}</strong><p>{item.bank.description}</p><small>{item.reason}</small></div><span className="status-badge status-review">{item.reason.startsWith("Potential duplicate") ? "संभावित डुप्लिकेट" : "नहीं मिला"}</span></div>)}{bankData?.unmatchedLedger.map((item) => <div key={item.ledger.id} className="recon-item"><div className="recon-alert"><FileText size={15} /></div><div><strong>बही में · {inr(item.ledger.amountPaise)}</strong><p>{item.ledger.description}</p><small>{item.reason}</small></div><span className="status-badge status-review">बैंक बाकी</span></div>)}{bankData?.mismatches.map((item) => <div key={item.bank.id} className="recon-item"><div className="recon-alert"><ArrowLeftRight size={15} /></div><div><strong>राशि अलग</strong><p>{item.reason}</p></div><span className="status-badge status-review">जाँचें</span></div>)}{!bankData?.unmatchedBank.length && !bankData?.unmatchedLedger.length && !bankData?.mismatches.length && <EmptyState text="सभी प्रविष्टियाँ मिल गईं।" />}</div></div>
                </div>
              </section>}
              {page === "loans" && <LoanView key={activeActor} loans={loans} members={dashboard.members} actor={activeActor} settings={dashboard.settings} busy={busy} onAction={runAction} onRefresh={refresh} onMessage={setMessage} onSettings={() => setPage("settings")} />}
              {page === "review" && <section className="page-section">
                <div className="page-heading"><div><p className="eyebrow">हर रविवार, साथ बैठकर</p><h1>इस हफ़्ते का समूह हिसाब</h1><p className="subheading">सभी रकम बही से अपने-आप जुड़ी हैं। समूह में साथ मिलकर समीक्षा करें।</p></div><span className="page-icon"><ClipboardCheck size={23} /></span></div>
                <div className="summary-banner"><div className="summary-emblem"><Sparkles size={21} /></div><div><span>सखी स्वयं सहायता समूह · साप्ताहिक समीक्षा</span><strong>इस सप्ताह {inr(dashboard.weekly.depositsPaise + dashboard.weekly.repaymentsPaise)} की कुल आवक</strong><p>शुरुआती बैलेंस {inr(dashboard.weekly.openingPaise)} → वर्तमान गणना {inr(dashboard.weekly.closingPaise)}</p></div><button className="button button-light" onClick={() => void speak(weeklySummary)}><Play size={15} fill="currentColor" />सुनें</button></div>
                <div className="summary-grid"><div className="panel"><h2>इस सप्ताह का हिसाब</h2><div className="summary-line"><span><i className="legend-dot green-dot" />साप्ताहिक बचत जमा</span><strong>{inr(dashboard.weekly.depositsPaise)}</strong></div><div className="summary-line"><span><i className="legend-dot blue-dot" />ऋण किस्तें वापस</span><strong>{inr(dashboard.weekly.repaymentsPaise)}</strong></div><div className="summary-line"><span><i className="legend-dot rose-dot" />निकासी और ऋण दिए</span><strong>− {inr(dashboard.weekly.outflowsPaise)}</strong></div><div className="summary-total"><span>आज का गणना बैलेंस</span><strong>{inr(dashboard.weekly.closingPaise)}</strong></div></div><div className="panel"><div className="table-toolbar"><div><h2>योगदान की याद</h2><p>इस सप्ताह की तय बचत के अनुसार।</p></div><Users size={17} /></div><div className="contribution-list">{dashboard.expectedContributions.slice(0, 6).map((member) => <div key={member.memberName} className="contribution-row"><div className="tiny-avatar">{member.memberName.slice(0, 1)}</div><div><strong>{member.memberName}</strong><small>जमा {inr(member.paidPaise)} / {inr(member.expectedPaise)}</small></div><span className="contribution-pending">बाकी {inr(member.expectedPaise - member.paidPaise)}</span></div>)}{dashboard.expectedContributions.length === 0 && <EmptyState text="सभी तय योगदान दर्ज हैं।" />}</div></div></div>
                <div className="panel installment-panel"><div className="table-toolbar"><div><h2>आने वाली ऋण किस्तें</h2><p>समूह के दर्ज ऋण और तय भुगतान से।</p></div><HandCoins size={17} /></div>{dashboard.pendingInstallments.map((installment) => <div key={installment.memberName} className="summary-line"><span>{installment.memberName} · {dateLabel(installment.dueAt, language)} तक</span><strong>{inr(installment.amountPaise)} · बकाया {inr(installment.outstandingPaise)}</strong></div>)}{dashboard.pendingInstallments.length === 0 && <p className="quiet-note">अभी कोई किस्त तय नहीं है।</p>}</div>
                <div className="panel query-panel"><div className="table-toolbar"><div><h2><Mic2 size={17} />समूह से पूछें</h2><p>तय सवालों के जवाब बही और बैंक मिलान से।</p></div><span className="status-badge status-neutral">जाँच योग्य जवाब</span></div><form className="query-row" onSubmit={(event) => { event.preventDefault(); void submitQuery(); }}><input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="जैसे: Kitna paisa hai? · Meena ka loan kitna baaki hai?" /><button className="button button-outline" type="button" disabled={busy || voiceStatusLabel !== "Voice API Connected" || recording} title={voiceStatusLabel === "Voice API Connected" ? "सवाल बोलकर रिकॉर्ड करें" : "बोले हुए सवाल के लिए ElevenLabs कॉन्फ़िगर करें; Mock Mode में टाइप करें"} onClick={() => void startRecording()}><Mic size={15} />सवाल बोलें</button>{recording && <button className="button button-outline" type="button" onClick={stopRecording}><Pause size={14} />रोकें · {recordedSeconds}s</button>}{audioFile && !recording && voiceStatusLabel === "Voice API Connected" && <button className="button button-outline" type="button" disabled={busy} onClick={() => void transcribeQueryAudio()}><FileAudio2 size={14} />सवाल पूछें</button>}<button className="button button-primary" disabled={busy || !queryText.trim()}><Send size={15} />पूछें</button></form><p className="query-privacy">आवाज़ वाला सवाल चुनने पर ऑडियो ElevenLabs को भेजा जाएगा। Mock Mode में सवाल लिखकर पूछें।</p>{queryAnswer && <div className="query-answer"><Sparkles size={16} />{queryAnswer}<button aria-label="जवाब पढ़कर सुनें" onClick={() => void speak(queryAnswer)}><Play size={14} /></button></div>}<div className="suggestion-chips">{["Kitna paisa hai?", "Is hafte kitna jama hua?", "Kaun si bank entries match nahi hui?", "Loan proposal ka result kya hai?"].map((query) => <button key={query} onClick={() => setQueryText(query)}>{query}</button>)}</div></div>
              </section>}
              {page === "audit" && <section className="page-section">
                <div className="page-heading"><div><p className="eyebrow">हर बदलाव का सबूत</p><h1>लेखा इतिहास और भरोसे की जाँच</h1><p className="subheading">SHA-256 से जुड़े रिकॉर्ड। यह tamper-evident है, पूर्ण रूप से immutable या blockchain नहीं।</p></div><span className="page-icon"><ShieldCheck size={23} /></span></div>
                <div className={`chain-banner ${audit?.verification.valid ? "" : "chain-invalid"}`}><div className="chain-icon">{audit?.verification.valid ? <ShieldCheck size={21} /> : <CircleHelp size={21} />}</div><div><span>ऑडिट चेन सत्यापन</span><strong>{audit?.verification.valid ? "सभी रिकॉर्ड की कड़ी सही है" : `रिकॉर्ड ${audit?.verification.firstInvalidSequence} के बाद कड़ी टूटी है`}</strong><small>{audit?.verification.checked ?? 0} घटनाएँ जाँचीं · SHA-256 linked events</small></div><button className="button button-outline" disabled={busy} onClick={() => void runAction(async () => { const result = await api<{ verification: NonNullable<typeof audit>["verification"] }>("/api/audit", { method: "POST" }); if (audit) setAudit({ ...audit, verification: result.verification }); setMessage(result.verification.valid ? "सत्यापन सही है — सभी कड़ियाँ मिलती हैं।" : `पहली गड़बड़ी घटना #${result.verification.firstInvalidSequence} पर है।`); })}><RefreshCw size={15} />फिर जाँचें</button></div>
                <div className="panel audit-panel"><div className="table-toolbar"><div><h2>हाल की घटनाएँ</h2><p>नया लेन-देन, वोट या नियम बदलने पर इतिहास जुड़ता है।</p></div><span className="count-pill">{audit?.events.length ?? 0} घटनाएँ</span></div><div className="audit-list">{audit?.events.map((event) => <div className="audit-row" key={event.id}><div className="audit-icon"><History size={16} /></div><div className="audit-main"><strong>{event.eventType.replaceAll("_", " ")}</strong><p>{event.actor} · {event.entityRef}</p><small>{event.payload}</small><code>{event.eventHash.slice(0, 24)}…</code></div><time>{new Date(event.occurredAt).toLocaleString(language === "en" ? "en-IN" : "hi-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time></div>)}</div><p className="audit-caveat"><LockKeyhole size={14} />सिस्टम के बाहर अधिकार रखने वाला व्यक्ति पूरा SQLite डेटाबेस फिर से लिख सकता है। यह रिकॉर्ड में बदलाव पकड़ने में मदद करता है, पूर्ण सुरक्षा की गारंटी नहीं।</p></div>
              </section>}
              {page === "settings" && settingsDraft && <section className="page-section">
                <div className="page-heading"><div><p className="eyebrow">आपके समूह के नियम</p><h1>सखी समूह सेटिंग</h1><p className="subheading">नीचे के नियम डेमो के लिए हैं, हर समूह इन्हें अपने अनुसार बदले।</p></div><span className="page-icon"><Settings2 size={23} /></span></div>
                <div className="settings-layout"><div className="panel settings-panel"><div className="panel-heading"><div><h2>ऋण स्वीकृति नियम</h2><p>नियम बदलने पर तारीख़ सहित ऑडिट इतिहास बनेगा।</p></div><ShieldCheck size={20} /></div><div className="settings-grid"><label>बिना समूह मतदान की अधिकतम राशि (₹)<input type="number" min="0" value={settingsDraft.approvalLimitPaise / 100} onChange={(event) => setSettingsDraft({ ...settingsDraft, approvalLimitPaise: (amountFromField(event.target.value) ?? 0) })} /></label><label>सामान्य मतदान का कोरम (सदस्य)<input type="number" min="1" max="12" value={settingsDraft.quorumCount} onChange={(event) => setSettingsDraft({ ...settingsDraft, quorumCount: Number(event.target.value) })} /></label><label>मंज़ूरी के लिए हाँ (%)<input type="number" min="1" max="100" value={settingsDraft.approvalPercent} onChange={(event) => setSettingsDraft({ ...settingsDraft, approvalPercent: Number(event.target.value) })} /></label><label>आपात मतदान का कम कोरम<input type="number" min="1" max="12" value={settingsDraft.emergencyQuorumCount} onChange={(event) => setSettingsDraft({ ...settingsDraft, emergencyQuorumCount: Number(event.target.value) })} /></label><label>साप्ताहिक तय बचत (₹)<input type="number" min="0" step="0.01" value={settingsDraft.expectedContributionPaise / 100} onChange={(event) => setSettingsDraft({ ...settingsDraft, expectedContributionPaise: amountFromField(event.target.value) ?? 0 })} /></label></div><label className="toggle-row"><span><strong>आपात मतदान की अनुमति</strong><small>आपात प्रस्ताव के लिए तभी कम कोरम लगेगा।</small></span><input type="checkbox" checked={settingsDraft.emergencyVoting} onChange={(event) => setSettingsDraft({ ...settingsDraft, emergencyVoting: event.target.checked })} /></label><button className="button button-primary" onClick={() => void runAction(saveSettings)} disabled={busy}><Check size={16} />नियम सहेजें</button></div>
                  <div className="settings-side"><div className="panel"><div className="help-heading"><Users size={18} /><strong>समूह की जानकारी</strong></div><div className="setting-info"><span>समूह का नाम</span><strong>सखी स्वयं सहायता समूह</strong></div><div className="setting-info"><span>सदस्य</span><strong>12 सदस्य</strong></div><div className="setting-info"><span>शुरुआती बैंक बैलेंस</span><strong>{inr(dashboard.settings.openingBalancePaise)}</strong></div><div className="setting-info"><span>डेमो की भूमिका</span><strong>{activeActor}</strong></div></div><div className="panel privacy-panel"><div className="help-heading"><LockKeyhole size={18} /><strong>गोपनीयता और सुरक्षा</strong></div><p>यह डेमो भूमिका पहचान सत्यापन नहीं है। आवाज़ का नमूना यहाँ संग्रहित नहीं होता। API कुंजी सिर्फ सर्वर पर रहती है।</p><p>डेमो डेटा हटाने के लिए README में SQLite फ़ाइल हटाने के चरण देखें।</p></div></div></div>
              </section>}
            </>
          )}
          <CallCenter members={dashboard?.members ?? []} actor={activeActor} language={language} showDirectory={page === "home" && Boolean(dashboard)} onActorChange={setActiveActor} onCallActivityChange={setCallInProgress} />
          <footer className="page-footer"><span>साथी कोष <b>·</b> समूह की बचत, सबकी समझ</span><span>डेमो — आधिकारिक बैंक रिकॉर्ड का विकल्प नहीं</span></footer>
        </div>
      </section>
    </main>
    </Localized>
    </LanguageContext.Provider>
  );
}

function StatCard({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: LucideIcon; tone: string }) {
  return <Localized><div className="stat-card"><div className={`stat-icon stat-${tone}`}><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><MoreHorizontal className="stat-more" size={17} /></div></Localized>;
}

function DashboardView({ data, actor, onSpeak, onNavigate, onReview }: {
  data: Dashboard; actor: string; onSpeak: () => void; onNavigate: (page: PageId) => void; onReview: () => void;
}) {
  const language = useContext(LanguageContext);
  return <Localized><section className="page-section">
    <div className="welcome-row"><div><p className="eyebrow">{language === "en" ? "Today" : "आज"} · {new Intl.DateTimeFormat(language === "en" ? "en-IN" : "hi-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(data.currentDateIso))} · {language === "en" ? "Hello" : "नमस्ते"} {actor}</p><h1>आपके समूह का हाल <span>🌿</span></h1><p className="subheading">बही साफ़ हो तो हर सदस्य को अपना हिसाब समझ आए।</p></div><button className="button button-primary speak-cta" onClick={() => onNavigate("voice")}><Mic2 size={17} />लेन-देन बोलकर दर्ज करें</button></div>
    <div className="stats-grid">
      <StatCard label="समूह का बैलेंस" value={inr(data.balancePaise)} note="गणना · आज तक" icon={Wallet} tone="green" />
      <StatCard label="इस महीने की बचत" value={inr(data.depositsThisMonthPaise)} note="बही में दर्ज जमा" icon={ArrowDownLeft} tone="blue" />
      <StatCard label="बकाया समूह ऋण" value={inr(data.outstandingLoansPaise)} note="दिए गए ऋण − किस्तें" icon={HandCoins} tone="amber" />
    </div>
    <div className="home-grid">
      <div className="panel activity-panel"><div className="table-toolbar"><div><h2>हाल की बही गतिविधि</h2><p>नया लेन-देन और जमा</p></div><button className="link-button" onClick={() => onNavigate("ledger")}>पूरी बही <ArrowUpRight size={14} /></button></div><TransactionTable transactions={data.latestTransactions} unmatchedIds={new Set(data.reconciliation.unmatchedLedger.map((item) => item.ledger.id))} /></div>
      <div className="right-column">
        <div className="weekly-card"><div className="weekly-card-header"><span className="weekly-icon"><ClipboardCheck size={18} /></span><span>इस रविवार की समीक्षा</span><MoreHorizontal size={17} /></div><h2>एक नज़र में<br />इस हफ़्ते का हिसाब</h2><div className="mini-metrics"><div><span>बचत जमा</span><strong>{inr(data.weekly.depositsPaise)}</strong></div><div><span>ऋण किस्तें</span><strong>{inr(data.weekly.repaymentsPaise)}</strong></div></div><div className="weekly-balance"><span>मौजूदा समूह बैलेंस</span><strong>{inr(data.weekly.closingPaise)}</strong></div><div className="weekly-actions"><button onClick={onReview}>पूरा हिसाब देखें<ArrowUpRight size={14} /></button><button aria-label="साप्ताहिक हिसाब सुनें" onClick={onSpeak}><Play size={14} fill="currentColor" /></button></div></div>
      </div>
    </div>
    <div className="home-bottom"><div className="panel assurance-card"><span className="assurance-icon"><ShieldCheck size={20} /></span><div><strong>पहले आपकी पुष्टि, फिर बही में एंट्री</strong><p>हर बचत और किस्त का हिसाब समूह के सामने। गलती होने पर पुरानी प्रविष्टि मिटाए बिना सुधार जोड़ें।</p></div></div><div className="members-card"><div><Users size={18} /><strong>{data.group.memberCount} सदस्य</strong></div><span>सखी स्वयं सहायता समूह</span></div></div>
  </section></Localized>;
}

function TransactionTable({ transactions, unmatchedIds }: { transactions: Transaction[]; unmatchedIds: Set<string> }) {
  const language = useContext(LanguageContext);
  if (!transactions.length) return <EmptyState text="इस फ़िल्टर में कोई प्रविष्टि नहीं।" />;
  return <Localized><div className="table-scroll"><table className="transaction-table"><thead><tr><th>सदस्य / विवरण</th><th>प्रकार</th><th>तारीख़</th><th>राशि</th><th>बैंक / स्रोत</th><th>दर्ज किया</th><th>पुष्टि</th></tr></thead><tbody>{transactions.map((entry) => {
    const income = transactionEffect(entry) > 0;
    return <tr key={entry.id}><td><div className="member-cell" title={`लेन-देन ID: ${entry.id}`}><span className="member-avatar">{entry.member?.name?.slice(0, 1) ?? "स"}</span><span><strong>{entry.member?.name ?? entry.memberName}</strong><small>{entry.description} · #{entry.id.slice(-6)}</small></span></div></td><td><span className={`type-pill type-${typeColors[entry.type]}`}>{typeLabels[entry.type]}</span></td><td className="date-cell">{dateLabel(entry.occurredAt, language)}</td><td className={`money-cell ${income ? "money-in" : "money-out"}`}>{income ? "+" : "−"} {inr(entry.amountPaise)}</td><td>{unmatchedIds.has(entry.id) ? <span className="bank-pending"><span />मिलान बाकी · {entry.source === "voice" ? "आवाज़" : "मैनुअल"}</span> : <span className="bank-confirmed" title={entry.bankReference ? `संदर्भ ${entry.bankReference}` : "बैंक प्रमाण अभी लिंक नहीं"}>{entry.bankReference ? <Check size={13} /> : null}{entry.bankReference ? "बैंक मिला" : entry.source === "voice" ? "आवाज़" : "मैनुअल"}</span>}</td><td>{entry.actor ?? "Treasurer"}</td><td><span className="status-badge status-match">पुष्टि हुई</span></td></tr>;
  })}</tbody></table></div></Localized>;
}

function LoanView({ loans, members, actor, settings, busy, onAction, onRefresh, onMessage, onSettings }: {
  loans: Loan[]; members: Member[]; actor: string; settings: Dashboard["settings"]; busy: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>; onRefresh: () => Promise<void>; onMessage: (message: string) => void; onSettings: () => void;
}) {
  const language = useContext(LanguageContext);
  const [memberName, setMemberName] = useState(actor);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedVoter, setSelectedVoter] = useState(members.find((member) => member.name !== actor)?.name ?? "");
  const [emergency, setEmergency] = useState(false);
  const [loanVoiceText, setLoanVoiceText] = useState("");
  const [loanAudio, setLoanAudio] = useState<File | null>(null);
  const [loanParseMessage, setLoanParseMessage] = useState("");
  const [loanSpeechActive, setLoanSpeechActive] = useState(false);
  const [voteSpeechActive, setVoteSpeechActive] = useState(false);
  const [voteSpeechMessage, setVoteSpeechMessage] = useState("");
  const [voteSpeechTranscript, setVoteSpeechTranscript] = useState("");
  const [votePromptSpeaking, setVotePromptSpeaking] = useState(false);
  const [callSequence, setCallSequence] = useState<LoanCallSequence | null>(null);
  const proposalRequestId = useRef<string | null>(null);
  const loanSpeechRecognizer = useRef<LiveSpeechRecognizer | null>(null);
  const voteSpeechRecognizer = useRef<LiveSpeechRecognizer | null>(null);
  const loanSpeechFinalText = useRef("");
  const callSequenceRef = useRef<LoanCallSequence | null>(null);
  const voteResponseHandled = useRef(false);
  const voteSpeechTranscriptRef = useRef("");
  const autoVoteListening = useRef(false);
  const voteRecognitionRetries = useRef(0);
  const voteRecognitionRetryTimer = useRef<number | null>(null);
  const callPromptGeneration = useRef(0);
  const updateCallSequence = (next: LoanCallSequence | null) => {
    callSequenceRef.current = next;
    setCallSequence(next);
  };
  useEffect(() => () => {
    loanSpeechRecognizer.current?.stop();
    voteSpeechRecognizer.current?.stop();
    if (voteRecognitionRetryTimer.current !== null) window.clearTimeout(voteRecognitionRetryTimer.current);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);
  const stopLoanSpeech = () => {
    loanSpeechRecognizer.current?.stop();
    setLoanSpeechActive(false);
  };
  const startLoanSpeech = () => {
    const browserWindow = window as LiveSpeechWindow;
    const SpeechRecognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setLoanParseMessage("इस ब्राउज़र में लाइव आवाज़ पहचान उपलब्ध नहीं है। ऋण अनुरोध नीचे टाइप करें।");
      return;
    }
    setLoanParseMessage("");
    setLoanAudio(null);
    loanSpeechFinalText.current = "";
    setLoanVoiceText("");
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === "en" ? "en-IN" : "hi-IN";
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) continue;
        if (result.isFinal) finalText += result[0]?.transcript ?? "";
        else interimText += result[0]?.transcript ?? "";
      }
      if (finalText) loanSpeechFinalText.current = `${loanSpeechFinalText.current} ${finalText}`.trim();
      setLoanVoiceText(`${loanSpeechFinalText.current} ${interimText}`.trim());
    };
    recognition.onerror = (event) => {
      setLoanSpeechActive(false);
      setLoanParseMessage(event.error === "not-allowed"
        ? "माइक्रोफ़ोन अनुमति नहीं मिली। साइट सेटिंग में अनुमति दें या अनुरोध टाइप करें।"
        : "लाइव आवाज़ पहचान उपलब्ध नहीं हुई। नेटवर्क जाँचें या अनुरोध टाइप करें।");
    };
    recognition.onend = () => setLoanSpeechActive(false);
    loanSpeechRecognizer.current = recognition;
    setLoanSpeechActive(true);
    try {
      recognition.start();
    } catch {
      loanSpeechRecognizer.current = null;
      setLoanSpeechActive(false);
      setLoanParseMessage("लाइव आवाज़ पहचान शुरू नहीं हो सकी। अनुरोध टाइप करें या फिर कोशिश करें।");
    }
  };
  const stopCallSpeech = () => {
    callPromptGeneration.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setVotePromptSpeaking(false);
  };
  const speakCallPrompt = (loan: Loan, recipient: string, result = false, onPromptEnd?: () => void) => {
    const promptGeneration = ++callPromptGeneration.current;
    let finished = false;
    const finish = () => {
      if (finished || promptGeneration !== callPromptGeneration.current) return;
      finished = true;
      setVotePromptSpeaking(false);
      onPromptEnd?.();
    };
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      finish();
      return;
    }
    const isEnglish = language === "en";
    const text = result
      ? isEnglish
        ? `${loan.memberName}, your emergency loan request for ${inr(loan.amountPaise)} has been ${loan.status === "APPROVED" ? "approved" : "not approved"} by the group.`
        : `${loan.memberName}, समूह ने आपके ${inr(loan.amountPaise)} के आपातकालीन ऋण अनुरोध को ${loan.status === "APPROVED" ? "मंज़ूरी दे दी है" : "मंज़ूरी नहीं दी है"}।`
      : isEnglish
        ? `Hello ${recipient}. ${loan.memberName} requested an emergency loan of ${inr(loan.amountPaise)} for ${loan.purpose}. Do you approve this loan?`
        : `नमस्ते ${recipient}। ${loan.memberName} ने ${loan.purpose} के लिए ${inr(loan.amountPaise)} का आपातकालीन ऋण मांगा है। क्या आप इस ऋण को मंज़ूरी देते हैं?`;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isEnglish ? "en-IN" : "hi-IN";
    utterance.onend = finish;
    utterance.onerror = finish;
    if (!result && onPromptEnd) setVotePromptSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  const startCallSequence = (loan: Loan) => {
    const alreadyVoted = new Set(loan.votes.map((vote) => vote.memberName ?? vote.member?.name));
    const recipients = members
      .map((member) => member.name)
      .filter((name) => name !== loan.memberName && !alreadyVoted.has(name));
    if (!recipients.length) {
      onMessage("सभी उपलब्ध सदस्य अपनी राय दे चुके हैं।");
      return;
    }
    updateCallSequence({ loanId: loan.id, recipients, index: 0, phase: "member" });
    const recipient = recipients[0]!;
    speakCallPrompt(loan, recipient, false, () => {
      const active = callSequenceRef.current;
      if (active?.loanId === loan.id && active.phase === "member" && active.recipients[active.index] === recipient) {
        startVoteSpeech(loan);
      }
    });
  };
  const stopCallSequence = () => {
    stopVoteSpeech();
    stopCallSpeech();
    setVotePromptSpeaking(false);
    updateCallSequence(null);
  };
  const respondToSimulatedCall = async (loan: Loan, choice: "YES" | "NO") => {
    const activeSequence = callSequenceRef.current;
    if (!activeSequence || activeSequence.loanId !== loan.id || activeSequence.phase !== "member") return;
    const voterName = activeSequence.recipients[activeSequence.index];
    if (!voterName) return;
    await onAction(async () => {
      const result = await api<{ status: Loan["status"]; duplicate: boolean }>(`/api/loans/${loan.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberName: voterName, choice }),
      });
      await onRefresh();
      const currentSequence = callSequenceRef.current;
      if (!currentSequence || currentSequence.loanId !== loan.id || currentSequence.phase !== "member") return;
      if (result.status === "APPROVED" || result.status === "REJECTED") {
        const updatedLoan = { ...loan, status: result.status };
        updateCallSequence({ ...currentSequence, phase: "result", resultStatus: result.status });
        setVoteSpeechMessage("");
        speakCallPrompt(updatedLoan, loan.memberName, true);
        onMessage(`${loan.memberName} को समूह का निर्णय सुनाया जा रहा है।`);
        return;
      }
      const nextIndex = currentSequence.index + 1;
      if (nextIndex < currentSequence.recipients.length) {
        const nextSequence = { ...currentSequence, index: nextIndex };
        updateCallSequence(nextSequence);
        setVoteSpeechMessage("");
        const recipient = nextSequence.recipients[nextIndex]!;
        speakCallPrompt(loan, recipient, false, () => {
          const current = callSequenceRef.current;
          if (current?.loanId === loan.id && current.phase === "member" && current.recipients[current.index] === recipient) {
            startVoteSpeech(loan);
          }
        });
        return;
      }
      updateCallSequence({ ...currentSequence, phase: "pending" });
      stopCallSpeech();
      onMessage("सभी उपलब्ध सदस्य अपनी राय दे चुके हैं।");
    });
  };
  const stopVoteSpeech = () => {
    autoVoteListening.current = false;
    if (voteRecognitionRetryTimer.current !== null) {
      window.clearTimeout(voteRecognitionRetryTimer.current);
      voteRecognitionRetryTimer.current = null;
    }
    voteSpeechRecognizer.current?.stop();
    voteSpeechRecognizer.current = null;
    setVoteSpeechActive(false);
  };
  const startVoteSpeech = (loan: Loan, retry = false) => {
    if (!retry) {
      autoVoteListening.current = true;
      voteRecognitionRetries.current = 0;
      voteResponseHandled.current = false;
    }
    if (!autoVoteListening.current || voteResponseHandled.current) return;
    const browserWindow = window as LiveSpeechWindow;
    const SpeechRecognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      autoVoteListening.current = false;
      setVoteSpeechMessage("इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं। नीचे हाँ/ना बटन से वोट दर्ज करें।");
      return;
    }
    if (voteRecognitionRetryTimer.current !== null) {
      window.clearTimeout(voteRecognitionRetryTimer.current);
      voteRecognitionRetryTimer.current = null;
    }
    if (!retry) {
      setVoteSpeechMessage("");
      setVoteSpeechTranscript("");
      voteSpeechTranscriptRef.current = "";
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === "en" ? "en-IN" : "hi-IN";
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result || voteResponseHandled.current) continue;
        const transcript = result[0]?.transcript ?? "";
        voteSpeechTranscriptRef.current = transcript;
        setVoteSpeechTranscript(transcript);
        if (!result.isFinal) continue;
        const response = parseLoanVoteResponse(transcript);
        if (!response) {
          setVoteSpeechMessage(`“${transcript}” साफ़ नहीं सुनाई दिया। “Yes/No” या “हाँ/नहीं” में से एक बोलें।`);
          continue;
        }
        if (response === "AMBIGUOUS") {
          setVoteSpeechMessage("हाँ और ना दोनों सुनाई दिए। कृपया एक उत्तर साफ़ बोलें।");
          continue;
        }
        voteResponseHandled.current = true;
        autoVoteListening.current = false;
        setVoteSpeechMessage(`आपका उत्तर: ${response === "YES" ? "हाँ" : "ना"} · वोट दर्ज हो रहा है…`);
        stopVoteSpeech();
        void respondToSimulatedCall(loan, response);
        return;
      }
    };
    recognition.onerror = (event) => {
      if (voteSpeechRecognizer.current !== recognition) return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed" || event.error === "audio-capture") {
        autoVoteListening.current = false;
        setVoteSpeechMessage(event.error === "audio-capture"
          ? "माइक्रोफ़ोन उपलब्ध नहीं है। अनुमति/डिवाइस जाँचें या नीचे हाँ/ना बटन चुनें।"
          : "माइक्रोफ़ोन अनुमति नहीं मिली। ब्राउज़र में अनुमति दें, फिर आवाज़ से सुनें दबाएँ या नीचे वोट चुनें।");
      } else if (event.error !== "no-speech") {
        setVoteSpeechMessage("आवाज़ पहचान में समस्या हुई। फिर सुनें या नीचे हाँ/ना बटन चुनें।");
      }
    };
    recognition.onend = () => {
      if (voteSpeechRecognizer.current !== recognition) return;
      voteSpeechRecognizer.current = null;
      setVoteSpeechActive(false);
      if (autoVoteListening.current && !voteResponseHandled.current) {
        if (voteRecognitionRetries.current < 2) {
          voteRecognitionRetries.current += 1;
          setVoteSpeechMessage(voteSpeechTranscriptRef.current
            ? "जवाब साफ़ नहीं मिला—एक बार फिर बोलें।"
            : "आवाज़ नहीं सुनाई दी—एक बार फिर बोलें।");
          voteRecognitionRetryTimer.current = window.setTimeout(() => startVoteSpeech(loan, true), 450);
        } else {
          autoVoteListening.current = false;
          setVoteSpeechMessage("आवाज़ साफ़ नहीं मिली। फिर सुनें दबाएँ या नीचे हाँ/ना बटन चुनें।");
        }
      }
    };
    voteSpeechRecognizer.current = recognition;
    setVoteSpeechActive(true);
    try {
      recognition.start();
    } catch {
      if (voteSpeechRecognizer.current === recognition) voteSpeechRecognizer.current = null;
      autoVoteListening.current = false;
      setVoteSpeechActive(false);
      setVoteSpeechMessage("माइक्रोफ़ोन शुरू नहीं हो सका। फिर सुनें दबाएँ या नीचे हाँ/ना बटन चुनें।");
    }
  };
  const createLoan = async (event: React.FormEvent) => {
    event.preventDefault();
    const amountPaise = amountFromField(amount);
    if (!amountPaise) throw new Error("ऋण राशि सही भरें।");
    const result = await api<{ proposal: { id: string; rules: string } }>("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-actor": actor },
      body: JSON.stringify({
        requestId: proposalRequestId.current ?? (proposalRequestId.current = crypto.randomUUID()),
        memberName,
        amountPaise,
        purpose,
        emergency,
      }),
    });
    proposalRequestId.current = null;
    setAmount("");
    setPurpose("");
    onMessage(result.proposal.rules);
    await onRefresh();
    if (emergency && amountPaise > settings.approvalLimitPaise) {
      const refreshed = await api<{ loans: Loan[] }>("/api/loans");
      const createdLoan = refreshed.loans.find((loan) => loan.id === result.proposal.id);
      if (createdLoan) startCallSequence(createdLoan);
    }
  };
  const cast = async (loan: Loan, choice: "YES" | "NO") => {
    await api(`/api/loans/${loan.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberName: selectedVoter, choice }),
    });
    onMessage(`${selectedVoter} का ${choice === "YES" ? "हाँ" : "ना"} वोट दर्ज हुआ।`);
    await onRefresh();
  };
  const approve = async (loan: Loan) => {
    const result = await api<{ approvals: { member: Member }[]; status: string }>(`/api/loans/${loan.id}/approve`, {
      method: "POST",
      headers: { "x-demo-actor": actor },
    });
    onMessage(result.status === "APPROVED" ? "कोषाध्यक्ष और सह-हस्ताक्षरकर्ता की मंज़ूरी पूरी हुई। पैसा अपने-आप ट्रांसफ़र नहीं हुआ।" : "पहली अधिकृत मंज़ूरी दर्ज हुई। दूसरे हस्ताक्षरकर्ता की पुष्टि बाकी है।");
    await onRefresh();
  };
  const parseLoanVoice = async () => {
    let transcript = loanVoiceText;
    if (loanAudio) {
      const form = new FormData();
      form.append("audio", loanAudio);
      const transcribed = await api<{ transcript: string }>("/api/voice/transcribe", { method: "POST", body: form });
      transcript = transcribed.transcript;
      setLoanVoiceText(transcript);
      setLoanAudio(null);
    }
    const parsed = await api<{ parsed: boolean; clarification?: string; proposal?: { memberName: string; amountPaise: number; purpose: string; emergency: boolean } }>("/api/loans/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (!parsed.parsed || !parsed.proposal) {
      setLoanParseMessage(parsed.clarification ?? "ऋण अनुरोध साफ़ नहीं है।");
      return;
    }
    setMemberName(parsed.proposal.memberName);
    setAmount(amountField(parsed.proposal.amountPaise));
    setPurpose(parsed.proposal.purpose);
    setEmergency(parsed.proposal.emergency);
    setLoanParseMessage(`मसौदा तैयार: ${parsed.proposal.memberName} · ${inr(parsed.proposal.amountPaise)}। पुष्टि और प्रस्ताव जोड़ने से पहले जाँचें।`);
  };
  return <Localized><section className="page-section">
    <div className="page-heading"><div><p className="eyebrow">समूह का फैसला, सबकी आवाज़</p><h1>ऋण अनुरोध और मतदान</h1><p className="subheading">नियम सर्वर पर जाँचे जाते हैं। वोटिंग का नतीजा आने पर भी असली पैसा ट्रांसफ़र नहीं होता।</p></div><span className="page-icon amber-icon"><Vote size={23} /></span></div>
    <div className="rule-strip"><ShieldCheck size={18} /><span><strong>{inr(settings.approvalLimitPaise)} तक:</strong> कोषाध्यक्ष + अधिकृत सह-हस्ताक्षरकर्ता। <strong>इससे ऊपर:</strong> {settings.quorumCount} सदस्यों का कोरम और {settings.approvalPercent}% हाँ।</span><button onClick={onSettings}>नियम बदलें <ArrowUpRight size={13} /></button></div>
    <div className="loan-workspace"><div className="panel proposal-form"><div className="panel-heading"><div><h2><Plus size={17} />नया ऋण प्रस्ताव</h2><p>सदस्य और समूह के लिए प्रस्ताव दर्ज करें।</p></div></div>
      <div className="loan-voice-box">
        <label>आवाज़ का वाक्य या उसका पाठ<textarea value={loanVoiceText} onChange={(event) => { setLoanVoiceText(event.target.value); setLoanAudio(null); setLoanParseMessage(""); }} placeholder="उदाहरण: Sunita ko emergency mein bees hazaar rupaye ka loan chahiye, ilaaj ke liye." rows={3} /></label>
        <button className={`button ${loanSpeechActive ? "button-no" : "button-outline"} button-wide`} type="button" disabled={busy} onClick={() => loanSpeechActive ? stopLoanSpeech() : startLoanSpeech()}><Mic2 size={15} />{loanSpeechActive ? "बोलना रोकें" : "लाइव बोलकर अनुरोध दर्ज करें"}</button>
        <input className="loan-audio-input" type="file" accept="audio/webm,audio/wav,audio/mpeg,audio/mp4,audio/ogg,audio/x-m4a" onChange={(event) => { stopLoanSpeech(); setLoanAudio(event.target.files?.[0] ?? null); setLoanVoiceText(""); setLoanParseMessage(""); }} />
        <button className="button button-outline button-wide" type="button" disabled={busy || loanSpeechActive || (!loanVoiceText.trim() && !loanAudio)} onClick={() => void onAction(parseLoanVoice)}><Mic2 size={15} />आवाज़ / वाक्य समझें</button>
        {loanParseMessage && <p className="loan-parse-message" role="status">{loanParseMessage}</p>}
        <p className="query-privacy">बोलकर या लिखकर अनुरोध दें। पहले नाम, राशि और उद्देश्य जाँचें; प्रस्ताव जोड़ने पर आपातकालीन समूह मतदान शुरू होगा। लाइव पहचान ब्राउज़र पर निर्भर है।</p>
      </div>
      <form onSubmit={(event) => void onAction(() => createLoan(event))}><label>किस सदस्य के लिए?<select value={memberName} onChange={(event) => setMemberName(event.target.value)}>{members.map((member) => <option key={member.id}>{member.name}</option>)}</select></label><label>राशि (₹)<input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="15,000" required /></label><label>ऋण का उद्देश्य<input value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="जैसे: दुकान के लिए सामान" minLength={2} required /></label><label className="toggle-row emergency-toggle"><span><strong>आपातकालीन प्रस्ताव</strong><small>केवल समूह सेटिंग चालू होने पर कम कोरम लगेगा।</small></span><input type="checkbox" checked={emergency} onChange={(event) => setEmergency(event.target.checked)} /></label><button className="button button-primary button-wide" disabled={busy}><Plus size={16} />पुष्टि करें और प्रस्ताव जोड़ें</button></form>
      <div className="mock-wallet"><Wallet size={16} /><span>डेमो मोड: स्वीकृति का अर्थ असली भुगतान नहीं है। Mock wallet transfer अभी सक्षम नहीं।</span></div></div>
      <div className="loan-list">{loans.map((loan) => {
        const activeSequence = callSequence?.loanId === loan.id ? callSequence : null;
        const activeRecipient = activeSequence?.phase === "member" ? activeSequence.recipients[activeSequence.index] : undefined;
        const resultStatus = activeSequence?.resultStatus ?? loan.status;
        return <div className="panel loan-card" key={loan.id}>
          <div className="loan-card-top"><div className="loan-avatar large">{loan.memberName.slice(0, 1)}</div><div className="loan-title"><strong>{loan.memberName} का ऋण अनुरोध</strong><span>{loan.purpose}</span></div><span className={`status-badge ${loan.status === "PENDING" ? "status-review" : loan.status === "APPROVED" ? "status-match" : "status-neutral"}`}>{loan.status === "PENDING" ? "लंबित" : loan.status === "APPROVED" ? "स्वीकृत" : loan.status === "REJECTED" ? "अस्वीकृत" : "दिया गया"}</span></div>
          <div className="loan-amount-row"><strong>{inr(loan.amountPaise)}</strong><span>प्रस्ताव राशि</span><span className={`rule-type ${loan.amountPaise > settings.approvalLimitPaise ? "needs-vote" : ""}`}>{loan.amountPaise > settings.approvalLimitPaise ? "समूह मतदान" : "2 हस्ताक्षर"}</span></div>
          {loan.amountPaise > settings.approvalLimitPaise ? <>
            <div className="vote-progress"><div><span>{loan.decision.cast} वोट पड़े</span><strong>{loan.decision.cast}/{loan.decision.quorum} कोरम</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, loan.decision.cast / loan.decision.quorum * 100)}%` }} /></div><div className="vote-counts"><span>हाँ <strong>{loan.decision.yes}</strong></span><span>ना <strong>{loan.decision.no}</strong></span><span>{settings.approvalPercent}% मंज़ूरी ज़रूरी</span></div></div>
            {loan.status === "PENDING" && <div className="vote-actions"><label>वोट देने वाला<select value={selectedVoter} onChange={(event) => setSelectedVoter(event.target.value)}>{members.filter((member) => member.name !== loan.memberName && !loan.votes.some((vote) => (vote.memberName ?? vote.member?.name) === member.name)).map((member) => <option key={member.id}>{member.name}</option>)}</select></label><button className="button button-yes" disabled={busy || !selectedVoter || selectedVoter === loan.memberName} onClick={() => void onAction(() => cast(loan, "YES"))}><Check size={15} />हाँ</button><button className="button button-no" disabled={busy || !selectedVoter || selectedVoter === loan.memberName} onClick={() => void onAction(() => cast(loan, "NO"))}><X size={15} />ना</button></div>}
            {loan.status === "PENDING" && loan.emergency && <div className="sim-call-launch"><div><strong><PhoneCall size={15} />आपातकालीन मंज़ूरी कॉल</strong><span>फोन पर नहीं—यह प्रस्तुति के लिए इन-ऐप क्रमवार कॉल डेमो है।</span></div><button className="button button-outline" disabled={busy || !!callSequence} onClick={() => startCallSequence(loan)}><PhoneCall size={15} />कॉल डेमो शुरू करें</button></div>}
          </> : <><div className="approval-list">{loan.approvals?.map((approval) => <span key={approval.member.id}><Check size={13} />{approval.member.name}</span>)}<span className="approval-wait">{loan.approvals?.length ? "दूसरा हस्ताक्षर बाकी" : "कोषाध्यक्ष और सह-हस्ताक्षरकर्ता ज़रूरी"}</span></div>{loan.status === "PENDING" && <button className="button button-outline button-wide" disabled={busy} onClick={() => void onAction(() => approve(loan))}><BadgeCheck size={16} />{actor} से अधिकृत मंज़ूरी</button>}</>}
          {activeSequence && <div className="sim-call-overlay" role="dialog" aria-modal="true" aria-labelledby="sim-call-title">
            <div className="sim-call-card">
              <div className="sim-call-icon"><PhoneCall size={23} /></div>
              <span className="sim-call-label">साथी कोष · डेमो कॉल {activeSequence.phase === "member" ? `${activeSequence.index + 1}/${activeSequence.recipients.length}` : ""}</span>
              <h2 id="sim-call-title">{activeSequence.phase === "member" ? `${activeRecipient} को कॉल` : activeSequence.phase === "result" ? `${loan.memberName} को नतीजा` : "कोरम पूरा नहीं हुआ"}</h2>
              {activeSequence.phase === "member" && activeRecipient && <>
                <p>{loan.memberName} ने {loan.emergency ? "आपातकालीन " : ""}{inr(loan.amountPaise)} ऋण मांगा है। उद्देश्य: {loan.purpose}। क्या आप मंज़ूरी देती हैं?</p>
                <button className="text-button sim-call-replay" onClick={() => {
                  stopVoteSpeech();
                  speakCallPrompt(loan, activeRecipient, false, () => {
                    const current = callSequenceRef.current;
                    if (current?.loanId === loan.id && current.phase === "member" && current.recipients[current.index] === activeRecipient) startVoteSpeech(loan);
                  });
                }}><Play size={14} />आवाज़ फिर सुनें</button>
                <div className="sim-call-voice-answer">
                  <button className={`button ${voteSpeechActive ? "button-no" : "button-primary"} button-wide`} disabled={busy || votePromptSpeaking} onClick={() => voteSpeechActive ? stopVoteSpeech() : startVoteSpeech(loan)}><Mic2 size={17} />{votePromptSpeaking ? "सवाल सुनिए…" : voteSpeechActive ? "सुन रहा है… अपना जवाब बोलें" : "फिर से सुनें"}</button>
                  <span>{votePromptSpeaking ? "सवाल पूरा होते ही माइक्रोफ़ोन अपने-आप चालू होगा।" : "बोलें: “Yes” / “No” या “हाँ” / “नहीं”"}</span>
                  {voteSpeechTranscript && <p className="sim-call-transcript" aria-live="polite">सुना: “{voteSpeechTranscript}”</p>}
                  {voteSpeechMessage && <p role="status">{voteSpeechMessage}</p>}
                  <div className="sim-call-manual-votes"><span>ज़रूरत पड़ने पर टैप करके वोट दें</span><button className="button button-yes" disabled={busy} onClick={() => { stopVoteSpeech(); void respondToSimulatedCall(loan, "YES"); }}><Check size={14} />हाँ</button><button className="button button-no" disabled={busy} onClick={() => { stopVoteSpeech(); void respondToSimulatedCall(loan, "NO"); }}><X size={14} />नहीं</button></div>
                </div>
                <small>अभी उत्तर दे रहे हैं: {activeRecipient} · डेमो में आप हर सदस्य की आवाज़ की भूमिका निभाते हैं।</small>
              </>}
              {activeSequence.phase === "result" && <><p>{loan.memberName}, आपका {inr(loan.amountPaise)} का आपातकालीन ऋण अनुरोध समूह ने {resultStatus === "APPROVED" ? "स्वीकृत" : "अस्वीकृत"} किया है।</p><button className="text-button sim-call-replay" onClick={() => speakCallPrompt({ ...loan, status: resultStatus }, loan.memberName, true)}><Play size={14} />नतीजे की सूचना फिर सुनें</button><span className={`status-badge ${resultStatus === "APPROVED" ? "status-match" : "status-neutral"}`}>{resultStatus === "APPROVED" ? "समूह ने मंज़ूरी दी" : "समूह ने मंज़ूरी नहीं दी"}</span></>}
              {activeSequence.phase === "pending" && <><p>सभी उपलब्ध सदस्यों ने जवाब दिया, लेकिन तय कोरम पूरा नहीं हुआ। अनुरोध लंबित है; इसे मंज़ूर या अस्वीकृत नहीं माना गया।</p><span className="status-badge status-review">अभी निर्णय नहीं हुआ</span></>}
              <p className="sim-call-disclaimer">यह केवल इन-ऐप सिमुलेशन है। कोई फ़ोन नंबर डायल नहीं हुआ और कोई पैसा ट्रांसफ़र नहीं हुआ।</p>
              <button className="button button-outline sim-call-close" onClick={stopCallSequence}><PhoneOff size={15} />{activeSequence.phase === "member" ? "क्रमवार कॉल रोकें" : "डेमो बंद करें"}</button>
            </div>
          </div>}
        </div>;
      })}{!loans.length && <div className="panel"><EmptyState text="अभी कोई ऋण प्रस्ताव नहीं।" /></div>}</div>
    </div>
    <div className="loan-footnote"><LockKeyhole size={14} />हर सदस्य एक प्रस्ताव पर एक ही बार वोट कर सकता है। वोट बदलने की सुविधा डेमो में बंद है; बदलाव का इतिहास ऑडिट में रहता है।</div>
  </section></Localized>;
}

function EmptyState({ text }: { text: string }) {
  return <Localized><div className="empty-state"><div><FileCheck2 size={20} /></div><span>{text}</span></div></Localized>;
}
