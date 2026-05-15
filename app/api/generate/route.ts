import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { mode, base, tool, tastes, ingredients } = await req.json();

    const toolConstraint = tool === "none"
      ? "シェイカーなしで作れるカクテルのみ（ビルドまたはステア）。シェイクするカクテルは絶対禁止。"
      : "シェイカーを使うカクテルのみ（シェイク）。ビルドのカクテルは絶対禁止。";

    const modeDesc = mode === "standard"
      ? "誰もが知る定番の有名カクテル"
      : "プロが勧める少し珍しい通なカクテル";

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `あなたは正確無比な一流バーテンダー。以下の条件でカクテルを3つ提案してください。

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
</COCKTAIL3>`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

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

    const cocktails = [1, 2, 3].map((i) => {
      const match = text.match(new RegExp(`<COCKTAIL${i}>(.*?)</COCKTAIL${i}>`, "s"));
      return match ? parseCocktail(match[1]) : null;
    }).filter(Boolean);

    return NextResponse.json({ cocktails });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
