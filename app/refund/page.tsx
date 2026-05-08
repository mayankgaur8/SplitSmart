export const metadata = {
  title: "Refund Policy | SplitSmart",
  description: "Refund policy for SplitSmart Pro and Team subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-200">
      <h1 className="text-3xl font-black text-white">Refund Policy</h1>
      <p className="mt-4 text-slate-400">Pro and Team subscriptions can be cancelled from Billing. Access continues until the current period ends unless required otherwise by law or provider policy.</p>
      <h2 className="mt-8 text-xl font-bold text-white">Refund Window</h2>
      <p className="mt-2 text-slate-400">New paid users may request a refund within 7 days if the account has not materially used paid-only features. Duplicate charges and provider errors are always reviewed.</p>
      <h2 className="mt-8 text-xl font-bold text-white">How to Request</h2>
      <p className="mt-2 text-slate-400">Email support@splitsmart.io with your account email, payment ID, reason, and invoice date.</p>
    </main>
  );
}
