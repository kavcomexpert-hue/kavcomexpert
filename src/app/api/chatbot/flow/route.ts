import { getContent } from "@/lib/queries/content-blocks";

export const revalidate = 3600;

/**
 * Idle-loaded by ChatbotLoader so the public layout RSC payload does not
 * carry the full chatbot flow JSON on every page.
 */
export async function GET() {
  try {
    const flowJson = await getContent("global.chatbot.flow_json");
    return Response.json(
      { flowJson },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return Response.json(
      { flowJson: "" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60",
        },
      },
    );
  }
}
