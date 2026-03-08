import { Controller, Get, Post, Body, Param, UseGuards, DefaultValuePipe, ParseEnumPipe } from '@nestjs/common';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TemplateType } from 'bizpark.core';

@Controller('api/templates')
export class TemplateController {
    constructor(private readonly templateService: TemplateService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async createTemplate(@Body() dto: any): Promise<any> {
        // Admin-only in real life, but for now anyone can register a template
        const template = await this.templateService.createTemplate(dto);
        return {
            success: true,
            message: 'Template registered successfully',
            data: template
        };
    }

    @Get()
    async getAllTemplates(): Promise<any> {
        // Publicly readable so users can browse them in the setup wizard
        const templates = await this.templateService.getAllTemplates();
        return {
            success: true,
            data: templates
        };
    }

    @Get('type/:type')
    async getTemplatesByType(@Param('type', new ParseEnumPipe(TemplateType)) type: TemplateType): Promise<any> {
        const templates = await this.templateService.getTemplatesByType(type);
        return {
            success: true,
            data: templates
        };
    }

    @Get(':id')
    async getTemplateById(@Param('id') id: string): Promise<any> {
        const template = await this.templateService.getTemplateById(id);
        return {
            success: true,
            data: template
        };
    }
}
