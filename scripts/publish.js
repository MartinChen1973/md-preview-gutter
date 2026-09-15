const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const PACKAGE_JSON_PATH = path.join(__dirname, "..", "package.json");
const ENV_PATH = path.join(__dirname, "..", ".env");
const TARGET_VSCODE = "vscode";
const TARGET_OVSX = "ovsx";
const PUBLISHER_BY_TARGET = {
  [TARGET_VSCODE]: "MartinChen",
  [TARGET_OVSX]: "MartinChen1973",
};
const DEFAULT_PUBLISHER = PUBLISHER_BY_TARGET[TARGET_OVSX];
const PAT_ENV_BY_TARGET = {
  [TARGET_VSCODE]: "VSCE_PAT",
  [TARGET_OVSX]: "OVSX_PAT",
};
const NPX_BIN = process.platform === "win32" ? "npx.cmd" : "npx";
const PUBLISH_ARGS_BY_TARGET = {
  [TARGET_VSCODE]: ["--yes", "@vscode/vsce", "publish", "--allow-missing-repository"],
  [TARGET_OVSX]: ["--yes", "ovsx", "publish", "--allow-missing-repository"],
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    applyEnvLine(line);
  }
}

function applyEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return;
  }
  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex < 1) {
    return;
  }
  const key = trimmed.slice(0, separatorIndex).trim();
  const value = unquote(trimmed.slice(separatorIndex + 1).trim());
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

function unquote(value) {
  const isDoubleQuoted = value.startsWith('"') && value.endsWith('"');
  const isSingleQuoted = value.startsWith("'") && value.endsWith("'");
  if (!isDoubleQuoted && !isSingleQuoted) {
    return value;
  }
  return value.slice(1, -1);
}

function readPackageJson() {
  return JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
}

function writePublisher(publisher) {
  const packageJson = readPackageJson();
  packageJson.publisher = publisher;
  fs.writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function requirePat(target) {
  const envName = PAT_ENV_BY_TARGET[target];
  const token = process.env[envName];
  if (token) {
    return;
  }
  throw new Error(
    `Missing ${envName} for ${target} publish (${PUBLISHER_BY_TARGET[target]}). Set it in .env and do not commit that file.`
  );
}

function runPublish(target) {
  requirePat(target);
  writePublisher(PUBLISHER_BY_TARGET[target]);
  const result = spawnSync(NPX_BIN, PUBLISH_ARGS_BY_TARGET[target], {
    cwd: path.join(__dirname, ".."),
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${target} publish failed with exit code ${result.status}`);
  }
}

function resolveTargets(argv) {
  const requested = argv[2] || "all";
  const byName = {
    all: [TARGET_VSCODE, TARGET_OVSX],
    [TARGET_VSCODE]: [TARGET_VSCODE],
    [TARGET_OVSX]: [TARGET_OVSX],
  };
  const targets = byName[requested];
  if (!targets) {
    throw new Error(`Unknown target "${requested}". Use vscode, ovsx, or all.`);
  }
  return targets;
}

function main() {
  loadEnvFile(ENV_PATH);
  const targets = resolveTargets(process.argv);
  try {
    for (const target of targets) {
      runPublish(target);
    }
  } finally {
    writePublisher(DEFAULT_PUBLISHER);
  }
}

main();
