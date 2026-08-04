/*
 * Every Expo project needs this file. It went missing during the repository
 * restructure, and without it Babel had no preset at all: no worklets plugin,
 * so Reanimated's worklet functions were never transformed. Expo Go then
 * handed an untransformed function to the native worklets runtime and the app
 * died on launch with SIGSEGV inside
 * `worklets::JSIWorkletsModuleProxy::toOptimizedObject`.
 *
 * babel-preset-expo adds `react-native-worklets/plugin` on its own when the
 * package is installed, so the preset alone is enough — listing the plugin
 * here as well would apply it twice.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
