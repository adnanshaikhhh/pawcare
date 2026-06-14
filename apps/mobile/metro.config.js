const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  config.resolver.unstable_enablePackageExports = true;
  // Keep hierarchical lookup ON so native module resolution works
  config.resolver.disableHierarchicalLookup = false;
  return config;
})();
