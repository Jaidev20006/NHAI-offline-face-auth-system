const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const config = {
  resolver: {
    assetExts: [...assetExts, 'ort', 'tflite'],
    sourceExts: [...sourceExts, 'ts', 'tsx']
  }
};

module.exports = mergeConfig(defaultConfig, config);
