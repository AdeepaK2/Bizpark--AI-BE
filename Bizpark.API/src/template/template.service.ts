import { Injectable } from '@nestjs/common';
import { adminPrisma, TemplateType } from 'bizpark.core';

@Injectable()
export class TemplateService {
    async createTemplate(data: {
        name: string;
        description?: string;
        type: TemplateType;
        deployment: any; // JSON
        cmsSchema: any;  // JSON
        baseHtmlUrl?: string;
    }): Promise<any> {
        return adminPrisma.template.create({
            data: {
                name: data.name,
                description: data.description,
                type: data.type,
                deployment: data.deployment || {},
                cmsSchema: data.cmsSchema || { sections: [] },
                baseHtmlUrl: data.baseHtmlUrl
            }
        });
    }

    async getAllTemplates(): Promise<any> {
        return adminPrisma.template.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async getTemplatesByType(type: TemplateType): Promise<any> {
        return adminPrisma.template.findMany({
            where: { type },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getTemplateById(id: string): Promise<any> {
        return adminPrisma.template.findUnique({
            where: { id }
        });
    }
}
