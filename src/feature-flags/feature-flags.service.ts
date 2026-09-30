import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from './entities/feature-flag.entity';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
  ) {}

  async findAll() {
    return this.featureFlagRepository.find({
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async update(id: string, updateFeatureFlagDto: UpdateFeatureFlagDto) {
    const flag = await this.featureFlagRepository.preload({
      id,
      ...updateFeatureFlagDto,
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag with id ${id} not found`);
    }

    await this.featureFlagRepository.save(flag);
    return flag;
  }
}
