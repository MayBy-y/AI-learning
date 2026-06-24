import { useLocation } from "react-router-dom";
import "./review.css";
import { useNavigate } from "react-router-dom";

export function Report() {
    const navigate = useNavigate();
    const { state } = useLocation();

    const {
        avg,
        nextReviewAt,
        details
    } = state;
    function getLevel(score: number) {

        if (score >= 90)
            return "🌟 已掌握"

        if (score >= 75)
            return "👍 良好"

        if (score >= 60)
            return "📚 继续巩固"

        return "🔥 重点复习"
    }
    return (
        <div className="report-page">

            <div className="report-header">

                <h1>🎉 复习完成</h1>

                <div className="score-circle">
                    {avg}
                </div>
                <h2>{getLevel(avg)}</h2>
                <p>
                    下次复习：
                    {new Date(
                        nextReviewAt
                    ).toLocaleDateString()}
                </p>

            </div>

            <div className="report-list">

                {
                    details.map(
                        (
                            item: any,
                            index: number
                        ) => (
                            <div
                                key={index}
                                className="report-card"
                            >
                                <h3>
                                    {item.question}
                                </h3>

                                <div className="question-score">
                                    得分：
                                    {item.score}
                                </div>

                                <p>
                                    {item.feedback}
                                </p>
                            </div>
                        )
                    )
                }

            </div>
            <button onClick={() => navigate('/review')}>继续复习</button>
        </div>
    );
}