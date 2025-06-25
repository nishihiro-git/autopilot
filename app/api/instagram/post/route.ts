import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { PrismaClient } from "@prisma/client";
import { FacebookAdsApi, AdAccount, AdCreative, Ad } from "facebook-nodejs-business-sdk";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { generatedPostId } = await request.json();

    if (!generatedPostId) {
      return NextResponse.json({ error: "投稿IDが必要です" }, { status: 400 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // Instagram連携情報を取得
    const instagramAccount = await prisma.instagramAccount.findUnique({
      where: { userId: user.id },
    });

    if (!instagramAccount || !instagramAccount.isActive) {
      return NextResponse.json({ error: "Instagram連携が設定されていません" }, { status: 400 });
    }

    // 生成された投稿を取得
    const generatedPost = await prisma.generatedPost.findUnique({
      where: { id: generatedPostId, userId: user.id },
    });

    if (!generatedPost) {
      return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
    }

    if (generatedPost.status === "POSTED") {
      return NextResponse.json({ error: "既に投稿済みです" }, { status: 400 });
    }

    // Facebook Ads APIを初期化
    FacebookAdsApi.init(instagramAccount.accessToken);

    try {
      // Instagram Business Account IDが必要
      if (!instagramAccount.instagramBusinessId) {
        throw new Error("Instagram Business Account IDが設定されていません");
      }

      // 画像をダウンロードしてBase64エンコード
      const imageResponse = await fetch(generatedPost.imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString("base64");

      // Instagram投稿を作成
      const instagramPost = await new Ad(instagramAccount.instagramBusinessId).create([], {
        creative: {
          object_story_spec: {
            instagram_media: {
              image_url: generatedPost.imageUrl,
              caption: generatedPost.caption,
            },
          },
        },
        status: "PAUSED", // 即座に投稿
      });

      // 投稿を実行
      const postResult = await instagramPost.update([], {
        status: "ACTIVE",
      });

      // 投稿成功時の処理
      await prisma.generatedPost.update({
        where: { id: generatedPostId },
        data: {
          status: "POSTED",
          instagramPostId: postResult.id,
          postedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Instagram投稿が完了しました",
        postId: postResult.id,
        postedAt: new Date().toISOString(),
      });
    } catch (apiError: any) {
      console.error("Instagram API エラー:", apiError);

      // エラー時の処理
      await prisma.generatedPost.update({
        where: { id: generatedPostId },
        data: {
          status: "FAILED",
          error: apiError.message || "投稿に失敗しました",
        },
      });

      return NextResponse.json(
        {
          error: "Instagram投稿に失敗しました",
          details: apiError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Instagram投稿エラー:", error);
    return NextResponse.json({ error: "投稿処理に失敗しました" }, { status: 500 });
  }
}
