"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link"; // Linkをインポート
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  UserCircleIcon,
  KeyIcon,
  TrashIcon,
  LinkIcon,
  CheckCircleIcon,
  SaveIcon,
  UnlinkIcon,
  HelpCircleIcon,
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

const dummyUser = {
  email: "user@example.com",
  name: "Taro Yamada",
};

export default function AccountPage() {
  const { toast } = useToast();
  const [userName, setUserName] = useState(dummyUser.name);
  const [instagramApiKey, setInstagramApiKey] = useState("");
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);

  const handleUserNameSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving user name:", userName);
    toast({
      title: "成功",
      description: "ユーザー名を更新しました。",
    });
  };

  const handleInstagramConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instagramApiKey.trim()) {
      toast({
        title: "入力エラー",
        description: "Instagram連携キーを入力してください。",
        variant: "destructive",
      });
      return;
    }
    console.log("Connecting Instagram with API Key:", instagramApiKey);
    setIsInstagramConnected(true);
    toast({
      title: "連携成功",
      description: "Instagramとの連携が完了しました。",
    });
  };

  const handleInstagramDisconnect = () => {
    console.log("Disconnecting Instagram");
    setIsInstagramConnected(false);
    setInstagramApiKey("");
    toast({
      title: "連携解除",
      description: "Instagramとの連携を解除しました。",
      variant: "default",
    });
  };

  const handleChangePassword = () => {
    console.log("Redirecting to change password page (mock)");
    toast({
      title: "パスワード変更",
      description: "パスワード変更ページへ遷移します（現在はモックです）。",
      variant: "default",
    });
  };

  const handleDeleteAccount = () => {
    console.log("Deleting account (mock)");
    toast({
      title: "アカウント削除",
      description: "アカウント削除処理を開始します（現在はモックです）。",
      variant: "destructive",
    });
  };

  return (
    <>
      <div className="min-h-screen w-full bg-slate-900 text-slate-50 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="relative z-10">
          <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <header className="mb-12 pt-12 sm:pt-16">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300">
                アカウント設定
              </h1>
              <p className="text-slate-400 mt-2 text-lg">プロフィール情報や連携サービスを管理します。</p>
            </header>
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 pb-12">
              <div className="lg:col-span-2 space-y-10">
                <section className="p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50">
                  <div className="flex items-center gap-3 mb-6">
                    <LinkIcon className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-slate-50">Instagram連携</h2>
                  </div>
                  {isInstagramConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>連携済みです。</span>
                      </div>
                      <p className="text-slate-400 text-sm">
                        APIキー: ••••••••{instagramApiKey.slice(-4)} (セキュリティのため一部のみ表示)
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleInstagramDisconnect}
                        className="bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                      >
                        <UnlinkIcon className="mr-2 h-4 w-4" />
                        連携を解除する
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleInstagramConnect} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="instagram-api-key" className="text-sm font-medium text-slate-300">
                            Instagram連携キー (アクセストークン)
                          </Label>
                          <Link
                            href="/account/instagram-help"
                            className="text-xs text-slate-400 hover:text-yellow-400 flex items-center gap-1 transition-colors"
                          >
                            <HelpCircleIcon className="h-4 w-4" />
                            連携方法
                          </Link>
                        </div>
                        <Input
                          id="instagram-api-key"
                          type="password"
                          placeholder="連携キーを入力してください"
                          value={instagramApiKey}
                          onChange={(e) => setInstagramApiKey(e.target.value)}
                          className="mt-1 text-base py-3 px-4 bg-slate-900/80 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Meta for Developersから取得したアクセストークンを入力します。
                        </p>
                      </div>
                      <Button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        連携する
                      </Button>
                    </form>
                  )}
                </section>
                <section className="p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50">
                  <div className="flex items-center gap-3 mb-6">
                    <UserCircleIcon className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-slate-50">プロフィール情報</h2>
                  </div>
                  <form onSubmit={handleUserNameSave} className="space-y-4">
                    <div>
                      <Label htmlFor="email-display" className="text-sm font-medium text-slate-300">
                        メールアドレス
                      </Label>
                      <p
                        id="email-display"
                        className="text-slate-400 mt-1 text-base py-3 px-4 bg-slate-900/50 border border-slate-700 rounded-md"
                      >
                        {dummyUser.email} (変更不可)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="user-name" className="text-sm font-medium text-slate-300">
                        ユーザー名
                      </Label>
                      <Input
                        id="user-name"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="mt-1 text-base py-3 px-4 bg-slate-900/80 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold"
                      disabled={userName === dummyUser.name}
                    >
                      <SaveIcon className="mr-2 h-4 w-4" />
                      ユーザー名を保存
                    </Button>
                  </form>
                </section>
              </div>
              <div className="lg:col-span-1 space-y-10">
                <section className="p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50">
                  <div className="flex items-center gap-3 mb-6">
                    <KeyIcon className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-slate-50">パスワード変更</h2>
                  </div>
                  <p className="text-slate-400 mb-4 text-sm">
                    セキュリティのため、定期的なパスワードの変更を推奨します。
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleChangePassword}
                    className="w-full bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-600/50 hover:text-white"
                  >
                    パスワードを変更する
                  </Button>
                </section>
                <section className="p-8 bg-slate-800/50 backdrop-blur-sm border border-red-700/50 rounded-xl shadow-2xl shadow-slate-950/50">
                  <div className="flex items-center gap-3 mb-6">
                    <TrashIcon className="h-6 w-6 text-red-500" />
                    <h2 className="text-2xl font-bold text-red-400">アカウント削除</h2>
                  </div>
                  <p className="text-slate-400 mb-4 text-sm">
                    この操作は取り消せません。すべてデータが完全に削除されます。
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleDeleteAccount}
                    className="w-full bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                  >
                    アカウントを削除する
                  </Button>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}
