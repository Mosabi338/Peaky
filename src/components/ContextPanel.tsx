import { useState } from 'react'
import { useStore } from '../store'
import { Plus, X, FileText, Upload } from 'lucide-react'

export default function ContextPanel() {
  const contextDocs = useStore((s) => s.contextDocs)
  const addContextDoc = useStore((s) => s.addContextDoc)
  const removeContextDoc = useStore((s) => s.removeContextDoc)

  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')

  const handleAdd = () => {
    if (!name.trim() || !content.trim()) return
    addContextDoc({
      id: crypto.randomUUID(),
      name: name.trim(),
      content: content.trim(),
    })
    setName('')
    setContent('')
    setShowAdd(false)
  }

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    for (const file of Array.from(e.dataTransfer.files)) {
      if (
        file.type === 'text/plain' ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.txt')
      ) {
        const text = await file.text()
        addContextDoc({
          id: crypto.randomUUID(),
          name: file.name,
          content: text,
        })
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs text-white/40">
          {contextDocs.length} document
          {contextDocs.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-ghost-500 hover:text-ghost-400 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
      >
        {showAdd && (
          <div className="p-3 rounded-lg bg-white/5 border border-ghost-500/20 space-y-2">
            <input
              type="text"
              placeholder="Document name (e.g., My Resume)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-ghost-900 text-white text-xs rounded-md px-2 py-1.5 border border-white/10 outline-none focus:border-ghost-500 placeholder:text-white/20"
            />
            <textarea
              placeholder="Paste content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full bg-ghost-900 text-white text-xs rounded-md px-2 py-1.5 border border-white/10 outline-none focus:border-ghost-500 placeholder:text-white/20 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-3 py-1 rounded-md bg-ghost-500 text-white text-xs font-medium hover:bg-ghost-600 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-3 py-1 rounded-md bg-white/5 text-white/50 text-xs hover:text-white/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {contextDocs.length === 0 && !showAdd ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20 text-sm">
            <Upload size={24} className="mb-2 text-white/10" />
            <p>Add context documents</p>
            <p className="text-xs text-white/15 mt-1">
              Resume, job description, notes...
            </p>
            <p className="text-[10px] text-white/10 mt-2">
              Drop .txt/.md files here or click +
            </p>
          </div>
        ) : (
          contextDocs.map((doc) => (
            <div
              key={doc.id}
              className="group p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText size={12} className="text-ghost-500" />
                  <span className="text-xs text-white/70 font-medium">
                    {doc.name}
                  </span>
                </div>
                <button
                  onClick={() => removeContextDoc(doc.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
              <p className="text-[11px] text-white/30 mt-1 line-clamp-2">
                {doc.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}