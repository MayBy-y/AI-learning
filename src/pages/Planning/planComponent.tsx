import React, { useState, useEffect } from "react";
import { TaskItem } from "./taskItem";
import { SmallPlan } from "./smallPlan";
import { FocusTimerPro, InsLoadingPage } from "./planTime";
import request from "../../utils/request.js";
import "./Plan.css";
import axios from "axios";
import {
    DndContext,
    closestCenter
} from "@dnd-kit/core";

import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove
} from "@dnd-kit/sortable";

type BlockType = "title" | "task" | "note";

interface oneItem {
    id: string;
    type: BlockType;
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
    pauseCount?: number
    foucsCount?: number,
    lastActiveTime?: number
}
interface aiHelp {
    id: string,
    reason: string,
    message: string,
    actions: smallSpan[]
}
interface smallSpan {
    type: string,
    label: string
}
interface Plan {

    id: string

    goal: string

    progress: number

    total_tasks: number

    done_tasks: number
    studied_today: boolean
}
const AiPlan: React.FC = () => {
    const [goal, setGoal] = useState("");
    const [time, setTime] = useState("");
    const [result, setResult] = useState<oneItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDaily, setShowDaily] = useState(false);
    const [finalList, setFinal] = useState<oneItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [openTime, setOpenTime] = useState<boolean>(false)
    const [right, setRight] = useState<boolean>(false)
    const [aihelp, setAihelp] = useState<aiHelp | null>(null)
    const [planId, setPlanId] = useState<string | null>(null)
    const [dailyPlan, setDailyPlan] = useState(null)
    const [planList, setPlanList] = useState<Plan[]>([])
    //记录拖拽对象
    //生成计划
    const mockRequest = async () => {
        const user = await request.get("/user/me");
        console.log(user);
        const usersid = user.data.user.id
        const res = await axios.post("http://localhost:3000/api/ai/plan", {
            usersid,
            goal,
            time,
        });
        console.log(res.data.data);
        setPlanId(res.data.data.id)
        return res.data.data.clean;
    };

    const handleGenerate = async () => {
        if (!goal.trim()) {
            alert("请输入学习目标");
            return;
        }

        setLoading(true);
        setResult([]);

        try {
            const res = await mockRequest();

            if (typeof res === "string") {
                setResult(JSON.parse(res));
            } else {
                setResult(res);
            }
        } catch (err) {
            console.log(err);
            setResult([]);
        } finally {
            setLoading(false);
        }
    };
    //生成每日计划
    const goDaily = async () => {
        const user = await request.get("/user/me");
        console.log(user);
        const usersid = user.data.user.id
        const res = await axios.post(
            "http://localhost:3000/api/ai/dailyPlan",
            {
                userId: usersid,
                planId: planId,
                list: result,
                goal,
            }
        );
        setDailyPlan(res.data.dailyPlanId)
        setFinal(res.data.data);
        setShowDaily(true);
    };

    const activeTask = finalList.find((item) => item.id === activeId);
    //判断是否需要ai帮助
    function isHlep(task: oneItem) {
        if ((task.pauseCount || 0) >= 3) {
            return 'pauseOut'
        }
        if ((task.duringTime || 0) > (task.estimatedMinutes * 60 || 0)) {
            return 'timeOut'
        }
        return false
    }
    //调取历史计划
    async function loadPlans() {
        const user = await request.get("/user/me")
        const userId = user.data.user.id
        console.log(userId);

        const res =
            await axios.get(
                `http://localhost:3000/api/ai/getList/${userId}`
            )

        setPlanList(res.data.data)
    }
    //继续旧任务
    async function handleContinue(
        planId: string
    ) {
        setPlanId(planId)
        const list = await request.get(`/ai/continue/${planId}`)
        console.log(list.data);
        if (list.data.hasPlan === false) {
            const user = await request.get("/user/me");
            console.log(user);
            const usersid = user.data.user.id
            const res = await axios.post(
                "http://localhost:3000/api/ai/dailyPlan",
                {
                    userId: usersid,
                    planId: planId,
                    list: list.data.details,
                    goal: list.data.goal,
                }
            );

            setDailyPlan(res.data.dailyPlanId)
            setFinal(res.data.data);
            setShowDaily(true);
        } else {
            setDailyPlan(list.data.dailyPlan.id)
            console.log('aaa', list.data.tasks);
            setFinal(list.data.tasks);
            setShowDaily(true);

        }

    }
    useEffect(() => {

        loadPlans()

    }, [])
    return (
        <>
            <div className="big">
                <div className={`plan-container ${showDaily ? "hide" : ""}`}>

                    <div className="studyCenter">
                        <h2>我的计划</h2>
                        {
                            planList.map(plan => {

                                return (

                                    <div className="planCard" key={plan.id}>

                                        <div className="cardTop">

                                            <div className="progressRing">

                                                <svg width="90" height="90">

                                                    <circle
                                                        cx="45"
                                                        cy="45"
                                                        r="38"
                                                        className="ringBg"
                                                    />

                                                    <circle
                                                        cx="45"
                                                        cy="45"
                                                        r="38"
                                                        className="ringProgress"
                                                        style={{
                                                            strokeDashoffset:
                                                                239 -
                                                                (239 * plan.progress) / 100
                                                        }}
                                                    />

                                                </svg>

                                                <span>
                                                    {plan.progress}%
                                                </span>

                                            </div>

                                        </div>

                                        <h3 className="planTitle">
                                            {plan.goal}
                                        </h3>
                                        {
                                            plan.studied_today && (
                                                <div className="todayTag">
                                                    今日已学习
                                                </div>
                                            )
                                        }
                                        <div className="planMeta">

                                            <div className="metaItem">
                                                ✓ {plan.done_tasks}
                                                个已完成
                                            </div>

                                            <div className="metaItem">
                                                📚 {plan.total_tasks}
                                                个任务
                                            </div>

                                        </div>

                                        <button
                                            className="continueBtn"
                                            onClick={() =>
                                                handleContinue(plan.id)
                                            }
                                        >
                                            继续学习 →
                                        </button>

                                    </div>
                                )
                            })
                        }

                    </div>

                    <div className="newStart">
                        <h2 className="title">生成学习计划</h2>
                        <div className="form">
                            <input
                                className="input"
                                placeholder="请输入学习目标"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                            />

                            <input
                                className="input"
                                placeholder="学习时间"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />

                            <button className="button" onClick={handleGenerate}>
                                {loading ? "生成中..." : "生成学习计划"}
                            </button>
                        </div>
                        <div className="result">
                            {loading &&
                                <InsLoadingPage />
                            }

                            {!loading &&
                                result.map((item, index) => (
                                    <div key={item.id}>
                                        {item.type === "title" && <h3>{item.content}</h3>}

                                        {item.type === "task" && (
                                            <div className="over_or_not">
                                                <input
                                                    type="checkbox"
                                                    checked={item.status === 'done'}
                                                    onChange={() => {

                                                        setResult(prev =>
                                                            prev.map(i =>
                                                                i.id === item.id
                                                                    ? { ...i, status: i.status === "done" ? "todo" : "done" }
                                                                    : i
                                                            )
                                                        );
                                                    }}
                                                />
                                                <input
                                                    value={item.content}
                                                    onChange={(e) => {
                                                        const newList = [...result];
                                                        newList[index].content =
                                                            e.target.value;
                                                        setResult(newList);
                                                    }}
                                                    className="goalWrite"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                        <button onClick={goDaily}>开始今日任务</button>
                    </div>

                </div>

                <div className={`daily-wrapper ${showDaily ? "show" : ""} ${right ? "upRight" : ""} `}>
                    <DailyPlan
                        list={finalList}
                        setList={setFinal}
                        setRight={setRight}
                        onStart={(id) => {
                            if (activeId) {
                                alert("请先结束当前专注任务");
                                return;
                            }
                            setOpenTime(true)
                            setActiveId(id);
                        }}
                        aiHelp={aihelp}
                        setAihelp={setAihelp}
                    />


                </div>
                <div className={`smallPlan ${right ? "slip" : ""}`}>
                    <SmallPlan
                        isOpen={right}
                        list={finalList}
                        dailysId={dailyPlan}
                        planId={planId}
                    /></div>
            </div>

            {openTime && <FocusTimerPro
                taskTitle={activeTask?.content || "未选择任务"}
                onStop={async (seconds) => {
                    if (!activeId) return;

                    const currentTask = finalList.find(
                        item => item.id === activeId
                    );

                    if (!currentTask) return;

                    const updatedTask = {
                        ...currentTask,
                        duringTime:
                            (currentTask.duringTime || 0) + seconds,
                        status: "paused" as const,
                        endTime: Date.now(),
                        pauseCount: (currentTask.pauseCount || 0) + 1
                    };

                    setFinal(prev =>
                        prev.map(item =>
                            item.id === activeId
                                ? updatedTask
                                : item
                        )
                    );

                    // 这里用 updatedTask
                    if (isHlep(updatedTask)) {

                        const res = await axios.post(
                            'http://localhost:3000/api/ai/help',
                            {
                                task: updatedTask,
                                gaol: goal,
                                helpType: isHlep(updatedTask),
                                taskList: finalList
                            }
                        );

                        console.log('ai help', res.data.data);

                        setAihelp(res.data.data);
                    }

                    setActiveId(null);
                }}
                letOpen={setOpenTime}
                overStep={(seconds) => {
                    if (!activeId) return;

                    setFinal((prev) =>
                        prev.map((item) =>
                            item.id === activeId
                                ? {
                                    ...item,
                                    duringTime:
                                        (item.duringTime || 0) + seconds,
                                    status: "done",
                                    endTime: Date.now(),
                                }
                                : item
                        )
                    );

                    setActiveId(null);
                }}
            />}
        </>
    );
};

interface DailyPlanProps {
    list: oneItem[];
    setList: React.Dispatch<React.SetStateAction<oneItem[]>>;
    onStart: (id: string) => void;
    setRight: (right: boolean) => void,
    aiHelp: aiHelp | null,
    setAihelp: (item: aiHelp | null) => void
}
interface suggestion {
    nextTaskId: string,
    content: string,
    reason: string,
    confidence: number
}
function DailyPlan({ list, setList, onStart, setRight, aiHelp, setAihelp }: DailyPlanProps) {
    const [aiSuggestion, setSuggestion] = useState<suggestion | null>(null)
    console.log('list:', list);

    const {
        editingId,
        setEditingId,
        addTask,
        deleteTask,
        updateContent,
        startTask,
    } = useDailyPlan({ onStart, setList })
    //按钮执行函数
    async function handleAiAction(action: string) {
        if (!aiHelp) return
        const helpTask = list.find(item => item.id === aiHelp.id)
        switch (action) {
            case "split_task":
                console.log('chai fen');
                //拆分
                if (helpTask) {
                    const res = await axios.post('http://localhost:3000/api/ai/splitTask',
                        { task: helpTask.content }
                    )
                    console.log('chai fen: ', res.data.data);
                    insertSubTasks(aiHelp.id, res.data.data)

                }

                break;
            case 'easier_practice':
                console.log('chu ti ');
                if (aiHelp) {
                    const res = await axios.post('http://localhost:3000/api/ai/text',
                        {
                            task: helpTask
                        }
                    )
                    console.log('chuti', res.data.data);

                }
                break;
            case 'review_basic':
                console.log('fu xi');
                if (aiHelp) {
                    const res = await axios.post('http://localhost:3000/api/ai/review',
                        {
                            task: helpTask
                        }
                    )
                    console.log('fu xi ', res.data.data);

                }
                break;
            case 'explain_concept':
                console.log('jieshi');
                if (aiHelp) {
                    const res = await axios.post('http://localhost:3000/api/ai/explain',
                        {
                            task: helpTask
                        }
                    )
                    console.log('fu xi ', res.data.data);

                }
                break;
            case 'take_break':
                alert('休息十分钟吧')
                setAihelp(null)

                break;
            case 'skip_task':
                break;
        }
        setAihelp(null)
    }
    //插入逻辑
    function insertSubTasks(parentId: string, tasks: oneItem[]) {
        setList(prev => {
            const parentIndex = prev.findIndex(i => i.id === parentId);

            if (parentIndex === -1) return prev;

            const parent = prev[parentIndex];

            const subBlocks = tasks.map(task => ({
                id: crypto.randomUUID(),
                type: "note" as const,
                content: task.content,
                parentId,
                depth: parent.depth + 1,
                status: "todo" as const,
                estimatedMinutes: task.estimatedMinutes,
                difficulty: task.difficulty,
                canSplit: false
            }));

            const next = [...prev];

            next.splice(parentIndex + 1, 0, ...subBlocks);

            return next;
        });
    }
    function handleDragEnd(event: any) {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        setList((prev) => {
            const oldIndex = prev.findIndex(i => i.id === active.id);
            const newIndex = prev.findIndex(i => i.id === over.id);

            return arrayMove(prev, oldIndex, newIndex);
        });
    }

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={list.map(i => i.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="daily">
                    {list.map((item) => <TaskItem
                        key={item.id}
                        item={item}
                        setList={setList}
                        editingId={editingId}
                        setEditingId={setEditingId}
                        addTask={addTask}
                        deleteTask={deleteTask}
                        updateContent={updateContent}
                        startTask={startTask}
                        setRigth={setRight}
                        list={list}
                        setSuggestion={setSuggestion}
                    />)}
                </div>
                {aiHelp ? (
                    <div className="ai-help-box">

                        <h3>温馨小提示💖</h3>

                        <p>{aiHelp.message}</p>
                        <h3>要不要试试</h3>
                        <div className="buttonList"> {aiHelp.actions.map((action) => (
                            <button
                                key={action.type}
                                onClick={() => handleAiAction(action.type)}
                            >
                                {action.label}
                            </button>
                        ))}</div>


                    </div>
                ) : aiSuggestion ? (
                    <div className="ai-box">
                        <h3>✨ AI建议下一步</h3>

                        <p>{aiSuggestion.reason}</p>
                        <p>{aiSuggestion.content}</p>

                        <button
                            onClick={() => {
                                const task = list.find(
                                    t => t.id === aiSuggestion.nextTaskId
                                );

                                onStart(aiSuggestion.nextTaskId);

                                setSuggestion(null);

                                if (!task) return;
                            }}
                        >
                            ▶ 开始这个任务
                        </button>
                    </div>
                ) : null}
                <button
                    className="activeButton"
                    onClick={() => setRight(true)}>结束今天的学习</button>
            </SortableContext>
        </DndContext>
    );
}


//方法容器


interface oneProps {
    onStart: (id: string) => void,
    setList: React.Dispatch<React.SetStateAction<oneItem[]>>
}
function useDailyPlan({ onStart, setList }: oneProps) {

    const [editingId, setEditingId] = useState<string | null>(null);
    function addTask(id: string) {
        const newTask: oneItem = {
            id: crypto.randomUUID(),
            type: 'task',
            depth: 0,
            content: '输入自定义任务',
            status: 'todo'
        }
        setList(prev => {
            const index = prev.findIndex(task => task.id === id)
            if (index === -1) return prev;

            const newTasks = [...prev];

            newTasks.splice(index + 1, 0, newTask);

            return newTasks;
        })
        setEditingId(newTask.id)
    }
    function deleteTask(id: string) {
        setList(prev => prev.filter(task => task.id !== id));
    }
    const updateContent = (id: string, content: string) => {
        setList((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, content } : item
            )
        );
    };
    function startTask(id: string) {
        setList(prev =>
            prev.map(item => {
                if (item.id !== id) return item;

                if (item.status === "done") return item;

                return {
                    ...item,
                    status: "doing",
                    startTime: Date.now(),
                };
            })
        );

        onStart(id);
    }

    return {
        editingId,
        setEditingId,
        addTask,
        deleteTask,
        updateContent,
        startTask,

    };
}
export default AiPlan;