import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Pool } from 'pg';
import { COMMERCE_ENTITIES } from './entities';

@Injectable()
export class TenantDataSourceFactory implements OnModuleDestroy {
  private readonly sources = new Map<string, DataSource>();
  private readonly initPromises = new Map<string, Promise<DataSource>>();

  private get dbUrl(): string {
    const url =
      process.env.COMMERCE_DATABASE_URL ||
      process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'Missing database URL. Set COMMERCE_DATABASE_URL or DATABASE_URL.',
      );
    }
    return url;
  }

  /**
   * Returns an initialized DataSource scoped to the tenant's schema.
   * The schema (tenant_<tenantId>) is created if it does not yet exist.
   */
  async getDataSource(tenantId: string): Promise<DataSource> {
    const existing = this.sources.get(tenantId);
    if (existing?.isInitialized) return existing;

    // Deduplicate concurrent initialization calls for the same tenant.
    const inflight = this.initPromises.get(tenantId);
    if (inflight) return inflight;

    const promise = this.initForTenant(tenantId);
    this.initPromises.set(tenantId, promise);

    try {
      const ds = await promise;
      this.sources.set(tenantId, ds);
      return ds;
    } finally {
      this.initPromises.delete(tenantId);
    }
  }

  private async initForTenant(tenantId: string): Promise<DataSource> {
    const schema = tenantSchemaName(tenantId);
    await this.ensureSchemaExists(schema);

    const ds = new DataSource({
      type: 'postgres',
      url: this.dbUrl,
      schema,
      entities: COMMERCE_ENTITIES,
      // synchronize creates tables automatically when the DataSource
      // is first initialized for a new tenant schema.
      synchronize: true,
      logging: process.env.TYPEORM_LOGGING === 'true',
    });

    await ds.initialize();
    return ds;
  }

  /**
   * Creates the PostgreSQL schema if it does not already exist.
   * This is a lightweight operation (no-op if schema already exists).
   */
  private async ensureSchemaExists(schema: string): Promise<void> {
    const pool = new Pool({ connectionString: this.dbUrl, max: 1 });
    try {
      await pool.query(
        `CREATE SCHEMA IF NOT EXISTS "${schema.replaceAll('"', '""')}"`,
      );
    } finally {
      await pool.end();
    }
  }

  async onModuleDestroy() {
    for (const ds of this.sources.values()) {
      if (ds.isInitialized) {
        await ds.destroy();
      }
    }
    this.sources.clear();
  }
}

/** Converts a tenantId to a safe PostgreSQL schema name. */
export function tenantSchemaName(tenantId: string): string {
  // Replace any character that is not alphanumeric or underscore with _.
  return `tenant_${tenantId.replace(/[^a-zA-Z0-9]/g, '_')}`;
}
