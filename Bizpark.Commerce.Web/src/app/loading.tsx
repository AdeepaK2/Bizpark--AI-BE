export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent bg-primary border-primary" style={{ borderTopColor: 'transparent' }} />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
