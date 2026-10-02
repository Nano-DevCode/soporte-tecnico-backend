import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { FilterTicketReportsDto } from '../dto/filter-ticket-reports.dto';
import { MatrixRow } from 'src/excel/interfaces/report-config.interface';
import { DepartmentsService } from 'src/departments/services/departments.service';
import { IssueTypeService } from 'src/issue_type/issue_type.service';

export type FormattedReportRow = {
  tipo: string;
  categoria: string;
  cantidad: number;
};

@Injectable()
export class TicketReportsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly issueTypeService: IssueTypeService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  async getTicketsSummaryReport({ school_period }: FilterTicketReportsDto) {
    const [allDepartments, allIssueTypes] = await Promise.all([
      this.departmentsService.findAll(),
      this.issueTypeService.findAll(),
    ]);

    const issueTypesSet = new Set<string>();
    allIssueTypes.forEach((issue) => issueTypesSet.add(issue.name));
    const issueTypes = Array.from(issueTypesSet);

    const departmentMap = new Map<string, MatrixRow>();
    const totalsRow: MatrixRow = { departamento: 'TOTAL GENERAL', total: 0 };

    issueTypes.forEach((issue) => {
      totalsRow[issue] = 0;
    });

    // Pre-poblar el mapa con todos los departamentos existentes en la BD
    allDepartments.forEach((dept) => {
      const deptoName = dept.name;
      const newRow: MatrixRow = { departamento: deptoName, total: 0 };

      issueTypes.forEach((issue) => {
        newRow[issue] = 0;
      });

      departmentMap.set(deptoName, newRow);
    });

    const rawData = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.jefe_depto', 'jefe_depto')
      .leftJoin('jefe_depto.department', 'department')
      .leftJoin('ticket.issue_type', 'issue_type')
      .select('department.name', 'departamento')
      .addSelect('issue_type.name', 'issueType')
      .addSelect('COUNT(ticket.id)', 'cantidad')
      .leftJoin('ticket.school_period', 'school_period')
      .andWhere('school_period.id = :school_period', { school_period })
      .groupBy('department.id')
      .addGroupBy('issue_type.id')
      .getRawMany<{
        departamento: string | null;
        issueType: string | null;
        cantidad: string;
      }>();

    rawData.forEach((row) => {
      const deptoName = row.departamento || 'Sin Asignar';
      const issueName = row.issueType || 'Sin Clasificar';
      const cantidad = Number(row.cantidad);

      if (!issueTypesSet.has(issueName)) {
        issueTypes.push(issueName);
        totalsRow[issueName] = 0;
        departmentMap.forEach((r) => (r[issueName] = 0));
        issueTypesSet.add(issueName);
      }

      if (!departmentMap.has(deptoName)) {
        const newRow: MatrixRow = { departamento: deptoName, total: 0 };
        issueTypes.forEach((issue) => {
          newRow[issue] = 0;
        });
        departmentMap.set(deptoName, newRow);
      }

      const deptoRow = departmentMap.get(deptoName)!;
      deptoRow[issueName] = (deptoRow[issueName] as number) + cantidad;
      deptoRow.total += cantidad;

      totalsRow[issueName] = (totalsRow[issueName] as number) + cantidad;
      totalsRow.total += cantidad;
    });

    const data = Array.from(departmentMap.values());

    return {
      issueTypes,
      data,
      totalsRow,
    };
  }
}
