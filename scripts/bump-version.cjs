#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const semver = require("semver");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function bumpVersion(currentVersion, releaseTypeOrVersion) {
  if (["patch", "minor", "major"].includes(releaseTypeOrVersion)) {
    return semver.inc(currentVersion, releaseTypeOrVersion);
  }
  if (semver.valid(releaseTypeOrVersion)) {
    return releaseTypeOrVersion;
  }
  console.error(
    "Invalid version. Use patch, minor, major, or a valid semver string."
  );
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: bump-version <patch|minor|major|version>");
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, "..");
const pkgPath = path.join(projectRoot, "package.json");
const tauriConfigPath = path.join(projectRoot, "src-tauri", "tauri.conf.json");
const cargoTomlPath = path.join(projectRoot, "src-tauri", "Cargo.toml");
const pkg = readJson(pkgPath);
const tauriConfig = readJson(tauriConfigPath);
const newVersion = bumpVersion(pkg.version, arg);

// 1) Update package.json
pkg.version = newVersion;
writeJson(pkgPath, pkg);

// 2) Update tauri.conf.json
tauriConfig.version = newVersion;
writeJson(tauriConfigPath, tauriConfig);

// 3) Update Cargo.toml
let cargoToml = fs.readFileSync(cargoTomlPath, "utf8");
// Replace the version under [package] only
cargoToml = cargoToml.replace(
  /(\[package\][\s\S]*?version\s*=\s*)"[^"]*"/,
  `$1"${newVersion}"`
);
fs.writeFileSync(cargoTomlPath, cargoToml);

console.log(`Bumped version to ${newVersion}`);
