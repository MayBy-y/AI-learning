import axios from "axios";
import { useState } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    Clock,
    Brain,
    AlertTriangle,
    Target,
    Flame,
    Loader2
} from "lucide-react";
import request from "../../utils/request.js";
import './smallPlan.css'
interface oneItem {
    id: string;
    type: "title" | "task" | "note";
    content: string;
    dailyId?: string
    //depth / parentId 模拟层级
    parentId?: string | null;
    depth: number;
    knowledgePoints?: string

    status?: "todo" | "doing" | "done" | "paused" | "skipped";
    startTime?: number;
    endTime?: number;
    duringTime?: number;
    estimatedMinutes?: number;
    difficulty?: "easy" | "medium" | "hard";
    canSplit?: boolean

}
interface getres {
    isOpen: boolean,
    list: oneItem[],
    dailysId: string | null,
    planId: string | null
}
interface result {
    summary: string

    strengths: string[]
    weaknesses: string[]
    tomorrowFocus: string[]

    totalStudyTime: number
    completionRate: number
    overtimeRate: number
    averageTaskTime: number

    learningState: string
    fatigueLevel: string
    focusLevel: string
}
export function SmallPlan({ list, dailysId, planId }: getres) {
    const [analysis, setAnalysis] = useState<result | null>(null)
    const [loading, setLoading] = useState(false);
    async function getResult() {

        try {

            setLoading(true);

            const user = await request.get("/user/me");

            const usersId = user.data.user.id;

            const res = await axios.post(
                "http://localhost:3000/api/ai/result",
                {
                    taskList: list,
                    dailyPlanId: dailysId,
                    planId,
                    usersId
                }
            );

            setAnalysis(res.data.data);

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }
    }
    const StatCard = ({
        icon: Icon,
        title,
        value,
        desc }: any) => (

        <motion.div

            whileHover={{
                y: -6,
                scale: 1.02
            }}

            transition={{
                duration: 0.2
            }}
            className="
relative
overflow-hidden

rounded-[28px]

bg-white/70
backdrop-blur-xl

border
border-white/40

shadow-lg

p-6
"
        >

            <Icon className="w-5 h-5 text-slate-500" />

            <div className="mt-5">

                <div className="text-sm text-slate-500">
                    {title}
                </div>

                <div className="text-3xl font-bold text-slate-900 mt-2">
                    {value}
                </div>

                <div className="text-sm text-slate-400 mt-2">
                    {desc}
                </div>

            </div>

        </motion.div>

    );




    const StateCard = ({
        icon: Icon,
        label,
        value
    }: any) => (

        <motion.div

            whileHover={{
                y: -5
            }}

            transition={{
                duration: 0.2
            }}

            className="
        bg-white
        border
        border-slate-200
        rounded-3xl
        p-6
        shadow-sm
        hover:shadow-lg
        "
        >

            <div className="flex items-center gap-4">

                <div
                    className="
w-12
h-12

rounded-2xl

bg-gradient-to-br
from-indigo-500
to-violet-500

text-white

flex
items-center
justify-center
"
                >
                    <Icon className="w-5 h-5 text-slate-700" />
                </div>

                <div>

                    <div className="text-sm text-slate-500">
                        {label}
                    </div>

                    <div className="font-semibold text-slate-900">
                        {value}
                    </div>

                </div>

            </div>

        </motion.div>

    );
    return (
        <>
            {
                !analysis &&

                <div className="w-full
h-screen

overflow-y-auto

flex
justify-center
items-center">

                    <motion.button

                        whileHover={{
                            scale: 1.05
                        }}

                        whileTap={{
                            scale: 0.97
                        }}

                        onClick={getResult}

                        className="
relative
overflow-hidden

h-14
px-10

rounded-2xl

bg-slate-900
text-white

font-medium

shadow-lg
"
                    >

                        <div className="buttonShine" />

                        {
                            loading
                                ?
                                <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                                :
                                <span className="relative z-10">
                                    生成学习报告
                                </span>
                        }

                    </motion.button>

                </div>
            }

            {
                analysis &&

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: .4 }}
                    className="
   w-full

max-w-[1000px]

h-[85vh]

mx-auto

rounded-[32px]

overflow-hidden
"
                >
                    <div
                        className="
        max-w-7xl
        mx-auto

        px-6
        lg:px-10

        h-[90vh]
        overflow-y-auto

        reportScroll
        py-6
    "
                    >

                        {/* hero */}

                        <div
                            className="
            relative
            overflow-hidden

            rounded-[36px]
            bg-[#fffdf9]
            bg-gradient-to-r
            from-indigo-600
            via-violet-600
            to-fuchsia-600

            p-10
            mb-8

            text-white
            shadow-2xl
        "
                        >

                            <div className="aiShine" />

                            <h1 className="text-5xl font-black">
                                学习分析报告
                            </h1>

                            <p className="mt-4 text-white/80 text-lg">
                                AI 根据今天的学习行为生成的专属反馈
                            </p>

                        </div>

                        {/* 数据卡 */}

                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

                            <StatCard
                                icon={TrendingUp}
                                title="完成率"
                                value={`${analysis.completionRate}%`}
                                desc="任务完成情况"
                            />

                            <StatCard
                                icon={Clock}
                                title="学习时长"
                                value={`${analysis.totalStudyTime}m`}
                                desc="累计学习时间"
                            />

                            <StatCard
                                icon={Brain}
                                title="平均任务时长"
                                value={`${analysis.averageTaskTime}m`}
                                desc="单任务耗时"
                            />

                            <StatCard
                                icon={AlertTriangle}
                                title="超时率"
                                value={`${analysis.overtimeRate}%`}
                                desc="计划偏差"
                            />

                        </div>

                        {/* AI总结 */}

                        <div
                            className="
            relative
            overflow-hidden

            rounded-[32px]

            bg-white/70
            backdrop-blur-xl

            border
            border-white/40

            shadow-xl

            p-8

            mb-8
        "
                        >

                            <div className="aiShine" />

                            <div className="flex items-center gap-4 mb-5">

                                <div
                                    className="
                    w-14
                    h-14

                    rounded-2xl

                    bg-indigo-600

                    flex
                    items-center
                    justify-center

                    text-white
                "
                                >
                                    <Brain />
                                </div>

                                <div>

                                    <h2 className="text-2xl font-bold">
                                        AI 学习洞察
                                    </h2>

                                    <p className="text-slate-500">
                                        基于今日任务执行情况分析
                                    </p>

                                </div>

                            </div>

                            <p className="text-slate-700 leading-8 text-lg">
                                {analysis.summary}
                            </p>

                        </div>

                        {/* 状态 */}

                        <div className="grid md:grid-cols-3 gap-5 mb-8">

                            <StateCard
                                icon={Flame}
                                label="学习状态"
                                value={analysis.learningState}
                            />

                            <StateCard
                                icon={AlertTriangle}
                                label="疲劳程度"
                                value={analysis.fatigueLevel}
                            />

                            <StateCard
                                icon={Target}
                                label="专注程度"
                                value={analysis.focusLevel}
                            />

                        </div>

                        {/* 优势问题 */}

                        <div className="grid xl:grid-cols-3 gap-6">

                            <div
                                className="
                bg-green-50
                border
                border-green-100
                rounded-[28px]
                p-6
                shadow-sm
            "
                            >

                                <h3 className="text-xl font-bold mb-5">
                                    🟢 优势
                                </h3>

                                <div className="space-y-3">

                                    {analysis.strengths?.map((item, i) => (

                                        <div
                                            key={i}
                                            className="
                            bg-white
                            rounded-2xl
                            p-4
                            shadow-sm
                        "
                                        >
                                            ✓ {item}
                                        </div>

                                    ))}

                                </div>

                            </div>

                            <div
                                className="
                bg-red-50
                border
                border-red-100
                rounded-[28px]
                p-6
                shadow-sm
            "
                            >

                                <h3 className="text-xl font-bold mb-5">
                                    🔴 问题
                                </h3>

                                <div className="space-y-3">

                                    {analysis.weaknesses?.map((item, i) => (

                                        <div
                                            key={i}
                                            className="
                            bg-white
                            rounded-2xl
                            p-4
                            shadow-sm
                        "
                                        >
                                            {item}
                                        </div>

                                    ))}

                                </div>

                            </div>

                            <div
                                className="
                bg-violet-50
                border
                border-violet-100
                rounded-[28px]
                p-6
                shadow-sm
            "
                            >

                                <h3 className="text-xl font-bold mb-5">
                                    🟣 明日重点
                                </h3>

                                <div className="space-y-3">

                                    {analysis.tomorrowFocus?.map((item, i) => (

                                        <div
                                            key={i}
                                            className="
                            bg-white
                            rounded-2xl
                            p-4
                            shadow-sm
                        "
                                        >
                                            {item}
                                        </div>

                                    ))}

                                </div>

                            </div>

                        </div>

                    </div>

                </motion.div>
            }
        </>
    )
}

