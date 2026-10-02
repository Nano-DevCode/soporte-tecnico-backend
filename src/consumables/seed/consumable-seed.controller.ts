import { Controller, Get } from '@nestjs/common';
import { ConsumableSeedService } from './consumable-seed.service';

@Controller('consumables-seed')
export class ConsumableSeedController {
  constructor(private readonly consumableSeedService: ConsumableSeedService) {}

  @Get()
  runSeed() {
    return this.consumableSeedService.RunSeed();
  }
}
