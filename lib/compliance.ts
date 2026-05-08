import crypto from "crypto";
import { db } from "@/lib/db";

export function contentHash(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export async function recordPolicyAcceptance(params: {
  userId: string;
  type: "TERMS" | "PRIVACY" | "REFUND" | "COOKIE" | "DPA";
  version: string;
  content: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const policy = await db.compliancePolicy.upsert({
    where: { type_version: { type: params.type, version: params.version } },
    create: {
      type: params.type,
      version: params.version,
      contentHash: contentHash(params.content),
      effectiveAt: new Date(),
    },
    update: {},
  });
  return db.complianceAcceptance.upsert({
    where: { userId_policyId: { userId: params.userId, policyId: policy.id } },
    create: {
      userId: params.userId,
      policyId: policy.id,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
    update: {},
  });
}
