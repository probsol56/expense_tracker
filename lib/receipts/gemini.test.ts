import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiReceiptExtractor } from "@/lib/receipts/gemini";
import { ReceiptExtractionError } from "@/lib/receipts/extractor";

const FILE = { bytes: new Uint8Array([1, 2, 3]), mimeType: "image/jpeg" as const };
const CONTEXT = { categories: ["Groceries"], currency: "BDT" };

function geminiBody(text: string) {
  return { candidates: [{ finishReason: "STOP", content: { parts: [{ text }] } }] };
}

function mockFetch(...responses: (Response | Error)[]) {
  let call = 0;
  const fetchMock = vi.fn(() => {
    const response = responses[Math.min(call++, responses.length - 1)];
    return response instanceof Response ? Promise.resolve(response) : Promise.reject(response);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function extractError(): Promise<ReceiptExtractionError> {
  const error: unknown = await new GeminiReceiptExtractor().extract(FILE, CONTEXT).catch((caught: unknown) => caught);
  if (!(error instanceof ReceiptExtractionError)) throw new Error("expected a ReceiptExtractionError");
  return error;
}

describe("GeminiReceiptExtractor", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends the image inline with the key in a header, not the URL", async () => {
    const fetchMock = mockFetch(Response.json(geminiBody(JSON.stringify({ merchant: "Agora", items: [] }))));
    await new GeminiReceiptExtractor().extract(FILE, CONTEXT);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain("test-key");
    expect(init.headers).toMatchObject({ "x-goog-api-key": "test-key" });
    const body: unknown = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: "AQID" } }, { text: expect.stringContaining("Groceries") }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
  });

  it("returns the validated receipt", async () => {
    mockFetch(Response.json(geminiBody(JSON.stringify({
      merchant: "Agora",
      total: 120,
      items: [{ name: "Milk", quantity: 1, unit_price: 120, total_price: 120 }],
    }))));
    await expect(new GeminiReceiptExtractor().extract(FILE, CONTEXT)).resolves.toMatchObject({
      merchant: "Agora",
      total: 120,
      date: null,
      items: [{ name: "Milk" }],
    });
  });

  it.each([
    [new Response("", { status: 429 }), "gemini_429"],
    [new Response("", { status: 503 }), "gemini_503"],
    [new Response("", { status: 500 }), "gemini_http_500"],
    [Response.json({ candidates: [{ finishReason: "SAFETY" }] }), "gemini_empty_safety"],
    [Response.json(geminiBody("not json")), "gemini_invalid_json"],
    [Response.json(geminiBody("[1,2]")), "gemini_invalid_shape"],
  ])("maps a failed response to a coded error (%#)", async (response, code) => {
    mockFetch(response);
    expect((await extractError()).code).toBe(code);
  });

  it("falls back to the next model when the first is busy", async () => {
    const fetchMock = mockFetch(
      new Response("", { status: 503 }),
      Response.json(geminiBody(JSON.stringify({ merchant: "Naturo", items: [] }))),
    );
    await expect(new GeminiReceiptExtractor().extract(FILE, CONTEXT)).resolves.toMatchObject({ merchant: "Naturo" });

    const urls = fetchMock.mock.calls.map((args) => String((args as unknown as [string])[0]));
    expect(urls).toHaveLength(2);
    expect(urls[0]).not.toBe(urls[1]);
  });

  it("tells the user it's busy, not unreadable, when every model is busy", async () => {
    const fetchMock = mockFetch(new Response("", { status: 503 }), new Response("", { status: 429 }));
    const error = await extractError();
    expect(error.userMessage).toMatch(/busy/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not fall back on a non-busy failure", async () => {
    const fetchMock = mockFetch(new Response("", { status: 400 }));
    expect((await extractError()).code).toBe("gemini_http_400");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps network failures and timeouts", async () => {
    mockFetch(new TypeError("fetch failed"));
    expect((await extractError()).code).toBe("gemini_network");

    mockFetch(new DOMException("timed out", "TimeoutError"));
    expect((await extractError()).code).toBe("gemini_timeout");
  });

  it("fails loudly when the API key is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    mockFetch(Response.json({}));
    await expect(new GeminiReceiptExtractor().extract(FILE, CONTEXT)).rejects.toThrow(/GEMINI_API_KEY/);
  });
});
