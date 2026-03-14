import { adminPrisma, TemplateType } from 'bizpark.core';

async function main() {
    console.log('Seeding Templates...');

    // 1. Modern Showcase Template
    const showcaseTemplate = await adminPrisma.template.create({
        data: {
            name: 'Modern Startup',
            description: 'A bold, sleek showcase for modern agencies and startups.',
            type: TemplateType.SHOWCASE,
            deployment: {
                framework: 'NEXTJS',
                repositoryUrl: 'https://github.com/bizpark/template-modern-startup',
                envRequirements: []
            },
            cmsSchema: {
                sections: [
                    {
                        id: 'hero',
                        label: 'Hero Section',
                        fields: [
                            { key: 'title', label: 'Headline', type: 'TEXT', required: true, defaultValue: 'Build Your Dream' },
                            { key: 'subtitle', label: 'Sub-headline', type: 'TEXT', required: false },
                            { key: 'primaryColor', label: 'Brand Color', type: 'COLOR', required: true, defaultValue: '#6633CC' },
                            { key: 'backgroundImage', label: 'Background Image', type: 'IMAGE_URL', required: false }
                        ]
                    },
                    {
                        id: 'about',
                        label: 'About Us',
                        fields: [
                            { key: 'heading', label: 'Section Heading', type: 'TEXT', required: true, defaultValue: 'Our Story' },
                            { key: 'content', label: 'Paragraph Text', type: 'TEXT', required: true }
                        ]
                    }
                ]
            }
        }
    });

    console.log(`Created Showcase Template: ${showcaseTemplate.name}`);

    // 2. E-Commerce Item Template
    const ecommerceTemplate = await adminPrisma.template.create({
        data: {
            name: 'Sleek Storefront',
            description: 'A minimalist e-commerce layout optimized for physical and digital products.',
            type: TemplateType.ECOMMERCE_ITEM,
            deployment: {
                framework: 'NEXTJS',
                repositoryUrl: 'https://github.com/bizpark/template-sleek-store',
                envRequirements: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
            },
            cmsSchema: {
                sections: [
                    {
                        id: 'hero',
                        label: 'Store Banner',
                        fields: [
                            { key: 'storeName', label: 'Store Name', type: 'TEXT', required: true },
                            { key: 'bannerImage', label: 'Banner Image', type: 'IMAGE_URL', required: true },
                            { key: 'accentColor', label: 'Accent Color', type: 'COLOR', required: true, defaultValue: '#111827' }
                        ]
                    },
                    {
                        id: 'productsConfig',
                        label: 'Products Grid',
                        fields: [
                            { key: 'gridColumns', label: 'Columns (2, 3, or 4)', type: 'TEXT', required: true, defaultValue: '3' },
                            { key: 'showPrices', label: 'Show Prices', type: 'TEXT', required: true, defaultValue: 'true' }
                        ]
                    }
                ]
            }
        }
    });

    console.log(`Created E-Commerce Template: ${ecommerceTemplate.name}`);

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await adminPrisma.$disconnect();
    });
