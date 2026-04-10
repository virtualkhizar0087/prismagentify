'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/database'

export function SettingsForm({ profile }: { profile: User | null }) {
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    await supabase
      .from('users')
      .update({ full_name: fullName })
      .eq('id', profile!.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
        <h2 className="mb-4 font-semibold text-gray-900">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">Email cannot be changed here.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
        <h2 className="mb-4 font-semibold text-gray-900">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Current plan</span>
            <span className="font-medium capitalize">{profile?.plan ?? 'free'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Member since</span>
            <span className="font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl bg-white p-6 ring-1 ring-red-200">
        <h2 className="mb-1 font-semibold text-red-700">Danger Zone</h2>
        <p className="mb-4 text-sm text-gray-500">
          Permanently delete your account and all associated data.
        </p>
        <button
          disabled
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 cursor-not-allowed transition-colors"
        >
          Delete account
        </button>
        <p className="mt-2 text-xs text-gray-400">Contact support to delete your account.</p>
      </div>
    </div>
  )
}
