import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

export function useSavedPlaces(userId: string) {
  const [saved, setSaved] = useState<number[]>([])
  const [savedLoading, setSavedLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedError, setSavedError] = useState('')
  const saveInProgress = useRef(false)

  useEffect(() => {
    let active = true

    async function loadSavedPlaces() {
      setSavedLoading(true)
      setSavedError('')

      try {
        const { data, error } = await supabase
          .from('yatriflow_saved_places')
          .select('destination_id')
          .eq('user_id', userId)

        if (error) throw new Error(error.message)
        if (!active) return

        setSaved((data ?? []).map((row) => row.destination_id))
      } catch (error) {
        if (!active) return

        setSavedError(
          error instanceof Error
            ? error.message
            : 'Could not load saved places.',
        )
      } finally {
        if (active) setSavedLoading(false)
      }
    }

    void loadSavedPlaces()

    return () => {
      active = false
    }
  }, [userId])

  async function toggleSave(destinationId: number) {
    if (saveInProgress.current || savedLoading || savedError) return

    saveInProgress.current = true
    setSaving(true)

    const alreadySaved = saved.includes(destinationId)

    try {
      if (alreadySaved) {
        const { error } = await supabase
          .from('yatriflow_saved_places')
          .delete()
          .eq('user_id', userId)
          .eq('destination_id', destinationId)

        if (error) throw new Error(error.message)

        setSaved((current) =>
          current.filter((id) => id !== destinationId),
        )
      } else {
        const { error } = await supabase
          .from('yatriflow_saved_places')
          .upsert(
            {
              user_id: userId,
              destination_id: destinationId,
            },
            {
              onConflict: 'user_id,destination_id',
              ignoreDuplicates: true,
            },
          )

        if (error) throw new Error(error.message)

        setSaved((current) =>
          current.includes(destinationId)
            ? current
            : [...current, destinationId],
        )
      }
    } catch (error) {
      setSavedError(
        error instanceof Error
          ? error.message
          : 'Could not update saved places.',
      )
    } finally {
      saveInProgress.current = false
      setSaving(false)
    }
  }

  return { saved, toggleSave, savedLoading, saving, savedError }
}
