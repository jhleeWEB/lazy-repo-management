import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type TokenResponse = {
  access_token?: string;
  error_description?: string;
  scope?: string;
  token_type?: string;
};

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function getAllowedOrigin() {
  const callbackUrl = process.env.OAUTH_CALLBACK_URL;
  if (!callbackUrl) return null;
  try {
    return new URL(callbackUrl).origin;
  } catch {
    return null;
  }
}

export function GET(request: NextRequest) {
  const callbackUrl = process.env.OAUTH_CALLBACK_URL;
  if (!callbackUrl) {
    return NextResponse.json(
      { error: "OAuth server configuration is incomplete." },
      { status: 500 },
    );
  }

  const destination = new URL(callbackUrl);
  destination.search = request.nextUrl.search;
  return NextResponse.redirect(destination);
}

export function OPTIONS(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin();
  const requestOrigin = request.headers.get("origin");
  if (!allowedOrigin || requestOrigin !== allowedOrigin) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(allowedOrigin),
  });
}

export async function POST(request: NextRequest) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const callbackUrl = process.env.OAUTH_CALLBACK_URL;
  const allowedOrigin = getAllowedOrigin();
  const requestOrigin = request.headers.get("origin");

  if (!clientId || !clientSecret || !callbackUrl || !allowedOrigin || requestOrigin !== allowedOrigin) {
    return NextResponse.json(
      { error: "OAuth server configuration is incomplete." },
      { status: 403, headers: corsHeaders(allowedOrigin ?? "null") },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    code?: string;
    code_verifier?: string;
  } | null;

  if (!payload?.code || !payload.code_verifier) {
    return NextResponse.json(
      { error: "Invalid OAuth request." },
      { status: 400, headers: corsHeaders(allowedOrigin) },
    );
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: payload.code,
      code_verifier: payload.code_verifier,
    }),
  });
  const token = (await tokenResponse.json()) as TokenResponse;

  if (!tokenResponse.ok || !token.access_token) {
    return NextResponse.json(
      { error: token.error_description ?? "GitHub authorization code exchange failed." },
      { status: 400, headers: corsHeaders(allowedOrigin) },
    );
  }

  return NextResponse.json(
    { access_token: token.access_token, scope: token.scope, token_type: token.token_type },
    { headers: corsHeaders(allowedOrigin) },
  );
}