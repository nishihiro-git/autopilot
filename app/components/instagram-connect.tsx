"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Instagram, ExternalLink } from "lucide-react";

interface InstagramAccount {
  id: number;
  instagramBusinessId: string | null;
  facebookPageId: string | null;
  instagramUsername: string | null;
  connectedAt: string;
  isActive: boolean;
}

export default function InstagramConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<InstagramAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // フォーム状態
  const [accessToken, setAccessToken] = useState("");
  const [instagramBusinessId, setInstagramBusinessId] = useState("");
  const [facebookPageId, setFacebookPageId] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");

  // 連携状況を取得
  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch("/api/instagram/connect");
      const data = await response.json();

      if (data.success) {
        setIsConnected(data.connected);
        if (data.connected) {
          setAccount(data.instagramAccount);
        }
      }
    } catch (error) {
      console.error("連携状況取得エラー:", error);
      setError("連携状況の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // Instagram連携を実行
  const connectInstagram = async () => {
    if (!accessToken) {
      setError("アクセストークンが必要です");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/instagram/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          instagramBusinessId: instagramBusinessId || null,
          facebookPageId: facebookPageId || null,
          instagramUsername: instagramUsername || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setIsConnected(true);
        setAccount(data.instagramAccount);
        // フォームをクリア
        setAccessToken("");
        setInstagramBusinessId("");
        setFacebookPageId("");
        setInstagramUsername("");
      } else {
        setError(data.error || "連携に失敗しました");
      }
    } catch (error) {
      console.error("Instagram連携エラー:", error);
      setError("連携処理に失敗しました");
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Instagram連携
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">読み込み中...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5" />
          Instagram連携
        </CardTitle>
        <CardDescription>Instagram Graph APIを使用して自動投稿を有効にします</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Instagram連携が完了しています</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">ステータス</Badge>
                <Badge variant={account?.isActive ? "default" : "destructive"}>
                  {account?.isActive ? "アクティブ" : "非アクティブ"}
                </Badge>
              </div>

              {account?.instagramUsername && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">ユーザー名</Badge>
                  <span>@{account.instagramUsername}</span>
                </div>
              )}

              {account?.instagramBusinessId && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Business ID</Badge>
                  <span className="font-mono text-sm">{account.instagramBusinessId}</span>
                </div>
              )}

              {account?.facebookPageId && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Facebook Page ID</Badge>
                  <span className="font-mono text-sm">{account.facebookPageId}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge variant="secondary">連携日時</Badge>
                <span>{new Date(account?.connectedAt || "").toLocaleString("ja-JP")}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsConnected(false);
                  setAccount(null);
                }}
              >
                連携を解除
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Instagram連携を設定して自動投稿を有効にしてください</AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessToken">Facebookアクセストークン *</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Facebook Graph API アクセストークン"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Facebook for Developersで取得したアクセストークンを入力してください
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagramBusinessId">Instagram Business Account ID</Label>
                <Input
                  id="instagramBusinessId"
                  placeholder="例: 17841412345678901"
                  value={instagramBusinessId}
                  onChange={(e) => setInstagramBusinessId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Instagram Business AccountのID（任意）</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebookPageId">Facebook Page ID</Label>
                <Input
                  id="facebookPageId"
                  placeholder="例: 123456789012345"
                  value={facebookPageId}
                  onChange={(e) => setFacebookPageId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">FacebookページのID（任意）</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagramUsername">Instagramユーザー名</Label>
                <Input
                  id="instagramUsername"
                  placeholder="例: your_instagram_username"
                  value={instagramUsername}
                  onChange={(e) => setInstagramUsername(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Instagramのユーザー名（任意）</p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={connectInstagram} disabled={isConnecting || !accessToken} className="flex-1">
                {isConnecting ? "連携中..." : "Instagram連携"}
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://developers.facebook.com/docs/instagram-basic-display-api/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  設定方法
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
