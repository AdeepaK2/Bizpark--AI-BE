import { Injectable } from '@nestjs/common';
import { prisma, Prisma, TemplateType } from 'bizpark.core';

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
    return prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplateById(id: string): Promise<any | null> {
    return prisma.template.findUnique({ where: { id } });
  }

  async createTemplate(input: TemplateInput): Promise<any> {
    return prisma.template.create({
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
    return prisma.template.update({
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
    ];

    const names = starters.map((s) => s.name);
    const existing = await prisma.template.findMany({
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
