import { useMemo } from 'react';
import { TakeGrid } from '../components/TakeGrid';
import { EmptyState } from '../components/ui';
import { useStore } from '../lib/store';

export default function Liked() {
  const recordings = useStore((s) => s.recordings);
  const liked = useMemo(() => recordings.filter((r) => r.liked), [recordings]);
  return (
    <TakeGrid
      recordings={liked}
      scope="liked"
      showScript
      empty={<EmptyState title="No liked videos yet" body="Long-press any take and tap Like to keep it here." />}
    />
  );
}
