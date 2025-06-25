"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CalendarClockIcon, SaveIcon, Trash2Icon, PlusIcon, CheckIcon, Loader2Icon, ClockIcon } from "lucide-react";

type Day = "月" | "火" | "水" | "木" | "金" | "土" | "日";
const ALL_DAYS: Day[] = ["月", "火", "水", "木", "金", "土", "日"];

interface Schedule {
  [day: string]: string[];
}

interface PostingScheduleProps {
  initialSchedule?: Schedule;
  onScheduleChange?: (schedule: Schedule) => void;
}

export default function PostingSchedule({ initialSchedule = {}, onScheduleChange }: PostingScheduleProps) {
  const [schedule, setSchedule] = useState<Schedule>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  // 初期値の設定
  useEffect(() => {
    console.log("PostingSchedule: 初期化", { initialSchedule });
    if (initialSchedule && Object.keys(initialSchedule).length > 0) {
      setSchedule(initialSchedule);
    }
  }, [initialSchedule]);

  // 曜日に時間を追加
  const addTimeToDay = (day: Day, time: string) => {
    if (!time) return;

    setSchedule((prev) => {
      const newSchedule = { ...prev };
      if (!newSchedule[day]) {
        newSchedule[day] = [];
      }
      if (!newSchedule[day].includes(time)) {
        newSchedule[day] = [...newSchedule[day], time].sort();
      }
      return newSchedule;
    });

    setIsSaved(false);
  };

  // 曜日から時間を削除
  const removeTimeFromDay = (day: Day, time: string) => {
    setSchedule((prev) => {
      const newSchedule = { ...prev };
      if (newSchedule[day]) {
        newSchedule[day] = newSchedule[day].filter((t) => t !== time);
        if (newSchedule[day].length === 0) {
          delete newSchedule[day];
        }
      }
      return newSchedule;
    });

    setIsSaved(false);
  };

  // 曜日全体を削除
  const removeDay = (day: Day) => {
    setSchedule((prev) => {
      const newSchedule = { ...prev };
      delete newSchedule[day];
      return newSchedule;
    });

    setIsSaved(false);
  };

  // 保存処理
  const handleSave = async () => {
    setIsSaving(true);
    setIsSaved(false);

    try {
      console.log("PostingSchedule: 保存するスケジュール:", schedule);
      console.log("PostingSchedule: onScheduleChange関数の存在:", !!onScheduleChange);

      if (onScheduleChange) {
        console.log("PostingSchedule: onScheduleChangeを呼び出し");
        onScheduleChange(schedule);
      } else {
        console.log("PostingSchedule: onScheduleChangeが未定義");
      }

      setIsSaving(false);
      setIsSaved(true);

      toast({
        title: "保存完了",
        description: "投稿スケジュールを正常に保存しました。",
        variant: "default",
      });

      // 2秒後に「保存完了」状態をリセット
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    } catch (error) {
      setIsSaving(false);
      toast({
        title: "保存エラー",
        description: "投稿スケジュールの保存に失敗しました。再度お試しください。",
        variant: "destructive",
      });
    }
  };

  const getButtonText = () => {
    if (isSaving) return "保存中...";
    if (isSaved) return "保存完了";
    return "スケジュールを保存";
  };

  const getButtonIcon = () => {
    if (isSaving) return <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />;
    if (isSaved) return <CheckIcon className="mr-2 h-5 w-5" />;
    return <SaveIcon className="mr-2 h-5 w-5" />;
  };

  return (
    <div className="space-y-8 p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50">
      <div className="flex items-center gap-3">
        <CalendarClockIcon className="h-6 w-6 text-yellow-400" />
        <h3 className="text-2xl font-bold text-slate-50">投稿スケジュール設定</h3>
      </div>

      {/* 曜日別スケジュール設定 */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-slate-200">曜日別投稿時間設定</h4>

        {ALL_DAYS.map((day) => (
          <DayScheduleCard
            key={day}
            day={day}
            times={schedule[day] || []}
            onAddTime={(time) => addTimeToDay(day, time)}
            onRemoveTime={(time) => removeTimeFromDay(day, time)}
            onRemoveDay={() => removeDay(day)}
          />
        ))}
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={`font-bold py-2.5 px-5 text-base rounded-md transition-all duration-200 ${
            isSaving
              ? "bg-slate-600 text-slate-400 cursor-not-allowed"
              : isSaved
              ? "bg-green-500 hover:bg-green-600 text-white hover:scale-105"
              : "bg-yellow-400 hover:bg-yellow-500 text-slate-900 hover:scale-105"
          } disabled:scale-100`}
        >
          {getButtonIcon()}
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
}

// 曜日別スケジュールカードコンポーネント
interface DayScheduleCardProps {
  day: Day;
  times: string[];
  onAddTime: (time: string) => void;
  onRemoveTime: (time: string) => void;
  onRemoveDay: () => void;
}

function DayScheduleCard({ day, times, onAddTime, onRemoveTime, onRemoveDay }: DayScheduleCardProps) {
  const [newTime, setNewTime] = useState<string>("09:00");

  const handleAddTime = () => {
    if (newTime) {
      onAddTime(newTime);
      setNewTime("09:00");
    }
  };

  return (
    <div className="p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-lg font-semibold text-yellow-400">{day}曜日</h5>
        {times.length > 0 && (
          <Button
            onClick={onRemoveDay}
            variant="outline"
            size="sm"
            className="text-red-400 border-red-500/50 hover:bg-red-500/20"
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 時間追加 */}
      <div className="flex items-center gap-3 mb-3">
        <input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          className="flex-grow text-base py-2 px-3 bg-slate-800 border-slate-600 text-slate-50 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
        />
        <Button
          onClick={handleAddTime}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 text-sm rounded-md transition-transform duration-200 hover:scale-105"
        >
          <PlusIcon className="mr-1 h-4 w-4" /> 追加
        </Button>
      </div>

      {/* 設定済み時間一覧 */}
      {times.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {times.map((time) => (
            <div
              key={time}
              className="flex items-center gap-2 bg-slate-700/50 text-slate-200 border border-slate-600 rounded-md px-3 py-1.5"
            >
              <ClockIcon className="h-4 w-4 text-yellow-400" />
              <span className="font-mono text-sm">{time}</span>
              <button
                onClick={() => onRemoveTime(time)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                aria-label={`${time}を削除`}
              >
                <Trash2Icon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm italic">投稿時間が設定されていません</p>
      )}
    </div>
  );
}
