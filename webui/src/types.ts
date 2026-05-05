import { FileInfo } from 'expo-file-system/legacy'

export type RootDirectory = 'document' | 'cache' | 'bundle' | (string & {})

export type AppFile = {
  name: string
  info: FileInfo
}
