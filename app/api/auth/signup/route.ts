import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // バリデーション
    if (!name || !email || !password) {
      return NextResponse.json({ error: "名前、メールアドレス、パスワードは必須です" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "パスワードは6文字以上で入力してください" }, { status: 400 });
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
    }

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 409 });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // 新しいユーザーを作成
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    console.log(`新規ユーザー登録: ${email}`);

    return NextResponse.json(
      {
        success: true,
        message: "アカウントが正常に作成されました",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("新規登録エラー:", error);
    return NextResponse.json({ error: "アカウントの作成に失敗しました" }, { status: 500 });
  }
}
