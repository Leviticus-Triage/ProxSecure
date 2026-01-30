import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toastSuccess } from '../../utils/toast';

/**
 * Copy-to-clipboard button. Shows "✓ Copied!" for 2s after successful copy and triggers toast.
 * @param {Object} props
 * @param {string} props.text - Content to copy
 * @param {string} [props.toastMessage] - Message for toast (default: "✓ Ansible task copied to clipboard")
 */
export default function CopyButton({ text, toastMessage = '✓ Ansible task copied to clipboard' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toastSuccess(toastMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          ✓ Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </button>
  );
}
