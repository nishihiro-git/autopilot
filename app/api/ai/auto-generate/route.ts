import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import OpenAI from "openai";
import { createApi } from "unsplash-js";
import { createClient } from "pexels";
import { PrismaClient } from "@prisma/client";
import { sendPostConfirmationEmail } from "@/lib/email";

const prisma = new PrismaClient();

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
    const body = await request.json();
    const { targetTime, userId } = body;

    // Vercel Cronからの呼び出しかどうかを判定
    const authHeader = request.headers.get("authorization");
    const isCronCall = authHeader === `Bearer ${process.env.CRON_SECRET || "auto-generate"}`;

    let userEmail: string | null = null;
    let targetUserId: number | null = null;

    if (isCronCall) {
      // Vercel Cronからの呼び出しの場合
      if (!userId) {
        return NextResponse.json({ error: "userIdが必要です" }, { status: 400 });
      }
      targetUserId = userId;

      // ユーザー情報を取得
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
      }
      userEmail = user.email;
    } else {
      // 通常のAPI呼び出しの場合
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
      }
      userEmail = session.user.email;
    }

    console.log(`自動投稿生成開始: ${userEmail}`, { targetTime, userId: targetUserId });

    // ユーザーの設定を取得
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { settings: true },
    });

    if (!user?.settings) {
      return NextResponse.json({ error: "設定が見つかりません" }, { status: 404 });
    }

    const settings = user.settings;
    const { keywords, design, content } = settings;

    // keywordsの型を適切に処理
    const keywordsArray = Array.isArray(keywords) ? keywords.filter((k): k is string => typeof k === "string") : [];

    if (keywordsArray.length === 0) {
      return NextResponse.json({ error: "キーワードが設定されていません" }, { status: 400 });
    }

    // 投稿生成
    const info = await generateInfo(keywordsArray);
    const image = await generateImage(keywordsArray, design || "", info);
    const caption = await generateCaption(keywordsArray, content || "", info);

    const post = {
      keywords: keywordsArray,
      info,
      image,
      caption,
      targetTime,
      generatedAt: new Date().toISOString(),
    };

    // 生成された投稿をデータベースに保存
    const savedPost = await prisma.generatedPost.create({
      data: {
        userId: user.id,
        keywords: keywordsArray,
        info: info,
        imageUrl: image.url,
        imageAlt: image.alt,
        imageSource: image.source,
        imagePhotographer: image.photographer,
        caption: caption,
        targetTime: new Date(targetTime),
        status: "GENERATED",
      },
    });

    // メール通知を送信
    try {
      const emailResult = await sendPostConfirmationEmail(userEmail, {
        keywords: keywordsArray,
        info,
        imageUrl: image.url,
        caption,
        targetTime,
        postId: savedPost.id,
      });

      if (emailResult.success) {
        console.log(`メール通知送信成功: ${userEmail}`, { messageId: emailResult.messageId });
      } else {
        console.error(`メール通知送信失敗: ${userEmail}`, emailResult.error);
      }
    } catch (emailError) {
      console.error(`メール通知エラー: ${userEmail}`, emailError);
    }

    console.log(`自動投稿生成完了: ${userEmail}`, {
      keywordsCount: keywordsArray.length,
      infoLength: info.length,
      imageUrl: image.url,
      captionLength: caption.length,
      targetTime,
      postId: savedPost.id,
    });

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        id: savedPost.id,
      },
    });
  } catch (error) {
    console.error("自動投稿生成エラー:", error);
    return NextResponse.json({ error: "自動投稿の生成に失敗しました" }, { status: 500 });
  }
}

// 情報取得
async function generateInfo(keywords: string[]): Promise<string> {
  try {
    const keywordText = keywords.join(", ");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "あなたはInstagram投稿のための情報収集専門家です。与えられたキーワードに関連する最新の情報、トレンド、興味深い事実を収集し、Instagram投稿に適した形でまとめてください。",
        },
        {
          role: "user",
          content: `以下のキーワードに関連する情報を収集してください：${keywordText}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "情報を取得できませんでした。";
  } catch (error) {
    console.error("情報取得エラー:", error);
    return "情報取得に失敗しました。";
  }
}

// 画像生成
async function generateImage(keywords: string[], design: string, info: string): Promise<any> {
  try {
    // 情報とデザイン指示を組み合わせて画像検索クエリを作成
    const searchQuery = design
      ? `${design} ${keywords.join(" ")}`
      : `${keywords.join(" ")} ${info.split(" ").slice(0, 5).join(" ")}`;

    // まずUnsplashで検索
    try {
      const unsplashResult = await unsplash.search.getPhotos({
        query: searchQuery,
        page: 1,
        perPage: 1,
        orientation: "landscape",
      });

      if (unsplashResult.response?.results?.[0]) {
        const photo = unsplashResult.response.results[0];
        return {
          url: photo.urls.regular,
          alt: photo.alt_description || keywords.join(", "),
          source: "unsplash",
          photographer: photo.user?.name,
        };
      }
    } catch (unsplashError) {
      console.log("Unsplash検索失敗、Pexelsを試行");
    }

    // Pexelsで検索
    try {
      const pexelsResult = await pexels.photos.search({
        query: searchQuery,
        page: 1,
        per_page: 1,
        orientation: "landscape",
      });

      if ("photos" in pexelsResult && pexelsResult.photos?.[0]) {
        const photo = pexelsResult.photos[0];
        return {
          url: photo.src.medium,
          alt: photo.alt || keywords.join(", "),
          source: "pexels",
          photographer: photo.photographer,
        };
      }
    } catch (pexelsError) {
      console.log("Pexels検索失敗");
    }

    // 画像が見つからない場合はデフォルト画像を返す
    return {
      url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=600&fit=crop",
      alt: "デフォルト画像",
      source: "default",
      photographer: "Default",
    };
  } catch (error) {
    console.error("画像生成エラー:", error);
    return {
      url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=600&fit=crop",
      alt: "エラー時のデフォルト画像",
      source: "error",
      photographer: "Default",
    };
  }
}

// キャプション生成
async function generateCaption(keywords: string[], content: string, info: string): Promise<string> {
  try {
    const keywordText = keywords.join(", ");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "あなたはInstagram投稿のキャプション作成専門家です。取得した情報と指示を基に、魅力的で、エンゲージメントを高めるキャプションを作成してください。ハッシュタグも含めてください。",
        },
        {
          role: "user",
          content: `キーワード: ${keywordText}\n取得した情報: ${info}\n指示: ${
            content || "魅力的なキャプションを作成してください"
          }\n\nInstagram投稿用のキャプションを作成してください。`,
        },
      ],
      max_tokens: 400,
      temperature: 0.8,
    });

    return completion.choices[0]?.message?.content || "キャプションを生成できませんでした。";
  } catch (error) {
    console.error("キャプション生成エラー:", error);
    return "キャプション生成に失敗しました。";
  }
}
