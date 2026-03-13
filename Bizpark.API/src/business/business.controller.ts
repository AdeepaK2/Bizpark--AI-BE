import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto, SaveWebsiteConfigDto } from 'bizpark.core';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AgentService } from '../agent/agent.service';

@Controller('api/business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
    constructor(
        private readonly businessService: BusinessService,
        private readonly agentService: AgentService
    ) { }

    @Post()
    async createBusiness(@Body() dto: CreateBusinessDto, @CurrentUser() user: any) {
        const business = await this.businessService.createBusiness(dto, user.id);
        return {
            success: true,
            message: 'Business created successfully',
            data: business
        };
    }

    @Get()
    async getMyBusinesses(@CurrentUser() user: any) {
        const businesses = await this.businessService.getBusinessesForUser(user.id);
        return {
            success: true,
            data: businesses
        };
    }

    @Get(':id')
    async getBusinessById(@Param('id') id: string): Promise<any> {
        const business = await this.businessService.getBusinessById(id);
        return {
            success: true,
            data: business
        };
    }

    @Post(':id/website')
    async saveWebsiteConfig(
        @Param('id') id: string,
        @Body() dto: SaveWebsiteConfigDto,
        @CurrentUser() user: any
    ): Promise<any> {
        // Basic security check to ensure this is the user's business
        const businesses = await this.businessService.getBusinessesForUser(user.id);
        if (!businesses.find(b => b.id === id)) {
            throw new Error('Unauthorized');
        }
        if (!dto?.templateId || !dto.templateId.trim()) {
            throw new BadRequestException('templateId is required to save website configuration');
        }

        const website = await this.businessService.saveWebsiteConfig(id, dto);
        return {
            success: true,
            message: 'Website configuration saved',
            data: website
        };
    }

    @Post(':id/website/deploy')
    async deployWebsite(
        @Param('id') id: string,
        @CurrentUser() user: any
    ): Promise<any> {
        // Basic security check
        const businesses = await this.businessService.getBusinessesForUser(user.id);
        if (!businesses.find(b => b.id === id)) {
            throw new Error('Unauthorized');
        }

        // Just fetching to make sure it exists before we queue
        const business = await this.businessService.getBusinessById(id);
        const websiteConfig = business?.websites?.[0];
        if (!websiteConfig?.templateId) {
            throw new BadRequestException('Website configuration not found. Save configuration first.');
        }

        // Queue the agent task via BullMQ wrapper
        const queuedTask = await this.agentService.queueTask({
            businessId: id,
            taskType: "WEBSITE_GENERATION",
            inputData: { websiteConfig }
        });

        return {
            success: true,
            message: 'Website build queued',
            data: queuedTask
        };
    }
}
