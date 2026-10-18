import Link from "next/link";
import { HandCoins } from "lucide-react";

type DocumentKind = "privacy" | "terms";
type Section = { title: string; hi: string; en: string };

const documents: Record<DocumentKind, { title: string; introHi: string; introEn: string; sections: Section[] }> = {
  privacy: {
    title: "गोपनीयता सूचना | Privacy notice",
    introHi: "यह सूचना Saathi Kosh के सिम्युलेटेड पोर्टफोलियो डेमो के लिए है। इसमें वास्तविक सदस्य या वित्तीय जानकारी न डालें।",
    introEn: "This notice applies to the simulated Saathi Kosh portfolio demo. Do not enter real member or financial information.",
    sections: [
      {
        title: "डेमो डेटा और पहचान | Demo data and identity",
        hi: "समूह, सदस्य, बही, बैंक मिलान और ऋण मतदान के नमूने काल्पनिक हैं। सदस्य चुनने का विकल्प लॉगिन या पहचान सत्यापन नहीं है।",
        en: "The sample group, members, ledger, bank reconciliation and loan votes are fictional. The member selector is not a login or identity check.",
      },
      {
        title: "डेटा कहाँ रखा जाता है | Where data is stored",
        hi: "इस डेमो में दर्ज जानकारी ऐप के SQLite डेटाबेस में रहती है। स्थानीय सेटअप में यह prisma/dev.db फ़ाइल है। तैनात ऐप में इसका स्थान होस्टिंग सेटअप पर निर्भर करेगा। भूमिका चुनने की पसंद ब्राउज़र के local storage में रहती है।",
        en: "Entries are stored in the app's SQLite database. In a local setup, this is prisma/dev.db. On a deployment, storage depends on the hosting configuration. The selected demo role is stored in browser local storage.",
      },
      {
        title: "आवाज़ और बाहरी सेवाएँ | Voice and external services",
        hi: "ब्राउज़र की आवाज़ पहचान सेवा ब्राउज़र विक्रेता द्वारा चलाई जा सकती है। यदि ElevenLabs कॉन्फ़िगर हो, तो रिकॉर्डिंग केवल आपके ट्रांसक्रिप्शन अनुरोध पर उस सेवा को भेजी जाती है। ऐप रिकॉर्डिंग फ़ाइल को सहेजता नहीं है। LiveKit चालू होने पर सक्रिय इन-ऐप कॉल का ऑडियो LiveKit के माध्यम से दोनों ब्राउज़र के बीच जाता है; ऐप कॉल रिकॉर्ड नहीं करता। इन सेवाओं की अपनी शर्तें और गोपनीयता नीतियाँ लागू होती हैं।",
        en: "Browser speech recognition may be operated by your browser provider. If ElevenLabs is configured, a recording is sent to it only when you request transcription. The app does not save the recording file. When LiveKit is enabled, active in-app call audio is carried between browsers through LiveKit; the app does not record calls. Those providers' own terms and privacy notices apply.",
      },
      {
        title: "सुरक्षा और हटाना | Security and deletion",
        hi: "API कुंजियाँ सर्वर पर रखी जानी चाहिए। डेमो में प्रमाणित उपयोगकर्ता खाते नहीं हैं, इसलिए डेटाबेस को निजी या सुरक्षित सदस्य रिकॉर्ड न मानें। स्थानीय नमूना डेटा हटाने के निर्देश README में हैं; ब्राउज़र की भूमिका पसंद हटाने के लिए साइट डेटा साफ़ करें।",
        en: "API keys should remain server-side. The demo has no authenticated user accounts, so its database must not be treated as private or secure member records. The README explains how to delete local sample data; clear the site's browser data to remove the saved role.",
      },
      {
        title: "वास्तविक उपयोग से पहले | Before real-world use",
        hi: "यह प्रोटोटाइप कानूनी अनुपालन या सुरक्षित वित्तीय सेवा का दावा नहीं करता। वास्तविक सदस्यों के डेटा से पहले सुरक्षा, सहमति, डेटा-हटाने और लागू कानूनों की विशेषज्ञ समीक्षा कराएँ।",
        en: "This prototype does not claim legal compliance or provide a secure financial service. Before using real member data, obtain expert review of security, consent, deletion and applicable legal requirements.",
      },
    ],
  },
  terms: {
    title: "उपयोग की शर्तें | Terms of use",
    introHi: "Saathi Kosh एक प्रदर्शन और सीखने के लिए बनाया गया सिम्युलेटेड प्रोटोटाइप है। इसका उपयोग करके आप नीचे दी गई सीमाओं को समझते हैं।",
    introEn: "Saathi Kosh is a simulated prototype for demonstration and learning. By using it, you acknowledge the limitations below.",
    sections: [
      {
        title: "केवल प्रदर्शन के लिए | Demonstration only",
        hi: "सभी समूह और वित्तीय रिकॉर्ड काल्पनिक हैं। यह ऐप बैंक, वॉलेट या भुगतान नेटवर्क से जुड़ा नहीं है और कोई वास्तविक धन हस्तांतरित नहीं करता।",
        en: "All group and financial records are fictional. The app is not connected to a bank, wallet or payment network and does not transfer real money.",
      },
      {
        title: "वित्तीय निर्णय | Financial decisions",
        hi: "बही, ऋण नियम, मतदान और साप्ताहिक सारांश केवल डेमो व्यवहार दिखाते हैं। इन्हें आधिकारिक लेखा, ऋण स्वीकृति, वित्तीय या कानूनी सलाह न मानें।",
        en: "The ledger, loan rules, votes and weekly summaries demonstrate prototype behavior only. They are not official accounts, lending decisions, or financial or legal advice.",
      },
      {
        title: "पहचान और सामग्री | Identity and content",
        hi: "डेमो पहचान चयनकर्ता किसी व्यक्ति की पहचान सत्यापित नहीं करता। वास्तविक Aadhaar, बैंक विवरण, पासवर्ड या संवेदनशील जानकारी न दें।",
        en: "The demo identity selector does not verify anyone's identity. Do not submit real Aadhaar, bank details, passwords or other sensitive information.",
      },
      {
        title: "बाहरी सेवाएँ | External services",
        hi: "वैकल्पिक आवाज़ और कॉल सुविधाएँ तभी उपलब्ध होती हैं जब संबंधित सेवा कॉन्फ़िगर की गई हो। उनके उपयोग पर संबंधित सेवा प्रदाता की शर्तें लागू होती हैं।",
        en: "Optional voice and call features work only when the corresponding provider is configured. Use of those features is also subject to the provider's terms.",
      },
      {
        title: "प्रोटोटाइप की स्थिति | Prototype status",
        hi: "ऐप बिना किसी उपलब्धता, सटीकता या किसी खास उद्देश्य के लिए उपयुक्तता की गारंटी के दिया गया है। सार्वजनिक या वास्तविक समूह उपयोग से पहले सुरक्षा और कानूनी समीक्षा आवश्यक है।",
        en: "The app is provided without guarantees of availability, accuracy or fitness for a particular purpose. Security and legal review are required before public or real-group use.",
      },
    ],
  },
};

export function LegalPage({ kind }: { kind: DocumentKind }) {
  const document = documents[kind];
  return (
    <main className="legal-shell">
      <header className="legal-header">
        <Link className="legal-brand" href="/">
          <span className="legal-brand-mark"><HandCoins size={19} /></span>
          <span>साथी कोष <small>Saathi Kosh</small></span>
        </Link>
        <Link className="legal-back" href="/">डेमो पर वापस जाएँ · Back to demo</Link>
      </header>
      <article className="legal-document">
        <p className="legal-eyebrow">सिम्युलेटेड प्रोजेक्ट · Simulated project</p>
        <h1>{document.title}</h1>
        <p className="legal-intro"><span className="legal-language">HI</span><span lang="hi">{document.introHi}</span><br /><span className="legal-language">EN</span><span lang="en">{document.introEn}</span></p>
        {document.sections.map((section) => (
          <section className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            <p><span className="legal-language">HI</span><span lang="hi">{section.hi}</span></p>
            <p><span className="legal-language">EN</span><span lang="en">{section.en}</span></p>
          </section>
        ))}
        <nav className="legal-footer" aria-label="Legal pages">
          <Link href="/privacy">गोपनीयता सूचना · Privacy</Link>
          <Link href="/terms">उपयोग की शर्तें · Terms</Link>
        </nav>
      </article>
    </main>
  );
}
