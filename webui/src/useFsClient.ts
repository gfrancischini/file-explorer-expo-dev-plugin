import { message } from 'antd'
import { useDevToolsPluginClient, type EventSubscription } from 'expo/devtools'
import mime from 'mime'
import { useEffect, useCallback, useState, useRef } from 'react'

import { AppFile, RootDirectory } from '@/types'
import { base64ToByteArray, convertFileToBase64 } from '@/utils'

function looksLikeText(bytes: Uint8Array, sampleSize = 512): boolean {
  const end = Math.min(bytes.length, sampleSize)
  if (end === 0) return false
  let nonPrintable = 0
  for (let i = 0; i < end; i++) {
    const b = bytes[i]!
    // Allow tab(9), LF(10), CR(13), printable ASCII(32-126), high bytes for UTF-8
    if (b < 9 || (b > 13 && b < 32) || b === 127) {
      nonPrintable++
    }
  }
  return nonPrintable / end < 0.1
}

const methods = {
  in: {
    ping: 'r-ping',
    getRootDirectories: 'r-get-root-directories',
    getFiles: 'r-get-files',
    getFileContent: 'r-get-file-content',
    error: 'error',
    success: 'success',
  },
  out: {
    ping: 'ping',
    getFiles: 'get-files',
    getFileContent: 'get-file-content',
    deleteFile: 'delete-file',
    getRootDirectories: 'get-root-directories',
    uploadFile: 'upload-file',
    newFolder: 'new-folder',
  },
}

type UseClientProps = {
  activePath: string
  setActivePath: (activePath: string) => void
  rootDirectoryType: RootDirectory
}

export function useFsClient({
  activePath,
  setActivePath,
  rootDirectoryType,
}: UseClientProps) {
  const client = useDevToolsPluginClient('file-explorer-expo-dev-plugin')
  const [rootDirectories, setRootDirectories] = useState<Record<
    RootDirectory,
    string
  > | null>(null)
  const [files, setFiles] = useState<AppFile[]>([])
  const [previewContent, setPreviewContent] = useState<{
    url: string
    mimeType: string
    fileName: string
  } | null>(null)
  const pendingAction = useRef<'download' | 'preview'>('download')

  const fetchFiles = useCallback(() => {
    if (activePath === '') return

    client?.sendMessage(methods.out.getFiles, { path: activePath })
  }, [client, activePath])

  const getFileContent = useCallback(
    (path: string) => {
      pendingAction.current = 'download'
      client?.sendMessage(methods.out.getFileContent, { path })
    },
    [client]
  )

  const previewFile = useCallback(
    (path: string) => {
      pendingAction.current = 'preview'
      client?.sendMessage(methods.out.getFileContent, { path })
    },
    [client]
  )

  const clearPreview = useCallback(() => {
    setPreviewContent((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  const deleteFile = useCallback(
    (path: string) => {
      client?.sendMessage(methods.out.deleteFile, { path })
    },
    [client]
  )

  const uploadFile = useCallback(
    async (file: File) => {
      const base64String = await convertFileToBase64(file)

      client?.sendMessage(methods.out.uploadFile, {
        path: activePath,
        name: encodeURI(file.name),
        base64String,
      })
    },
    [client, activePath]
  )

  const createNewFolder = useCallback(
    (folderName: string) => {
      client?.sendMessage(methods.out.newFolder, {
        path: activePath,
        name: encodeURI(folderName),
      })
    },
    [client, activePath]
  )

  useEffect(() => {
    const subscriptions: EventSubscription[] = []

    if (!client) {
      return
    }

    subscriptions.push(
      client.addMessageListener(methods.in.getFiles, (data) => {
        setFiles(data.files ?? [])
      })
    )

    subscriptions.push(
      client.addMessageListener(methods.in.getRootDirectories, (data) => {
        setRootDirectories(data.rootDirectories)
        setActivePath(data.rootDirectories?.[rootDirectoryType])
      })
    )

    subscriptions.push(
      client.addMessageListener(methods.in.getFileContent, (data) => {
        const bytes = base64ToByteArray(data.content)
        const mimeType =
          mime.getType(data.path) || (looksLikeText(bytes) ? 'text/plain' : '')
        const blob = new Blob([bytes], {
          type: mimeType,
        })
        const url = URL.createObjectURL(blob)

        if (pendingAction.current === 'preview') {
          pendingAction.current = 'download'
          const fileName = decodeURI(data.path).split('/').pop() || 'file'
          setPreviewContent({ url, mimeType, fileName })
        } else {
          const a = document.createElement('a')
          a.href = url
          a.download = decodeURI(data.path).split('/').pop() || 'file'
          a.click()
          setTimeout(() => URL.revokeObjectURL(url), 100)
        }
      })
    )

    subscriptions.push(
      client.addMessageListener(methods.in.error, ({ error }) => {
        message.error(error ?? `Unknown error`)
      })
    )

    client.sendMessage(methods.out.getRootDirectories, {})

    return () => {
      for (const subscription of subscriptions) {
        subscription?.remove()
      }
    }
  }, [client])

  useEffect(() => {
    const dynamicSubscriptions: EventSubscription[] = []

    if (!client) {
      return
    }

    dynamicSubscriptions.push(
      client.addMessageListener(
        methods.in.success,
        ({ message: messageIn, refresh }) => {
          message.success(messageIn ?? `Success`)
          if (refresh) fetchFiles()
        }
      )
    )

    return () => {
      for (const subscription of dynamicSubscriptions) {
        subscription?.remove()
      }
    }
  }, [client, fetchFiles])

  return {
    files,
    rootDirectories,
    fetchFiles,
    getFileContent,
    deleteFile,
    uploadFile,
    createNewFolder,
    previewFile,
    previewContent,
    clearPreview,
  }
}
