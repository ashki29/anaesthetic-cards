import { useState, useRef } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Notice } from '../lib/types'

interface NoticeComposerProps {
  editingNotice?: Notice
  onNoticeCreated: () => void
  onCancel?: () => void
}

interface ImagePreview {
  file?: File
  url: string
  isExisting: boolean
}

export default function NoticeComposer({
  editingNotice,
  onNoticeCreated,
  onCancel,
}: NoticeComposerProps) {
  const { profile, team } = useAuth()
  const [content, setContent] = useState(editingNotice?.content || '')
  const [images, setImages] = useState<ImagePreview[]>(
    () => editingNotice?.images?.map((url) => ({ url, isExisting: true })) ?? []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!editingNotice

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews: ImagePreview[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        newPreviews.push({
          file,
          url: URL.createObjectURL(file),
          isExisting: false,
        })
      }
    }

    setImages((prev) => [...prev, ...newPreviews])
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index]
      // Revoke object URL if it's a local preview
      if (!removed.isExisting) {
        URL.revokeObjectURL(removed.url)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadImages = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (const img of images) {
      if (img.isExisting) {
        // Keep existing URLs
        uploadedUrls.push(img.url)
      } else if (img.file) {
        // Upload new file
        const ext = img.file.name.split('.').pop() || 'jpg'
        const path = `${userId}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('notice-images')
          .upload(path, img.file)

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('notice-images')
          .getPublicUrl(path)

        uploadedUrls.push(urlData.publicUrl)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('Please enter some content')
      return
    }

    if (!team || !profile) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Upload images
      const imageUrls = await uploadImages(profile.id)

      if (isEditing) {
        // Find images that were removed and delete from storage
        const originalImages = editingNotice?.images ?? []
        const removedUrls = originalImages.filter((url) => !imageUrls.includes(url))
        if (removedUrls.length > 0) {
          const paths = removedUrls
            .map((url) => {
              const match = url.match(/notice-images\/(.+)$/)
              return match ? match[1] : null
            })
            .filter(Boolean) as string[]

          if (paths.length > 0) {
            await supabase.storage.from('notice-images').remove(paths)
          }
        }

        // Update notice
        const { error: updateError } = await supabase
          .from('notices')
          .update({
            content: content.trim(),
            images: imageUrls,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNotice.id)

        if (updateError) throw updateError
      } else {
        // Create new notice
        const { error: insertError } = await supabase.from('notices').insert({
          team_id: team.id,
          author_id: profile.id,
          content: content.trim(),
          images: imageUrls,
          is_pinned: false,
          is_archived: false,
        })

        if (insertError) throw insertError
      }

      // Clear form
      setContent('')
      images.forEach((img) => {
        if (!img.isExisting) URL.revokeObjectURL(img.url)
      })
      setImages([])

      onNoticeCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share an update with your team..."
          className="input min-h-[100px] resize-none mb-3"
          disabled={loading}
        />

        {/* Image previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {images.map((img, index) => (
              <div key={img.url} className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
              disabled={loading}
            />
            <label
              htmlFor="image-upload"
              className={`inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 cursor-pointer ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add images
            </label>
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : isEditing ? 'Save' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
