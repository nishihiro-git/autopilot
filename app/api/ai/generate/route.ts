import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import OpenAI from "openai";
import { createApi } from "unsplash-js";
import { createClient } from "pexels";

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Unsplashクライアントの初期化
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || "",
});

// Pexelsクライアントの初期化
const pexels = createClient(process.env.PEXELS_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { type, keywords, design, content } = body;

    if (!type || !keywords || keywords.length === 0) {
      return NextResponse.json({ error: "必要なパラメータが不足しています" }, { status: 400 });
    }

    switch (type) {
      case "info":
        return await generateInfo(keywords);
      case "image":
        return await generateImage(keywords, design);
      case "caption":
        return await generateCaption(keywords, content);
      case "all":
        return await generateAll(keywords, design, content);
      default:
        return NextResponse.json({ error: "無効なタイプです" }, { status: 400 });
    }
  } catch (error) {
    console.error("AI生成エラー:", error);
    return NextResponse.json({ error: "AI生成に失敗しました" }, { status: 500 });
  }
}

// 情報取得
async function generateInfo(keywords: string[]) {
  try {
    const keywordText = keywords.join(", ");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "あなたはInstagram投稿のための情報収集専門家です。与えられたキーワードに関連する最新の情報、トレンド、興味深い事実を収集してください。",
        },
        {
          role: "user",
          content: `以下のキーワードに関連する情報を収集してください：${keywordText}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const info = completion.choices[0]?.message?.content || "情報を取得できませんでした。";

    return NextResponse.json({
      success: true,
      type: "info",
      data: info,
    });
  } catch (error) {
    console.error("情報取得エラー:", error);
    return NextResponse.json({ error: "情報取得に失敗しました" }, { status: 500 });
  }
}

// 画像生成
async function generateImage(keywords: string[], design: string) {
  try {
    const prompt = design
      ? `${design}。キーワード: ${keywords.join(", ")}`
      : `Instagram投稿用の美しい画像。キーワード: ${keywords.join(", ")}`;

    // まずUnsplashで検索
    try {
      const unsplashResult = await unsplash.search.getPhotos({
        query: keywords.join(" "),
        page: 1,
        perPage: 1,
        orientation: "landscape",
      });

      if (unsplashResult.response?.results?.[0]) {
        const photo = unsplashResult.response.results[0];
        return NextResponse.json({
          success: true,
          type: "image",
          data: {
            url: photo.urls.regular,
            alt: photo.alt_description || keywords.join(", "),
            source: "unsplash",
            photographer: photo.user?.name,
          },
        });
      }
    } catch (unsplashError) {
      console.log("Unsplash検索失敗、Pexelsを試行");
    }

    // Pexelsで検索
    try {
      const pexelsResult = await pexels.photos.search({
        query: keywords.join(" "),
        page: 1,
        per_page: 1,
        orientation: "landscape",
      });

      if ("photos" in pexelsResult && pexelsResult.photos?.[0]) {
        const photo = pexelsResult.photos[0];
        return NextResponse.json({
          success: true,
          type: "image",
          data: {
            url: photo.src.medium,
            alt: photo.alt || keywords.join(", "),
            source: "pexels",
            photographer: photo.photographer,
          },
        });
      }
    } catch (pexelsError) {
      console.log("Pexels検索失敗");
    }

    // 画像が見つからない場合はデフォルト画像を返す
    return NextResponse.json({
      success: true,
      type: "image",
      data: {
        url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=600&fit=crop",
        alt: "デフォルト画像",
        source: "default",
        photographer: "Default",
      },
    });
  } catch (error) {
    console.error("画像生成エラー:", error);
    return NextResponse.json({ error: "画像生成に失敗しました" }, { status: 500 });
  }
}

// キャプション生成
async function generateCaption(keywords: string[], content: string) {
  try {
    const keywordText = keywords.join(", ");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "あなたはInstagram投稿のキャプション作成専門家です。魅力的で、エンゲージメントを高めるキャプションを作成してください。ハッシュタグも含めてください。",
        },
        {
          role: "user",
          content: `キーワード: ${keywordText}\n指示: ${
            content || "魅力的なキャプションを作成してください"
          }\n\nInstagram投稿用のキャプションを作成してください。`,
        },
      ],
      max_tokens: 300,
      temperature: 0.8,
    });

    const caption = completion.choices[0]?.message?.content || "キャプションを生成できませんでした。";

    return NextResponse.json({
      success: true,
      type: "caption",
      data: caption,
    });
  } catch (error) {
    console.error("キャプション生成エラー:", error);
    return NextResponse.json({ error: "キャプション生成に失敗しました" }, { status: 500 });
  }
}

// 全機能一括生成
async function generateAll(keywords: string[], design: string, content: string) {
  try {
    const [infoResult, imageResult, captionResult] = await Promise.allSettled([
      generateInfo(keywords),
      generateImage(keywords, design),
      generateCaption(keywords, content),
    ]);

    const results = {
      info: infoResult.status === "fulfilled" ? await infoResult.value.json() : null,
      image: imageResult.status === "fulfilled" ? await imageResult.value.json() : null,
      caption: captionResult.status === "fulfilled" ? await captionResult.value.json() : null,
    };

    return NextResponse.json({
      success: true,
      type: "all",
      data: results,
    });
  } catch (error) {
    console.error("一括生成エラー:", error);
    return NextResponse.json({ error: "一括生成に失敗しました" }, { status: 500 });
  }
}
