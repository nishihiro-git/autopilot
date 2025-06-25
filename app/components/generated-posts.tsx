"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Image, FileText, Info, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface GeneratedPost {
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
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generated-posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      } else {
        toast.error("投稿の読み込みに失敗しました");
      }
    } catch (error) {
      console.error("投稿読み込みエラー:", error);
      toast.error("投稿の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field}をコピーしました`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("コピーに失敗しました");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GENERATED":
        return <Badge variant="default">生成済み</Badge>;
      case "POSTED":
        return <Badge variant="secondary">投稿済み</Badge>;
      case "FAILED":
        return <Badge variant="destructive">失敗</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>自動生成された投稿</span>
            <Button onClick={loadPosts} disabled={loading} variant="outline" size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </CardTitle>
          <CardDescription>スケジュールに基づいて自動生成された投稿一覧</CardDescription>
        </CardHeader>
      </Card>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">まだ自動生成された投稿はありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(post.status)}
                    <span className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">投稿予定: {formatDate(post.targetTime)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* キーワード */}
                <div className="flex flex-wrap gap-2">
                  {post.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>

                {/* 情報 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">取得した情報</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(post.info, `info-${post.id}`)}
                      className="ml-auto"
                    >
                      {copiedField === `info-${post.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed">{post.info}</p>
                </div>

                <Separator />

                {/* 画像 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="h-4 w-4" />
                    <span className="text-sm font-medium">生成された画像</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      ソース: {post.imageSource} | 撮影者: {post.imagePhotographer}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="relative aspect-video overflow-hidden rounded-lg border">
                      <img src={post.imageUrl} alt={post.imageAlt} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{post.imageAlt}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(post.imageUrl, `image-${post.id}`)}
                      >
                        {copiedField === `image-${post.id}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* キャプション */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">生成されたキャプション</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(post.caption, `caption-${post.id}`)}
                      className="ml-auto"
                    >
                      {copiedField === `caption-${post.id}` ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.caption}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
