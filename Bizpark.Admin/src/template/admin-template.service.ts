import { Injectable } from '@nestjs/common';
import { adminPrisma, Prisma, TemplateType } from 'bizpark.core';

type TemplateInput = {
  name: string;
  description?: string;
  type: TemplateType;
  deployment: Prisma.InputJsonValue;
  cmsSchema: Prisma.InputJsonValue;
  baseHtmlUrl?: string;
};

@Injectable()
export class AdminTemplateService {
  async listTemplates(): Promise<any[]> {
    return adminPrisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplateById(id: string): Promise<any | null> {
    return adminPrisma.template.findUnique({ where: { id } });
  }

  async createTemplate(input: TemplateInput): Promise<any> {
    return adminPrisma.template.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        deployment: input.deployment,
        cmsSchema: input.cmsSchema,
        baseHtmlUrl: input.baseHtmlUrl || null,
      },
    });
  }

  async updateTemplate(id: string, input: TemplateInput): Promise<any> {
    return adminPrisma.template.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        deployment: input.deployment,
        cmsSchema: input.cmsSchema,
        baseHtmlUrl: input.baseHtmlUrl || null,
      },
    });
  }

  async seedStarterTemplates(): Promise<number> {
    const starters: TemplateInput[] = [
      {
        name: 'Starter Service Classic',
        description: 'Clean local-services template with hero and about blocks.',
        type: 'SHOWCASE',
        baseHtmlUrl: undefined,
        deployment: {
          framework: 'NEXTJS',
          repositoryUrl: '',
          envRequirements: [],
          baseHtml: `<section style="font-family:Arial,sans-serif;padding:56px;max-width:980px;margin:0 auto;">
  <h1 style="font-size:42px;margin:0 0 10px;">{{hero.title}}</h1>
  <p style="font-size:18px;line-height:1.6;color:#334155;margin:0 0 18px;">{{hero.subtitle}}</p>
  <a href="#" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;">{{hero.ctaText}}</a>
  <div style="margin-top:30px;border:1px solid #e2e8f0;border-radius:14px;padding:22px;background:#f8fafc;">
    <h2 style="margin:0 0 8px;">{{about.heading}}</h2>
    <p style="margin:0;color:#475569;line-height:1.7;">{{about.body}}</p>
  </div>
</section>`,
        },
        cmsSchema: {
          sections: [
            {
              id: 'hero',
              label: 'Hero',
              fields: [
                { key: 'title', label: 'Hero Title', type: 'TEXT', defaultValue: 'Grow with confidence' },
                { key: 'subtitle', label: 'Hero Subtitle', type: 'TEXT', defaultValue: 'We help your business build a strong web presence.' },
                { key: 'ctaText', label: 'CTA Text', type: 'TEXT', defaultValue: 'Book a call' },
              ],
            },
            {
              id: 'about',
              label: 'About',
              fields: [
                { key: 'heading', label: 'About Heading', type: 'TEXT', defaultValue: 'About Our Team' },
                { key: 'body', label: 'About Body', type: 'TEXT', defaultValue: 'Add your unique strengths and customer promise here.' },
              ],
            },
          ],
        },
      },
      {
        name: 'Starter Restaurant Warm',
        description: 'Restaurant template with menu highlight and CTA.',
        type: 'SHOWCASE',
        baseHtmlUrl: undefined,
        deployment: {
          framework: 'NEXTJS',
          repositoryUrl: '',
          envRequirements: [],
          baseHtml: `<section style="font-family:Georgia,serif;padding:50px;max-width:980px;margin:0 auto;background:#fff8f1;">
  <h1 style="font-size:44px;margin:0;color:#7c2d12;">{{hero.title}}</h1>
  <p style="font-size:18px;line-height:1.7;color:#7c2d12cc;">{{hero.subtitle}}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:24px 0;">
    <div style="padding:16px;border:1px solid #fed7aa;border-radius:12px;background:#fff;">{{menu.itemOne}}</div>
    <div style="padding:16px;border:1px solid #fed7aa;border-radius:12px;background:#fff;">{{menu.itemTwo}}</div>
  </div>
  <a href="#" style="display:inline-block;background:#b45309;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;">{{hero.ctaText}}</a>
</section>`,
        },
        cmsSchema: {
          sections: [
            {
              id: 'hero',
              label: 'Hero',
              fields: [
                { key: 'title', label: 'Restaurant Name', type: 'TEXT', defaultValue: 'Taste & Hearth' },
                { key: 'subtitle', label: 'Subtitle', type: 'TEXT', defaultValue: 'Fresh ingredients. Honest flavors.' },
                { key: 'ctaText', label: 'CTA Text', type: 'TEXT', defaultValue: 'Reserve a table' },
              ],
            },
            {
              id: 'menu',
              label: 'Menu Highlights',
              fields: [
                { key: 'itemOne', label: 'Highlight 1', type: 'TEXT', defaultValue: 'Wood-fired Margherita' },
                { key: 'itemTwo', label: 'Highlight 2', type: 'TEXT', defaultValue: 'Truffle Mushroom Pasta' },
              ],
            },
          ],
        },
      },
      {
        name: 'Starter Product Launch',
        description: 'Product landing page for single offer campaigns.',
        type: 'ECOMMERCE_ITEM',
        baseHtmlUrl: undefined,
        deployment: {
          framework: 'NEXTJS',
          repositoryUrl: '',
          envRequirements: [],
          baseHtml: `<section style="font-family:system-ui,sans-serif;padding:54px;max-width:1020px;margin:0 auto;">
  <p style="font-weight:700;color:#0f172a;">{{hero.badge}}</p>
  <h1 style="font-size:46px;line-height:1.12;letter-spacing:-0.02em;margin:0 0 14px;">{{hero.title}}</h1>
  <p style="font-size:18px;color:#334155;max-width:760px;">{{hero.subtitle}}</p>
  <a href="#" style="display:inline-block;background:#111827;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;">{{hero.ctaText}}</a>
</section>`,
        },
        cmsSchema: {
          sections: [
            {
              id: 'hero',
              label: 'Hero',
              fields: [
                { key: 'badge', label: 'Badge', type: 'TEXT', defaultValue: 'NEW RELEASE' },
                { key: 'title', label: 'Title', type: 'TEXT', defaultValue: 'Launch your product website in hours' },
                { key: 'subtitle', label: 'Subtitle', type: 'TEXT', defaultValue: 'Fast, structured, and conversion-focused templates.' },
                { key: 'ctaText', label: 'CTA Text', type: 'TEXT', defaultValue: 'Start now' },
              ],
            },
          ],
        },
      },
      {
        name: 'Template X',
        description: 'Simple small landing page for quick testing.',
        type: 'SHOWCASE',
        baseHtmlUrl: undefined,
        deployment: {
          framework: 'NEXTJS',
          repositoryUrl: '',
          envRequirements: [],
          baseHtml: `<section style="font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:40px;border:1px solid #e5e7eb;border-radius:16px;background:#ffffff;">
  <p style="margin:0;color:#0284c7;font-weight:700;letter-spacing:0.04em;">{{hero.tag}}</p>
  <h1 style="margin:8px 0 10px;font-size:40px;line-height:1.2;">{{hero.title}}</h1>
  <p style="margin:0 0 18px;color:#475569;font-size:18px;line-height:1.7;">{{hero.subtitle}}</p>
  <a href="#" style="display:inline-block;text-decoration:none;background:#0f172a;color:#fff;padding:12px 16px;border-radius:10px;">{{hero.ctaText}}</a>
</section>`,
          previewData: {
            hero: {
              tag: 'TEMPLATE X',
              title: 'Your next website starts here',
              subtitle: 'Use this minimal layout to test schema, placeholders, and preview rendering.',
              ctaText: 'Start Building',
            },
          },
        },
        cmsSchema: {
          sections: [
            {
              id: 'hero',
              label: 'Hero',
              fields: [
                { key: 'tag', label: 'Tag', type: 'TEXT', defaultValue: 'TEMPLATE X' },
                { key: 'title', label: 'Title', type: 'TEXT', defaultValue: 'Your next website starts here' },
                { key: 'subtitle', label: 'Subtitle', type: 'TEXT', defaultValue: 'Use this minimal layout to test schema and placeholders.' },
                { key: 'ctaText', label: 'CTA Text', type: 'TEXT', defaultValue: 'Start Building' },
              ],
            },
          ],
        },
      },
      {
        name: 'Landing Nova One',
        description: 'Polished single-page landing template with hero, highlights, testimonial, and final CTA.',
        type: 'SHOWCASE',
        baseHtmlUrl: undefined,
        deployment: {
          framework: 'NEXTJS',
          repositoryUrl: '',
          envRequirements: [],
          baseHtml: `<section style="font-family:Inter,system-ui,sans-serif;max-width:1080px;margin:28px auto;padding:22px;">
  <div style="border:1px solid #e2e8f0;border-radius:18px;padding:52px;background:linear-gradient(135deg,#f8fafc,#eef9ff);">
    <span style="display:inline-block;background:#e0f2fe;color:#0369a1;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.06em;">{{hero.badge}}</span>
    <h1 style="font-size:48px;line-height:1.1;letter-spacing:-.03em;margin:14px 0 14px;color:#0f172a;max-width:860px;">{{hero.title}}</h1>
    <p style="font-size:18px;line-height:1.75;color:#334155;max-width:760px;margin:0 0 20px;">{{hero.subtitle}}</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <a href="#" style="text-decoration:none;background:{{theme.accentColor}};color:#fff;padding:12px 18px;border-radius:12px;font-weight:700;">{{hero.ctaPrimary}}</a>
      <a href="#" style="text-decoration:none;background:#fff;color:#0f172a;padding:12px 18px;border-radius:12px;border:1px solid #d1d5db;font-weight:700;">{{hero.ctaSecondary}}</a>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px;">
    <article style="border:1px solid #e2e8f0;border-radius:14px;padding:18px;background:#fff;">
      <h3 style="margin:0 0 8px;color:#0f172a;">{{highlights.itemOneTitle}}</h3>
      <p style="margin:0;color:#475569;line-height:1.6;">{{highlights.itemOneText}}</p>
    </article>
    <article style="border:1px solid #e2e8f0;border-radius:14px;padding:18px;background:#fff;">
      <h3 style="margin:0 0 8px;color:#0f172a;">{{highlights.itemTwoTitle}}</h3>
      <p style="margin:0;color:#475569;line-height:1.6;">{{highlights.itemTwoText}}</p>
    </article>
    <article style="border:1px solid #e2e8f0;border-radius:14px;padding:18px;background:#fff;">
      <h3 style="margin:0 0 8px;color:#0f172a;">{{highlights.itemThreeTitle}}</h3>
      <p style="margin:0;color:#475569;line-height:1.6;">{{highlights.itemThreeText}}</p>
    </article>
  </div>
  <blockquote style="margin:18px 0 0;border:1px solid #e2e8f0;border-radius:14px;padding:24px;background:#fff;">
    <p style="margin:0 0 10px;color:#111827;font-size:20px;line-height:1.6;">"{{testimonial.quote}}"</p>
    <footer style="color:#64748b;font-weight:600;">{{testimonial.author}}</footer>
  </blockquote>
  <div style="margin-top:18px;border-radius:16px;padding:26px;background:#0f172a;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
    <h2 style="margin:0;font-size:30px;line-height:1.2;max-width:700px;">{{finalCta.title}}</h2>
    <a href="#" style="text-decoration:none;background:{{theme.accentColor}};color:#fff;padding:12px 18px;border-radius:12px;font-weight:700;white-space:nowrap;">{{finalCta.buttonText}}</a>
  </div>
</section>`,
          previewData: {
            hero: {
              badge: 'NEW',
              title: 'Turn visitors into customers with one clean landing page',
              subtitle: 'Fast-loading, conversion-focused layout you can personalize in minutes.',
              ctaPrimary: 'Start Free',
              ctaSecondary: 'Book Demo',
            },
            highlights: {
              itemOneTitle: 'Lightning Fast',
              itemOneText: 'Optimized performance and clean page structure.',
              itemTwoTitle: 'Built to Convert',
              itemTwoText: 'Simple sections crafted for signup and inquiry actions.',
              itemThreeTitle: 'Easy to Edit',
              itemThreeText: 'Update content without touching code.',
            },
            testimonial: {
              quote: 'We launched in one week and doubled lead volume.',
              author: 'A. Fernando, Founder',
            },
            theme: { accentColor: '#0ea5e9' },
            finalCta: {
              title: 'Ready to launch your page?',
              buttonText: 'Get Started Today',
            },
          },
        },
        cmsSchema: {
          sections: [
            {
              id: 'hero',
              label: 'Hero',
              fields: [
                { key: 'badge', label: 'Badge', type: 'TEXT', defaultValue: 'NEW' },
                { key: 'title', label: 'Title', type: 'TEXT', defaultValue: 'Turn visitors into customers with one clean landing page' },
                { key: 'subtitle', label: 'Subtitle', type: 'TEXT', defaultValue: 'Fast-loading, conversion-focused layout you can personalize in minutes.' },
                { key: 'ctaPrimary', label: 'Primary CTA', type: 'TEXT', defaultValue: 'Start Free' },
                { key: 'ctaSecondary', label: 'Secondary CTA', type: 'TEXT', defaultValue: 'Book Demo' },
              ],
            },
            {
              id: 'highlights',
              label: 'Highlights',
              fields: [
                { key: 'itemOneTitle', label: 'Highlight 1 Title', type: 'TEXT', defaultValue: 'Lightning Fast' },
                { key: 'itemOneText', label: 'Highlight 1 Text', type: 'TEXT', defaultValue: 'Optimized performance and clean page structure.' },
                { key: 'itemTwoTitle', label: 'Highlight 2 Title', type: 'TEXT', defaultValue: 'Built to Convert' },
                { key: 'itemTwoText', label: 'Highlight 2 Text', type: 'TEXT', defaultValue: 'Simple sections crafted for signup and inquiry actions.' },
                { key: 'itemThreeTitle', label: 'Highlight 3 Title', type: 'TEXT', defaultValue: 'Easy to Edit' },
                { key: 'itemThreeText', label: 'Highlight 3 Text', type: 'TEXT', defaultValue: 'Update content without touching code.' },
              ],
            },
            {
              id: 'testimonial',
              label: 'Testimonial',
              fields: [
                { key: 'quote', label: 'Quote', type: 'TEXT', defaultValue: 'We launched in one week and doubled lead volume.' },
                { key: 'author', label: 'Author', type: 'TEXT', defaultValue: 'A. Fernando, Founder' },
              ],
            },
            {
              id: 'theme',
              label: 'Theme',
              fields: [
                { key: 'accentColor', label: 'Accent Color', type: 'COLOR', defaultValue: '#0ea5e9' },
              ],
            },
            {
              id: 'finalCta',
              label: 'Final CTA',
              fields: [
                { key: 'title', label: 'CTA Title', type: 'TEXT', defaultValue: 'Ready to launch your page?' },
                { key: 'buttonText', label: 'CTA Button Text', type: 'TEXT', defaultValue: 'Get Started Today' },
              ],
            },
          ],
        },
      },
    ];

    const names = starters.map((s) => s.name);
    const existing = await adminPrisma.template.findMany({
      where: { name: { in: names } },
      select: { name: true },
    });
    const existingSet = new Set(existing.map((e) => e.name));

    let created = 0;
    for (const starter of starters) {
      if (existingSet.has(starter.name)) continue;
      await this.createTemplate(starter);
      created += 1;
    }
    return created;
  }
}
