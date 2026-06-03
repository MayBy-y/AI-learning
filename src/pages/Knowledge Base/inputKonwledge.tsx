// MarkdownRender.tsx
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import './konwledge.css'
interface Props {
    content: string
}

export default function MarkdownRender({ content }: Props) {

    return (

        <div className="card-contents">

            <ReactMarkdown
                components={{
                    code({ children, className }) {

                        const match = /language-(\w+)/.exec(className || "")

                        if (match) {

                            return (

                                <SyntaxHighlighter
                                    style={oneLight}
                                    language={match[1]}
                                    PreTag="div"
                                >
                                    {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>

                            )

                        }

                        return <code>{children}</code>

                    }
                }}
            >

                {content}

            </ReactMarkdown>

        </div>

    )

}