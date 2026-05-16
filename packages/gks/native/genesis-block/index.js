// Genesis Block — native binding loader.
//
// Loads the prebuilt `.node` artifact for the current platform/arch.
// Falls back to a developer build under `target/release/` if present.
//
// Per BLUEPRINT--GENESIS-GRAPH-INTEGRATION the production loader is
// the per-triple optional-deps pattern. For P3.1 we keep it simple:
// look for a sibling `genesis-block.<triple>.node` file (the path
// `napi build` produces), and otherwise throw a descriptive error.

const { existsSync, readFileSync } = require('node:fs')
const { join } = require('node:path')
const { platform, arch } = process

function tripleForHost() {
  if (platform === 'darwin' && arch === 'arm64') return 'darwin-arm64'
  if (platform === 'darwin' && arch === 'x64') return 'darwin-x64'
  if (platform === 'linux' && arch === 'x64') {
    const isMusl = (() => {
      try {
        const ldd = readFileSync('/usr/bin/ldd', 'utf8')
        return ldd.includes('musl')
      } catch {
        return false
      }
    })()
    return isMusl ? 'linux-x64-musl' : 'linux-x64-gnu'
  }
  if (platform === 'linux' && arch === 'arm64') return 'linux-arm64-gnu'
  if (platform === 'win32' && arch === 'x64') return 'win32-x64-msvc'
  return null
}

const triple = tripleForHost()
if (!triple) {
  throw new Error(
    `genesis-block: unsupported host ${platform}-${arch}; rebuild from source in packages/gks/native/genesis-block`,
  )
}

const localCandidate = join(__dirname, `genesis-block.${triple}.node`)
const devCandidate = join(__dirname, 'target', 'release', 'libgenesis_block_native.node')

let binding
if (existsSync(localCandidate)) {
  binding = require(localCandidate)
} else if (existsSync(devCandidate)) {
  binding = require(devCandidate)
} else {
  throw new Error(
    `genesis-block: no prebuilt binary found for ${triple}. ` +
      `Run \`napi build --platform --release\` in packages/gks/native/genesis-block, ` +
      `or install the per-triple optional dependency.`,
  )
}

module.exports = binding
module.exports.default = binding
