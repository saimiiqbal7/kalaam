import { supabase } from './supabase'

export async function registerUser(name, phone) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, phone }])
    .select()
    .single()
  if (error) throw error
  localStorage.setItem('kalaam_user_id', data.id)
  localStorage.setItem('kalaam_user_name', data.name)
  return data
}

export async function updateLastSeen() {
  const userId = localStorage.getItem('kalaam_user_id')
  if (!userId) return
  await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', userId)
}

export async function trackBookOpened(bookId) {
  const userId = localStorage.getItem('kalaam_user_id')
  if (!userId) return
  const { data } = await supabase.from('users').select('books_started').eq('id', userId).single()
  if (!data) return
  const updated = [...new Set([...(data.books_started || []), bookId])]
  await supabase.from('users').update({ books_started: updated }).eq('id', userId)
}

export async function trackChapterCompleted(bookId, chapterId) {
  const userId = localStorage.getItem('kalaam_user_id')
  if (!userId) return
  const { data } = await supabase.from('users').select('chapters_completed').eq('id', userId).single()
  if (!data) return
  const key = `${bookId}_${chapterId}`
  const updated = [...new Set([...(data.chapters_completed || []), key])]
  await supabase.from('users').update({ chapters_completed: updated }).eq('id', userId)
}

export async function trackWordSaved() {
  const userId = localStorage.getItem('kalaam_user_id')
  if (!userId) return
  const { data } = await supabase.from('users').select('words_saved').eq('id', userId).single()
  if (!data) return
  await supabase.from('users').update({ words_saved: (data.words_saved || 0) + 1 }).eq('id', userId)
}

export async function updateSupportLevel(level) {
  const userId = localStorage.getItem('kalaam_user_id')
  if (!userId) return
  await supabase.from('users').update({ support_level: level }).eq('id', userId)
}

export function getLocalUser() {
  return {
    id: localStorage.getItem('kalaam_user_id'),
    name: localStorage.getItem('kalaam_user_name'),
  }
}

export function isRegistered() {
  return !!localStorage.getItem('kalaam_user_id')
}
