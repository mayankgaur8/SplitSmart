export const metadata = {
  title: "Privacy Policy | SplitSmart",
  description: "How SplitSmart collects, uses, protects, exports, and deletes customer data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-200">
      <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
      <p className="mt-4 text-slate-400">SplitSmart collects account, group, expense, payment status, device, and support data only to operate the service, prevent fraud, and meet legal obligations.</p>
      <h2 className="mt-8 text-xl font-bold text-white">Data Controls</h2>
      <p className="mt-2 text-slate-400">Users can request export or deletion from Settings. Payment provider records may be retained where required for tax, chargeback, anti-fraud, and accounting obligations.</p>
      <h2 className="mt-8 text-xl font-bold text-white">AI Processing</h2>
      <p className="mt-2 text-slate-400">SplitSmart does not send payment secrets, OTPs, card numbers, CVV, or webhook signatures to AI services. AI prompts are filtered and usage is logged for abuse and cost control.</p>
      <h2 className="mt-8 text-xl font-bold text-white">Notifications</h2>
      <p className="mt-2 text-slate-400">Email and WhatsApp notifications require consent where applicable and can be disabled in account settings.</p>
      <h2 className="mt-8 text-xl font-bold text-white">Contact</h2>
      <p className="mt-2 text-slate-400">For privacy requests, contact privacy@splitsmart.io.</p>
    </main>
  );
}
