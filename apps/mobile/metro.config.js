// Metro in a pnpm workspace.
//
// Two settings, each fixing a specific failure:
//
//   watchFolders      without the repo root, editing packages/api-client does
//                     not trigger a reload.
//   nodeModulesPaths  pnpm hoists shared dependencies to the workspace root,
//                     which Metro does not look in by default.
//
// Note what is deliberately NOT set: `disableHierarchicalLookup`. The Expo
// monorepo guide recommends it to stop Metro resolving a stray second copy of
// React, but that advice assumes npm or Yarn's flat node_modules. Under pnpm
// every package's own dependencies live beside it inside .pnpm/, reachable only
// by walking up from the importing file — which is exactly what hierarchical
// lookup does. Turning it off makes expo-modules-core unresolvable from expo.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
