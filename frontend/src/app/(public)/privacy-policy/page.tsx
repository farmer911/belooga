export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16">
      <div data-testid="legal-content-container" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border border-[#d1d6da] rounded-xl p-8 shadow-sm space-y-6">
        <h1 className="text-3xl font-extrabold text-[#252525]">Privacy Policy</h1>
        <p className="text-xs text-[#737475]">Last Updated: October 2026</p>

        <div className="space-y-4 text-sm text-[#515151] leading-relaxed">
          <p>
            At Belooga, we prioritize the privacy and security of candidates and recruiting partners. This Privacy Policy outlines how we collect, store, and process your video pitches, resumes, and credentials.
          </p>
          <h2 className="text-lg font-bold text-[#252525]">1. Data Collection & Media Storage</h2>
          <p>
            When you register an account, we collect your name, email address, password hash (Argon2id), professional timeline, and optional video elevator pitch. Video recordings are stored securely in encrypted object storage and are never shared with unauthorized third parties.
          </p>
          <h2 className="text-lg font-bold text-[#252525]">2. Profile Visibility Controls</h2>
          <p>
            You retain absolute ownership of your profile. Setting your candidate workspace to "Hidden" immediately restricts public visibility and prevents search indexing across our discovery engine.
          </p>
          <h2 className="text-lg font-bold text-[#252525]">3. GDPR & Right to Erasure</h2>
          <p>
            You may request complete account deletion at any time via your account settings. This action permanently cascades across all candidate media, timeline records, and session vaults.
          </p>
        </div>
      </div>
    </div>
  );
}
