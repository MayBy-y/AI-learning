import { useEffect, useState } from "react";
import "./time.css";

interface Props {
    taskTitle?: string;
    onStop?: (seconds: number) => void;
    letOpen: (open: boolean) => void;
    overStep: (numberId: number) => void
}

export function FocusTimerPro({
    taskTitle = "专注中任务",
    onStop,
    letOpen,
    overStep
}: Props) {
    const [seconds, setSeconds] = useState(0);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;

        if (running) {
            timer = setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 10);
        }

        return () => clearInterval(timer);
    }, [running]);

    const format = (s: number) => {
        const h = String(Math.floor(s / 3600)).padStart(2, "0");
        const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
        const sec = String(s % 60).padStart(2, "0");
        return `${h}:${m}:${sec}`;
    };

    const handleStop = () => {
        setRunning(false);
        onStop?.(seconds);
        letOpen(false)
    };
    const handleOver = () => {
        setRunning(false);
        overStep(seconds)
        letOpen(false)
    };
    return (
        <div className="focus-pro-card">
            <div className="focus-title">{taskTitle || 'aaaa'}</div>

            <div className={`focus-circle ${running ? "active" : ""}`}>
                <div className="focus-inner">
                    <div className="time">{format(seconds)}</div>
                    <div className="status">
                        {running ? "专注中..." : "已暂停"}
                    </div>
                </div>
            </div>

            <div className="actions">
                {!running ? (
                    <button onClick={() => setRunning(true)}>开始</button>
                ) : (
                    <button onClick={() => setRunning(false)}>暂停</button>
                )}

                <button className="stop" onClick={handleStop}>
                    结束
                </button>
                <button className="over" onClick={handleOver}>完成任务</button>
                <button
                    className="reset"
                    onClick={() => {
                        setRunning(false);
                        setSeconds(0);
                    }}
                >
                    重置
                </button>
            </div>
        </div>
    );
}
export function InsLoadingPage() {
    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
            {/* 背景模糊球 */}
            <div className="absolute w-72 h-72 bg-black/5 rounded-full blur-3xl top-[-60px] left-[-60px] animate-pulse" />
            <div className="absolute w-72 h-72 bg-black/5 rounded-full blur-3xl bottom-[-60px] right-[-60px] animate-pulse" />

            {/* 主卡片 */}
            <div className="relative z-10 flex flex-col items-center gap-6 px-10 py-12 rounded-[32px] bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-black/5">
                {/* 动态圆环 */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[3px] border-black/10" />

                    <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-black animate-spin" />

                    <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
                </div>

                {/* 文字区域 */}
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-[20px] font-medium tracking-wide text-black/90">
                        AI Learning
                    </h1>

                    <p className="text-sm text-black/45 tracking-[0.2em] uppercase">
                        Loading your focus...
                    </p>
                </div>

                {/* 动态进度条 */}
                <div className="w-52 h-[4px] bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-black rounded-full animate-[loading_1.8s_ease-in-out_infinite]" />
                </div>
            </div>

            <style>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(200%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
        </div>
    );
}
