import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 投稿の詳細を取得
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "無効な投稿IDです" }, { status: 400 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 投稿を取得
    const post = await prisma.generatedPost.findFirst({
      where: {
        id: postId,
        userId: user.id,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      post: {
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
      },
    });
  } catch (error) {
    console.error("投稿取得エラー:", error);
    return NextResponse.json({ error: "投稿の取得に失敗しました" }, { status: 500 });
  }
}

// 投稿を更新
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "無効な投稿IDです" }, { status: 400 });
    }

    const body = await request.json();
    const { info, caption, imageUrl, imageAlt } = body;

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 投稿を更新
    const updatedPost = await prisma.generatedPost.update({
      where: {
        id: postId,
        userId: user.id,
      },
      data: {
        info: info || undefined,
        caption: caption || undefined,
        imageUrl: imageUrl || undefined,
        imageAlt: imageAlt || undefined,
        imageSource: imageUrl ? "custom" : undefined,
        imagePhotographer: imageUrl ? "ユーザーアップロード" : undefined,
        updatedAt: new Date(),
      },
    });

    console.log(`投稿更新完了: ${user.email}`, {
      postId: updatedPost.id,
      infoLength: updatedPost.info.length,
      captionLength: updatedPost.caption.length,
      imageUrl: updatedPost.imageUrl,
    });

    return NextResponse.json({
      success: true,
      message: "投稿を更新しました",
      post: {
        id: updatedPost.id,
        keywords: updatedPost.keywords as string[],
        info: updatedPost.info,
        imageUrl: updatedPost.imageUrl,
        imageAlt: updatedPost.imageAlt,
        imageSource: updatedPost.imageSource,
        imagePhotographer: updatedPost.imagePhotographer,
        caption: updatedPost.caption,
        targetTime: updatedPost.targetTime.toISOString(),
        status: updatedPost.status,
        createdAt: updatedPost.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("投稿更新エラー:", error);
    return NextResponse.json({ error: "投稿の更新に失敗しました" }, { status: 500 });
  }
}
