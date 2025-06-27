const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("=== データベースの内容確認 ===");

    // Userテーブルの確認
    const users = await prisma.user.findMany();
    console.log("\n--- Userテーブル ---");
    console.log(JSON.stringify(users, null, 2));

    // Settingテーブルの確認
    const settings = await prisma.setting.findMany();
    console.log("\n--- Settingテーブル ---");
    console.log(JSON.stringify(settings, null, 2));

    // GeneratedPostテーブルの確認
    const generatedPosts = await prisma.generatedPost.findMany();
    console.log("\n--- GeneratedPostテーブル ---");
    console.log(JSON.stringify(generatedPosts, null, 2));
  } catch (error) {
    console.error("エラー:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
