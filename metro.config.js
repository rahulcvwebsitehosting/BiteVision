const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite ships a wa-sqlite worker for the web that imports a .wasm file
// missing from the published npm package, which breaks `expo export --platform
// web` (and Vercel builds). The app has no persistence on web by design, so
// resolve the module to a tiny shim that rejects on open — the root layout
// already treats storage as optional.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return context.resolveRequest(
      context,
      require.resolve('./src/db/expo-sqlite.web.ts'),
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
