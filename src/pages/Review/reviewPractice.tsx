import { useParams } from "react-router-dom";
import request from "../../utils/request";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./review.css";

interface QuestionItem {
    type: "choice" | "fill" | "judge" | "qa"
    question: string;
    options?: string[]
    answer: string;
}

export function Practice() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<QuestionItem[]>([]);
    const [current, setCurrent] = useState(0);

    const [answers, setAnswers] = useState<Record<number, string>>({})

    async function getPractice() {
        const res = await request.post(`/review/program/${id}`);
        console.log(res.data.data);

        setQuestions(res.data.data);
    }

    useEffect(() => {
        getPractice();
    }, []);

    if (!questions.length) {
        return (
            <VisionLoading />
        );
    }
    async function getResult() {
        const res = await request.post('/review/answer', {
            questions,
            answers,
            knowledgeId: id
        })
        console.log(res.data);

        navigate("/report", {
            state: res.data.data
        })
    }
    const currentQuestion = questions[current];
    function renderQuestion(question: QuestionItem) {
        switch (question.type) {

            case "choice":
                return (
                    <div className="choice-list">
                        {question.options?.map((item, index) => {
                            const isActive = answers[current] === item;

                            return (
                                <div
                                    key={index}
                                    className={`choice-card ${isActive ? "active" : ""
                                        }`}
                                    onClick={() =>
                                        setAnswers({
                                            ...answers,
                                            [current]: item
                                        })
                                    }
                                >
                                    <div className="option-index">
                                        {String.fromCharCode(65 + index)}
                                    </div>

                                    <div className="option-text">
                                        {item}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );

            case "judge":
                return (
                    <div className="judge-list">

                        <button
                            className={
                                answers[current] === "true"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setAnswers({
                                    ...answers,
                                    [current]: "true"
                                })
                            }
                        >
                            正确
                        </button>

                        <button
                            className={
                                answers[current] === "false"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setAnswers({
                                    ...answers,
                                    [current]: "false"
                                })
                            }
                        >
                            错误
                        </button>

                    </div>
                )

            case "fill":
            case "qa":
                return (
                    <textarea
                        placeholder="请输入答案..."
                        value={
                            answers[current] || ""
                        }
                        onChange={(e) =>
                            setAnswers({
                                ...answers,
                                [current]:
                                    e.target.value
                            })
                        }
                    />
                )

            default:
                return null
        }
    }
    return (
        <>
            {/* <div className="question-nav">

                {
                    questions.map((_, index) => (
                        <button
                            key={index}
                            className={
                                current === index
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setCurrent(index)
                            }
                        >
                            {index + 1}
                        </button>
                    ))
                }

            </div> */}
            <div className="practice-page">

                <div className="practice-card">

                    <div className="progress">
                        第 {current + 1} / {questions.length} 题
                    </div>

                    <h2 className="question">
                        {currentQuestion.question}
                    </h2>

                    {renderQuestion(currentQuestion)}

                    <div className="btn-group">

                        <button
                            disabled={current === 0}
                            onClick={() =>
                                setCurrent(current - 1)
                            }
                        >
                            上一题
                        </button>

                        {
                            current === questions.length - 1
                                ? (
                                    <button
                                        onClick={() => {
                                            getResult()
                                        }}
                                    >
                                        提交
                                    </button>
                                )
                                : (
                                    <button
                                        onClick={() =>
                                            setCurrent(current + 1)
                                        }
                                    >
                                        下一题
                                    </button>
                                )
                        }

                    </div>

                </div>
            </div>
        </>

    );
}

function VisionLoading() {
    return (
        <div className="vision-overlay">

            <div className="vision-card">

                <div className="ai-icon">
                    ✨
                </div>

                <h2>
                    AI正在思考中
                </h2>

                <p>
                    正在分析知识点并生成复习题...
                </p>

                <div className="progress-bar">
                    <div className="progress-fill"></div>
                </div>

                <span>
                    请稍候
                </span>

            </div>

        </div>
    );
}