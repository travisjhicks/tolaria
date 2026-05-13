const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const config = getDefaultConfig(projectRoot)
const mobileNodeModules = path.resolve(projectRoot, 'node_modules')
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules')
const mobileReactRoot = path.resolve(mobileNodeModules, 'react')
const mobileReactDomRoot = path.resolve(mobileNodeModules, 'react-dom')

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  workspaceNodeModules,
]
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: mobileReactRoot,
  'react-dom': mobileReactDomRoot,
  'react-native': path.resolve(workspaceNodeModules, 'react-native'),
}
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(mobileReactRoot, 'index.js') },
      moduleName,
      platform,
    )
  }

  if (moduleName === 'react-dom' || moduleName.startsWith('react-dom/')) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(mobileReactDomRoot, 'index.js') },
      moduleName,
      platform,
    )
  }

  if (moduleName === 'isomorphic-git') {
    return {
      filePath: path.resolve(workspaceNodeModules, 'isomorphic-git/index.js'),
      type: 'sourceFile',
    }
  }

  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
