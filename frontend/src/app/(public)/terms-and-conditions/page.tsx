export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16">
      <div data-testid="legal-content-container" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border border-[#d1d6da] rounded-xl p-8 shadow-sm space-y-6">
        <h1 className="text-3xl font-extrabold text-[#252525]">Terms and Conditions</h1>
        <p className="text-xs text-[#737475]">Effective Date: October 2026</p>

        <div className="space-y-4 text-sm text-[#515151] leading-relaxed">
          <p>
            Welcome to Belooga. By registering for an account or using our video recruitment platform, you agree to comply with and be bound by the following terms.
          </p>
          <h2 className="text-lg font-bold text-[#252525]">1. Authentic Representation</h2>
          <p>
            Candidates agree to provide accurate, truthful employment history and credentials. Uploading fraudulent resumes or impersonating others will result in immediate profile suspension.
          </p>
          <h2 className="text-lg font-bold text-[#252525]">2. Video Content Standards</h2>
          <p>
            All 30-second elevator pitches must maintain professional standards. Prohibited content includes hate speech, harassment, explicit media, or proprietary employer disclosures.
          </p>
          <h2 className="text-lg font-bold text-[#252525]">3. Platform Availability</h2>
          <p>
            We strive for 99.9% uptime across our Next.js frontend and FastAPI backend infrastructure. Scheduled maintenance will be announced in advance.
          </p>
        </div>
      </div>
    </div>
  );
}
