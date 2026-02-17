import ReactMarkdown from 'react-markdown'

interface Props {
  content: string
}

export default function Markdown({ content }: Props) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-gray-900 mt-6 mb-3 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-gray-800 mt-5 mb-2 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm text-gray-700 leading-relaxed mb-3 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-5 mb-3 space-y-1.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-5 mb-3 space-y-1.5">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-gray-700 leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-600">{children}</em>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 border-primary-300 pl-4 my-3 text-sm text-gray-600 italic">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-')
          if (isBlock) {
            return (
              <code className="block bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-800 overflow-x-auto my-3">
                {children}
              </code>
            )
          }
          return (
            <code className="bg-gray-100 text-primary-700 px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          )
        },
        hr: () => <hr className="my-4 border-gray-200" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50 border-b border-gray-200">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
