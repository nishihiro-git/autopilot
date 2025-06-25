import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { FacebookAdsApi, Ad } from "facebook-nodejs-business-sdk";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(request: NextRequest) {
  try {
    // Vercel Cronからの認証
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // 30分後に投稿予定の投稿を取得
    const scheduledPosts = await prisma.generatedPost.findMany({
      where: {
        status: "GENERATED",
        targetTime: {
          gte: now,
          lte: thirtyMinutesFromNow,
        },
      },
      include: {
        user: {
          include: {
            instagramAccount: true,
          },
        },
      },
    });

    console.log(`自動投稿処理開始: ${scheduledPosts.length}件の投稿を処理`);

    const results = [];

    for (const post of scheduledPosts) {
      try {
        // Instagram連携が設定されているかチェック
        if (!post.user.instagramAccount || !post.user.instagramAccount.isActive) {
          console.log(`投稿 ${post.id}: Instagram連携が設定されていません`);
          await prisma.generatedPost.update({
            where: { id: post.id },
            data: {
              status: "FAILED",
              error: "Instagram連携が設定されていません",
            },
          });
          results.push({ postId: post.id, status: "FAILED", error: "Instagram連携未設定" });
          continue;
        }

        // Facebook Ads APIを初期化
        FacebookAdsApi.init(post.user.instagramAccount.accessToken);

        // Instagram Business Account IDが必要
        if (!post.user.instagramAccount.instagramBusinessId) {
          throw new Error("Instagram Business Account IDが設定されていません");
        }

        // Instagram投稿を作成
        const instagramPost = await new Ad(post.user.instagramAccount.instagramBusinessId).create([], {
          creative: {
            object_story_spec: {
              instagram_media: {
                image_url: post.imageUrl,
                caption: post.caption,
              },
            },
          },
          status: "PAUSED",
        });

        // 投稿を実行
        const postResult = await instagramPost.update([], {
          status: "ACTIVE",
        });

        // 投稿成功時の処理
        await prisma.generatedPost.update({
          where: { id: post.id },
          data: {
            status: "POSTED",
            instagramPostId: postResult.id,
            postedAt: new Date(),
          },
        });

        console.log(`投稿 ${post.id}: 成功 (Instagram Post ID: ${postResult.id})`);
        results.push({ postId: post.id, status: "SUCCESS", instagramPostId: postResult.id });
      } catch (error: any) {
        console.error(`投稿 ${post.id} エラー:`, error);

        // エラー時の処理
        await prisma.generatedPost.update({
          where: { id: post.id },
          data: {
            status: "FAILED",
            error: error.message || "投稿に失敗しました",
          },
        });

        results.push({ postId: post.id, status: "FAILED", error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `自動投稿処理完了: ${results.length}件処理`,
      results,
    });
  } catch (error) {
    console.error("自動投稿エラー:", error);
    return NextResponse.json({ error: "自動投稿処理に失敗しました" }, { status: 500 });
  }
}
