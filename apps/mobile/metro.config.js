const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// pnpm stores real package directories under <workspaceRoot>/node_modules/.pnpm
// and workspace packages under <workspaceRoot>/packages. Metro resolves symlinks
// to their real paths, so both must be watched or every dependency outside
// apps/mobile fails to resolve at bundle time.
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules/.pnpm/node_modules"),
];

// Hierarchical lookup must stay enabled: pnpm relies on walking up from a
// package's real path into .pnpm/<pkg>/node_modules to find its own deps.

module.exports = config;
