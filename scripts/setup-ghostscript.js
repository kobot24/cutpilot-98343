#!/usr/bin/env node

/**
 * Automatic Ghostscript Setup Script
 *
 * This script automatically downloads and installs Ghostscript binary
 * for the current platform during npm install.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const BINARIES_DIR = path.join(__dirname, '..', 'src-tauri', 'binaries');

// Ghostscript download URLs (using publicly available sources)
const GHOSTSCRIPT_URLS = {
  // Windows: Official Ghostscript release
  'win32-x64': {
    url: 'https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10031/gs10.03.1-win64.exe',
    installer: true,
    binary: 'gs-x86_64-pc-windows-msvc.exe',
  },
  // macOS: Will use Homebrew or system gs
  'darwin-x64': {
    useSystem: true,
    binary: 'gs-x86_64-apple-darwin',
  },
  'darwin-arm64': {
    useSystem: true,
    binary: 'gs-aarch64-apple-darwin',
  },
  // Linux: Will use system package manager
  'linux-x64': {
    useSystem: true,
    binary: 'gs-x86_64-unknown-linux-gnu',
  },
};

function getPlatformKey() {
  const platform = os.platform();
  const arch = os.arch();

  if (platform === 'win32') {
    return 'win32-x64';
  } else if (platform === 'darwin') {
    return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
  } else if (platform === 'linux') {
    return 'linux-x64';
  }

  return null;
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
}

function checkIfBinaryExists(binaryPath) {
  return fs.existsSync(binaryPath);
}

function findSystemGhostscript() {
  try {
    const result = execSync('which gs', { encoding: 'utf8' }).trim();
    if (result && fs.existsSync(result)) {
      return result;
    }
  } catch (e) {
    // Try common paths
    const commonPaths = [
      '/usr/bin/gs',
      '/usr/local/bin/gs',
      '/opt/homebrew/bin/gs',
      '/opt/local/bin/gs',
    ];

    for (const path of commonPaths) {
      if (fs.existsSync(path)) {
        return path;
      }
    }
  }

  return null;
}

function copySystemGhostscript(targetPath) {
  const systemGs = findSystemGhostscript();

  if (!systemGs) {
    console.log('⚠ Ghostscript not found on system');
    console.log('');
    console.log('Please install Ghostscript:');

    if (os.platform() === 'darwin') {
      console.log('  macOS:  brew install ghostscript');
    } else if (os.platform() === 'linux') {
      console.log('  Ubuntu: sudo apt install ghostscript');
      console.log('  Fedora: sudo dnf install ghostscript');
    }

    console.log('');
    console.log('Then run: npm install (again)');
    return false;
  }

  try {
    fs.copyFileSync(systemGs, targetPath);
    fs.chmodSync(targetPath, 0o755);
    console.log(`✓ Copied Ghostscript from: ${systemGs}`);
    console.log(`  to: ${targetPath}`);
    return true;
  } catch (e) {
    console.error(`✗ Failed to copy Ghostscript: ${e.message}`);
    return false;
  }
}

async function downloadFile(url, targetPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    console.log(`Downloading: ${url}`);

    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location, targetPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(targetPath);
      const totalBytes = parseInt(response.headers['content-length'], 10);
      let downloadedBytes = 0;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${percent}%`);
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\n✓ Download complete');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(targetPath, () => {});
      reject(err);
    });
  });
}

async function setupGhostscript() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Ghostscript Setup for CutPilot');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const platformKey = getPlatformKey();

  if (!platformKey) {
    console.log('✗ Unsupported platform');
    return;
  }

  const config = GHOSTSCRIPT_URLS[platformKey];
  if (!config) {
    console.log(`✗ No configuration for platform: ${platformKey}`);
    return;
  }

  ensureDirectoryExists(BINARIES_DIR);

  const binaryPath = path.join(BINARIES_DIR, config.binary);

  // Check if binary already exists
  if (checkIfBinaryExists(binaryPath)) {
    console.log('✓ Ghostscript binary already exists');
    console.log(`  Location: ${binaryPath}`);
    console.log('');
    return;
  }

  console.log(`Platform: ${platformKey}`);
  console.log(`Target: ${config.binary}`);
  console.log('');

  // Handle system-based installation (macOS/Linux)
  if (config.useSystem) {
    console.log('Using system Ghostscript...');
    const success = copySystemGhostscript(binaryPath);

    if (success) {
      console.log('');
      console.log('✓ Ghostscript setup complete!');
    } else {
      console.log('');
      console.log('⚠ Setup incomplete - manual installation required');
      console.log('  See: src-tauri/binaries/README.md');
    }

    console.log('');
    return;
  }

  // Handle Windows installer download
  if (config.installer) {
    console.log('Windows detected - manual installation required:');
    console.log('');
    console.log('1. Download Ghostscript from:');
    console.log('   https://ghostscript.com/releases/gsdnld.html');
    console.log('');
    console.log('2. Install it (default location is fine)');
    console.log('');
    console.log('3. Copy the binary:');
    console.log('   From: C:\\Program Files\\gs\\gs10.XX.X\\bin\\gswin64c.exe');
    console.log(`   To:   ${binaryPath}`);
    console.log('');
    console.log('Or run this PowerShell command (as Administrator):');
    console.log(`   Copy-Item "C:\\Program Files\\gs\\gs*\\bin\\gswin64c.exe" "${binaryPath}"`);
    console.log('');
    return;
  }
}

// Run setup
setupGhostscript().catch((error) => {
  console.error('Error during Ghostscript setup:', error);
  process.exit(0); // Don't fail npm install
});
