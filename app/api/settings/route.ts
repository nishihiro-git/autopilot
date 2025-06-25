import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 設定を取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 設定を返す（設定が存在しない場合はデフォルト値）
    const settings = user.settings || {
      keywords: [],
      design: "",
      content: "",
      schedule: {},
    };

    // データの整合性を確保
    const validatedSettings = {
      keywords: Array.isArray(settings.keywords) ? settings.keywords : [],
      design: typeof settings.design === "string" ? settings.design : "",
      content: typeof settings.content === "string" ? settings.content : "",
      schedule: typeof settings.schedule === "object" && settings.schedule !== null ? settings.schedule : {},
    };

    // デバッグログを追加
    console.log(`設定を読み込みました: ${user.email}`, {
      rawSettings: settings,
      validatedSettings: validatedSettings,
      scheduleType: typeof settings.schedule,
      scheduleValue: settings.schedule,
    });

    return NextResponse.json({
      success: true,
      settings: validatedSettings,
    });
  } catch (error) {
    console.error("設定取得エラー:", error);
    return NextResponse.json({ error: "設定の取得に失敗しました" }, { status: 500 });
  }
}

// 設定を保存
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { keywords, design, content, schedule } = body;

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // データの検証と正規化
    const validatedData = {
      keywords: Array.isArray(keywords) ? keywords : [],
      design: typeof design === "string" ? design : "",
      content: typeof content === "string" ? content : "",
      schedule: typeof schedule === "object" && schedule !== null ? schedule : {},
    };

    // トランザクションを使用してデータの整合性を保証
    const settings = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 既存の設定を取得
      const existingSettings = await tx.setting.findUnique({
        where: { userId: user.id },
      });

      if (existingSettings) {
        // 既存の設定を更新（部分更新ではなく完全な置き換え）
        return await tx.setting.update({
          where: { userId: user.id },
          data: {
            keywords: validatedData.keywords,
            design: validatedData.design,
            content: validatedData.content,
            schedule: validatedData.schedule,
            updatedAt: new Date(),
          },
        });
      } else {
        // 新しい設定を作成
        return await tx.setting.create({
          data: {
            userId: user.id,
            keywords: validatedData.keywords,
            design: validatedData.design,
            content: validatedData.content,
            schedule: validatedData.schedule,
          },
        });
      }
    });

    console.log(`設定を保存しました: ${user.email}`, {
      keywordsCount: validatedData.keywords.length,
      designLength: validatedData.design.length,
      contentLength: validatedData.content.length,
      scheduleKeys: Object.keys(validatedData.schedule || {}).length,
      scheduleData: validatedData.schedule,
    });

    return NextResponse.json({
      success: true,
      message: "設定を保存しました",
      settings: {
        keywords: settings.keywords,
        design: settings.design,
        content: settings.content,
        schedule: settings.schedule,
      },
    });
  } catch (error) {
    console.error("設定保存エラー:", error);
    return NextResponse.json({ error: "設定の保存に失敗しました" }, { status: 500 });
  }
}
