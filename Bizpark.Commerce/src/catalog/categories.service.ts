import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { CategoryEntity } from '../db/entities';

@Injectable()
export class CategoriesService {
  constructor(private readonly tenantDb: TenantDataSourceFactory) {}

  async list(tenantId: string) {
    const repo = await this.repo(tenantId);
    const all = await repo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
    return buildTree(all);
  }

  async getById(tenantId: string, categoryId: string) {
    const repo = await this.repo(tenantId);
    const cat = await repo.findOne({ where: { id: categoryId } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(
    tenantId: string,
    payload: { name: string; slug: string; description?: string; parentId?: string | null; sortOrder?: number },
  ) {
    const repo = await this.repo(tenantId);
    const cat = repo.create({
      name: payload.name,
      slug: payload.slug.toLowerCase().replace(/\s+/g, '-'),
      description: payload.description ?? null,
      parentId: payload.parentId ?? null,
      sortOrder: payload.sortOrder ?? 0,
      isActive: true,
    });
    return repo.save(cat);
  }

  async update(
    tenantId: string,
    categoryId: string,
    payload: { name?: string; slug?: string; description?: string; parentId?: string | null; sortOrder?: number; isActive?: boolean },
  ) {
    const repo = await this.repo(tenantId);
    const cat = await repo.findOne({ where: { id: categoryId } });
    if (!cat) throw new NotFoundException('Category not found');

    if (payload.name !== undefined) cat.name = payload.name;
    if (payload.slug !== undefined) cat.slug = payload.slug.toLowerCase().replace(/\s+/g, '-');
    if (payload.description !== undefined) cat.description = payload.description ?? null;
    if (payload.parentId !== undefined) cat.parentId = payload.parentId ?? null;
    if (payload.sortOrder !== undefined) cat.sortOrder = payload.sortOrder;
    if (payload.isActive !== undefined) cat.isActive = payload.isActive;

    return repo.save(cat);
  }

  async delete(tenantId: string, categoryId: string) {
    const repo = await this.repo(tenantId);
    const cat = await repo.findOne({ where: { id: categoryId } });
    if (!cat) throw new NotFoundException('Category not found');
    await repo.remove(cat);
    return { deleted: true, id: categoryId };
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(CategoryEntity);
  }
}

type CategoryNode = CategoryEntity & { children: CategoryNode[] };

function buildTree(cats: CategoryEntity[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  cats.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}
