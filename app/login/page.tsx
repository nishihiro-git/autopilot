"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MailIcon, LockIcon, LogInIcon } from "lucide-react";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // 既にログインしている場合はリダイレクト
  useEffect(() => {
    if (status === "authenticated" && session) {
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      router.push(callbackUrl);
    }
  }, [session, status, router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/",
    });

    setLoading(false);

    if (res?.error) {
      setError("メールアドレスまたはパスワードが正しくありません。");
    } else if (res?.ok) {
      router.push("/");
    }
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
          onSubmit={handleLogin}
          className="space-y-8 p-8 sm:p-10 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-400">AI Autopilotにログインして始めましょう。</p>
          </div>

          {error && <div className="text-red-400 text-center font-semibold">{error}</div>}

          <div className="space-y-6">
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
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 pr-4 py-3 text-base bg-slate-900/80 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-slate-600 data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
              />
              <Label htmlFor="remember" className="text-sm text-slate-300 cursor-pointer">
                ログイン状態を保存する
              </Label>
            </div>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 text-base rounded-md transition-transform duration-200 hover:scale-105"
            disabled={loading}
          >
            <LogInIcon className="mr-2 h-5 w-5" />
            {loading ? "ログイン中..." : "ログイン"}
          </Button>

          <p className="text-xs text-center text-slate-500">
            アカウントをお持ちでないですか？{" "}
            <Link href="/signup" className="font-medium text-yellow-400 hover:text-yellow-300">
              サインアップ
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
