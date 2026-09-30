import { Module } from '@nestjs/common';
import { FeatureFlagsSeedService } from './feature-flags-seed.service';
import { FeatureFlagsSeedController } from './feature-flags-seed.controller';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [FeatureFlagsModule, AuthModule],
  controllers: [FeatureFlagsSeedController],
  providers: [FeatureFlagsSeedService],
})
export class FeatureFlagsSeedModule {}
