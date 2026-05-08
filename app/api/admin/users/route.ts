import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-response";
import { paginationSchema } from "@/lib/validations";

// GET /api/admin/users — paginated user list for admin panel
export async function GET(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const { searchParams } = new URL(req.url);
    const { page, limit, search } = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
    });

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          plan: true,
          planStatus: true,
          planExpiresAt: true,
          reputationScore: true,
          totalPaid: true,
          createdAt: true,
          _count: { select: { groupMemberships: true, createdExpenses: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return ok(users, { page, limit, total, hasNext: page * limit < total });
  } catch (err) {
    return handleError(err);
  }
}
