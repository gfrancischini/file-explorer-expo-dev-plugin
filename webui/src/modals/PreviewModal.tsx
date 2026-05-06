import { DownloadOutlined } from '@ant-design/icons'
import { Button, Modal, Typography, theme } from 'antd'
import { useEffect, useState } from 'react'

export type PreviewContent = {
  url: string
  mimeType: string
  fileName: string
}

type PreviewModalProps = {
  previewContent: PreviewContent | null
  onClose: () => void
}

function isTextMime(mimeType: string) {
  return (
    mimeType.startsWith('text/') ||
    [
      'application/json',
      'application/xml',
      'application/javascript',
      'application/typescript',
    ].includes(mimeType)
  )
}

function PreviewBody({ previewContent }: { previewContent: PreviewContent }) {
  const { token } = theme.useToken()
  const { url, mimeType } = previewContent
  const [textContent, setTextContent] = useState<string | null>(null)

  useEffect(() => {
    setTextContent(null)
    if (isTextMime(mimeType)) {
      fetch(url)
        .then((r) => r.text())
        .then((text) => {
          if (mimeType === 'application/json') {
            try {
              return setTextContent(JSON.stringify(JSON.parse(text), null, 2))
            } catch {}
          }
          setTextContent(text)
        })
    }
  }, [url, mimeType])

  if (mimeType.startsWith('image/')) {
    return (
      <img
        src={url}
        alt={previewContent.fileName}
        style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}
      />
    )
  }

  if (mimeType === 'application/pdf') {
    return (
      <iframe
        src={url}
        width="100%"
        height="500px"
        style={{ border: 'none', display: 'block' }}
        title={previewContent.fileName}
      />
    )
  }

  if (mimeType.startsWith('video/')) {
    return (
      <video
        src={url}
        controls
        style={{ width: '100%', display: 'block' }}
      />
    )
  }

  if (mimeType.startsWith('audio/')) {
    return <audio src={url} controls style={{ display: 'block', width: '100%' }} />
  }

  if (isTextMime(mimeType)) {
    return (
      <pre
        style={{
          maxHeight: 500,
          overflow: 'auto',
          background: token.colorBgLayout,
          padding: 16,
          borderRadius: token.borderRadius,
          fontSize: token.fontSizeSM,
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {textContent ?? 'Loading…'}
      </pre>
    )
  }

  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <Typography.Text type="secondary">
        Preview not available for this file type.
      </Typography.Text>
    </div>
  )
}

function handleDownload(previewContent: PreviewContent) {
  const a = document.createElement('a')
  a.href = previewContent.url
  a.download = previewContent.fileName
  a.click()
}

export function PreviewModal({ previewContent, onClose }: PreviewModalProps) {
  return (
    <Modal
      open={!!previewContent}
      title={previewContent?.fileName}
      onCancel={onClose}
      width={800}
      footer={[
        <Button
          key="download"
          icon={<DownloadOutlined />}
          onClick={() => previewContent && handleDownload(previewContent)}
        >
          Download
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {previewContent && <PreviewBody previewContent={previewContent} />}
    </Modal>
  )
}
