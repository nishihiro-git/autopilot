"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Image, FileText, Info, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface PostGeneratorProps {
  keywords: string[];
  design: string;
  content: string;
}

interface GeneratedPost {
  keywords: string[];
  info: string;
  image: {
    url: string;
    alt: string;
    source: string;
    photographer: string;
  };
  caption: string;
  generatedAt: string;
}

export default function PostGenerator({ keywords, design, content }: PostGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generatePost = async () => {
    if (!keywords || keywords.length === 0) {
      toast.error("キーワードを設定してください");
      return;
    }

    setIsGenerating(true);
    setGeneratedPost(null);

    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keywords,
          design,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "投稿の生成に失敗しました");
      }

      setGeneratedPost(data.post);
      toast.success("投稿が生成されました！");
    } catch (error) {
      console.error("投稿生成エラー:", error);
      toast.error(error instanceof Error ? error.message : "投稿の生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

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

  const canGenerate = keywords && keywords.length > 0;

  return (
    <div className="space-y-6">
      {/* 生成ボタン */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            統合投稿生成
          </CardTitle>
          <CardDescription>
            キーワード、デザイン指示、キャプション指示を基に、情報取得・画像生成・キャプション生成を一括で行います
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generatePost} disabled={!canGenerate || isGenerating} className="w-full" size="lg">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                投稿を生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                投稿を生成
              </>
            )}
          </Button>
          {!canGenerate && <p className="mt-2 text-sm text-muted-foreground">キーワードを設定してください</p>}
        </CardContent>
      </Card>

      {/* 生成された投稿 */}
      {generatedPost && (
        <div className="space-y-6">
          {/* 情報セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                取得した情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <p className="text-sm leading-relaxed">{generatedPost.info}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedPost.info, "情報")}
                  className="ml-2 flex-shrink-0"
                >
                  {copiedField === "情報" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 画像セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                生成された画像
              </CardTitle>
              <CardDescription>
                ソース: {generatedPost.image.source} | 撮影者: {generatedPost.image.photographer}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-lg border">
                  <img
                    src={generatedPost.image.url}
                    alt={generatedPost.image.alt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{generatedPost.image.alt}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedPost.image.url, "画像URL")}
                  >
                    {copiedField === "画像URL" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* キャプションセクション */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                生成されたキャプション
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{generatedPost.caption}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedPost.caption, "キャプション")}
                    className="ml-2 flex-shrink-0"
                  >
                    {copiedField === "キャプション" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {generatedPost.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 生成情報 */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>生成日時: {new Date(generatedPost.generatedAt).toLocaleString("ja-JP")}</span>
                <span>キーワード数: {generatedPost.keywords.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
