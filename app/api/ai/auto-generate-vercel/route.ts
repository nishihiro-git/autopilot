import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("自動投稿生成バッチ開始:", new Date().toISOString());

    const now = new Date();
    const target = new Date(now.getTime() + 30 * 60 * 1000); // 30分後

    // 曜日を日本語で取得
    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
    const targetDay = weekDays[target.getDay()];
    const targetTimeStr = target.toTimeString().slice(0, 5); // 'HH:MM'

    console.log(`チェック対象: ${targetDay} ${targetTimeStr} (${target.toISOString()})`);

    // 全ユーザーの設定を取得
    const users = await prisma.user.findMany({
      include: { settings: true },
    });

    console.log(`全ユーザー数: ${users.length}`);

    let generatedCount = 0;
    const results = [];

    for (const user of users) {
      console.log(`ユーザー ${user.email} の設定をチェック中...`);

      if (!user.settings) {
        console.log(`ユーザー ${user.email}: 設定なし`);
        continue;
      }

      const schedule = user.settings.schedule;
      console.log(`ユーザー ${user.email} のスケジュール:`, schedule);

      if (!schedule || typeof schedule !== "object") {
        console.log(`ユーザー ${user.email}: スケジュールなし`);
        continue;
      }

      // スケジュールから該当曜日の時間を取得
      const scheduleObj = schedule as Record<string, any>;
      const daySchedule = scheduleObj[targetDay];
      console.log(`ユーザー ${user.email} の ${targetDay} のスケジュール:`, daySchedule);

      if (!daySchedule || !Array.isArray(daySchedule)) {
        console.log(`ユーザー ${user.email}: ${targetDay} のスケジュールなし`);
        continue;
      }

      // 30分後に投稿予定があるかチェック
      if (daySchedule.includes(targetTimeStr)) {
        console.log(`ユーザー ${user.email}: ${targetDay} ${targetTimeStr} に投稿予定`);

        try {
          // 自動生成APIを呼び出し
          const apiUrl = `${process.env.NEXTAUTH_URL}/api/ai/auto-generate`;
          console.log(`API呼び出し: ${apiUrl}`);

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.CRON_SECRET || "auto-generate"}`, // 簡易認証
            },
            body: JSON.stringify({
              targetTime: target.toISOString(),
              userId: user.id,
            }),
          });

          console.log(`API応答ステータス: ${response.status}`);

          if (response.ok) {
            const responseData = await response.json();
            console.log(`API応答データ:`, responseData);

            generatedCount++;
            results.push({
              user: user.email,
              status: "success",
              targetTime: target.toISOString(),
            });
            console.log(`ユーザー ${user.email}: 投稿生成成功`);
          } else {
            const error = await response.text();
            results.push({
              user: user.email,
              status: "error",
              error: error,
            });
            console.error(`ユーザー ${user.email}: 投稿生成失敗 - ${error}`);
          }
        } catch (error) {
          results.push({
            user: user.email,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
          console.error(`ユーザー ${user.email}: 投稿生成エラー - ${error}`);
        }
      } else {
        console.log(`ユーザー ${user.email}: ${targetDay} ${targetTimeStr} のスケジュールなし`);
      }
    }

    console.log(`自動投稿生成バッチ完了: ${generatedCount}件生成, ${results.length}件処理`);

    return NextResponse.json({
      success: true,
      generatedCount,
      totalProcessed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("自動投稿生成バッチエラー:", error);
    return NextResponse.json(
      {
        error: "バッチ処理に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
