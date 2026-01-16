import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Notice, User } from '../lib/types'
import NoticeCard from '../components/NoticeCard'
import NoticeComposer from '../components/NoticeComposer'

export type NoticeWithAuthor = Notice & {
  author: User
}

export default function Notices() {
  const { profile, team } = useAuth()
  const [notices, setNotices] = useState<NoticeWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)

  const loadNotices = useCallback(async () => {
    if (!team) return

    setLoading(true)
    const { data, error } = await supabase
      .from('notices')
      .select('*, author:users(*)')
      .eq('team_id', team.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading notices:', error)
    } else if (data) {
      setNotices(data as NoticeWithAuthor[])
    }
    setLoading(false)
  }, [team])

  useEffect(() => {
    void loadNotices()
  }, [loadNotices])

  const handleNoticeCreated = () => {
    void loadNotices()
  }

  const handleNoticeUpdated = () => {
    void loadNotices()
  }

  const handleNoticeDeleted = () => {
    void loadNotices()
  }

  const filteredNotices = showArchived
    ? notices
    : notices.filter((n) => !n.is_archived)

  const pinnedCount = notices.filter((n) => n.is_pinned && !n.is_archived).length

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Notice Board</h1>

      <NoticeComposer onNoticeCreated={handleNoticeCreated} />

      <div className="flex items-center justify-between mb-4 mt-6">
        <h2 className="text-sm font-medium text-slate-500">
          {loading ? 'Loading...' : `${filteredNotices.length} notice${filteredNotices.length === 1 ? '' : 's'}`}
        </h2>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show archived
        </label>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading notices...</div>
      ) : filteredNotices.length === 0 ? (
        <div className="card text-center py-8 text-slate-500">
          <p>No notices yet.</p>
          <p className="text-sm mt-1">Be the first to post an update for your team.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              currentUserId={profile?.id}
              pinnedCount={pinnedCount}
              onUpdate={handleNoticeUpdated}
              onDelete={handleNoticeDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
