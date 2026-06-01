import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { URL, fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// [성능 최적화] 노드 처리 능력 확장
process.env.UV_THREADPOOL_SIZE = '64';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const FRONTEND_PATH = path.join(__dirname, '../frontend');

// [성능 최적화] 하드디스크 대신 RAM 디스크(/dev/shm) 사용 - I/O 병목 제거
const TEMP_DIR = '/dev/shm/taeo_downloads';
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =================================
// 설정
// =================================
const WHITELISTED_DOMAINS = ['tiktok.com', 'instagram.com', 'youtube.com', 'x.com', 'twitter.com', 'youtu.be'];
const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB
const CONCURRENT_JOBS = 5; // 무료 서버 부하 고려하여 5개로 최적화
const DOWNLOAD_TIMEOUT = 10 * 60 * 1000;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;

// =================================
// 전역 상태 및 캐시
// =================================
let activeJobs = 0;
const ipRequestMap = new Map();
const metadataCache = new Map();
const pendingAnalyzes = new Map();

function setCache(url, data) {
  metadataCache.set(url, { data, timestamp: Date.now() });
  pendingAnalyzes.delete(url);
  setTimeout(() => {
    const cached = metadataCache.get(url);
    if (cached && Date.now() - cached.timestamp >= 10 * 60 * 1000) {
      metadataCache.delete(url);
    }
  }, 10 * 60 * 1000);
}

// =================================
// 플랫폼별 독립 설정
// =================================
const PLATFORM_CONFIGS = {
  youtube: {
    domains: ['youtube.com', 'youtu.be'],
    format: 'bv+ba/b',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    referer: 'https://www.youtube.com/',
    useProxy: true,
    extraArgs: [
      '--extractor-args', 'youtube:player_client=android,web',
      '--force-ipv4',
      '--no-playlist',
      '--no-check-certificates'
    ]
  },
  tiktok: {
    domains: ['tiktok.com'],
    format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    referer: 'https://www.google.com/',
    useProxy: true,
    extraArgs: ['--no-playlist']
  },
  instagram: {
    domains: ['instagram.com'],
    format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    referer: 'https://www.google.com/',
    useProxy: true,
    extraArgs: ['--no-playlist']
  },
  twitter: {
    domains: ['x.com', 'twitter.com'],
    format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    referer: 'https://x.com/',
    useProxy: true,
    extraArgs: ['--no-playlist']
  }
};

// =================================
// 유틸리티 함수
// =================================
function generateRandomId() {
  return crypto.randomBytes(8).toString('hex');
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
}

function checkRateLimit(ip) {
  const now = Date.now();
  if (!ipRequestMap.has(ip)) ipRequestMap.set(ip, []);
  const timestamps = ipRequestMap.get(ip);
  const recentRequests = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recentRequests.length >= RATE_LIMIT_MAX) return false;
  recentRequests.push(now);
  ipRequestMap.set(ip, recentRequests);
  return true;
}

function validateUrl(urlString) {
  try {
    const url = new URL(urlString);
    return { valid: ['http:', 'https:'].includes(url.protocol), url };
  } catch (err) {
    return { valid: false };
  }
}

function getPlatformConfig(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    for (const key in PLATFORM_CONFIGS) {
      if (PLATFORM_CONFIGS[key].domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
        return PLATFORM_CONFIGS[key];
      }
    }
  } catch (e) {}
  return null;
}

async function executeYtDlp(args, config = null, timeout = DOWNLOAD_TIMEOUT, useAccel = false, jobId = null) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const ytdlpArgs = [...args, '--no-warnings', '--geo-bypass'];

    if (config) {
      if (config.userAgent) ytdlpArgs.push('--user-agent', config.userAgent);
      if (config.referer) ytdlpArgs.push('--referer', config.referer);
      if (config.extraArgs) ytdlpArgs.push(...config.extraArgs);
    }
    
    const cookiesPath = process.env.YTDLP_COOKIES || '/home/opc/cookies.txt';
    if (fs.existsSync(cookiesPath)) ytdlpArgs.push('--cookies', cookiesPath);
    
    const hasProxy = process.env.YTDLP_PROXY && (!config || config.useProxy !== false);
    if (hasProxy) {
      ytdlpArgs.push('--proxy', process.env.YTDLP_PROXY);
    }

    if (useAccel) {
      ytdlpArgs.push('--downloader', 'aria2c');
      const ariaArgs = ['-x 16', '-s 16', '-j 16', '-k 1M', '--stream-piece-selector=random'];
      if (hasProxy) {
        ariaArgs.push(`--all-proxy=${process.env.YTDLP_PROXY}`);
      }
      ytdlpArgs.push('--downloader-args', `aria2c:${ariaArgs.join(' ')}`);
    }

    const proc = spawn('yt-dlp', ytdlpArgs, { timeout });
    
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      // yt-dlp/aria2c 출력에서 진행률(%) 추출 (예: [download] 10.5% ...)
      if (jobId) {
        const match = output.match(/(\d+\.?\d*)%/);
        if (match) jobProgress.set(jobId, parseFloat(match[1]));
      }
    });

    proc.stderr.on('data', (data) => stderr += data.toString());
    proc.on('close', (code) => {
      if (jobId) jobProgress.set(jobId, 100);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr.substring(0, 200) || `Exit code ${code}`));
    });
    proc.on('error', (err) => reject(new Error(`Spawn error: ${err.message}`)));
  });
}

function mapYtDlpErrorMessage(errorMessage) {
  if (errorMessage.includes('Sign in to confirm you’re not a bot')) return '유튜브 봇 차단 발생. 잠시 후 다시 시도해 주세요.';
  if (errorMessage.includes('video not found')) return '영상을 찾을 수 없습니다. URL을 확인해 주세요.';
  return '다운로드 실패. 다시 시도해 주세요.';
}

// =================================
// 라우트
// =================================
app.use(cors());
app.get(['/sw.js', '/verification.txt', '/verification.html'], (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, req.path.split('/').pop()));
});
app.use(express.static(FRONTEND_PATH));
app.get(['/en', '/ko', '/ja'], (req, res) => res.sendFile('index.html', { root: FRONTEND_PATH }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', activeJobs }));

app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).end();
  const validation = validateUrl(url);
  if (!validation.valid) return res.status(400).end();
  const config = getPlatformConfig(url);
  if (!config) return res.status(400).end();

  if (metadataCache.has(url)) return res.json({ status: 'cached' });
  if (pendingAnalyzes.has(url)) return res.json({ status: 'pending' });

  const analysisPromise = (async () => {
    try {
      console.log(`[PRE-FETCH] Analyzing: ${url}`);
      const { stdout: metadataJson } = await executeYtDlp([url, '--dump-json'], config, 60000);
      const metadata = JSON.parse(metadataJson);
      setCache(url, metadata);
      return metadata;
    } catch (err) {
      console.error(`[PRE-FETCH ERR] ${err.message}`);
      pendingAnalyzes.delete(url);
      throw err;
    }
  })();
  pendingAnalyzes.set(url, analysisPromise);
  res.json({ status: 'started' });
});

app.post('/api/download', async (req, res) => {
  const clientIp = getClientIp(req);
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL_REQUIRED' });

  if (!checkRateLimit(clientIp)) return res.status(429).json({ error: 'TOO_MANY_REQUESTS' });
  if (activeJobs >= CONCURRENT_JOBS) return res.status(429).json({ error: 'SERVER_BUSY' });

  const config = getPlatformConfig(url);
  if (!config) return res.status(400).json({ error: 'UNSUPPORTED_DOMAIN' });

  activeJobs++;
  const randomId = generateRandomId();
  const tempFilePath = path.join(TEMP_DIR, `${randomId}.mp4`);
  
  try {
    let metadata;
    const cached = metadataCache.get(url);
    const pending = pendingAnalyzes.get(url);
    
    if (cached) metadata = cached.data;
    else if (pending) metadata = await pending;
    else {
      const { stdout: metadataJson } = await executeYtDlp([url, '--dump-json'], config, 45000);
      metadata = JSON.parse(metadataJson);
    }

    if ((metadata.filesize || metadata.filesize_approx || 0) > MAX_FILE_SIZE) {
      throw new Error('FILE_TOO_LARGE');
    }

    // [성능 최적화] RAM 디스크에서 aria2c 가속 다운로드 시작
    console.log(`[ULTRA-ACCEL] ${metadata.title} -> RAM Disk`);
    const downloadArgs = [
      url,
      '-f', config.format,
      '-o', tempFilePath,
      '--no-part',
      '--merge-output-format', 'mp4',
      '--postprocessor-args', 'ffmpeg:-movflags frag_keyframe+empty_moov'
    ];
    
    await executeYtDlp(downloadArgs, config, DOWNLOAD_TIMEOUT, true);

    // [성능 최적화] 파일 전송 시 높은 우선순위 부여
    const cleanTitle = (metadata.title || randomId).replace(/[\\/:*?"<>|]/g, "").substring(0, 80);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanTitle)}.mp4"; filename*=UTF-8''${encodeURIComponent(cleanTitle)}.mp4`);
    res.setHeader('X-Accel-Buffering', 'no'); // 버퍼링 방지로 즉시 전송
    
    const fileStream = fs.createReadStream(tempFilePath, { highWaterMark: 128 * 1024 }); // 버퍼 크기 최적화
    fileStream.pipe(res);

    fileStream.on('end', () => {
      console.log(`[ULTRA-DONE] ${cleanTitle}`);
      fs.unlink(tempFilePath, () => {});
      jobProgress.delete(progressId);
      activeJobs--;
    });

    res.on('close', () => {
      fileStream.destroy();
      if (fs.existsSync(tempFilePath)) fs.unlink(tempFilePath, () => {});
      jobProgress.delete(progressId);
    });

  } catch (err) {
    console.error(`[DL-ERR] ${err.message}`);
    activeJobs--;
    if (fs.existsSync(tempFilePath)) fs.unlink(tempFilePath, () => {});
    if (!res.headersSent) res.status(500).json({ error: 'FAILED', message: mapYtDlpErrorMessage(err.message) });
  }
});

app.listen(PORT, () => console.log(`🚀 TAEO Ultra-Fast Server on port ${PORT}`));

process.on('uncaughtException', (err) => console.error('[UNCAUGHT]', err));
process.on('unhandledRejection', (err) => console.error('[UNHANDLED REJECTION]', err));

