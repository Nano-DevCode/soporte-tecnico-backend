import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRole } from '../auth/interfaces/valid-roles';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Feature Flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  findAll() {
    return this.featureFlagsService.findAll();
  }

  @Patch(':id/toggle')
  @Auth(ValidRole.superAdmin)
  update(
    @Param('id') id: string,
    @Body() updateFeatureFlagDto: UpdateFeatureFlagDto,
  ) {
    return this.featureFlagsService.update(id, updateFeatureFlagDto);
  }
}
