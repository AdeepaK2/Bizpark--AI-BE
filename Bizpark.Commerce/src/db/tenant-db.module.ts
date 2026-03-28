import { Global, Module } from '@nestjs/common';
import { TenantDataSourceFactory } from './tenant-datasource.factory';

@Global()
@Module({
  providers: [TenantDataSourceFactory],
  exports: [TenantDataSourceFactory],
})
export class TenantDbModule {}
