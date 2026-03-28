'use client';

import { useApp } from '@/context/AppContext';
import Link from 'next/link';

export default function Footer() {
  const { config } = useApp();
  const primary = config?.primaryColor ?? '#2563eb';
  const footer = config?.content?.footer;

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <p className="font-bold text-lg" style={{ color: primary }}>{config?.businessName ?? 'BizStore'}</p>
            {config?.tagline && <p className="text-sm text-gray-500 mt-1">{config.tagline}</p>}
            {/* Social links — agent sets content.footer.socialLinks */}
            {footer?.socialLinks && (
              <div className="flex gap-3 mt-4">
                {footer.socialLinks.instagram && (
                  <a href={`https://instagram.com/${footer.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 text-xs">Instagram</a>
                )}
                {footer.socialLinks.facebook && (
                  <a href={`https://facebook.com/${footer.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 text-xs">Facebook</a>
                )}
                {footer.socialLinks.twitter && (
                  <a href={`https://twitter.com/${footer.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 text-xs">Twitter</a>
                )}
                {footer.socialLinks.tiktok && (
                  <a href={`https://tiktok.com/@${footer.socialLinks.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 text-xs">TikTok</a>
                )}
              </div>
            )}
          </div>

          {/* Contact — agent sets content.footer.contactEmail, contactPhone, address */}
          {(footer?.contactEmail || footer?.contactPhone || footer?.address) && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Contact</p>
              <div className="space-y-1 text-sm text-gray-500">
                {footer.contactEmail && <p><a href={`mailto:${footer.contactEmail}`} className="hover:text-gray-700">{footer.contactEmail}</a></p>}
                {footer.contactPhone && <p>{footer.contactPhone}</p>}
                {footer.address && <p className="whitespace-pre-line">{footer.address}</p>}
              </div>
            </div>
          )}

          {/* Policies — agent sets content.footer.policies */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Store</p>
            <div className="space-y-1 text-sm text-gray-500">
              <Link href="/shop" className="block hover:text-gray-700">Shop</Link>
              {footer?.policies?.shipping && <p className="text-xs leading-relaxed">{footer.policies.shipping}</p>}
              {footer?.policies?.returns && <p className="text-xs leading-relaxed">{footer.policies.returns}</p>}
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} {config?.businessName ?? 'BizStore'}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
