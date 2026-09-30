import { Controller, Get } from '@nestjs/common';
import { FeatureFlagsSeedService } from './feature-flags-seed.service';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Seed')
@Controller('feature-flags-seed')
export class FeatureFlagsSeedController {
  constructor(
    private readonly featureFlagsSeedService: FeatureFlagsSeedService,
  ) {}

  @Get()
  @Auth(ValidRole.superAdmin)
  executeSeed() {
    return this.featureFlagsSeedService.runSeed();
  }
}
