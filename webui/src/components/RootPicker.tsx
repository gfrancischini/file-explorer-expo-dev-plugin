import { Button, Row } from 'antd'

import { RootDirectory } from '../types'

import { capitalize } from '@/utils'

type RootPickerProps = {
  roots: RootDirectory[]
  onRootChange: (root: RootDirectory) => void
  selectedRoot: RootDirectory
}

export function RootPicker({
  roots,
  onRootChange,
  selectedRoot,
}: RootPickerProps) {
  return (
    <Row style={{ gap: 8 }}>
      {roots.map((root) => (
        <Button
          key={root}
          onClick={() => onRootChange(root)}
          type={root === selectedRoot ? 'primary' : 'default'}
          style={{
            borderRadius: 15,
          }}
        >
          {capitalize(root)}
        </Button>
      ))}
    </Row>
  )
}
