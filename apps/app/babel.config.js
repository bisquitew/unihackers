module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // makes StyleSheet styles that use colour tokens follow the light/dark theme live (see the plugin for how)
    plugins: [require.resolve('./babel-plugin-live-theme.js')],
  };
};
