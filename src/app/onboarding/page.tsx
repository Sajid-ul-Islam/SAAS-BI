import React from 'react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const metadata = {
  title: 'Merchant Onboarding | SaaS BI Bangladesh',
  description: 'Connect your store and courier credentials in under 5 minutes',
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          SaaS BI Bangladesh
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          The unified BI analytics platform for WooCommerce, Shopify, Pathao, and Steadfast
        </p>
      </div>

      <OnboardingWizard />
    </div>
  );
}
