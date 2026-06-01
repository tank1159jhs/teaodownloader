const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const loadingUI = document.getElementById('loadingUI');
const errorUI = document.getElementById('errorUI');
const errorMessage = document.getElementById('errorMessage');
const successUI = document.getElementById('successUI');

const TRANSLATIONS = {
  en: {
    hero_title: "⚡ TAEO",
    hero_subtitle: "Fast & Easy Video Downloader",
    hero_description: "Download TikTok, Instagram & YouTube videos instantly. No watermark, completely free.",
    input_placeholder: "Paste video link here...",
    download_btn: "Download",
    loading: "Analyzing video...",
    error_occurred: "Error",
    error_default: "Failed to process video.",
    error_unsupported: "Unsupported URL format. Please paste a direct video link.",
    retry_btn: "Try Again",
    success_title: "✅ Request Sent",
    download_another: "Download Another",
    started: "Processing started! Your download will begin shortly.",
    save_log: "The save location window will appear shortly (within 20 seconds). Please do not close this page.",
    complete_dialog: "Complete! Opening Save Dialog...",
    feature_fast_title: "Lightning Fast",
    feature_fast_desc: "Download videos in seconds",
    feature_hq_title: "High Quality",
    feature_hq_desc: "Best available quality",
    feature_wm_title: "No Watermark",
    feature_wm_desc: "Clean downloads",
    feature_sec_title: "Secure",
    feature_sec_desc: "Your privacy protected",
    faq_title: "Frequently Asked Questions",
    faq_q1: "What platforms do you support?",
    faq_a1: "We support TikTok, Instagram, and YouTube. Simply paste the video URL and click download.",
    faq_q2: "Is TAEO free to use?",
    faq_a2: "Yes! TAEO is completely free. We support ourselves through non-intrusive advertising (if any).",
    faq_q3: "Where are videos saved?",
    faq_a3: "Files are streamed directly and not stored on our server permanently. Privacy first!",
    legal_notice_title: "Copyright Notice:",
    legal_notice_desc: "Only download content that you have permission to download. TAEO is a tool and is not responsible for how you use it. Always respect creator rights."
  },
  ko: {
    hero_title: "⚡ TAEO",
    hero_subtitle: "빠르고 쉬운 영상 다운로더",
    hero_description: "틱톡, 인스타그램, 유튜브 영상을 즉시 다운로드하세요. 워터마크 없이 무료로 제공됩니다.",
    input_placeholder: "여기에 영상 링크를 붙여넣으세요...",
    download_btn: "다운로드",
    loading: "영상 분석 중...",
    error_occurred: "오류 발생",
    error_default: "다운로드 처리에 실패했습니다.",
    error_unsupported: "지원하지 않는 URL 형식입니다. 영상 상세 주소를 입력해 주세요.",
    retry_btn: "다시 시도",
    success_title: "✅ 요청 완료",
    download_another: "추가 다운로드",
    started: "처리가 시작되었습니다! 곧 다운로드가 진행됩니다.",
    save_log: "저장 위치 선택 창이 나타날 때까지 최대 20초 정도 소요될 수 있습니다. 창이 뜰 때까지 잠시만 기다려 주세요.",
    complete_dialog: "완료! 저장 창을 여는 중...",
    feature_fast_title: "초고속 다운로드",
    feature_fast_desc: "몇 초 만에 영상을 소장하세요",
    feature_hq_title: "고화질 유지",
    feature_hq_desc: "가능한 최상의 화질을 제공합니다",
    feature_wm_title: "워터마크 제거",
    feature_wm_desc: "깨끗한 원본 그대로 다운로드",
    feature_sec_title: "안전한 보안",
    feature_sec_desc: "사용자의 개인정보를 보호합니다",
    faq_title: "자주 묻는 질문",
    faq_q1: "어떤 플랫폼을 지원하나요?",
    faq_a1: "틱톡, 인스타그램(릴스), 유튜브를 지원합니다. URL만 붙여넣으면 끝!",
    faq_q2: "정말 무료인가요?",
    faq_a2: "네! TAEO는 누구나 무료로 이용할 수 있는 서비스입니다.",
    faq_q3: "영상이 어디에 저장되나요?",
    faq_a3: "서버에 영구 저장되지 않고 즉시 사용자에게 스트리밍됩니다. 안심하세요!",
    legal_notice_title: "저작권 고지:",
    legal_notice_desc: "반드시 저작권자의 허가를 받은 콘텐츠만 다운로드하세요. TAEO는 도구일 뿐이며 사용자의 이용 방식에 책임을 지지 않습니다. 제작자의 권리를 존중해 주세요."
  },
  ja: {
    hero_title: "⚡ TAEO",
    hero_subtitle: "最速ビデオダウンローダー",
    hero_description: "TikTok、Instagram、YouTubeの動画を即座にダウンロード。ウォーターマークなし、完全無料。",
    input_placeholder: "ここにリンク를 貼り付けてください...",
    download_btn: "ダウンロード",
    loading: "動画を分析中...",
    error_occurred: "エラー",
    error_default: "処理に失敗しました。",
    error_unsupported: "サポートされていない形式です。動画の個別URLを入力してください。",
    retry_btn: "再試行",
    success_title: "✅ リクエスト完了",
    download_another: "続けてダウンロード",
    started: "処理を開始しました！まもなくダウンロードが始まります。",
    save_log: "保存場所の選択ウィンドウが表示されるまで、最大20秒ほどかかる場合があります. ウィンドウが表示されるまでそのままお待ちください。",
    complete_dialog: "完了！保存ウィンドウを開いています...",
    feature_fast_title: "超高速",
    feature_fast_desc: "数秒で動画を保存",
    feature_hq_title: "高画質",
    feature_hq_desc: "最高の画質で提供",
    feature_wm_title: "ロゴなし",
    feature_wm_desc: "ウォーターマークなしの保存",
    feature_sec_title: "安全第一",
    feature_sec_desc: "プライバシーを徹底保護",
    faq_title: "よくある質問",
    faq_q1: "どのサイトに対応していますか？",
    faq_a1: "TikTok、Instagram、YouTubeに対応しています。URLを貼るだけでOKです。",
    faq_q2: "利用料金はかかりますか？",
    faq_a2: "いいえ、完全に無料です。どなたでも自由にご利用いただけます。",
    faq_q3: "動画はどこに保存されますか？",
    faq_a3: "サーバーには保存されず、直接転送されます。プライバシーは守られます。",
    legal_notice_title: "著作権に関する注意:",
    legal_notice_desc: "著作権者の許可を得たコンテンツのみをダウンロードしてください。TAEOはツールであり、利用方法に関する責任は負いません。クリエイターの権利を尊重してください。"
  }
};

function initLanguage() {
  const langSelect = document.getElementById('langSelect');
  const pathParts = window.location.pathname.split('/');
  let currentLang = pathParts[1] || 'en';
  
  if (!['en', 'ko', 'ja'].includes(currentLang)) currentLang = 'en';
  
  langSelect.value = currentLang;
  applyTranslations(currentLang);

  langSelect.addEventListener('change', (e) => {
    const newLang = e.target.value;
    window.location.href = `/${newLang}/`;
  });
}

function applyTranslations(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
}

function showLoading() {
  loadingUI.classList.remove('hidden');
  errorUI.classList.add('hidden');
  successUI.classList.add('hidden');
  const progressContainer = document.getElementById('progressContainer');
  if (progressContainer) progressContainer.classList.add('hidden');
  downloadBtn.disabled = true;
}

function showSuccess(msg) {
  loadingUI.classList.add('hidden');
  errorUI.classList.add('hidden');
  successUI.classList.remove('hidden');
  downloadBtn.disabled = false;
}

function showError(msg) {
  loadingUI.classList.add('hidden');
  successUI.classList.add('hidden');
  errorUI.classList.remove('hidden');
  
  const langPath = window.location.pathname.split('/')[1] || 'en';
  const t = TRANSLATIONS[langPath] || TRANSLATIONS['en'];
  
  // 서버에서 온 에러 메시지가 특정 패턴일 경우 다국어 처리
  if (msg.includes('지원하지 않는 URL')) {
    errorMessage.textContent = t.error_unsupported;
  } else {
    errorMessage.textContent = msg || t.error_default;
  }
  
  downloadBtn.disabled = false;
}

function resetForm() {
  urlInput.value = '';
  loadingUI.classList.add('hidden');
  errorUI.classList.add('hidden');
  successUI.classList.add('hidden');
  const progressContainer = document.getElementById('progressContainer');
  if (progressContainer) progressContainer.classList.add('hidden');
}

async function trackProgress(url) {
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  if (!progressContainer || !progressBar || !progressText) return;

  const langPath = window.location.pathname.split('/')[1] || 'en';
  const t = TRANSLATIONS[langPath] || TRANSLATIONS['en'];

  const msgUint8 = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const progressId = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

  progressContainer.classList.remove('hidden');
  progressBar.style.width = '0%';
  progressText.textContent = '0%';
  
  const eventSource = new EventSource(`/api/progress/${progressId}`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const progress = data.progress;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
    
    if (progress >= 100) {
      eventSource.close();
      progressText.textContent = t.complete_dialog;
    }
  };

  eventSource.onerror = () => eventSource.close();
}

async function downloadVideo() {
  const url = urlInput.value.trim();
  const langPath = window.location.pathname.split('/')[1] || 'en';
  const t = TRANSLATIONS[langPath] || TRANSLATIONS['en'];

  if (!url) {
    showError(t.input_placeholder);
    return;
  }
  
  showLoading();

  try {
    // 먼저 분석 시도하여 캐시 생성 및 에러 체크
    const analyzeRes = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!analyzeRes.ok) {
      const errData = await analyzeRes.json().catch(() => ({}));
      showError(errData.message || t.error_default);
      return;
    }

    // 분석 성공 시 진행률 추적 시작 및 다운로드 실행
    trackProgress(url);
    showSuccess(t.started);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/download';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'url';
    input.value = url;
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

  } catch (err) {
    showError(t.error_default);
  }
}

// [속도 최적화] 메타데이터 미리 분석 (Pre-fetch)
let lastAnalyzedUrl = '';
async function preFetchMetadata(url) {
  if (!url || url === lastAnalyzedUrl) return;
  if (!url.startsWith('http')) return;
  
  lastAnalyzedUrl = url;
  try {
    await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
  } catch (err) {}
}

urlInput.addEventListener('input', (e) => preFetchMetadata(e.target.value.trim()));
urlInput.addEventListener('paste', (e) => {
  const pastedData = (e.clipboardData || window.clipboardData).getData('text');
  preFetchMetadata(pastedData.trim());
});

downloadBtn.addEventListener('click', downloadVideo);
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') downloadVideo();
});

document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    button.parentElement.classList.toggle('active');
  });
});

initLanguage();
window.resetForm = resetForm;
