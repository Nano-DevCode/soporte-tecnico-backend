import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EquipmentticketsService } from './equipmenttickets.service';
import { CreateEquipmentticketDto } from './dto/create-equipmentticket.dto';
import { UpdateEquipmentticketDto } from './dto/update-equipmentticket.dto';

@Controller('equipmenttickets')
export class EquipmentticketsController {
  constructor(
    private readonly equipmentticketsService: EquipmentticketsService,
  ) {}

  @Post()
  create(@Body() createEquipmentticketDto: CreateEquipmentticketDto) {
    return this.equipmentticketsService.create(createEquipmentticketDto);
  }

  @Get()
  findAll() {
    return this.equipmentticketsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipmentticketsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEquipmentticketDto: UpdateEquipmentticketDto,
  ) {
    return this.equipmentticketsService.update(+id, updateEquipmentticketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentticketsService.remove(+id);
  }
}
