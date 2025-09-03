const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web-specific resolver options
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add alias for React Native modules that don't work on web
config.resolver.alias = {
  'react-native': 'react-native-web',
};

// Configure transformer for better web compatibility
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

module.exports = config;
