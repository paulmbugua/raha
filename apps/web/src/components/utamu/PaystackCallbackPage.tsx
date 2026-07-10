'use client';

import { useEffect, useState } from 'react';
import { utamuApi } from '../../lib/utamuApi';

export default function PaystackCallbackPage() {
  const [message, setMessage] = useState('Confirming Paystack payment...');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref') || '';
    if (!reference) {
      setMessage('Payment reference is missing.');
      return;
    }
    utamuApi.verifyPaystackPayment(reference)
      .then((result: any) => setMessage(result.status === 'paid' ? 'Payment confirmed. VIP visibility is now active.' : 'Payment is still pending.'))
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Payment confirmation failed.'));
  }, []);
  return <section className="grid min-h-[70vh] place-items-center bg-[#fff0f6] px-5"><div className="max-w-xl rounded-[3px] bg-white p-6 text-center shadow"><h1 className="text-3xl text-[#ff4eb8]">Payment confirmation</h1><p className="mt-4 text-[#3b164b]">{message}</p><a href="/" className="mt-5 inline-flex rounded-full bg-[#e60073] px-5 py-2 text-sm font-bold text-white">Return to Secret Nairobi</a></div></section>;
}
