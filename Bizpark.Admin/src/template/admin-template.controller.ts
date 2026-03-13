import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma, TemplateType } from 'bizpark.core';
import { AdminTemplateService } from './admin-template.service';
import {
  templateFormPage,
  templatesListPage,
} from './admin-template.views';

type TemplateFormBody = {
  name?: string;
  description?: string;
  type?: string;
  baseHtmlUrl?: string;
  deploymentRaw?: string;
  cmsSchemaRaw?: string;
  baseHtmlTemplate?: string;
  previewDataRaw?: string;
};

type ParseResult =
  | { ok: false; error: string }
  | {
      ok: true;
      value: {
        name: string;
        description?: string;
        type: TemplateType;
        baseHtmlUrl?: string;
        deployment: Prisma.InputJsonValue;
        cmsSchema: Prisma.InputJsonValue;
      };
    };

@Controller('admin/templates')
export class AdminTemplateController {
  constructor(private readonly templateService: AdminTemplateService) {}

  @Get()
  async list(@Res() res: Response, @Query('notice') notice?: string) {
    const templates = await this.templateService.listTemplates();
    return res
      .status(200)
      .send(templatesListPage({ templates, notice }));
  }

  @Post('seed-starters')
  async seedStarters(@Res() res: Response) {
    const created = await this.templateService.seedStarterTemplates();
    return res.redirect(`/admin/templates?notice=Seeded+${created}+starter+template(s)`);
  }

  @Get('new')
  createForm(@Res() res: Response, @Query('error') error?: string) {
    return res.status(200).send(
      templateFormPage({
        mode: 'create',
        action: '/admin/templates/new',
        error,
      }),
    );
  }

  @Post('new')
  async create(@Body() body: TemplateFormBody, @Res() res: Response) {
    const parsed = this.parseForm(body);
    if (!parsed.ok) {
      return res.status(400).send(
        templateFormPage({
          mode: 'create',
          action: '/admin/templates/new',
          error: parsed.error,
          values: body as any,
        }),
      );
    }

    await this.templateService.createTemplate(parsed.value);
    return res.redirect('/admin/templates?notice=Template+created');
  }

  @Get(':id')
  async editForm(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('error') error?: string,
    @Query('notice') notice?: string,
  ) {
    const template = await this.templateService.getTemplateById(id);
    if (!template) {
      return res.status(404).send('Template not found');
    }

    return res.status(200).send(
      templateFormPage({
        mode: 'edit',
        action: `/admin/templates/${id}`,
        error,
        notice,
        values: {
          name: template.name,
          description: template.description || '',
          type: template.type,
          baseHtmlUrl: template.baseHtmlUrl || '',
          deploymentRaw: JSON.stringify(template.deployment || {}, null, 2),
          cmsSchemaRaw: JSON.stringify(template.cmsSchema || { sections: [] }, null, 2),
          baseHtmlTemplate:
            typeof (template.deployment as any)?.baseHtml === 'string'
              ? (template.deployment as any).baseHtml
              : '',
          previewDataRaw:
            (template.deployment as any)?.previewData
              ? JSON.stringify((template.deployment as any).previewData, null, 2)
              : '',
        },
      }),
    );
  }

  @Post(':id')
  async update(
    @Param('id') id: string,
    @Body() body: TemplateFormBody,
    @Res() res: Response,
  ) {
    const parsed = this.parseForm(body);
    if (!parsed.ok) {
      return res.status(400).send(
        templateFormPage({
          mode: 'edit',
          action: `/admin/templates/${id}`,
          error: parsed.error,
          values: body as any,
        }),
      );
    }

    await this.templateService.updateTemplate(id, parsed.value);
    return res.redirect(`/admin/templates/${id}?notice=Template+updated`);
  }

  private parseForm(body: TemplateFormBody): ParseResult {
    if (!body.name?.trim()) {
      return { ok: false, error: 'Template name is required.' };
    }
    if (!body.type || !(body.type in TemplateType)) {
      return { ok: false, error: 'Template type is invalid.' };
    }

    let deployment: Prisma.InputJsonValue = {};
    let cmsSchema: Prisma.InputJsonValue = { sections: [] };
    try {
      deployment = (body.deploymentRaw?.trim()
        ? JSON.parse(body.deploymentRaw)
        : {}) as Prisma.InputJsonValue;
    } catch {
      return { ok: false, error: 'Deployment JSON is invalid.' };
    }
    try {
      cmsSchema = (body.cmsSchemaRaw?.trim()
        ? JSON.parse(body.cmsSchemaRaw)
        : { sections: [] }) as Prisma.InputJsonValue;
    } catch {
      return { ok: false, error: 'CMS Schema JSON is invalid.' };
    }

    return {
      ok: true,
      value: {
        name: body.name.trim(),
        description: body.description?.trim() || undefined,
        type: body.type as TemplateType,
        baseHtmlUrl: body.baseHtmlUrl?.trim() || undefined,
        deployment: this.withTemplatePreviewData(
          deployment,
          body.baseHtmlTemplate,
          body.previewDataRaw,
        ),
        cmsSchema,
      },
    };
  }

  private withTemplatePreviewData(
    deployment: Prisma.InputJsonValue,
    baseHtmlTemplate?: string,
    previewDataRaw?: string,
  ): Prisma.InputJsonValue {
    const DEFAULT_BASE_TEMPLATE = `<section style="font-family:Arial,sans-serif;padding:56px;max-width:980px;margin:0 auto;">
  <h1 style="font-size:42px;margin:0 0 10px;">{{hero.title}}</h1>
  <p style="font-size:18px;line-height:1.6;color:#334155;margin:0 0 18px;">{{hero.subtitle}}</p>
  <a href="#" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;">{{hero.ctaText}}</a>
  <div style="margin-top:32px;padding:22px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
    <h2 style="margin:0 0 8px;font-size:28px;">{{about.heading}}</h2>
    <p style="margin:0;color:#475569;line-height:1.7;">{{about.body}}</p>
  </div>
</section>`;

    const deploymentObj: Record<string, Prisma.InputJsonValue> =
      deployment &&
      typeof deployment === 'object' &&
      !Array.isArray(deployment)
        ? ({ ...(deployment as Prisma.InputJsonObject) } as Record<string, Prisma.InputJsonValue>)
        : {};

    deploymentObj.baseHtml = (baseHtmlTemplate?.trim() || DEFAULT_BASE_TEMPLATE) as Prisma.InputJsonValue;

    if (previewDataRaw?.trim()) {
      try {
        deploymentObj.previewData = JSON.parse(previewDataRaw) as Prisma.InputJsonValue;
      } catch {
        // If preview JSON is invalid, skip persisting it; form preview already shows parsing errors.
      }
    }

    return deploymentObj as Prisma.InputJsonObject;
  }
}
