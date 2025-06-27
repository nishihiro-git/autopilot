"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  CheckCircleIcon,
  XCircleIcon,
  ImageIcon,
  CalendarIcon,
  TagIcon,
  Loader2Icon,
  ArrowLeftIcon,
} from "lucide-react";

interface Post {
  id: number;
  keywords: string[];
  info: string;
  imageUrl: string;
  imageAlt: string;
  imageSource: string;
  imagePhotographer: string;
  caption: string;
  targetTime: string;
  status: string;
  createdAt: string;
}

export default function PostConfirmationPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadPost();
      // URLパラメータからアクションを取得
      const urlAction = searchParams.get("action");
      if (urlAction && ["approve", "reject"].includes(urlAction)) {
        setAction(urlAction);
      }
    }
  }, [status, params.id, searchParams]);

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/generated-posts`);
      const data = await response.json();

      if (data.success) {
        const targetPost = data.posts.find((p: Post) => p.id === parseInt(params.id));
        if (targetPost) {
          setPost(targetPost);
        } else {
          toast({
            title: "投稿が見つかりません",
            description: "指定された投稿が見つかりませんでした。",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("投稿読み込みエラー:", error);
      toast({
        title: "エラー",
        description: "投稿の読み込みに失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType: "approve" | "reject") => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/posts/confirm/${params.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: actionType }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: actionType === "approve" ? "投稿承認" : "投稿拒否",
          description: result.message,
        });

        // 投稿状態を更新
        if (post) {
          setPost({
            ...post,
            status: actionType === "approve" ? "POSTED" : "REJECTED",
          });
        }

        // 3秒後にダッシュボードにリダイレクト
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        toast({
          title: "エラー",
          description: result.error || "処理に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("投稿確認エラー:", error);
      toast({
        title: "エラー",
        description: "投稿確認処理に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GENERATED":
        return <Badge variant="secondary">生成済み</Badge>;
      case "POSTED":
        return <Badge className="bg-green-500">投稿済み</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">拒否済み</Badge>;
      case "FAILED":
        return <Badge variant="destructive">失敗</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="h-12 w-12 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-slate-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen w-full bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-slate-400">投稿が見つかりません</p>
          <Button onClick={() => router.push("/")} className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            ダッシュボードに戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-50 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="relative z-10">
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
          <div className="mb-8">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="mb-4 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              ダッシュボードに戻る
            </Button>

            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300">
                投稿確認
              </h1>
              {getStatusBadge(post.status)}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 投稿内容 */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-50">
                  <ImageIcon className="h-5 w-5 text-yellow-400" />
                  投稿内容
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* キーワード */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <TagIcon className="h-4 w-4" />
                    キーワード
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {post.keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-yellow-400/20 text-yellow-300 border-yellow-400/50"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 生成された情報 */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">生成された情報</h3>
                  <p className="text-slate-400 text-sm bg-slate-900/50 p-3 rounded-md">{post.info}</p>
                </div>

                {/* 投稿予定時刻 */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <CalendarIcon className="h-4 w-4" />
                    投稿予定時刻
                  </h3>
                  <p className="text-slate-400 text-sm">{new Date(post.targetTime).toLocaleString("ja-JP")}</p>
                </div>
              </CardContent>
            </Card>

            {/* 画像とキャプション */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-50">投稿画像</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg">
                  <img src={post.imageUrl} alt={post.imageAlt} className="w-full h-full object-cover" />
                </div>

                <div className="text-xs text-slate-500">
                  出典: {post.imageSource} {post.imagePhotographer && `by ${post.imagePhotographer}`}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">キャプション</h3>
                  <div className="bg-slate-900/50 p-3 rounded-md">
                    <p className="text-slate-400 text-sm whitespace-pre-wrap">{post.caption}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* アクションボタン */}
          {post.status === "GENERATED" && (
            <Card className="mt-6 bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => handleAction("approve")}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6"
                  >
                    {processing && action === "approve" ? (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircleIcon className="mr-2 h-4 w-4" />
                    )}
                    承認して投稿
                  </Button>

                  <Button
                    onClick={() => handleAction("reject")}
                    disabled={processing}
                    variant="destructive"
                    className="font-bold py-3 px-6"
                  >
                    {processing && action === "reject" ? (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircleIcon className="mr-2 h-4 w-4" />
                    )}
                    拒否
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ステータス表示 */}
          {post.status !== "GENERATED" && (
            <Card className="mt-6 bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-400">
                    {post.status === "POSTED" && "この投稿は承認され、Instagramに投稿されました。"}
                    {post.status === "REJECTED" && "この投稿は拒否されました。"}
                    {post.status === "FAILED" && "この投稿の処理中にエラーが発生しました。"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
