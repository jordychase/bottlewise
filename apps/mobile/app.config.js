/**
 * Dynamic Expo config. Reads the base URL from env so the same build
 * can target local dev (no prefix) and GitHub Pages (/bottlewise/app/).
 *
 *   local web dev:   EXPO_BASE_URL unset → assets resolve from /
 *   pages deploy:    EXPO_BASE_URL=/bottlewise/app → assets resolve under that prefix
 */

const baseConfig = require("./app.json").expo;

module.exports = ({ config }) => ({
  ...config,
  ...baseConfig,
  experiments: {
    ...(baseConfig.experiments ?? {}),
    baseUrl: process.env.EXPO_BASE_URL ?? "",
  },
});
