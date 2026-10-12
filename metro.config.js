// Release builds resolve '@/features/godmode' to a stub, so God Mode's code is not in the bundle.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const godMode = process.env.EXPO_PUBLIC_GOD_MODE === '1';
const stub = path.join(__dirname, 'src/features/godmode-stub/index.tsx');

const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    !godMode &&
    (moduleName === '@/features/godmode' || moduleName.endsWith('/features/godmode'))
  ) {
    return { type: 'sourceFile', filePath: stub };
  }
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
