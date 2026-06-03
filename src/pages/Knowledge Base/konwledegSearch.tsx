import MarkdownRender from "./inputKonwledge";
import { useParams } from "react-router-dom"
import { useNavigate } from 'react-router-dom';

import axios from "axios"
interface Knowledge {

    id: number;

    title: string;

    content: string;

    tags: string;

    resource_url?: string | null

    resource_name?: string | null
    ai_tags?: string[]
    ai_title?: string
    category?: string
    key_points?: string[]
    summary: string
}
import {

    useEffect,

    useState

} from "react"
interface SearchBoxProps {
    value: string;
    onChange: (value: string) => void;
}


export function SearchBox({
    value,
    onChange
}: SearchBoxProps) {

    return (

        <div className="searchBox">

            <span className="searchIcon">
                🔍
            </span>

            <input
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                placeholder="搜索知识、标签..."
                className="searchInput"
            />

            {
                value && (

                    <button
                        className="clearBtn"
                        onClick={() =>
                            onChange("")
                        }
                    >
                        ✕
                    </button>

                )
            }

        </div>

    );

}

export function SmallBox() {
    const navigate = useNavigate()

    const { id } = useParams()

    const [detail, setDetail] = useState<Knowledge | null>(null)
    async function getDetail() {

        const res =

            await axios.get(

                `http://localhost:3000/api/knowledge/${id}`

            )
        console.log(res.data);

        setDetail(

            res.data

        )

    }

    useEffect(() => {

        getDetail()

    }, [id])

    if (!detail) {

        return <div>

            加载中...

        </div>

    }

    return (

        <div className="detailPage">

            <button
                className="backBtn"
                onClick={() => navigate(-1)}
            >

                ← 返回

            </button>

            <div className="detailHeader">

                <h1 className="detailTitle">

                    {detail.title}

                </h1>

                <span className="detailTag">

                    #{detail.tags}

                </span>

            </div>

            <div className="detailCard">

                <MarkdownRender
                    content={detail.content}
                />
                {detail.ai_title && (
                    <div className="aiPanel">

                        <h3>🧠 AI 总结</h3>

                        <p>{detail.summary}</p>

                        <h4>📌 关键点</h4>
                        <ul>
                            {detail.key_points?.map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>

                        <h4>🏷 标签</h4>
                        <div className="tagList">
                            {detail.ai_tags?.map((tag: string) => (
                                <span key={tag}>#{tag} </span>
                            ))}
                        </div>

                        <h4>📚 推荐标题</h4>
                        <p className="titleCard">{detail.title}</p>

                    </div>
                )}
                {

                    detail.resource_url && (

                        <div className="resourceArea">

                            <div className="resourceTitle">

                                学习资料

                            </div>

                            <a

                                href={`http://localhost:3000${detail.resource_url}`}

                                target="_blank"

                                className="resourceLink"

                            >

                                📎

                                {detail.resource_name}

                            </a>

                        </div>

                    )

                }

            </div>

        </div>

    )
}