// expo-file-system/legacy subpath was introduced in v19 (Expo SDK 54).
// v18 and below export the legacy API from the main entry point.
let FileSystem;
try {
    FileSystem = require('expo-file-system/legacy');
}
catch {
    FileSystem = require('expo-file-system');
}
export default FileSystem;
//# sourceMappingURL=fileSystemCompat.js.map