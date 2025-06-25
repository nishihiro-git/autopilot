"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MailIcon, LockIcon, UserIcon, UserPlusIcon } from "lucide-react";

function SignupPageContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // 既にログインしている場合はリダイレクト
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/");
    }
  }, [session, status, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // バリデーション
    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください。");
      setLoading(false);
      return;
    }

    if (!agreeToTerms) {
      setError("利用規約に同意してください。");
      setLoading(false);
      return;
    }

    try {
      // 新規登録APIを呼び出し
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        setError(signupData.error || "アカウントの作成に失敗しました。");
        setLoading(false);
        return;
      }

      // 新規登録成功後、自動ログイン
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/",
      });

      if (res?.error) {
        setError("ログインに失敗しました。作成したアカウントでログインしてください。");
      } else if (res?.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("新規登録エラー:", error);
      setError("アカウントの作成に失敗しました。");
    }

    setLoading(false);
  };

  // ログイン済みの場合はローディング表示
  if (status === "loading" || (status === "authenticated" && session)) {
    return (
      <div className="min-h-screen w-full bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-slate-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-50 relative flex items-center justify-center p-4">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative z-10 w-full max-w-md">
        <form
          onSubmit={handleSignup}
          className="space-y-8 p-8 sm:p-10 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 mb-2">
              Create Account
            </h1>
            <p className="text-slate-400">AI Autopilotのアカウントを作成しましょう。</p>
          </div>

          {error && <div className="text-red-400 text-center font-semibold">{error}</div>}

          <div className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-300">
                お名前
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  placeholder="お名前を入力"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-12 pr-4 py-3 text-base bg-slate-900/80 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                メールアドレス
              </Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="メールアドレスを入力"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 pr-4 py-3 text-base bg-slate-900/80 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                パスワード
              </Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="パスワードを入力（6文字以上）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 pr-4 py-3 text-base bg-slate-900/80 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200"
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
                パスワード（確認）
              </Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="パスワードを再入力"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-12 pr-4 py-3 text-base bg-slate-900/80 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                className="border-slate-600 data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400 mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer">
                <a href="#" className="text-yellow-400 hover:text-yellow-300">
                  利用規約
                </a>
                と
                <a href="#" className="text-yellow-400 hover:text-yellow-300">
                  プライバシーポリシー
                </a>
                に同意します
              </Label>
            </div>
          </div>

          {/* Signup Button */}
          <Button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 text-base rounded-md transition-transform duration-200 hover:scale-105"
            disabled={loading}
          >
            <UserPlusIcon className="mr-2 h-5 w-5" />
            {loading ? "アカウント作成中..." : "アカウントを作成"}
          </Button>

          <p className="text-xs text-center text-slate-500">
            既にアカウントをお持ちですか？{" "}
            <Link href="/login" className="font-medium text-yellow-400 hover:text-yellow-300">
              ログイン
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupPageContent />
    </Suspense>
  );
}
