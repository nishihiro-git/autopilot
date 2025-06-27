"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import PostEditor from "./post-editor";
import {
  ImageIcon,
  CalendarIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
  EyeIcon,
  RefreshCwIcon,
  EditIcon,
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

export default function GeneratedPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generated-posts");
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
      } else {
        toast({
          title: "エラー",
          description: "投稿の読み込みに失敗しました。",
          variant: "destructive",
        });
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

  const handleAction = async (postId: number, action: "approve" | "reject") => {
    setProcessing(postId);
    try {
      const response = await fetch(`/api/posts/confirm/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: action === "approve" ? "投稿承認" : "投稿拒否",
          description: result.message,
        });

        // 投稿状態を更新
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, status: action === "approve" ? "POSTED" : "REJECTED" } : post
          )
        );
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
      setProcessing(null);
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP");
  };

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
          <h3 className="text-xl sm:text-2xl font-bold text-slate-50">生成された投稿</h3>
        </div>
        <div className="text-center py-8">
          <Loader2Icon className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-slate-400">投稿を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
          <h3 className="text-xl sm:text-2xl font-bold text-slate-50">生成された投稿</h3>
        </div>
        <Button
          onClick={loadPosts}
          variant="outline"
          size="sm"
          className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50"
        >
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          更新
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <ImageIcon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">まだ投稿が生成されていません。</p>
          <p className="text-slate-500 text-sm mt-2">
            設定を完了してスケジュールを設定すると、自動的に投稿が生成されます。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-50 text-lg">投稿 #{post.id}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(post.status)}
                    <span className="text-xs text-slate-500">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* キーワード */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <TagIcon className="h-4 w-4" />
                    キーワード
                  </h4>
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

                {/* 投稿予定時刻 */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <CalendarIcon className="h-4 w-4" />
                    投稿予定時刻
                  </h4>
                  <p className="text-slate-400 text-sm">{formatDate(post.targetTime)}</p>
                </div>

                {/* 画像プレビュー */}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">投稿画像</h4>
                  <div className="aspect-square w-32 overflow-hidden rounded-lg">
                    <img src={post.imageUrl} alt={post.imageAlt} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    出典: {post.imageSource} {post.imagePhotographer && `by ${post.imagePhotographer}`}
                  </p>
                </div>

                {/* 生成された情報 */}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">生成された情報</h4>
                  <p className="text-slate-400 text-sm bg-slate-800/50 p-3 rounded-md line-clamp-3">{post.info}</p>
                </div>

                {/* キャプション */}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">キャプション</h4>
                  <div className="bg-slate-800/50 p-3 rounded-md">
                    <p className="text-slate-400 text-sm line-clamp-4 whitespace-pre-wrap">{post.caption}</p>
                  </div>
                </div>

                {/* アクションボタン */}
                {post.status === "GENERATED" && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-700">
                    <Button
                      onClick={() => setEditingPost(post)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      <EditIcon className="mr-2 h-4 w-4" />
                      編集
                    </Button>
                    <Button
                      onClick={() => handleAction(post.id, "approve")}
                      disabled={processing === post.id}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                      {processing === post.id ? (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircleIcon className="mr-2 h-4 w-4" />
                      )}
                      承認して投稿
                    </Button>

                    <Button
                      onClick={() => handleAction(post.id, "reject")}
                      disabled={processing === post.id}
                      variant="destructive"
                      className="font-bold"
                    >
                      {processing === post.id ? (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircleIcon className="mr-2 h-4 w-4" />
                      )}
                      拒否
                    </Button>
                  </div>
                )}

                {/* 編集済み投稿の編集ボタン */}
                {post.status !== "GENERATED" && (
                  <div className="pt-4 border-t border-slate-700">
                    <Button
                      onClick={() => setEditingPost(post)}
                      variant="outline"
                      className="w-full bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                    >
                      <EditIcon className="mr-2 h-4 w-4" />
                      編集
                    </Button>
                  </div>
                )}

                {/* 詳細表示ボタン */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                    onClick={() => window.open(`/posts/confirm/${post.id}`, "_blank")}
                  >
                    <EyeIcon className="mr-2 h-4 w-4" />
                    詳細を表示
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 投稿編集モーダル */}
      {editingPost && (
        <PostEditor post={editingPost} onClose={() => setEditingPost(null)} onUpdate={handlePostUpdate} />
      )}
    </div>
  );
}
