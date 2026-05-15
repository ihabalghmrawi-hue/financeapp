'use client'

import { useState, useCallback } from 'react'
import { fileService } from '../file-service'
import type { FilePickerResult, UploadProgress } from '../types'

export function useFilePicker() {
  const [selected, setSelected] = useState<FilePickerResult | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [picking, setPicking] = useState(false)

  const pickImage = useCallback(async () => {
    setPicking(true)
    const result = await fileService.pickImage()
    setSelected(result)
    setPicking(false)
    return result
  }, [])

  const pickDocument = useCallback(async () => {
    setPicking(true)
    const result = await fileService.pickDocument()
    setSelected(result)
    setPicking(false)
    return result
  }, [])

  const pickPDF = useCallback(async () => {
    setPicking(true)
    const result = await fileService.pickPDF()
    setSelected(result)
    setPicking(false)
    return result
  }, [])

  const upload = useCallback(
    async (uploadUrl: string): Promise<boolean> => {
      if (!selected) {
        return false
      }

      setUploadProgress({ fileId: selected.name, fileName: selected.name, progress: 0, speed: 0, status: 'queued' })

      return fileService.uploadFile(selected, uploadUrl, (progress) => {
        setUploadProgress({ ...progress })
      })
    },
    [selected],
  )

  const reset = useCallback(() => {
    setSelected(null)
    setUploadProgress(null)
  }, [])

  return { selected, uploadProgress, picking, pickImage, pickDocument, pickPDF, upload, reset }
}
