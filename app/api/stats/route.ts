import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type Metric = "visits" | "archived" | "restored" | "deleted";

type RedisResponse<T> = {
  result?: T;
  error?: string;
};

const redisKeys: Record<Metric, string> = {
  visits: "reposweep:visits",
  archived: "reposweep:archived",
  restored: "reposweep:restored",
  deleted: "reposweep:deleted",
};

function getAllowedOrigin() {
  const callbackUrl = process.env.OAUTH_CALLBACK_URL;
  if (!callbackUrl) return null;
  try {
    return new URL(callbackUrl).origin;
  } catch {
    return null;
  }
}

function corsHeaders(origin: string, cacheControl = "no-store") {
  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    "Cache-Control": cacheControl,
    Vary: "Origin",
  };
}

function isAllowedRequest(request: NextRequest, allowedOrigin: string | null) {
  return Boolean(allowedOrigin && request.headers.get("origin") === allowedOrigin);
}

async function redisCommand<T>(command: Array<string | number>) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) throw new Error("Redis configuration is incomplete.");

  const response = await fetch(redisUrl.replace(/\/$/, ""), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  const payload = (await response.json()) as RedisResponse<T>;
  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Redis request failed.");
  }
  return payload.result;
}

export function OPTIONS(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin();
  if (!isAllowedRequest(request, allowedOrigin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(allowedOrigin!),
  });
}

export async function GET(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin();
  if (!isAllowedRequest(request, allowedOrigin)) {
    return NextResponse.json(
      { error: "Stats request is not allowed." },
      { status: 403, headers: corsHeaders(allowedOrigin ?? "null") },
    );
  }

  try {
    const [visitors, values] = await Promise.all([
      redisCommand<number>(["PFCOUNT", redisKeys.visits]),
      redisCommand<Array<string | number | null>>([
        "MGET",
        redisKeys.archived,
        redisKeys.restored,
        redisKeys.deleted,
      ]),
    ]);
    const totals = (values ?? []).map((value) => Number(value ?? 0));
    return NextResponse.json(
      {
        visits: Number(visitors ?? 0),
        archived: totals[0] || 0,
        restored: totals[1] || 0,
        deleted: totals[2] || 0,
      },
      { headers: corsHeaders(allowedOrigin!, "public, max-age=15, s-maxage=15") },
    );
  } catch {
    return NextResponse.json(
      { error: "Stats provider request failed." },
      { status: 502, headers: corsHeaders(allowedOrigin!) },
    );
  }
}

export async function POST(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin();
  if (!isAllowedRequest(request, allowedOrigin)) {
    return NextResponse.json(
      { error: "Stats request is not allowed." },
      { status: 403, headers: corsHeaders(allowedOrigin ?? "null") },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    metric?: Metric;
    count?: number;
    visitorId?: string;
  } | null;
  const metric = payload?.metric;
  if (!metric || !(metric in redisKeys)) {
    return NextResponse.json(
      { error: "Invalid stats update." },
      { status: 400, headers: corsHeaders(allowedOrigin!) },
    );
  }

  try {
    if (metric === "visits") {
      const visitorId = payload?.visitorId;
      if (!visitorId || !/^[a-f0-9-]{36}$/i.test(visitorId)) {
        return NextResponse.json(
          { error: "Invalid visitor identifier." },
          { status: 400, headers: corsHeaders(allowedOrigin!) },
        );
      }
      await redisCommand<number>(["PFADD", redisKeys.visits, visitorId]);
      return NextResponse.json(
        { metric, recorded: true },
        { headers: corsHeaders(allowedOrigin!) },
      );
    }

    const count = payload?.count;
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 1000) {
      return NextResponse.json(
        { error: "Invalid stats update." },
        { status: 400, headers: corsHeaders(allowedOrigin!) },
      );
    }
    const total = await redisCommand<number>(["INCRBY", redisKeys[metric], count]);
    return NextResponse.json(
      { metric, total: Number(total ?? 0) },
      { headers: corsHeaders(allowedOrigin!) },
    );
  } catch {
    return NextResponse.json(
      { error: "Stats provider request failed." },
      { status: 502, headers: corsHeaders(allowedOrigin!) },
    );
  }
}