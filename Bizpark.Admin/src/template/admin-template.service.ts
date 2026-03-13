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
}
