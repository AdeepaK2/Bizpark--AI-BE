import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto, SaveWebsiteConfigDto } from 'bizpark.core';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AgentService } from '../agent/agent.service';
import { randomBytes } from 'node:crypto';

@Controller('api/business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
    constructor(
        private readonly businessService: BusinessService,
        private readonly agentService: AgentService
    ) { }

    @Post()
    async createBusiness(@Body() dto: CreateBusinessDto, @CurrentUser() user: { id: string; email: string; name: string }) {
        const business = await this.businessService.createBusiness(dto, user.id);

        // Provision Commerce schema + bootstrap admin account (best-effort, non-blocking)
        const commerceUrl = process.env.COMMERCE_URL || 'http://localhost:3003';
        const adminPassword = 'Biz-' + randomBytes(4).toString('hex');
        let adminCredentials: { email: string; password: string } | null = null;

        try {
            const bootstrapResp = await fetch(`${commerceUrl}/api/commerce/auth/bootstrap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-tenant-id': business.id },
                body: JSON.stringify({ email: user.email, password: adminPassword, name: user.name }),
            });
            if (bootstrapResp.ok) {
                adminCredentials = { email: user.email, password: adminPassword };
            }
        } catch {
            // Commerce may be starting up — admin can be provisioned later via the website publish flow
        }

        return {
            success: true,
            message: 'Business created successfully',
            data: { ...business, storefrontUrl: `http://localhost:3004/?tenant=${business.id}`, adminUrl: `http://localhost:3004/auth?tenant=${business.id}` },
            adminCredentials,
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
        @Body() body: { tone?: string },
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
        if (!websiteConfig) {
            throw new BadRequestException('Website configuration not found. Save configuration first.');
        }

        // Queue the agent task via BullMQ wrapper
        const queuedTask = await this.agentService.queueTask({
            businessId: id,
            taskType: "WEBSITE_GENERATION",
            inputData: {
                business: {
                    id: business.id,
                    name: business.name,
                    category: (business as any).category,
                    description: (business as any).description,
                    logoUrl: (business as any).logoUrl,
                },
                websiteConfig: {
                    templateId: websiteConfig.templateId,
                    cmsData: (websiteConfig as any).cmsData || {},
                },
                tone: body?.tone || 'professional',
            },
        });

        return {
            success: true,
            message: 'Website build queued',
            data: queuedTask
        };
    }
}
