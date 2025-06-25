"use client";

import Link from "next/link";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstagramHelpPage() {
  const steps = [
    {
      title: "Meta for Developersへの登録",
      description: "まず、Facebookアカウントを使用してMeta for Developersに登録します。これがすべての基本となります。",
    },
    {
      title: "アプリの作成",
      description:
        "開発者ダッシュボードで「新しいアプリを作成」を選択し、「ビジネス」タイプを選びます。アプリ名などを設定して作成を完了します。",
    },
    {
      title: "Instagram Graph APIの追加",
      description:
        "作成したアプリのダッシュボードで、「製品を追加」から「Instagram Graph API」を見つけて設定します。これにより、Instagramと連携する機能が有効になります。",
    },
    {
      title: "Instagramアカウントの準備",
      description:
        "連携したいInstagramアカウントが「ビジネスアカウント」または「クリエイターアカウント」になっていることを確認してください。なっていない場合は、Instagramアプリの設定から切り替えられます。",
    },
    {
      title: "Facebookページとの連携",
      description:
        "Instagramのビジネス/クリエイターアカウントは、Facebookページと連携している必要があります。Instagramのプロフィール編集画面から連携設定を確認・実行してください。",
    },
    {
      title: "アクセストークンの生成",
      description:
        "アプリダッシュボードの「Instagram Graph API」>「Graph APIエクスプローラ」ツールを使用します。先ほど連携したFacebookページとInstagramアカウントを選択し、必要な権限を付与して「アクセストークンを生成」をクリックします。",
    },
    {
      title: "必要な権限の確認",
      description:
        "トークンを生成する際に、少なくとも以下の権限が含まれていることを確認してください。これらの権限がないと、投稿が正常に行えません。",
      permissions: ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"],
    },
    {
      title: "トークンの使用",
      description:
        "生成された長い文字列が「連携キー（アクセストークン）」です。これをコピーし、アカウント設定画面の入力欄に貼り付けて連携を完了してください。",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-50 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative z-10">
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
          <header className="mb-12 pt-12 sm:pt-16">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              アカウント設定に戻る
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300">
              Instagram連携ガイド
            </h1>
            <p className="text-slate-400 mt-2 text-lg">アクセストークンを取得するための手順です。</p>
          </header>

          <main className="max-w-3xl mx-auto space-y-10 pb-12">
            {steps.map((step, index) => (
              <section key={index} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-yellow-400 font-bold text-xl">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && <div className="w-px h-full bg-slate-700" />}
                </div>
                <div className="flex-1 pb-8">
                  <h2 className="text-2xl font-bold text-slate-100 mb-3">{step.title}</h2>
                  <p className="text-slate-300 leading-relaxed">{step.description}</p>
                  {step.permissions && (
                    <div className="mt-4 space-y-2">
                      {step.permissions.map((perm) => (
                        <div
                          key={perm}
                          className="inline-flex items-center gap-2 mr-2 bg-slate-800/80 border border-slate-700 rounded-md px-3 py-1"
                        >
                          <code className="text-sm text-slate-300">{perm}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}
            <div className="text-center pt-8 border-t border-slate-700">
              <h3 className="text-xl font-bold text-slate-100 mb-4">より詳細な情報</h3>
              <p className="text-slate-400 mb-6">
                Metaの公式ドキュメントが最も正確で最新の情報源です。
                <br />
                仕様が変更される場合があるため、必ず公式情報もご確認ください。
              </p>
              <a
                href="https://developers.facebook.com/docs/instagram-graph-api"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-yellow-400 hover:border-slate-500 transition-colors"
                >
                  公式ドキュメントを開く
                  <ExternalLinkIcon className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
