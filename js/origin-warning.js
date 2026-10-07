function createOriginWarning(message) {
  const page = document.querySelector('.page');
  if (!page) return;

  let warning = document.getElementById('installWarning');
  if (!warning) {
    warning = document.createElement('div');
    warning.id = 'installWarning';
    warning.className = 'warning';
    page.insertBefore(warning, page.firstChild);
  }

  warning.innerHTML = message;
  warning.style.display = 'block';
}

function createStatusMessage(message, isError = false) {
  const page = document.querySelector('.page');
  if (!page) return;

  let status = document.getElementById('networkStatus');
  if (!status) {
    status = document.createElement('div');
    status.id = 'networkStatus';
    status.className = 'status';
    page.insertBefore(status, page.firstChild);
  }

  status.className = 'status';
  status.classList.toggle('status--error', isError);
  status.textContent = message;
  status.style.display = 'block';

  if (!isError) {
    setTimeout(() => {
      if (status) {
        status.style.display = 'none';
      }
    }, 4000);
  }
}

function showOriginWarning() {
  const usingFile = location.protocol === 'file:';
  const insecureWeb =
    location.protocol !== 'https:' &&
    !['localhost', '127.0.0.1'].includes(location.hostname);

  if (usingFile) {
    createOriginWarning(
      '⚠️ تم فتح التطبيق مباشرةً من ملف. لكي يعمل التثبيت والتخزين وحفظ اللوحات بشكل صحيح، يرجى تشغيل التطبيق عبر خادم محلي مثل <strong>python -m http.server 8000</strong> ثم فتح <strong>http://127.0.0.1:8000</strong>.'
    );
  } else if (insecureWeb) {
    createOriginWarning(
      '⚠️ هذا التطبيق يحتاج إلى صفحة آمنة (https) أو localhost لكي يعمل التثبيت والتخزين بشكل كامل. إذا ظهرت مشكلة، يُرجى استخدام خادم محلي.'
    );
  }
}

function handleOnlineStatus() {
  createStatusMessage('✅ عادت الشبكة! التطبيق جاهز للاستخدام.');
}

function handleOfflineStatus() {
  createStatusMessage('⚠️ أنت الآن بدون اتصال. التطبيق يعمل في الوضع غير المتصل.', true);
}

function initNetworkStatus() {
  if (!navigator.onLine) {
    handleOfflineStatus();
  }

  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOfflineStatus);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') {
    return;
  }
  navigator.serviceWorker
    .register('service-worker.js', { updateViaCache: 'none' })
    .then((registration) => {
      registration.update().catch(() => {});
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

window.addEventListener('DOMContentLoaded', () => {
  showOriginWarning();
  initNetworkStatus();
  registerServiceWorker();
});
