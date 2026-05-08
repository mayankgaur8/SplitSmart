// AI service — wraps Anthropic Claude API for all AI features.
// Falls back gracefully if API key is absent (returns null / empty arrays).

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(
  prompt: string,
  systemPrompt: string,
  maxTokens = 500
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[AI] ANTHROPIC_API_KEY not set — AI features disabled");
    return null;
  }
  try {
    const res = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error("[AI] Claude API error:", res.status);
      return null;
    }
    const data = await res.json();
    return data.content?.[0]?.text ?? null;
  } catch (err) {
    console.error("[AI] Fetch error:", err);
    return null;
  }
}

// ─── Receipt OCR / Parsing ────────────────────────────────────────────────────

export type ParsedReceipt = {
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  date: string | null;
  items: Array<{ name: string; amount: number }>;
  confidence: number;
};

export async function parseReceiptText(
  receiptText: string
): Promise<ParsedReceipt | null> {
  const result = await callClaude(
    `Parse this receipt and return ONLY valid JSON:\n\n${receiptText}`,
    `You are a receipt parsing AI. Extract merchant name, total amount, currency (default INR),
     category (rent/food/transport/utilities/entertainment/subscriptions/travel/shopping/health/education/other),
     date, and line items. Return ONLY this JSON structure:
     {"merchant":"","amount":0,"currency":"INR","category":"","date":null,"items":[],"confidence":0.0}`,
    400
  );
  if (!result) return null;
  try {
    const match = result.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

// ─── Expense categorization ───────────────────────────────────────────────────

export async function categorizeExpense(title: string, amount: number): Promise<string> {
  const result = await callClaude(
    `Expense title: "${title}", amount: ${amount}. What category?`,
    `You are an expense categorizer. Return ONLY one word from:
     rent, food, transport, utilities, entertainment, subscriptions, travel, shopping, health, education, other`
  );
  const valid = ["rent","food","transport","utilities","entertainment","subscriptions","travel","shopping","health","education","other"];
  const cat = result?.trim().toLowerCase() ?? "other";
  return valid.includes(cat) ? cat : "other";
}

// ─── Spending insights ────────────────────────────────────────────────────────

export type SpendingInsight = {
  type: "saving" | "warning" | "recommendation" | "achievement";
  title: string;
  description: string;
  savingAmount?: number;
  actionLabel?: string;
};

export async function generateSpendingInsights(context: {
  monthlyTotals: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  subscriptions: Array<{ name: string; cost: number; usageScore: number }>;
  streakDays: number;
}): Promise<SpendingInsight[]> {
  const prompt = `
Spending data:
Monthly totals (last 3 months): ${JSON.stringify(context.monthlyTotals)}
Categories: ${JSON.stringify(context.categoryBreakdown)}
Subscriptions: ${JSON.stringify(context.subscriptions)}
Payment streak: ${context.streakDays} days

Generate 3-4 actionable financial insights. Return ONLY a JSON array:
[{"type":"saving|warning|recommendation|achievement","title":"","description":"","savingAmount":null,"actionLabel":null}]`;

  const result = await callClaude(prompt,
    "You are a personal finance AI for Indian users. Be concise, specific, and actionable.", 600);

  if (!result) return getDefaultInsights(context);
  try {
    const match = result.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : getDefaultInsights(context);
  } catch {
    return getDefaultInsights(context);
  }
}

function getDefaultInsights(context: {
  subscriptions?: Array<{ name: string; cost: number; usageScore: number }>;
  streakDays?: number;
}): SpendingInsight[] {
  const insights: SpendingInsight[] = [];

  const wastedSubs = context.subscriptions?.filter((s) => s.usageScore < 40) ?? [];
  if (wastedSubs.length > 0) {
    const saving = wastedSubs.reduce((s, sub) => s + sub.cost, 0);
    insights.push({
      type: "saving",
      title: `${wastedSubs.length} underused subscriptions detected`,
      description: `Cancel ${wastedSubs.map((s) => s.name).join(", ")} to save ₹${saving}/month.`,
      savingAmount: saving,
      actionLabel: "Review Subscriptions",
    });
  }

  if ((context.streakDays ?? 0) >= 7) {
    insights.push({
      type: "achievement",
      title: `${context.streakDays}-day payment streak!`,
      description: "You're in the top 10% of reliable payers. Keep it up!",
    });
  }

  return insights;
}

// ─── Settlement optimization description ─────────────────────────────────────

export async function explainSettlementOptimization(
  original: number,
  optimized: number,
  savings: number
): Promise<string> {
  const result = await callClaude(
    `Original payments: ${original}, After optimization: ${optimized}, savings: ${savings} fewer transactions.`,
    "Write one friendly sentence (max 20 words) explaining debt minimization to a non-technical user."
  );
  return result ?? `Reduced ${original} payments to just ${optimized} — saving everyone time and hassle.`;
}

// ─── AI Chat assistant ────────────────────────────────────────────────────────

export async function askGroupFinanceAssistant(
  question: string,
  context: {
    groupName: string;
    totalSpent: number;
    memberCount: number;
    pendingSettlements: number;
  }
): Promise<string> {
  const result = await callClaude(
    `Group: ${context.groupName}, ${context.memberCount} members, ₹${context.totalSpent} total spent, ${context.pendingSettlements} pending settlements.\n\nUser asks: "${question}"`,
    `You are SplitSmart's AI assistant for group finance. Be helpful, concise, friendly.
     Answer in 2-3 sentences max. Focus on actionable advice about splitting expenses, settlements, and saving money.`,
    300
  );
  return result ?? "I'm having trouble processing that right now. Try asking again in a moment.";
}
