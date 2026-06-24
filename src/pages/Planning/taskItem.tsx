import { useSortable } from "@dnd-kit/sortable";
import { useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
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
    pauseCount?: number
    foucsCount?: number,
    lastActiveTime?: number
}

function formatSecondsToMinutes(seconds: number): string {
    return `${(seconds / 60).toFixed(1)} 分钟`;
}
interface taskItem {
    item: oneItem,
    editingId: string | null,
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>,
    addTask: (id: string) => void,
    deleteTask: (id: string) => void,
    updateContent: (id: string, content: string) => void,
    startTask: (id: string) => void,
    setList: React.Dispatch<React.SetStateAction<oneItem[]>>,
    setRigth: (right: boolean) => void,
    list: oneItem[],
    setSuggestion: (item: suggestion) => void
}
interface SplitTask {
    content: string,
    estimatedMinutes: number
    difficulty: "easy" | "medium" | "hard"
}
interface suggestion {
    nextTaskId: string,
    content: string,
    reason: string,
    confidence: number
}
export function TaskItem({
    item,
    editingId,
    setEditingId,
    addTask,
    deleteTask,
    updateContent,
    startTask,
    setList,
    list,
    setSuggestion
}: taskItem) {
    //分解任务相关元素
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [splitData, setSplitData] = useState<SplitTask[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({
        id: item.id
    });
    console.log('item', item);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    //拆解任务
    async function splitStep() {
        setOpen(true);
        setLoading(true);
        setActiveId(item.id);
        const res = await axios.post('http://localhost:3000/api/ai/splitTask',
            { task: item.content }
        )
        console.log(res.data.data);

        setSplitData(res.data.data);
        setLoading(false);
    }
    //插入逻辑
    function insertSubTasks(parentId: string, tasks: SplitTask[]) {
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
    //确认插入
    function handleConfirm() {
        if (!activeId) return;

        insertSubTasks(activeId, splitData);

        setOpen(false);
        setSplitData([]);
        setActiveId(null);
    }
    async function chooseNext() {
        const res = await axios.post('http://localhost:3000/api/ai/nextStep',
            {
                allTasks: list,
                completedTask: item
            }
        )
        console.log(res.data.data);
        setSuggestion(res.data.data)

    }
    return (
        <div className="planList"
            ref={setNodeRef}
            style={style}
        >
            <div
                style={{ opacity: item.type === 'task' ? 1 : 0 }}
                className="drag-handle"
                {...attributes}
                {...listeners}
            >
                ⋮⋮
            </div>
            <div className="task-actions">
                <button onClick={() => addTask(item.id)}>+</button>
                <button onClick={() => deleteTask(item.id)}>🗑</button>
            </div>

            {item.type === 'title' ? (<h2>{item.content}</h2>) :
                (<></>)}
            {item.type === 'note' ? (<span className="samllSpan">{item.content}</span>) : (<></>)}
            {item.type === 'task' ? (<div className="everyBox">

                <input
                    type="checkbox"
                    checked={item.status === 'done'}
                    onChange={() => {

                        setList(prev =>
                            prev.map(i =>
                                i.id === item.id
                                    ? { ...i, status: i.status === "done" ? "todo" : "done" }
                                    : i
                            )
                        );
                        if (item.status !== 'done') { chooseNext() }
                    }}
                />

                {editingId === item.id ? (
                    <input
                        className="inputBox"
                        autoFocus
                        value={item.content}
                        onChange={(e) =>
                            updateContent(item.id, e.target.value)
                        }
                        onBlur={() => setEditingId(null)}
                    />
                ) : (
                    <div onClick={() => setEditingId(item.id)}>
                        {item.content}
                    </div>
                )}

                <button
                    disabled={item.status === "done"}
                    onClick={() => startTask(item.id)}>
                    ▶️
                </button>
                {item.duringTime && <span>{formatSecondsToMinutes(item.duringTime)}</span>}
                <button onClick={() => splitStep()}>拆解任务</button>
            </div>) : (<></>)}
            {open && (
                <div className="modal-mask">
                    <div className="modal">

                        <h3>任务拆解</h3>

                        {loading ? (
                            <p>AI 思考中...</p>
                        ) : (
                            splitData.map((task, index) => (
                                <div key={index} className="split-item">
                                    <div className="limited">  <input
                                        className="split-input"
                                        value={task.content}
                                        onChange={(e) => {
                                            const next = [...splitData];
                                            next[index].content = e.target.value;
                                            setSplitData(next);
                                        }}
                                    /></div>


                                    <span>{task.estimatedMinutes} min</span>
                                    <span>{task.difficulty}</span>

                                    <button
                                        onClick={() => {
                                            setSplitData(prev =>
                                                prev.filter((_, i) => i !== index)
                                            );
                                        }}
                                    >
                                        删除
                                    </button>
                                </div>
                            ))
                        )}

                        <div className="modal-actions">
                            <button onClick={() => setOpen(false)}>
                                取消
                            </button>

                            <button onClick={handleConfirm}>
                                确认插入
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
