import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { action } = body; // "approve" or "reject"

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "無効なアクションです" }, { status: 400 });
    }

    // 投稿を取得
    const post = await prisma.generatedPost.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    if (!post) {
      return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
    }

    // 投稿の所有者かどうかを確認
    if (post.user.email !== session.user.email) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    if (action === "approve") {
      // 投稿を承認してInstagramに投稿
      try {
        // Instagram投稿処理（既存のロジックを使用）
        const instagramResult = await postToInstagram(post);

        if (instagramResult.success) {
          // 投稿成功
          await prisma.generatedPost.update({
            where: { id: parseInt(id) },
            data: {
              status: "POSTED",
              instagramPostId: instagramResult.postId,
              postedAt: new Date(),
            },
          });

          console.log(`投稿承認・投稿成功: ${session.user.email}`, {
            postId: id,
            instagramPostId: instagramResult.postId,
          });

          return NextResponse.json({
            success: true,
            message: "投稿が承認され、Instagramに投稿されました",
            instagramPostId: instagramResult.postId,
          });
        } else {
          // 投稿失敗
          await prisma.generatedPost.update({
            where: { id: parseInt(id) },
            data: {
              status: "FAILED",
              error: instagramResult.error,
            },
          });

          return NextResponse.json(
            {
              success: false,
              message: "投稿の承認に失敗しました",
              error: instagramResult.error,
            },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error("Instagram投稿エラー:", error);

        await prisma.generatedPost.update({
          where: { id: parseInt(id) },
          data: {
            status: "FAILED",
            error: "Instagram投稿処理中にエラーが発生しました",
          },
        });

        return NextResponse.json(
          {
            success: false,
            message: "投稿の承認に失敗しました",
            error: "Instagram投稿処理中にエラーが発生しました",
          },
          { status: 500 }
        );
      }
    } else {
      // 投稿を拒否
      await prisma.generatedPost.update({
        where: { id: parseInt(id) },
        data: {
          status: "REJECTED",
        },
      });

      console.log(`投稿拒否: ${session.user.email}`, { postId: id });

      return NextResponse.json({
        success: true,
        message: "投稿が拒否されました",
      });
    }
  } catch (error) {
    console.error("投稿確認エラー:", error);
    return NextResponse.json({ error: "投稿確認処理に失敗しました" }, { status: 500 });
  }
}

// Instagram投稿処理（既存のロジックを再利用）
async function postToInstagram(post: any) {
  try {
    // ここで既存のInstagram投稿APIを呼び出す
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/instagram/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: post.imageUrl,
        caption: post.caption,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        postId: result.postId || "unknown",
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Instagram投稿に失敗しました",
      };
    }
  } catch (error) {
    console.error("Instagram投稿エラー:", error);
    return {
      success: false,
      error: "Instagram投稿処理中にエラーが発生しました",
    };
  }
}
