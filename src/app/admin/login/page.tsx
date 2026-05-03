import { LoginClient } from './login-client';

export const metadata = { title: 'Admin login / Suite Marketplace' };

export default function AdminLoginPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-24">
      <div className="max-w-md mx-auto">
        <p className="eyebrow">Suite Marketplace</p>
        <h1 className="h-display text-[56px] mt-4">Admin.</h1>
        <p className="mt-4 body-lede text-muted text-[14px]">
          Restricted to authorized organizers of Sukan UiTM Kuala Terengganu 2026.
        </p>
        <LoginClient />
      </div>
    </div>
  );
}
