/**
 * Simple toast notification utility.
 * Creates a temporary notification element at top-right, auto-dismisses after 3s with fade-out.
 */

const TOAST_DURATION_MS = 3000;
const FADE_OUT_MS = 300;

let toastContainer = null;
let hideTimeout = null;

function ensureContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(message, type = 'success') {
  if (hideTimeout) clearTimeout(hideTimeout);

  const container = ensureContainer();
  container.innerHTML = '';

  const el = document.createElement('div');
  el.className =
    type === 'success'
      ? 'rounded-lg border border-primary-500 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800 shadow-lg transition-opacity duration-300'
      : type === 'error'
        ? 'rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 shadow-lg transition-opacity duration-300'
        : 'rounded-lg border border-gray-400 bg-gray-100 px-4 py-3 text-sm font-medium text-gray-800 shadow-lg transition-opacity duration-300';
  el.textContent = message;
  el.setAttribute('role', 'alert');
  container.appendChild(el);

  hideTimeout = setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, FADE_OUT_MS);
    hideTimeout = null;
  }, TOAST_DURATION_MS);
}

/**
 * Show a success toast (green/blue styling).
 * @param {string} message - Message to display (e.g. "✓ Ansible task copied to clipboard")
 */
export function toastSuccess(message) {
  showToast(message, 'success');
}

/**
 * Show an info toast.
 * @param {string} message - Message to display
 */
export function toastInfo(message) {
  showToast(message, 'info');
}

/**
 * Show an error toast (red styling).
 * @param {string} message - Message to display
 */
export function toastError(message) {
  showToast(message, 'error');
}
