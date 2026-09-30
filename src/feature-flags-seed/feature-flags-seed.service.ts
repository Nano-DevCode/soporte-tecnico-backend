import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from '../feature-flags/entities/feature-flag.entity';

@Injectable()
export class FeatureFlagsSeedService {
  private readonly logger = new Logger(FeatureFlagsSeedService.name);

  constructor(
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
  ) {}

  async runSeed() {
    this.logger.log('Running Feature Flags Seed');

    const flagsToSeed = [
      {
        id: 'quick_command_palette',
        title: 'Buscador Global (Ctrl + K)',
        description:
          'Búsqueda global y accesos directos desde cualquier pantalla.',
        category: 'system',
        badge: 'Experimental',
        iconName: 'Command',
        enabled: false,
      },
    ];

    for (const flag of flagsToSeed) {
      const exists = await this.featureFlagRepository.findOne({
        where: { id: flag.id },
      });
      if (!exists) {
        const newFlag = this.featureFlagRepository.create(flag);
        await this.featureFlagRepository.save(newFlag);
        this.logger.log(`Inserted feature flag: ${flag.id}`);
      } else {
        this.logger.log(`Feature flag ${flag.id} already exists, skipping...`);
      }
    }

    return { message: 'Seed executed successfully' };
  }
}
