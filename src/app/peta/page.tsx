import { redirect } from 'next/navigation';

// The standalone map page has been merged into /potensi-desa as the
// "Sebaran Koperasi" tab. Keep this route as a permanent redirect so old
// links/bookmarks continue to work.
export default function PetaPage() {
  redirect('/potensi-desa');
}
