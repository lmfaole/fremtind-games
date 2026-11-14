export const ALLOWED_ORIGINS = [
    "https://fremtind.games",
    "https://www.fremtind.games",
    "http://localhost:3000",
];

export function corsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get("Origin");
    const headers: Record<string, string> = { Vary: "Origin" };
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }
    return headers;
}

export function json(
    request: Request,
    body: unknown,
    status = 200,
    extra: Record<string, string> = {},
) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders(request), ...extra },
    });
}
