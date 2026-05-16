const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

const originalResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === '@react-native-community/datetimepicker') {
      return { filePath: path.resolve(__dirname, 'web-shims/datetimepicker.js'), type: 'sourceFile' }
    }
    if (moduleName === 'react-native-maps') {
      return { filePath: path.resolve(__dirname, 'web-shims/react-native-maps.js'), type: 'sourceFile' }
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
