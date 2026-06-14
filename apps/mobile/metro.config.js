const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  config.resolver.unstable_enablePackageExports = true;
  config.resolver.disableHierarchicalLookup = false;
  config.watchFolders = [__dirname, require('path').resolve(__dirname, '../../packages')];
  return config;
})();
