import { useEffect, useState } from "react";
import axios from "axios";
import { SearchBox } from "./konwledegSearch";
import "./konwledge.css";
import { useNavigate } from 'react-router-dom';
interface Knowledge {

    id: number;

    title: string;

    content: string;

    tags: string;

    resource_url: string | null

    resource_name: string | null


}

export default function KonwledgePage() {

    const [list, setList] = useState<Knowledge[]>([]);

    const [showModal, setShowModal] = useState(false);

    const [title, setTitle] = useState("");

    const [content, setContent] = useState("");

    const [tags, setTags] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    //搜索功能
    const [keyword, setKeyword] = useState("")
    const [searchText, setSearchText] = useState("")

    const [resourceUrl, setResourceUrl] = useState("")

    const [resourceName, setResourceName] = useState("")
    const navigate = useNavigate()
    //防抖处理
    useEffect(() => {

        const timer = setTimeout(() => {

            setKeyword(searchText)

        }, 300)

        return () => {

            clearTimeout(timer)

        }

    }, [searchText])
    //搜索函数

    const filterList = list.filter(item => {

        const search = keyword.toLowerCase()

        return (

            (item.title || "")
                .toLowerCase()
                .includes(search)

            ||

            (item.content || "")
                .toLowerCase()
                .includes(search)

            ||

            (item.tags || "")
                .toLowerCase()
                .includes(search)

        )

    })
    async function getKnowledge() {

        const res = await axios.get(
            "http://localhost:3000/api/knowledge/list"
        );

        setList(res.data);

    }
    function openEdit(item: Knowledge) {

        setEditingId(item.id)

        setTitle(item.title)

        setContent(item.content)

        setTags(item.tags)

        setShowModal(true)

    }
    function resetForm() {

        setShowModal(false)

        setEditingId(null)

        setTitle("")

        setContent("")

        setTags("")

        setResourceName("")

    }
    const deleteKnowledge = async (id: number) => {

        await axios.delete(
            `http://localhost:3000/api/knowledge/delete/${id}`
        );

        // 重新拉列表
        getKnowledge();

    };
    async function saveKnowledge() {

        if (
            !title.trim()
            ||
            !content.trim()
        ) return

        if (editingId) {

            await axios.put(

                `http://localhost:3000/api/knowledge/update/${editingId}`,

                {
                    title,
                    content,
                    tags,
                    resource_url:

                        resourceUrl,

                    resource_name:

                        resourceName
                }

            )

        } else {

            const res = await axios.post(

                "http://localhost:3000/api/knowledge/add",

                {
                    title,
                    content,
                    tags,
                    resource_url:

                        resourceUrl,

                    resource_name:

                        resourceName
                }

            )
            console.log(res);
            const id = res.data.id
            await axios.post(`http://localhost:3000/api/knowAi/summarize/${id}`)
        }

        resetForm()

        getKnowledge()

    }
    async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        const formData = new FormData()
        formData.append("file", file)
        try {
            const res = await axios.post(

                "http://localhost:3000/api/knowledge/upload",

                formData,

                {

                    headers: {

                        "Content-Type":

                            "multipart/form-data"

                    }

                }

            )
            console.log(res.data);

            setResourceUrl(

                res.data.fileUrl

            )

            setResourceName(

                res.data.fileName

            )
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {

        getKnowledge();

    }, []);

    return (

        <div className="page">
            <button onClick={() => { navigate(-1) }}>返回主页</button>
            <div className="header">

                <h1>
                    📚 我的知识库
                </h1>

                <button
                    className="addBtn"
                    onClick={() => {
                        setShowModal(true)
                        saveKnowledge()
                    }

                    }
                >
                    + 添加知识
                </button>

            </div>

            <div className="searchWrapper">

                <SearchBox
                    value={searchText}
                    onChange={setSearchText}
                />

            </div>
            <div className="contianer">
                <div className="knowledgeGrid">

                    {
                        filterList.map((item, index) => (

                            <div
                                key={item.id}
                                className="card animate-card"
                                onClick={() => {
                                    navigate(`/konwledgeDtail/${item.id}`)
                                }}
                                style={{
                                    animationDelay:
                                        `${index * 80}ms`
                                }}
                            >

                                <h3>
                                    {item.title}
                                </h3>


                                {
                                    item.resource_url && (

                                        <a

                                            className="resourceLink"

                                            href={

                                                `http://localhost:3000${item.resource_url}`

                                            }

                                            target="_blank"

                                            rel="noreferrer"

                                        >

                                            📎

                                            {item.resource_name}

                                        </a>

                                    )
                                }
                                <div
                                    className="bottom"
                                >

                                    <span
                                        className="tag"
                                    >
                                        {item.tags}
                                    </span>
                                    <button
                                        className="delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            openEdit(item)
                                        }

                                        }
                                    >
                                        编辑
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteKnowledge(item.id)
                                        }

                                        }
                                    >
                                        删除
                                    </button>

                                </div>

                            </div>

                        ))
                    }

                </div>
            </div>

            {showModal &&
                (<div className="mask"><div className="modal">
                    <h2>{
                        editingId

                            ? "编辑知识"

                            : "添加知识"

                    }</h2>
                    <input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <textarea
                        placeholder="支持 Markdown，例如 # 标题、- 列表"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <input placeholder="标签" value={tags} onChange={(e) => setTags(e.target.value)} />
                    <input

                        type="file"

                        onChange={uploadFile}

                    />
                    {

                        resourceName && (

                            <p>

                                📎

                                {resourceName}

                            </p>

                        )

                    }
                    <button onClick={saveKnowledge} > 保存 </button>
                </div>
                </div>)}
        </div>

    )

}