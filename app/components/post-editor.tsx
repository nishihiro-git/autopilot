"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { EditIcon, SaveIcon, XIcon, UploadIcon, ImageIcon, Loader2Icon } from "lucide-react";

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

interface PostEditorProps {
  post: Post;
  onClose: () => void;
  onUpdate: (updatedPost: Post) => void;
}

export default function PostEditor({ post, onClose, onUpdate }: PostEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editedPost, setEditedPost] = useState<Post>(post);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/generated-posts/${post.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          info: editedPost.info,
          caption: editedPost.caption,
          imageUrl: editedPost.imageUrl,
          imageAlt: editedPost.imageAlt,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "保存完了",
          description: "投稿を更新しました。",
        });
        onUpdate(result.post);
        setIsEditing(false);
      } else {
        throw new Error(result.error || "保存に失敗しました");
      }
    } catch (error) {
      console.error("保存エラー:", error);
      toast({
        title: "保存エラー",
        description: "投稿の更新に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setEditedPost((prev) => ({
          ...prev,
          imageUrl: result.url,
          imageAlt: file.name,
          imageSource: "custom",
          imagePhotographer: "ユーザーアップロード",
        }));
        toast({
          title: "アップロード完了",
          description: "画像をアップロードしました。",
        });
      } else {
        throw new Error(result.error || "アップロードに失敗しました");
      }
    } catch (error) {
      console.error("アップロードエラー:", error);
      toast({
        title: "アップロードエラー",
        description: "画像のアップロードに失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setEditedPost(post);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-50">投稿編集 #{post.id}</h2>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SaveIcon className="mr-2 h-4 w-4" />
                    )}
                    保存
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="border-slate-600 text-slate-300">
                    キャンセル
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <EditIcon className="mr-2 h-4 w-4" />
                  編集
                </Button>
              )}
              <Button onClick={onClose} variant="outline" size="sm" className="border-slate-600 text-slate-300">
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* キーワード */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">キーワード</h3>
            <div className="flex flex-wrap gap-2">
              {post.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 rounded-md px-2 py-1 text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* 画像 */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">投稿画像</h3>
            <div className="flex items-start gap-4">
              <div className="aspect-square w-32 overflow-hidden rounded-lg border border-slate-700">
                <img src={editedPost.imageUrl} alt={editedPost.imageAlt} className="w-full h-full object-cover" />
              </div>
              {isEditing && (
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center gap-2 bg-slate-800 border border-slate-600 text-slate-300 px-4 py-2 rounded-md cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    {isUploading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <UploadIcon className="h-4 w-4" />
                    )}
                    画像をアップロード
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    出典: {editedPost.imageSource}{" "}
                    {editedPost.imagePhotographer && `by ${editedPost.imagePhotographer}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 生成された情報 */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">生成された情報</h3>
            {isEditing ? (
              <Textarea
                value={editedPost.info}
                onChange={(e) => setEditedPost((prev) => ({ ...prev, info: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-slate-300 min-h-[100px]"
                placeholder="情報を入力してください"
              />
            ) : (
              <div className="bg-slate-800/50 p-3 rounded-md">
                <p className="text-slate-400 text-sm whitespace-pre-wrap">{post.info}</p>
              </div>
            )}
          </div>

          {/* キャプション */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">キャプション</h3>
            {isEditing ? (
              <Textarea
                value={editedPost.caption}
                onChange={(e) => setEditedPost((prev) => ({ ...prev, caption: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-slate-300 min-h-[120px]"
                placeholder="キャプションを入力してください"
              />
            ) : (
              <div className="bg-slate-800/50 p-3 rounded-md">
                <p className="text-slate-400 text-sm whitespace-pre-wrap">{post.caption}</p>
              </div>
            )}
          </div>

          {/* 投稿予定時刻 */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">投稿予定時刻</h3>
            <p className="text-slate-400 text-sm">{new Date(post.targetTime).toLocaleString("ja-JP")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
