"use client";

import { useEffect, useState } from "react";

const TERMS_KEY = "naatukavala-terms-accepted";
const TERMS_VERSION = "1";

export default function TermsAcceptance() {
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(TERMS_KEY);
    if (accepted !== TERMS_VERSION) {
      setTimeout(() => setShow(true), 0);
    }
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (!show) return null;

  function accept() {
    localStorage.setItem(TERMS_KEY, TERMS_VERSION);
    setShow(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 id="terms-title" className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Terms & Conditions
        </h2>
        <div className="mb-4 max-h-60 overflow-y-auto text-sm text-slate-600 dark:text-slate-300">
          <p className="mb-2">
            Welcome to Naatukavala (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By using our marketplace, you agree to these terms.
          </p>
          <p className="mb-2">
            <strong>1. Use of Service</strong> You must be 18+ to use this service. You are responsible for your account activity.
          </p>
          <p className="mb-2">
            <strong>2. Purchases</strong> All purchases are subject to seller terms. We facilitate transactions but are not party to contracts between buyers and sellers.
          </p>
          <p className="mb-2">
            <strong>3. Content</strong> You retain rights to your content. You grant us a license to display it on our platform.
          </p>
          <p className="mb-2">
            <strong>4. Limitation of Liability</strong> We provide the platform &ldquo;as is&rdquo; without warranties. We are not liable for indirect damages.
          </p>
          <p className="mb-2">
            <strong>5. Changes</strong> We may update these terms. Continued use constitutes acceptance.
          </p>
        </div>
        <button
          onClick={accept}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
}