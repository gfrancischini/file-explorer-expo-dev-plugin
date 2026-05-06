export let useFileExplorerDevTools;
// @ts-ignore process.env.NODE_ENV is defined by metro transform plugins
if (process.env.NODE_ENV !== 'production') {
    useFileExplorerDevTools =
        require('./useFileExplorerDevTools').useFileExplorerDevTools;
}
else {
    useFileExplorerDevTools = () => { };
}
//# sourceMappingURL=index.js.map