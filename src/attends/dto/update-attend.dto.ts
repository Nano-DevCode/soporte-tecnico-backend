import { PartialType } from '@nestjs/mapped-types';
import { CreateAttendDto } from './create-attend.dto';

export class UpdateAttendDto extends PartialType(CreateAttendDto) {}
