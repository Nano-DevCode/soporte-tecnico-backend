import { Injectable } from '@nestjs/common';
import { CreatePruebasocketDto } from './dto/create-pruebasocket.dto';
import { UpdatePruebasocketDto } from './dto/update-pruebasocket.dto';

@Injectable()
export class PruebasocketsService {
  create(_createPruebasocketDto: CreatePruebasocketDto) {
    return 'This action adds a new pruebasocket';
  }

  findAll() {
    return `This action returns all pruebasockets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pruebasocket`;
  }

  update(id: number, _updatePruebasocketDto: UpdatePruebasocketDto) {
    return `This action updates a #${id} pruebasocket`;
  }

  remove(id: number) {
    return `This action removes a #${id} pruebasocket`;
  }
}
