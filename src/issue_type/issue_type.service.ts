import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateIssueTypeDto } from './dto/create-issue_type.dto';
import { Repository } from 'typeorm';
import { IssueType } from './entities/issue_type.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class IssueTypeService {
  private readonly logger = new Logger(IssueTypeService.name);

  constructor(
    @InjectRepository(IssueType)
    private readonly issueTypeRepository: Repository<IssueType>,
    private readonly i18n: I18nService,
  ) {}

  async create(createIssueTypeDto: CreateIssueTypeDto) {
    const issueType = this.issueTypeRepository.create(createIssueTypeDto);
    await this.issueTypeRepository.save(issueType);
    return issueType;
  }

  findAll() {
    return this.issueTypeRepository.find();
  }

  async findOneOrFail(id: number) {
    const issueTypeDb = await this.issueTypeRepository.findOneBy({ id });
    if (!issueTypeDb)
      throw new NotFoundException(
        this.i18n.t('errors.issue_types.not_found', {
          args: { id },
        }),
      );
    return issueTypeDb;
  }

  async deleteAll() {
    await this.issueTypeRepository.query(
      'TRUNCATE TABLE "issue_type" RESTART IDENTITY CASCADE',
    );
  }
}
