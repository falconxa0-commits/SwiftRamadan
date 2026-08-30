'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Shield,
  Info,
} from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';

type Tab = 'terms' | 'privacy' | 'about';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'terms',   label: 'Terms of Service', icon: FileText },
  { id: 'privacy', label: 'Privacy Policy',   icon: Shield },
  { id: 'about',   label: 'About Us',         icon: Info },
];

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account, browsing, or placing an order on SwiftRamadan ("the Service"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the Service immediately.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 18 years old and legally able to enter into contracts under the laws of the Federal Republic of Nigeria to use SwiftRamadan. By using the Service, you represent and warrant that you meet these requirements.',
  },
  {
    title: '3. Account Registration',
    body: 'You must provide accurate, current, and complete information during registration and keep it updated. You are responsible for safeguarding your password and for all activities that occur under your account. Notify us immediately of any unauthorized use.',
  },
  {
    title: '4. Ordering & Availability',
    body: 'SwiftRamadan connects customers with vendors and riders for food and grocery delivery in Lagos, Nigeria. Product availability, pricing, and delivery times may vary. We reserve the right to limit quantities, refuse orders, or modify product offerings without notice.',
  },
  {
    title: '5. Pricing & Payments',
    body: 'All prices are listed in Nigerian Naira (₦) unless otherwise specified. Prices include applicable taxes but exclude delivery and service fees, which are shown at checkout. Payment is due at the time of order placement via accepted methods (card, transfer, Paystack, cash on delivery, or BNPL).',
  },
  {
    title: '6. Delivery',
    body: 'Estimated delivery times are approximations and may vary due to traffic, weather, vendor preparation, or other factors. SwiftRamadan is not liable for delays outside its reasonable control. "Iftar Precision" delivery aims to arrive 5–10 minutes before Maghrib but is not guaranteed to the minute.',
  },
  {
    title: '7. Cancellations',
    body: 'Orders can be cancelled free of charge within 2 minutes of placement. After vendor preparation begins, cancellations may attract a fee of up to 50% of the order value. Refunds for cancelled orders are processed to the original payment method within 3–5 business days.',
  },
  {
    title: '8. Returns & Refunds',
    body: 'If you receive an incorrect, damaged, or unsafe item, contact support within 24 hours of delivery with photo evidence. Approved refunds are issued to your original payment method or as store credit. Perishable goods cannot be returned once delivered.',
  },
  {
    title: '9. User Conduct',
    body: 'You agree not to: (a) use the Service for unlawful activities; (b) abuse, harass, or threaten vendors, riders, or staff; (c) place fraudulent orders; (d) attempt to hack, reverse-engineer, or disrupt the Service; (e) share offensive or inappropriate content in community features. Violations may result in account suspension.',
  },
  {
    title: '10. Vendor Responsibilities',
    body: 'Vendors must maintain valid food safety certifications, accurately represent products, fulfill accepted orders on time, and comply with all Nigerian food handling regulations. SwiftRamadan reserves the right to suspend or terminate vendors who violate quality standards.',
  },
  {
    title: '11. Rider Responsibilities',
    body: 'Riders are independent contractors, not employees. Riders must hold a valid driver\'s license, obey all traffic laws, maintain vehicle insurance where required, and deliver orders promptly and professionally. Riders are responsible for their own taxes.',
  },
  {
    title: '12. Hasanat & Swift Points',
    body: 'Loyalty points (Hasanat Points and Swift Points) have no cash value and are non-transferable. SwiftRamadan may modify point earning rates, redemption options, or expire unused points after 12 months of account inactivity. Points are forfeited on account termination.',
  },
  {
    title: '13. Intellectual Property',
    body: 'All content, trademarks, logos, and software on SwiftRamadan are the property of SwiftRamadan Ltd. or its licensors and are protected by Nigerian and international IP laws. You may not copy, modify, distribute, or create derivative works without written permission.',
  },
  {
    title: '14. Limitation of Liability',
    body: 'SwiftRamadan is provided "as is" without warranties of any kind. To the maximum extent permitted by law, SwiftRamadan shall not be liable for indirect, incidental, special, or consequential damages, including loss of profits, data, or goodwill, arising from your use of the Service.',
  },
  {
    title: '15. Indemnification',
    body: 'You agree to indemnify and hold harmless SwiftRamadan, its officers, employees, and partners from any claims, damages, losses, or expenses (including legal fees) arising from your misuse of the Service, violation of these Terms, or infringement of third-party rights.',
  },
  {
    title: '16. Modifications to Terms',
    body: 'We may update these Terms periodically. Material changes will be communicated via email or in-app notification at least 14 days before taking effect. Continued use of the Service after changes constitutes acceptance of the revised Terms.',
  },
  {
    title: '17. Governing Law & Disputes',
    body: 'These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved first through good-faith negotiation, then by binding arbitration in Lagos, Nigeria. You and SwiftRamadan waive any right to participate in a class action.',
  },
  {
    title: '18. Contact',
    body: 'For questions about these Terms, contact us at legal@swiftramadan.app or SwiftRamadan Ltd., Lekki Phase 1, Lagos, Nigeria.',
  },
];

const PRIVACY_SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect: (a) Account info — name, email, phone, password (hashed); (b) Profile info — area, avatar, dietary preferences, loyalty tier; (c) Order info — items ordered, delivery address, payment method (last 4 digits only), order history; (d) Device info — IP address, device type, OS, app usage analytics; (e) Location — precise GPS only when you enable location features.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to: (a) process and deliver your orders; (b) personalize your experience (recommendations, prayer times, Iftar Precision); (c) communicate order updates, promos, and support; (d) process payments securely via Paystack; (e) prevent fraud and abuse; (f) comply with legal obligations.',
  },
  {
    title: '3. Information Sharing',
    body: 'We share your data only with: (a) Vendors — your name, phone, and delivery address for order fulfillment; (b) Riders — your name, phone, and delivery address for delivery; (c) Payment processors (Paystack) — payment info under their PCI-DSS compliance; (d) Authorities — when required by Nigerian law. We never sell your personal data.',
  },
  {
    title: '4. Data Security',
    body: 'We use industry-standard security measures: TLS encryption in transit, AES-256 encryption at rest, tokenized card storage, firewalls, and access controls. Despite these measures, no system is 100% secure — we notify you of any breach within 72 hours as required by the Nigeria Data Protection Regulation (NDPR) 2023.',
  },
  {
    title: '5. Your Rights',
    body: 'Under NDPR you have the right to: (a) access your personal data; (b) correct inaccurate data; (c) request deletion of your data (subject to legal retention requirements); (d) export your data in a portable format; (e) object to processing for marketing; (f) withdraw consent at any time. To exercise these rights, email privacy@swiftramadan.app.',
  },
  {
    title: '6. Cookies & Local Storage',
    body: 'We use cookies and local storage to: keep you logged in, remember cart contents, store preferences (theme, language, currency), and analyze usage. You can disable cookies in your browser, but some features may not work properly. We do not use cookies for cross-site advertising tracking.',
  },
  {
    title: '7. Third-Party Services',
    body: 'We integrate with: Paystack (payments), Google Maps (delivery routing), Firebase (push notifications), and DiceBear (avatars). Each third party has its own privacy policy — we recommend reviewing them. We share only the minimum data required for each service to function.',
  },
  {
    title: '8. Data Retention',
    body: 'We retain your data for as long as your account is active. After account deletion, we retain order records for 7 years (for tax and legal compliance), then permanently delete them. Loyalty points and profile data are deleted within 30 days of account closure.',
  },
  {
    title: '9. Children\'s Privacy',
    body: 'SwiftRamadan is not directed at children under 18. We do not knowingly collect data from minors. If you believe we have collected data from a minor, contact us at privacy@swiftramadan.app and we will delete it promptly.',
  },
  {
    title: '10. Changes to This Policy',
    body: 'We may update this Privacy Policy periodically. Material changes will be communicated via email or in-app notification at least 14 days before taking effect. The "last updated" date below reflects the most recent revision.',
  },
  {
    title: '11. Contact',
    body: 'For privacy questions or to exercise your rights, contact our Data Protection Officer at privacy@swiftramadan.app or SwiftRamadan Ltd., Lekki Phase 1, Lagos, Nigeria.',
  },
];

const ABOUT_CONTENT = (
  <>
    <section className="space-y-2">
      <h3 className="text-[#10E07A] font-bold text-base">Our Mission</h3>
      <p className="text-white/65 text-sm leading-relaxed">
        SwiftRamadan exists to make Ramadan in Lagos easier, more connected, and more blessed.
        We deliver fresh Iftar meals, groceries, and Sahur essentials — timed perfectly to prayer
        schedules — while empowering local vendors, riders, and communities to thrive during the
        holy month.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="text-[#F5C451] font-bold text-base">Ramadan 2026 Features</h3>
      <ul className="text-white/65 text-sm leading-relaxed space-y-1.5 list-disc list-inside">
        <li><strong className="text-white">Iftar Precision</strong> — meals arrive 5–10 min before Maghrib</li>
        <li><strong className="text-white">Sahur Wake-Up Alarm</strong> — never miss Sahur again</li>
        <li><strong className="text-white">Smart Kitchen</strong> — live AI cooking coach with Chef Safa</li>
        <li><strong className="text-white">Prayer Times & Qibla</strong> — accurate Lagos prayer schedule</li>
        <li><strong className="text-white">Hasanat Points</strong> — daily rewards for engagement</li>
        <li><strong className="text-white">Charity & Zakat</strong> — give back to verified mosques & those in need</li>
        <li><strong className="text-white">Group Buy</strong> — community savings on Ramadan staples</li>
        <li><strong className="text-white">SwiftReel</strong> — share cooking tips & recipes with the community</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h3 className="text-[#A78BFA] font-bold text-base">Our Values</h3>
      <div className="grid grid-cols-1 gap-2">
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <p className="text-white text-sm font-bold">🌿 Faith First</p>
          <p className="text-white/50 text-xs">Every feature respects the spirit of Ramadan.</p>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <p className="text-white text-sm font-bold">🤝 Community</p>
          <p className="text-white/50 text-xs">We empower local vendors, riders, and families.</p>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <p className="text-white text-sm font-bold">⚡ Speed & Precision</p>
          <p className="text-white/50 text-xs">Hot meals, on time, every time — timed to the adhan.</p>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <p className="text-white text-sm font-bold">💚 Generosity</p>
          <p className="text-white/50 text-xs">Built-in Zakat, Sadaqah, and charity giving.</p>
        </div>
      </div>
    </section>

    <section className="space-y-2">
      <h3 className="text-[#38BDF8] font-bold text-base">Contact Us</h3>
      <div className="text-white/65 text-sm leading-relaxed space-y-1">
        <p>SwiftRamadan Ltd.</p>
        <p>Lekki Phase 1, Lagos, Nigeria</p>
        <p>Email: hello@swiftramadan.app</p>
        <p>WhatsApp: +234 801 234 5678</p>
        <p>Support hours: 7 AM – 11 PM (WAT), 7 days a week during Ramadan</p>
      </div>
    </section>

    <p className="text-center text-white/60 text-[10px] pt-3">
      Made with 💚 in Lagos • © 2026 SwiftRamadan
    </p>
  </>
);

export default function LegalPagesModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'legal';
  const [activeTab, setActiveTab] = useState<Tab>('terms');

  const handleClose = () => setActiveModal(null);

  const sections = activeTab === 'terms' ? TERMS_SECTIONS : activeTab === 'privacy' ? PRIVACY_SECTIONS : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md max-h-[90vh] glass-card rounded-3xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto"
              style={{ background: 'linear-gradient(180deg, rgba(15,17,24,0.95), rgba(11,13,20,0.98))' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/30 flex items-center justify-center icon-tile">
                    <FileText className="w-5 h-5 text-[#A78BFA] relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base tracking-tight">Legal</h2>
                    <p className="text-white/65 text-[11px]">Terms, privacy & about</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close legal"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-5 pt-3 pb-1 flex gap-2 shrink-0">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${
                        isActive
                          ? 'bg-[#A78BFA]/10 border-[#A78BFA]/40 text-[#A78BFA]'
                          : 'bg-white/[0.02] border-white/5 text-white/50 hover:text-white/80'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="leading-tight text-center">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
                {sections ? (
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-white/5">
                      <h3 className="text-white font-extrabold text-base tracking-tight">
                        {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                      </h3>
                      <p className="text-white/65 text-[11px] mt-0.5">
                        Last updated: February 2026 • Effective immediately
                      </p>
                    </div>
                    {sections.map((section, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.2) }}
                        className="space-y-1.5"
                      >
                        <h4 className="text-[#10E07A] font-bold text-sm">{section.title}</h4>
                        <p className="text-white/65 text-xs leading-relaxed">{section.body}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    <div className="pb-2 border-b border-white/5">
                      <h3 className="text-white font-extrabold text-base tracking-tight">
                        About SwiftRamadan
                      </h3>
                      <p className="text-white/65 text-[11px] mt-0.5">
        Ramadan 2026 • Lagos, Nigeria
                      </p>
                    </div>
                    {ABOUT_CONTENT}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
