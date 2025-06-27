"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { TagIcon, PlusIcon, XIcon, SparklesIcon, Loader2Icon } from "lucide-react";

interface KeywordManagerProps {
  initialKeywords?: string[];
  onKeywordsChange?: (keywords: string[]) => void | Promise<void>;
}

export default function KeywordManager({ initialKeywords = [], onKeywordsChange }: KeywordManagerProps) {
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // initialKeywordsが変更されたときに内部状態を同期
  useEffect(() => {
    setKeywords(initialKeywords);
  }, [initialKeywords]);

  const addKeyword = useCallback(async () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      const updatedKeywords = [...keywords, newKeyword.trim()];
      if (onKeywordsChange) {
        await onKeywordsChange(updatedKeywords);
      } else {
        setKeywords(updatedKeywords);
      }
      setNewKeyword("");
    }
  }, [newKeyword, keywords, onKeywordsChange]);

  const removeKeyword = useCallback(
    async (keywordToRemove: string) => {
      const updatedKeywords = keywords.filter((keyword) => keyword !== keywordToRemove);
      if (onKeywordsChange) {
        await onKeywordsChange(updatedKeywords);
      } else {
        setKeywords(updatedKeywords);
      }
    },
    [keywords, onKeywordsChange]
  );

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      await addKeyword();
    }
  };

  // AI情報取得
  const generateInfo = async () => {
    if (keywords.length === 0) {
      toast({
        title: "キーワードが必要です",
        description: "情報取得するキーワードを先に設定してください。",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "info",
          keywords: keywords,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "情報取得完了",
          description: "キーワードに関連する情報を取得しました。",
        });
        console.log("取得した情報:", result.data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "情報取得に失敗しました");
      }
    } catch (error) {
      console.error("情報取得エラー:", error);
      toast({
        title: "情報取得エラー",
        description: "情報の取得に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <TagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
          <h3 className="text-xl sm:text-2xl font-bold text-slate-50">投稿キーワード設定</h3>
        </div>
        <Button
          onClick={generateInfo}
          disabled={isGenerating || keywords.length === 0}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-3 sm:px-4 text-xs sm:text-sm rounded-md transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:opacity-50 w-full sm:w-auto"
        >
          {isGenerating ? (
            <Loader2Icon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <SparklesIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          )}
          AI情報取得
        </Button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <input
            type="text"
            placeholder="キーワードを入力"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow text-base sm:text-lg py-2 sm:py-2.5 px-3 sm:px-4 bg-slate-900/80 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 rounded-md transition-all duration-200"
          />
          <Button
            onClick={async () => await addKeyword()}
            disabled={!newKeyword.trim()}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2 sm:py-2.5 px-4 sm:px-5 text-sm sm:text-base rounded-md transition-transform duration-200 hover:scale-105 disabled:scale-100 disabled:opacity-50"
          >
            <PlusIcon className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">追加</span>
            <span className="sm:hidden">追加</span>
          </Button>
        </div>

        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <div
                key={keyword}
                className="flex items-center gap-1 sm:gap-2 bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 rounded-md px-2 sm:px-3 py-1 sm:py-1.5"
              >
                <span className="font-medium text-xs sm:text-sm">{keyword}</span>
                <button
                  onClick={async () => await removeKeyword(keyword)}
                  className="text-yellow-400 hover:text-red-400 transition-colors"
                  aria-label={`${keyword}を削除`}
                >
                  <XIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs sm:text-sm text-slate-400 space-y-1 sm:space-y-0">
        <p>• キーワードは投稿のテーマや内容を決定します</p>
        <p>• 複数のキーワードを設定することで、より具体的な内容を生成できます</p>
        <p>• AI情報取得ボタンで、キーワードに関連する最新情報を自動取得できます</p>
      </div>
    </div>
  );
}
