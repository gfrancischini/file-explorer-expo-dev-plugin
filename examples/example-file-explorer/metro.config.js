const path = require('path')
const { getDefaultConfig } = require('@expo/metro-config')
const { withMetroConfig } = require('react-native-monorepo-config')

const root = path.resolve(__dirname, '..', '..')

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname,
})

config.resolver.unstable_enablePackageExports = true

/**
 * this is need for windows
 * https://github.com/callstack/react-native-builder-bob/pull/849
 * */
config.resolver.disableHierarchicalLookup = true

// With disableHierarchicalLookup, Metro won't walk up directories to resolve
// modules. We need to explicitly list node_modules paths so that regular deps
// of monorepo packages (like expo-modules-core, which is a dep of expo, not a
// peer dep) can still be found.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
]

module.exports = config
