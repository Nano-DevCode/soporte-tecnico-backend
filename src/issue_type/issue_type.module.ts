import { Module } from '@nestjs/common';
import { IssueTypeService } from './issue_type.service';
import { IssueTypeController } from './issue_type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueType } from './entities/issue_type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IssueType])],
  controllers: [IssueTypeController],
  providers: [IssueTypeService],
  exports: [IssueTypeService, TypeOrmModule],
})
export class IssueTypeModule {}
