"use client";

import type React from "react";

import { useState, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  PilcrowIcon,
  SaveIcon,
  LightbulbIcon,
  CheckIcon,
  MessageSquareIcon,
  SparklesIcon,
  Loader2Icon,
  FileTextIcon,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ContentInstructionsProps {
  initialInstructions?: string;
  onInstructionsChange?: (instructions: string) => void;
}

export default function ContentInstructions({
  initialInstructions = "",
  onInstructionsChange,
}: ContentInstructionsProps) {
  const [instructions, setInstructions] = useState<string>(initialInstructions);
  const [isSaved, setIsSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
  const { toast } = useToast();

  // 初期データを設定
  useEffect(() => {
    setInstructions(initialInstructions);
  }, [initialInstructions]);

  const handleSave = useCallback(() => {
    if (onInstructionsChange) {
      onInstructionsChange(instructions);
    }

    setIsSaved(true);
    toast({
      title: "保存完了",
      description: "キャプション構成指示を正常に保存しました。",
      variant: "default",
    });

    // 2秒後に「保存完了」状態をリセット
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  }, [instructions, onInstructionsChange, toast]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInstructions(event.target.value);
    // 入力時に「保存完了」状態をリセット
    if (isSaved) {
      setIsSaved(false);
    }
  };

  // 自動保存機能
  useEffect(() => {
    if (instructions !== initialInstructions && instructions.trim()) {
      const timeoutId = setTimeout(() => {
        if (onInstructionsChange) {
          onInstructionsChange(instructions);
        }
      }, 2000); // 2秒後に自動保存

      return () => clearTimeout(timeoutId);
    }
  }, [instructions, initialInstructions, onInstructionsChange]);

  const exampleInstructions = [
    "結論を最初に述べ、その理由を3つの箇条書きで説明。最後に行動を促す一文を入れる。",
    "読者の悩みに共感する文章から始め、解決策を提示。専門用語は使わず、フレンドリーな口調で。",
    "ストーリーテリング形式で。冒頭で読者の興味を引き、中盤で具体的なエピソードを語り、最後に学びを共有する。",
    "ユーモアを交え、絵文字を多めに使用。各文は短く、テンポの良い文章にする。",
  ];

  const getRandomExample = () => {
    const randomIndex = Math.floor(Math.random() * exampleInstructions.length);
    setInstructions(exampleInstructions[randomIndex]);
    toast({
      title: "ヒントを適用しました",
      description: "構成指示の例を入力しました。",
      variant: "default",
    });
  };

  const getButtonText = () => {
    if (isSaved) return "保存完了";
    return "指示を保存";
  };

  const getButtonIcon = () => {
    if (isSaved) return <CheckIcon className="mr-2 h-5 w-5" />;
    return <SaveIcon className="mr-2 h-5 w-5" />;
  };

  const isButtonDisabled = initialInstructions === instructions && !isSaved;

  // AIキャプション生成
  const generateCaption = async () => {
    if (!instructions.trim()) {
      toast({
        title: "キャプション指示が必要です",
        description: "キャプション生成する指示を先に入力してください。",
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
          type: "caption",
          keywords: ["content", "caption"], // キャプション用のキーワード
          content: instructions,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedCaption(result.data);
        toast({
          title: "キャプション生成完了",
          description: "指示に基づいてキャプションを生成しました。",
        });
        console.log("生成されたキャプション:", result.data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "キャプション生成に失敗しました");
      }
    } catch (error) {
      console.error("キャプション生成エラー:", error);
      toast({
        title: "キャプション生成エラー",
        description: "キャプションの生成に失敗しました。",
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
          <MessageSquareIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
          <h3 className="text-xl sm:text-2xl font-bold text-slate-50">キャプション構成指示</h3>
        </div>
        <Button
          onClick={generateCaption}
          disabled={isGenerating || !instructions.trim()}
          className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-2 px-3 sm:px-4 text-xs sm:text-sm rounded-md transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:opacity-50 w-full sm:w-auto"
        >
          {isGenerating ? (
            <Loader2Icon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <FileTextIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          )}
          AIキャプション生成
        </Button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <textarea
          value={instructions}
          onChange={handleInputChange}
          placeholder="キャプションの構成や内容の指示を入力してください（例：簡潔で分かりやすく、ハッシュタグを3つ含める、親しみやすい口調で）"
          className="w-full h-24 sm:h-32 text-base sm:text-lg py-2 sm:py-3 px-3 sm:px-4 bg-slate-900/80 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 rounded-md resize-none transition-all duration-200"
        />

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={handleSave}
            disabled={isButtonDisabled}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-2 px-3 sm:px-4 text-xs sm:text-sm rounded-md transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:opacity-50"
          >
            {getButtonIcon()}
            {getButtonText()}
          </Button>
          <Button
            onClick={getRandomExample}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-yellow-400"
          >
            <LightbulbIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">ヒントを表示</span>
            <span className="sm:hidden">ヒント</span>
          </Button>
        </div>

        {generatedCaption && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-base sm:text-lg font-semibold text-slate-200">生成されたキャプション</h4>
            <div className="p-3 sm:p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
              <p className="text-slate-200 whitespace-pre-wrap text-sm sm:text-base">{generatedCaption}</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs sm:text-sm text-slate-400 space-y-1 sm:space-y-0">
        <p>• キャプションのトーン、長さ、構成などを具体的に指示してください</p>
        <p>• 例：「親しみやすい口調」「簡潔で分かりやすく」「ハッシュタグを5つ含める」</p>
        <p>• AIキャプション生成ボタンで、指示に基づいてキャプションを自動生成できます</p>
      </div>
    </div>
  );
}
