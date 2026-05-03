import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-gray-200">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">Page not found</h1>
        <p className="text-gray-500 mt-2 text-sm">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex gap-3 justify-center mt-8">
          <Link href="/" className="px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-primary">
            Go Home
          </Link>
          <Link href="/shop" className="px-5 py-2.5 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50">
            Browse Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
