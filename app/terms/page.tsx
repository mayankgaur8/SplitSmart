export const metadata = {
  title: "Terms of Service | SplitSmart",
  description: "SplitSmart terms for paid SaaS users and group expense management.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-200">
      <h1 className="text-3xl font-black text-white">Terms of Service</h1>
      <p className="mt-4 text-slate-400">By using SplitSmart, you agree to keep account credentials secure, enter accurate expense data, and use payments only for lawful settlements between known parties.</p>
      <h2 className="mt-8 text-xl font-bold text-white">Payments</h2>
      <p className="mt-2 text-slate-400">SplitSmart coordinates payment provider workflows but does not hold customer funds. Provider terms, bank rules, and chargeback policies may apply.</p>
      <h2 className="mt-8 text-xl font-bold text-white">Availability</h2>
      <p className="mt-2 text-slate-400">We aim for reliable service, but maintenance, provider outages, network issues, and force majeure events may affect availability.</p>
      <h2 className="mt-8 text-xl font-bold text-white">Abuse</h2>
      <p className="mt-2 text-slate-400">Fraud, harassment, spam, unauthorized access, and attempts to bypass limits can lead to suspension or termination.</p>
    </main>
  );
}
