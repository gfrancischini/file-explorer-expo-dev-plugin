import { useDevToolsPluginClient } from 'expo/devtools';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import FileSystem from './fileSystemCompat';
const methods = {
    in: {
        ping: 'ping',
        getFiles: 'get-files',
        getFileContent: 'get-file-content',
        deleteFile: 'delete-file',
        getRootDirectories: 'get-root-directories',
        uploadFile: 'upload-file',
        newFolder: 'new-folder',
    },
    out: {
        ping: 'r-ping',
        getRootDirectories: 'r-get-root-directories',
        getFiles: 'r-get-files',
        getFileContent: 'r-get-file-content',
        error: 'error',
        success: 'success',
    },
};
export function useFileExplorerDevTools(options) {
    const client = useDevToolsPluginClient('file-explorer-expo-dev-plugin');
    const sendError = useCallback((error) => {
        client?.sendMessage(methods.out.error, {
            error,
        });
    }, [client]);
    const sendSuccess = useCallback((message, refresh) => {
        client?.sendMessage(methods.out.success, {
            message,
            refresh,
        });
    }, [client]);
    useEffect(() => {
        const subscriptions = [];
        client?.sendMessage(methods.in.ping, { from: 'app' });
        subscriptions.push(client?.addMessageListener(methods.in.getFiles, async (data) => {
            if (!data.path)
                return;
            let files = [];
            try {
                files = await FileSystem.readDirectoryAsync(data.path);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                sendError(message);
                return;
            }
            const filePromises = files.map(async (file) => {
                try {
                    return {
                        name: file,
                        info: await FileSystem.getInfoAsync(`${data.path.replace(/\/$/, '')}/${encodeURIComponent(file)}`),
                    };
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    return { error: message };
                }
            });
            const filesWithMetadata = await Promise.all(filePromises);
            const validFiles = filesWithMetadata.filter((file) => !('error' in file));
            const errors = filesWithMetadata
                .filter((file) => 'error' in file)
                .map((file) => file.error);
            client?.sendMessage(methods.out.getFiles, {
                files: validFiles,
            });
            if (errors.length > 0) {
                sendError(errors.join(', '));
            }
        }));
        subscriptions.push(client?.addMessageListener(methods.in.getRootDirectories, () => client?.sendMessage(methods.out.getRootDirectories, {
            rootDirectories: {
                document: FileSystem.documentDirectory,
                cache: FileSystem.cacheDirectory,
                bundle: `file://${FileSystem.bundleDirectory}`,
                ...Platform.select({
                    ios: {
                        bundle: `file://${FileSystem.bundleDirectory}`,
                        library: FileSystem.documentDirectory?.replace(/Documents\/$/, 'Library/'),
                    },
                    android: {
                        library: FileSystem.documentDirectory?.replace('/files/', '/'),
                    },
                }),
                ...options?.additionalRootDirectories,
            },
        })));
        subscriptions.push(client?.addMessageListener(methods.in.getFileContent, async (data) => {
            if (!data.path)
                return;
            try {
                const content = await FileSystem.readAsStringAsync(data.path, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                client?.sendMessage(methods.out.getFileContent, {
                    content,
                    path: data.path,
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                sendError(message);
            }
        }));
        subscriptions.push(client?.addMessageListener(methods.in.deleteFile, async (data) => {
            if (!data.path)
                return;
            try {
                await FileSystem.deleteAsync(data.path);
                sendSuccess('File deleted', true);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                sendError(message);
            }
        }));
        subscriptions.push(client?.addMessageListener(methods.in.uploadFile, async (data) => {
            try {
                await FileSystem.writeAsStringAsync(`${data.path}/${data.name}`, data.base64String, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                sendSuccess('File uploaded', true);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                sendError(message);
            }
        }));
        subscriptions.push(client?.addMessageListener(methods.in.newFolder, async (data) => {
            try {
                await FileSystem.makeDirectoryAsync(`${data.path}/${data.name}`, {
                    intermediates: true,
                });
                sendSuccess('Folder created', true);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                sendError(message);
            }
        }));
        return () => {
            for (const subscription of subscriptions) {
                subscription?.remove();
            }
        };
    }, [client]);
}
//# sourceMappingURL=useFileExplorerDevTools.js.map