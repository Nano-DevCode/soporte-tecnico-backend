/* import { PartialType } from '@nestjs/mapped-types';
import { CreateToolDto } from './create-tool.dto';

export class UpdateToolDto extends PartialType(CreateToolDto) {}
 */

import { PartialType } from '@nestjs/swagger';
import { CreateToolDto } from './create-tool.dto';

export class UpdateToolDto extends PartialType(CreateToolDto) {}
