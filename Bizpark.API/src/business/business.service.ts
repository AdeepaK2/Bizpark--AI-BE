import { Injectable } from '@nestjs/common';
import { prisma, CreateBusinessDto } from 'bizpark.core';

@Injectable()
export class BusinessService {
    async createBusiness(dto: CreateBusinessDto, userId: string) {
        return prisma.business.create({
            data: {
                ...dto,
                users: {
                    create: {
                        userId,
                        role: 'OWNER'
                    }
                }
            }
        });
    }
    async getBusinessesForUser(userId: string) {
        return prisma.business.findMany({
            where: {
                users: {
                    some: { userId: userId }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getBusinessById(id: string): Promise<any> {
        return prisma.business.findUnique({
            where: { id },
            include: { websites: true }
        });
    }

    async saveWebsiteConfig(businessId: string, dto: any): Promise<any> {
        // Upsert website info.
        // In this iteration, we assume one website per business.
        const domain = `${businessId}-local`;
        return prisma.website.upsert({
            where: { domain },
            update: {
                templateId: dto.templateId,
                cmsData: dto.cmsData || {}
            },
            create: {
                businessId,
                domain,
                templateId: dto.templateId,
                cmsData: dto.cmsData || {}
            }
        });
    }
}
