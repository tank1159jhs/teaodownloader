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
    loading_text: "Downloading your video...",
    error_title: "❌ Error",
    retry_btn: "Try Again",
    success_title: "✅ Ready to Download",
    download_again_btn: "Download Another",
    started: "Download started! Please wait."
  },
  ko: {
    hero_title: "⚡ TAEO",
    hero_subtitle: "빠르고 쉬운 영상 다운로더",
    hero_description: "틱톡, 인스타그램, 유튜브 영상을 즉시 다운로드하세요. 워터마크 없이 무료로 제공됩니다.",
    input_placeholder: "여기에 영상 링크를 붙여넣으세요...",
    download_btn: "다운로드",
    loading_text: "영상을 다운로드 중입니다...",
    error_title: "❌ 오류 발생",
    retry_btn: "다시 시도",
    success_title: "✅ 다운로드 준비 완료",
    download_again_btn: "추가 다운로드",
    started: "다운로드가 시작되었습니다! 잠시만 기다려주세요."
  },
  ja: {
    hero_title: "⚡ TAEO",
    hero_subtitle: "最速ビデオダウンローダー",
    hero_description: "TikTok、Instagram、YouTubeの動画を即座にダウンロード。ウォ터マークなし、完全無料。",
    input_placeholder: "ここにリンクを貼り付けてください...",
    download_btn: "ダウンロード",
    loading_text: "動画をダウンロード中です...",
    error_title: "❌ エラー",
    retry_btn: "再試行",
    success_title: "✅ ダウンロード準備完了",
    download_again_btn: "続けてダウンロード",
    started: "ダウンロードを開始했습니다! 少々お待ちください。"
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
  downloadBtn.disabled = true;
}

function showSuccess(msg) {
  loadingUI.classList.add('hidden');
  successUI.classList.remove('hidden');
  downloadBtn.disabled = false;
}

function showError(msg) {
  loadingUI.classList.add('hidden');
  errorUI.classList.remove('hidden');
  errorMessage.textContent = msg;
  downloadBtn.disabled = false;
}

function resetForm() {
  urlInput.value = '';
  loadingUI.classList.add('hidden');
  errorUI.classList.add('hidden');
  successUI.classList.add('hidden');
}

function downloadVideo() {
  const url = urlInput.value.trim();
  if (!url) {
    const langPath = window.location.pathname.split('/')[1] || 'en';
    const t = TRANSLATIONS[langPath] || TRANSLATIONS['en'];
    showError(t.input_placeholder);
    return;
  }
  
  showLoading();

  // HTML Form을 동적으로 생성하여 POST 전송 (브라우저 네이티브 다운로드 트리거)
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

  setTimeout(() => {
    const langPath = window.location.pathname.split('/')[1] || 'en';
    const t = TRANSLATIONS[langPath] || TRANSLATIONS['en'];
    showSuccess(t.started);
  }, 2000);
}

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
