import { Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { EntityManager, Repository } from 'typeorm';
import { PaginationWithPageDto } from '../common/dtos/paginationWithPage.dto';
import { PaginationResponse } from 'src/common/pagination/paginationResponse';
import { PAGINATION } from 'src/common/constants/pagination.constants';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async create(createTagDto: CreateTagDto, transactionManager?: EntityManager) {
    const manager = transactionManager || this.tagRepository.manager;
    const tag = manager.create(Tag, createTagDto);
    return await manager.save(tag);
  }

  async findAll(paginationWithPageDto: PaginationWithPageDto) {
    const {
      limit = PAGINATION.DEFAULT_LIMIT_SELECT,
      page = PAGINATION.DEFAULT_PAGE,
      search,
    } = paginationWithPageDto;

    const offset = (page - 1) * limit;
    const cleanSearch = search?.trim();

    const query = this.tagRepository.createQueryBuilder('tag');

    if (cleanSearch) {
      query.where('unaccent(tag.name) ILIKE unaccent(:search)', {
        search: `%${cleanSearch}%`,
      });
    }

    const [data, total] = await query
      .orderBy('tag.name', 'ASC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return PaginationResponse({ data: data, total }, { limit, page, search });
  }

  async findOne(id: number, transactionManager?: EntityManager) {
    const manager = transactionManager || this.tagRepository.manager;
    const tag = await manager.findOneBy(Tag, {
      id,
    });
    return tag;
  }

  async findOneByName(name: string, transactionManager?: EntityManager) {
    const manager = transactionManager || this.tagRepository.manager;
    const tag = await manager.findOneBy(Tag, {
      name,
    });
    return tag;
  }

  async findOneOrCreate(name: string, transactionManager: EntityManager) {
    let tag = await this.findOneByName(name, transactionManager);
    if (!tag) {
      tag = await this.create({ name }, transactionManager);
    }

    return tag;
  }

  // En TagsService
  async bulkFindOrCreate(
    names: string[],
    transactionManager: EntityManager,
  ): Promise<Tag[]> {
    if (!names || names.length === 0) return [];

    await transactionManager
      .createQueryBuilder()
      .insert()
      .into(Tag)
      .values(names.map((name) => ({ name })))
      .orIgnore()
      .execute();

    return await transactionManager
      .createQueryBuilder(Tag, 'tag')
      .where('tag.name IN (:...names)', { names })
      .getMany();
  }
}
