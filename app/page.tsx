"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import KeywordManager from "@/app/components/keyword-manager";
import DesignInstructions from "@/app/components/design-instructions";
import ContentInstructions from "@/app/components/content-instructions";
import PostingSchedule from "@/app/components/posting-schedule";
import GeneratedPosts from "@/app/components/generated-posts";
import InstagramConnect from "@/app/components/instagram-connect";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { LogOutIcon, UserIcon, Loader2Icon, Settings, Calendar, BarChart3, Instagram } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Settings {
  keywords: string[];
  design: string;
  content: string;
  schedule: Record<string, string[]>;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState<Settings>({
    keywords: [],
    design: "",
    content: "",
    schedule: {},
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ログインしていない場合はログインページにリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 初期データ読み込み
  useEffect(() => {
    if (status === "authenticated") {
      loadSettings();
    }
  }, [status]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();

      if (data.success && data.settings) {
        console.log("設定を読み込みました:", session?.user?.email, data);
        setSettings({
          keywords: data.settings.keywords || [],
          design: data.settings.design || "",
          content: data.settings.content || "",
          schedule: data.settings.schedule || {},
        });
      }
    } catch (error) {
      console.error("設定読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      setSaving(true);
      try {
        const updatedSettings = { ...settings, ...newSettings };

        // デバッグログを追加
        console.log("保存する設定:", updatedSettings);
        console.log("新しく追加された設定:", newSettings);

        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSettings),
        });

        if (response.ok) {
          const result = await response.json();
          setSettings(updatedSettings);
          console.log("設定保存成功:", result);
          toast({
            title: "保存完了",
            description: "設定を保存しました。",
          });
          return true;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "保存に失敗しました");
        }
      } catch (error) {
        console.error("設定保存エラー:", error);
        toast({
          title: "保存エラー",
          description: "設定の保存に失敗しました。",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [settings, toast]
  );

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  // ローディング中または未認証の場合はローディング表示
  if (status === "loading" || status === "unauthenticated") {
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
    <div className="min-h-screen w-full bg-slate-900 text-slate-50 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="relative z-10">
        {/* Header with User Info and Logout */}
        <header className="border-b border-slate-700 bg-slate-800/30 backdrop-blur-sm">
          <div className="container mx-auto px-3 sm:px-6 md:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 whitespace-nowrap">
                  Instagram AI Autopilot
                </h1>
                {saving && <Loader2Icon className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-yellow-400" />}
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                {/* User Info */}
                <div className="hidden sm:flex items-center gap-2 text-slate-300">
                  <UserIcon className="h-4 w-4" />
                  <span className="text-sm">{session?.user?.name || session?.user?.email || "ユーザー"}</span>
                </div>
                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-slate-300 border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 hover:text-red-400 hover:border-red-500 transition-colors text-xs sm:text-sm px-2 sm:px-3"
                >
                  <LogOutIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">ログアウト</span>
                  <span className="sm:hidden">ログアウト</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-3 sm:p-6 md:p-8">
          <div className="mb-8 sm:mb-16 pt-8 sm:pt-12 md:pt-16 flex flex-col items-center text-center relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 px-2">
              AI Autopilot ダッシュボード
            </h2>
            <p className="text-slate-400 mt-3 sm:mt-4 text-sm sm:text-lg max-w-2xl mx-auto px-2">
              キーワードと指示を設定するだけで、AIがコンテンツ制作から投稿までを自動化します。
            </p>
          </div>
          <Tabs defaultValue="settings" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-[#334155] p-1 rounded-lg gap-1">
              <TabsTrigger
                value="settings"
                className="flex items-center gap-1 sm:gap-2 bg-[#334155] text-white font-semibold transition-all duration-300 px-2 sm:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-yellow-400 data-[state=active]:text-[#333] data-[state=inactive]:text-white"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">設定</span>
                <span className="sm:hidden">設定</span>
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="flex items-center gap-1 sm:gap-2 bg-[#334155] text-white font-semibold transition-all duration-300 px-2 sm:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-yellow-400 data-[state=active]:text-[#333] data-[state=inactive]:text-white"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">スケジュール</span>
                <span className="sm:hidden">スケジュール</span>
              </TabsTrigger>
              <TabsTrigger
                value="instagram"
                className="flex items-center gap-1 sm:gap-2 bg-[#334155] text-white font-semibold transition-all duration-300 px-2 sm:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-yellow-400 data-[state=active]:text-[#333] data-[state=inactive]:text-white"
              >
                <Instagram className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Instagram連携</span>
                <span className="sm:hidden">連携</span>
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                className="flex items-center gap-1 sm:gap-2 bg-[#334155] text-white font-semibold transition-all duration-300 px-2 sm:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-yellow-400 data-[state=active]:text-[#333] data-[state=inactive]:text-white"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">生成投稿</span>
                <span className="sm:hidden">投稿</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <KeywordManager
                  initialKeywords={settings.keywords}
                  onKeywordsChange={(keywords) => saveSettings({ keywords })}
                />
                <ContentInstructions
                  initialInstructions={settings.content}
                  onInstructionsChange={(content) => saveSettings({ content })}
                />
              </div>
              <DesignInstructions
                initialInstructions={settings.design}
                onInstructionsChange={(design) => saveSettings({ design })}
              />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <PostingSchedule
                initialSchedule={settings.schedule}
                onScheduleChange={(schedule) => saveSettings({ schedule })}
              />
            </TabsContent>

            <TabsContent value="instagram" className="space-y-6">
              <InstagramConnect />
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              <GeneratedPosts />
            </TabsContent>
          </Tabs>
        </div>
        <Toaster />
      </div>
    </div>
  );
}
