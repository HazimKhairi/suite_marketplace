import { TrackClient } from './track-client';

export const metadata = { title: 'Track order · Suite Marketplace' };
export const dynamic = 'force-dynamic';

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; phone?: string }>;
}) {
  const { order, phone } = await searchParams;
  return <TrackClient initialOrder={order ?? ''} initialPhone={phone ?? ''} />;
}
