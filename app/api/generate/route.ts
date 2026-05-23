import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const extractTag = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "s"));
  return match ? match[1].trim() : "";
};

const parseCocktail = (block: string) => ({
  name: extractTag(block, "NAME"),
  strength: extractTag(block, "STRENGTH"),
  technique: extractTag(block, "TECHNIQUE"),
  materials: extractTag(block, "MATERIALS"),
  steps: extractTag(block, "STEPS"),
  snack: extractTag(block, "SNACK"),
  msg: extractTag(block, "MSG"),
});

export async function POST(req: NextRequest) {
  const { mode, base, tool, tastes, ingredients } = await req.json();

  const toolConstraint = tool === "none"
    ? "シェイカーなしで作れるカクテルのみ（ビルドまたはステア）。シェイクするカクテルは絶対禁止。"
    : "シェイカーを使うカクテルのみ（シェイク）。ビルドのカクテルは絶対禁止。";

  const modeDesc = mode === "standard"
    ? "誰もが知る定番の有名カクテル"
    : "プロが勧める少し珍しい通なカクテル";

  const prompt = `あなたは正確無比な一流バーテンダー。以下の条件でカクテルを3つ提案してください。

モード：${modeDesc}
ベーススピリッツ：${base}
道具：${toolConstraint}
テイスト：${tastes.length > 0 ? tastes.join("、") : "おまかせ"}
手持ち材料：${ingredients || "なし"}

以下のXMLタグで3つ分出力してください。余計な説明不要。

<COCKTAIL1>
<NAME>カクテルの正式名称</NAME>
<STRENGTH>度数の強さ（★★★〜★☆☆）</STRENGTH>
<TECHNIQUE>ビルド・ステア・シェイクのいずれか</TECHNIQUE>
<MATERIALS>材料を分量（ml、個、枚）付きで改行区切りで</MATERIALS>
<STEPS>作り方を簡潔に</STEPS>
<SNACK>合うおつまみ</SNACK>
<MSG>バーテンダーからの一言（こだわりポイント）</MSG>
</COCKTAIL1>

<COCKTAIL2>
<NAME>カクテルの正式名称</NAME>
<STRENGTH>度数の強さ</STRENGTH>
<TECHNIQUE>ビルド・ステア・シェイクのいずれか</TECHNIQUE>
<MATERIALS>材料と分量</MATERIALS>
<STEPS>作り方</STEPS>
<SNACK>合うおつまみ</SNACK>
<MSG>バーテンダーからの一言</MSG>
</COCKTAIL2>

<COCKTAIL3>
<NAME>カクテルの正式名称</NAME>
<STRENGTH>度数の強さ</STRENGTH>
<TECHNIQUE>ビルド・ステア・シェイクのいずれか</TECHNIQUE>
<MATERIALS>材料と分量</MATERIALS>
<STEPS>作り方</STEPS>
<SNACK>合うおつまみ</SNACK>
<MSG>バーテンダーからの一言</MSG>
</COCKTAIL3>`;

  const encoder = new TextEncoder();
  const sentCocktails = new Set<number>();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        let buffer = "";

        const stream = await client.messages.stream({
          model: "claude-haiku-4-5",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            buffer += chunk.delta.text;

            for (let i = 1; i <= 3; i++) {
              if (sentCocktails.has(i)) continue;
              const match = buffer.match(
                new RegExp(`<COCKTAIL${i}>(.*?)</COCKTAIL${i}>`, "s")
              );
              if (match) {
                const cocktail = parseCocktail(match[1]);
                const payload = JSON.stringify({ index: i - 1, cocktail });
                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                sentCocktails.add(i);
              }
            }
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        const err = JSON.stringify({ error: String(e) });
        controller.enqueue(encoder.encode(`data: ${err}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
