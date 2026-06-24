import './review.css'
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import request from '../../utils/request';
interface ReviewItem {
    id: string;
    knowledge_name: string;
    difficulty?: number;
    review_count: number;
    mastery: number;
    next_review_time: string;
    last_review_time: string;
}

interface Props {
    items: ReviewItem[];
    onReview: (id: string) => void;
}
export function ReviewPart() {
    const navigate = useNavigate();
    const [knowledgeList, setknowledgeList] = useState<ReviewItem[]>([])
    async function getKnowledge() {
        const result = await request.get("/user/me")
        const userId = result.data.user.id
        const res = await request.get(`/knowledge/reviewList/${userId}`)
        console.log(res.data);
        setknowledgeList(res.data)
    }

    useEffect(() => {
        getKnowledge()
    }, [])
    return <>
        <button onClick={() => { navigate('/') }}>返回主页</button>
        <ReviewList
            items={knowledgeList}
            onReview={(id) =>
                navigate(`/practice/${id}`)
            }
        />
    </>
}


export default function ReviewList({
    items,
    onReview
}: Props) {
    function formatReviewTime(time: string | null) {
        if (!time) {
            return "还未开始"
        }

        const diff =
            Date.now() - new Date(time).getTime()

        const days = Math.floor(
            diff / (1000 * 60 * 60 * 24)
        )

        return `${days}天前`
    }
    function renderStars(mastery: number) {
        const count = Math.ceil(mastery / 20)

        return "⭐".repeat(count) + "☆".repeat(5 - count)
    }
    return (
        <div className="review-page">
            <div className="review-title">
                <h1>🌱 今日复习</h1>
                <p>慢慢积累，每天进步一点点</p>
            </div>

            <div className="review-grid">
                {items.map((item) => (
                    <div className="review-card" key={item.id}>
                        <div className="card-top">
                            <span className="book-icon">📖</span>
                            <h3>{item.knowledge_name}</h3>
                        </div>

                        <div className="mastery">
                            {renderStars(item.mastery)}
                        </div>

                        <p className="review-time">
                            上次复习：{formatReviewTime(item.last_review_time)}
                        </p>

                        <button
                            className="start-btn"
                            onClick={() => onReview(item.id)}
                        >
                            开始复习 ✨
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}