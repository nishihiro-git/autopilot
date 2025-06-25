import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";
import { PrismaClient } from "@prisma/client";

// Prismaクライアントのシングルトンインスタンス
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 生成された投稿を取得（最新順）
    const posts = await prisma.generatedPost.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20, // 最新20件
    });

    // データを整形
    const formattedPosts = posts.map((post: any) => ({
      id: post.id,
      keywords: post.keywords as string[],
      info: post.info,
      imageUrl: post.imageUrl,
      imageAlt: post.imageAlt,
      imageSource: post.imageSource,
      imagePhotographer: post.imagePhotographer,
      caption: post.caption,
      targetTime: post.targetTime.toISOString(),
      status: post.status,
      createdAt: post.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error("生成された投稿取得エラー:", error);
    return NextResponse.json({ error: "投稿の取得に失敗しました" }, { status: 500 });
  }
}
