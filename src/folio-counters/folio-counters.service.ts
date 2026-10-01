import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SchoolPeriodsService } from 'src/school-periods/school-periods.service';
import { EntityManager, In, Repository } from 'typeorm';
import { FolioCounter } from './entities/folio-counter.entity';
import { DepartmentsService } from '../departments/services/departments.service';
import { UpdateFolioCounterDto } from './dto/update-folio-counter.dto';
import { User } from 'src/users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
// const CC_ACRONYM = 'CC';
const OT_ACRONYM = 'OT';

@Injectable()
export class FolioCountersService {
  constructor(
    private readonly schoolPeriodsService: SchoolPeriodsService,
    private readonly departmentsService: DepartmentsService,
    @InjectRepository(FolioCounter)
    private readonly folioCounterRepository: Repository<FolioCounter>,
    private readonly i18n: I18nService,
  ) {}

  async generateNewFolio(
    departmentAcronym: string,
    transactionManager?: EntityManager,
  ) {
    const manager = transactionManager || this.folioCounterRepository.manager;
    const year = new Date().getFullYear().toString();
    const counterKey = `CC_${year}`;

    const result = await manager.query<{ current_value: number }[]>(
      `
      INSERT INTO folio_counters (id, current_value)
      VALUES ($1, 1)
      ON CONFLICT (id)
      DO UPDATE SET current_value = folio_counters.current_value + 1
      RETURNING current_value;
      `,
      [counterKey],
    );

    const nextNumber = result[0].current_value;
    const paddedNumber = String(nextNumber).padStart(4, '0');

    return `${OT_ACRONYM}-${year}-${paddedNumber}-${departmentAcronym}`;
  }

  async getCurrentYearResponseCounterDetail() {
    const year = new Date().getFullYear().toString();
    const counterKey = `CC_${year}`;

    const counter = await this.folioCounterRepository.findOneBy({
      id: counterKey,
    });

    const currentValue = counter ? counter.current_value : 0;
    const nextValue = currentValue + 1;

    return {
      year,
      current_value: currentValue,
      next_value: nextValue,
      next_folio_preview: `${OT_ACRONYM}-${year}-${String(nextValue).padStart(4, '0')}-DEP`,
    };
  }

  async jumpCurrentYearResponseCounter({
    requestedNextFolio,
  }: UpdateFolioCounterDto) {
    const year = new Date().getFullYear().toString();
    const counterKey = `CC_${year}`;
    const targetValue = requestedNextFolio - 1;

    await this.folioCounterRepository.manager.transaction(
      async (transactionManager) => {
        const currentCounter = await transactionManager
          .createQueryBuilder(FolioCounter, 'counter')
          .where('counter.id = :id', { id: counterKey })
          .setLock('pessimistic_write')
          .getOne();

        if (currentCounter) {
          // if (targetValue < currentCounter.current_value) {
          //   throw new BadRequestException(
          //     this.i18n.t('errors.folio_counters.cannot_reduce', {
          //       args: { next_natural: currentCounter.current_value + 1 },
          //     }),
          //   );
          // }
          if (targetValue === currentCounter.current_value) {
            throw new BadRequestException(
              this.i18n.t('errors.folio_counters.already_configured', {
                args: { requested: requestedNextFolio },
              }),
            );
          }
        }

        await transactionManager.query(
          `
          INSERT INTO folio_counters (id, current_value)
          VALUES ($1, $2)
          ON CONFLICT (id)
          DO UPDATE SET current_value = EXCLUDED.current_value;
          `,
          [counterKey, targetValue],
        );
      },
    );

    const nextValue = targetValue + 1;

    return {
      year,
      current_value: targetValue,
      next_value: nextValue,
      next_folio_preview: `${OT_ACRONYM}-${year}-${String(nextValue).padStart(4, '0')}-DEP`,
    };
  }

  async generateDepartmentTicketFolio(
    departmentId: string,
    departmentAcronym: string,
    periodId: string,
    periodName: string,
    transactionManager: EntityManager,
  ): Promise<string> {
    if (!departmentId || !departmentAcronym || !periodId || !periodName) {
      throw new BadRequestException(
        this.i18n.t('errors.folio_counters.missing_folio_data'),
      );
    }

    const counterKey = `REQ_${departmentId}_${periodId}`;

    const result = await transactionManager.query<{ current_value: number }[]>(
      `
      INSERT INTO folio_counters (id, current_value)
      VALUES ($1, 1)
      ON CONFLICT (id)
      DO UPDATE SET current_value = folio_counters.current_value + 1
      RETURNING current_value;
      `,
      [counterKey],
    );

    const nextNumber = result[0].current_value;

    const paddedNumber = String(nextNumber).padStart(4, '0');

    return `${departmentAcronym}-${periodName}-${paddedNumber}`;
  }

  async jumpCurrentPeriodDepartmentCounter(
    departmentId: string,
    { requestedNextFolio }: UpdateFolioCounterDto,
  ) {
    const activePeriod =
      await this.schoolPeriodsService.getActiveSchoolPeriodOrFail();

    const dep = await this.departmentsService.findOne(departmentId);

    const counterKey = `REQ_${departmentId}_${activePeriod.id}`;
    const targetValue = requestedNextFolio - 1;

    await this.folioCounterRepository.manager.transaction(
      async (transactionManager) => {
        const currentCounter = await transactionManager
          .createQueryBuilder(FolioCounter, 'counter')
          .where('counter.id = :id', { id: counterKey })
          .setLock('pessimistic_write')
          .getOne();

        if (currentCounter) {
          if (targetValue < currentCounter.current_value) {
            throw new BadRequestException(
              this.i18n.t('errors.folio_counters.cannot_reduce', {
                args: { next_natural: currentCounter.current_value + 1 },
              }),
            );
          }
          if (targetValue === currentCounter.current_value) {
            throw new BadRequestException(
              this.i18n.t('errors.folio_counters.already_configured', {
                args: { requested: requestedNextFolio },
              }),
            );
          }
        }

        await transactionManager.query(
          `
          INSERT INTO folio_counters (id, current_value)
          VALUES ($1, $2)
          ON CONFLICT (id)
          DO UPDATE SET current_value = EXCLUDED.current_value;
          `,
          [counterKey, targetValue],
        );
      },
    );

    const nextValue = targetValue + 1;

    return {
      department_id: dep.id,
      department_name: dep.name,
      acronym: dep.acronym,
      period_id: activePeriod.id,
      period_name: activePeriod.name,
      current_value: targetValue,
      next_value: nextValue,
      next_folio_preview: `${dep.acronym}-${activePeriod.name}-${String(nextValue).padStart(4, '0')}`,
    };
  }

  async getCurrentPeriodDepartmentCounters() {
    const activePeriod =
      await this.schoolPeriodsService.getActiveSchoolPeriodOrFail();

    const { data: departments } = await this.departmentsService.findAllFilter({
      limit: 10000,
      status: true,
    });

    const counterKeys = departments.map(
      (d) => `REQ_${d.id}_${activePeriod.id}`,
    );

    const activeCounters = await this.folioCounterRepository.find({
      where: { id: In(counterKeys) },
    });

    return departments.map((dep) => {
      const targetKey = `REQ_${dep.id}_${activePeriod.id}`;
      const counter = activeCounters.find((c) => c.id === targetKey);
      const currentValue = counter ? counter.current_value : 0;
      const nextValue = currentValue + 1;

      return {
        department_id: dep.id,
        department_name: dep.name,
        acronym: dep.acronym,
        period_id: activePeriod.id,
        period_name: activePeriod.name,
        current_value: currentValue,
        next_value: nextValue,
        next_folio_preview: `${dep.acronym}-${activePeriod.name}-${String(nextValue).padStart(4, '0')}`,
      };
    });
  }

  async getCurrentPeriodDepartmentCounterDetail(departmentId: string) {
    const activePeriod =
      await this.schoolPeriodsService.getActiveSchoolPeriodOrFail();
    const dep = await this.departmentsService.findOne(departmentId);

    const targetKey = `REQ_${dep.id}_${activePeriod.id}`;
    const counter = await this.folioCounterRepository.findOneBy({
      id: targetKey,
    });

    const currentValue = counter ? counter.current_value : 0;
    const nextValue = currentValue + 1;

    return {
      department_id: dep.id,
      department_name: dep.name,
      acronym: dep.acronym,
      period_id: activePeriod.id,
      period_name: activePeriod.name,
      current_value: currentValue,
      next_value: nextValue,
      next_folio_preview: `${dep.acronym}-${activePeriod.name}-${String(nextValue).padStart(4, '0')}`,
    };
  }

  async generateOTFolio(
    departmentAcronym: string,
    transactionManager?: EntityManager,
  ): Promise<string> {
    const manager = transactionManager || this.folioCounterRepository.manager;
    const year = new Date().getFullYear().toString();
    const counterKey = `OT_${year}`;

    const result = await manager.query<{ current_value: number }[]>(
      `
      INSERT INTO folio_counters (id, current_value)
      VALUES ($1, 1)
      ON CONFLICT (id)
      DO UPDATE SET current_value = folio_counters.current_value + 1
      RETURNING current_value;
      `,
      [counterKey],
    );

    const nextNumber = result[0].current_value;
    const paddedNumber = String(nextNumber).padStart(4, '0');

    return `${OT_ACRONYM}-${year}-${paddedNumber}-${departmentAcronym}`;
  }

  async getCurrentYearOTCounterDetail() {
    const year = new Date().getFullYear().toString();
    const counterKey = `OT_${year}`;

    const counter = await this.folioCounterRepository.findOneBy({
      id: counterKey,
    });

    const currentValue = counter ? counter.current_value : 0;
    const nextValue = currentValue + 1;

    return {
      year,
      current_value: currentValue,
      next_value: nextValue,
      next_folio_preview: `${OT_ACRONYM}-${year}-${String(nextValue).padStart(4, '0')}-DEP`,
    };
  }

  async jumpCurrentYearOTCounter({
    requestedNextFolio,
  }: UpdateFolioCounterDto) {
    const year = new Date().getFullYear().toString();
    const counterKey = `OT_${year}`;
    const targetValue = requestedNextFolio - 1;

    await this.folioCounterRepository.manager.transaction(
      async (transactionManager) => {
        const currentCounter = await transactionManager
          .createQueryBuilder(FolioCounter, 'counter')
          .where('counter.id = :id', { id: counterKey })
          .setLock('pessimistic_write')
          .getOne();

        if (currentCounter) {
          if (targetValue < currentCounter.current_value) {
            throw new BadRequestException(
              this.i18n.t('errors.folio_counters.cannot_reduce', {
                args: { next_natural: currentCounter.current_value + 1 },
              }),
            );
          }
          if (targetValue === currentCounter.current_value) {
            throw new BadRequestException(
              this.i18n.t('errors.folio_counters.already_configured', {
                args: { requested: requestedNextFolio },
              }),
            );
          }
        }

        await transactionManager.query(
          `
          INSERT INTO folio_counters (id, current_value)
          VALUES ($1, $2)
          ON CONFLICT (id)
          DO UPDATE SET current_value = EXCLUDED.current_value;
          `,
          [counterKey, targetValue],
        );
      },
    );

    const nextValue = targetValue + 1;

    return {
      year,
      current_value: targetValue,
      next_value: nextValue,
      next_folio_preview: `${OT_ACRONYM}-${year}-${String(nextValue).padStart(4, '0')}-DEP`,
    };
  }

  async getCurrentPeriodMyDepartmentCounterDetail(user: User) {
    const departmentId = user?.staff?.department?.id;

    if (!departmentId) {
      throw new BadRequestException(
        this.i18n.t('errors.folio_counters.no_department'),
      );
    }

    return this.getCurrentPeriodDepartmentCounterDetail(departmentId);
  }

  async jumpMyDepartmentCounter(
    user: User,
    updateFolioDto: UpdateFolioCounterDto,
  ) {
    const departmentId = user?.staff?.department?.id;

    if (!departmentId) {
      throw new BadRequestException(
        this.i18n.t('errors.folio_counters.no_department'),
      );
    }

    return this.jumpCurrentPeriodDepartmentCounter(
      departmentId,
      updateFolioDto,
    );
  }
}
