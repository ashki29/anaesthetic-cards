import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { NoticeWithAuthor } from '../lib/types'
import NoticeComposer from './NoticeComposer'
import ImageLightbox from './ImageLightbox'

interface NoticeCardProps {
  notice: NoticeWithAuthor
  currentUserId?: string
  pinnedCount: number
  onUpdate: () => void
  onDelete: () => void
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export default function NoticeCard({
  notice,
  currentUserId,
  pinnedCount,
  onUpdate,
  onDelete,
}: NoticeCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const isAuthor = currentUserId === notice.author_id
  const canPin = notice.is_pinned || pinnedCount < 3
  const images = notice.images ?? []

  const handlePin = async () => {
    if (notice.is_pinned) {
      // Unpin
      setActionLoading(true)
      const { error } = await supabase
        .from('notices')
        .update({ is_pinned: false })
        .eq('id', notice.id)
      setActionLoading(false)
      if (error) {
        alert(error.message)
        return
      }
      onUpdate()
    } else {
      // Check pin limit
      if (pinnedCount >= 3) {
        alert('Maximum 3 pinned notices. Unpin one first.')
        return
      }
      setActionLoading(true)
      const { error } = await supabase
        .from('notices')
        .update({ is_pinned: true })
        .eq('id', notice.id)
      setActionLoading(false)
      if (error) {
        alert(error.message)
        return
      }
      onUpdate()
    }
    setShowMenu(false)
  }

  const handleArchive = async () => {
    setActionLoading(true)
    const { error } = await supabase
      .from('notices')
      .update({ is_archived: !notice.is_archived, is_pinned: false })
      .eq('id', notice.id)
    setActionLoading(false)
    if (error) {
      alert(error.message)
      return
    }
    setShowMenu(false)
    onUpdate()
  }

  const handleDelete = async () => {
    setDeleting(true)
    // Delete images from storage
    if (images.length > 0) {
      const paths = images.map((url) => {
        const match = url.match(/notice-images\/(.+)$/)
        return match ? match[1] : null
      }).filter(Boolean) as string[]

      if (paths.length > 0) {
        await supabase.storage.from('notice-images').remove(paths)
      }
    }
    const { error } = await supabase.from('notices').delete().eq('id', notice.id)
    setDeleting(false)
    setConfirmDelete(false)
    if (error) {
      alert(error.message)
      return
    }
    onDelete()
  }

  if (editing) {
    return (
      <NoticeComposer
        editingNotice={notice}
        onNoticeCreated={() => {
          setEditing(false)
          onUpdate()
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div
      className={`card relative ${notice.is_archived ? 'opacity-60' : ''} ${
        notice.is_pinned ? 'border-blue-300 bg-blue-50/50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {notice.is_pinned && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
              </svg>
              Pinned
            </span>
          )}
          {notice.is_archived && (
            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              Archived
            </span>
          )}
        </div>

        {isAuthor && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-slate-100 rounded"
              disabled={actionLoading}
            >
              <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                  <button
                    onClick={() => {
                      setEditing(true)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handlePin}
                    disabled={!canPin && !notice.is_pinned}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    {notice.is_pinned ? 'Unpin' : 'Pin to top'}
                  </button>
                  <button
                    onClick={handleArchive}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    {notice.is_archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(true)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Author & time */}
      <div className="text-sm text-slate-500 mb-2">
        <span className="font-medium text-slate-700">{notice.author.display_name}</span>
        {' · '}
        {formatRelativeTime(notice.created_at)}
        {notice.updated_at !== notice.created_at && ' (edited)'}
      </div>

      {/* Content */}
      <div className="whitespace-pre-wrap text-slate-800 mb-3">{notice.content}</div>

      {/* Images */}
      {images.length > 0 && (
        <div
          className={`grid gap-2 ${
            images.length === 1
              ? 'grid-cols-1'
              : images.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-3'
          }`}
        >
          {images.map((url, index) => (
            <button
              key={url}
              onClick={() => setLightboxIndex(index)}
              className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete notice?</h3>
            <p className="text-slate-600 mb-4">
              This will permanently delete this notice and any attached images.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
