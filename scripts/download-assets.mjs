import fs from 'node:fs/promises';
import path from 'node:path';

const GSTATIC_BASE = 'https://www.gstatic.com/aistudio/starter-apps/tennis';
const DOWNLOAD_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;

const ASSETS_TO_DOWNLOAD = [
  // 3D Models (.glb)
  'models/stadium_court.glb',
  'models/tennis_net.glb',
  'models/mii_player.glb',
  'models/mii_opponent.glb',
  'models/tennis_racket.glb',
  'models/tennis_ball.glb',
  'models/mii_crowd.glb',
  // MediaPipe Hands binary/model assets
  'mediapipe/hands/hands.binarypb',
  'mediapipe/hands/hands_solution_packed_assets.data',
  'mediapipe/hands/hands_solution_simd_wasm_bin.wasm',
  'mediapipe/hands/hands_solution_wasm_bin.wasm',
  'mediapipe/hands/hand_landmark_full.tflite',
  'mediapipe/hands/hand_landmark_lite.tflite',
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadAsset(relPath) {
  const destPath = path.resolve('public', 'assets', relPath);

  try {
    const stat = await fs.stat(destPath);
    if (stat.isFile() && stat.size > 0) {
      console.log(`[download-assets] Already present: ${relPath}`);
      return;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  await fs.mkdir(path.dirname(destPath), { recursive: true });
  const url = `${GSTATIC_BASE}/${relPath}`;
  const tempPath = `${destPath}.${process.pid}.tmp`;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    try {
      console.log(`[download-assets] Downloading ${relPath} (attempt ${attempt}/${MAX_ATTEMPTS})`);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Argon-Tennis-Asset-Downloader' },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0) {
        throw new Error('The server returned an empty asset');
      }

      // Write to a temporary file first so an interrupted download cannot
      // leave a non-empty but incomplete file that future builds will trust.
      await fs.writeFile(tempPath, buffer);
      await fs.rename(tempPath, destPath);
      console.log(`[download-assets] Ready: ${relPath} (${buffer.length} bytes)`);
      return;
    } catch (error) {
      lastError = error;
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.warn(`[download-assets] Could not remove temporary file for ${relPath}:`, cleanupError.message);
        }
      }

      if (attempt < MAX_ATTEMPTS) {
        const waitMs = 500 * (2 ** (attempt - 1));
        console.warn(`[download-assets] Attempt ${attempt} failed for ${relPath}: ${error.message}. Retrying in ${waitMs}ms.`);
        await delay(waitMs);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Failed to download ${relPath} after ${MAX_ATTEMPTS} attempts: ${lastError?.message ?? 'Unknown error'}`);
}

async function main() {
  console.log('[download-assets] Ensuring static 3D models and MediaPipe assets in public/assets/...');
  const results = await Promise.allSettled(ASSETS_TO_DOWNLOAD.map(downloadAsset));
  const failures = results
    .map((result, index) => ({ result, asset: ASSETS_TO_DOWNLOAD[index] }))
    .filter(({ result }) => result.status === 'rejected');

  if (failures.length > 0) {
    console.error(`[download-assets] ${failures.length} asset(s) failed:`);
    for (const { asset, result } of failures) {
      console.error(`  - ${asset}: ${result.reason?.message ?? result.reason}`);
    }
    throw new Error('Static asset preparation failed; build stopped to avoid shipping an incomplete game.');
  }

  console.log(`[download-assets] All ${ASSETS_TO_DOWNLOAD.length} static assets are ready.`);
}

main().catch((err) => {
  console.error('[download-assets] Error:', err.message);
  process.exitCode = 1;
});
