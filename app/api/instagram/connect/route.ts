import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { PrismaClient } from "@prisma/client";

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

    const { accessToken, instagramBusinessId, facebookPageId, instagramUsername } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: "アクセストークンが必要です" }, { status: 400 });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // データベースの状態を確認
    console.log("データベース接続確認:", { userId: user.id, email: user.email });

    // 既存のInstagram連携情報を確認
    const existingAccount = await prisma.instagramAccount.findUnique({
      where: { userId: user.id },
    });

    console.log("既存のInstagram連携情報:", existingAccount);

    let instagramAccount;

    if (existingAccount) {
      // 更新
      instagramAccount = await prisma.instagramAccount.update({
        where: { userId: user.id },
        data: {
          accessToken,
          instagramBusinessId: instagramBusinessId || null,
          facebookPageId: facebookPageId || null,
          instagramUsername: instagramUsername || null,
          lastTokenRefresh: new Date(),
          isActive: true,
        },
      });
    } else {
      // 新規作成
      instagramAccount = await prisma.instagramAccount.create({
        data: {
          userId: user.id,
          accessToken,
          instagramBusinessId: instagramBusinessId || null,
          facebookPageId: facebookPageId || null,
          instagramUsername: instagramUsername || null,
          isActive: true,
        },
      });
    }

    console.log("Instagram連携情報保存完了:", instagramAccount);

    return NextResponse.json({
      success: true,
      message: "Instagram連携が完了しました",
      instagramAccount: {
        id: instagramAccount.id,
        instagramBusinessId: instagramAccount.instagramBusinessId,
        facebookPageId: instagramAccount.facebookPageId,
        instagramUsername: instagramAccount.instagramUsername,
        connectedAt: instagramAccount.connectedAt,
        isActive: instagramAccount.isActive,
      },
    });
  } catch (error) {
    console.error("Instagram連携エラー:", error);

    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("エラースタック:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Instagram連携に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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

    // Instagram連携情報を取得
    const instagramAccount = await prisma.instagramAccount.findUnique({
      where: { userId: user.id },
    });

    if (!instagramAccount) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "Instagram連携が設定されていません",
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      instagramAccount: {
        id: instagramAccount.id,
        instagramBusinessId: instagramAccount.instagramBusinessId,
        facebookPageId: instagramAccount.facebookPageId,
        instagramUsername: instagramAccount.instagramUsername,
        connectedAt: instagramAccount.connectedAt,
        isActive: instagramAccount.isActive,
      },
    });
  } catch (error) {
    console.error("Instagram連携情報取得エラー:", error);
    return NextResponse.json({ error: "連携情報の取得に失敗しました" }, { status: 500 });
  }
}
