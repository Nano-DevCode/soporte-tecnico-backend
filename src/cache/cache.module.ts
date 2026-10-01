import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { AuthModule } from 'src/auth/auth.module';
import { CacheController } from 'src/common/controllers/cache.controller';
import { CacheInvalidationListener } from 'src/common/listeners/cache-invalidation.listener';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [CacheController],
  providers: [CacheInvalidationListener],
  exports: [CommonModule],
})
export class CacheModule {}
