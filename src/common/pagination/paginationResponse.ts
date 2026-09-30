import { PAGINATION } from '../constants/pagination.constants';
import { PaginationWithPageDto } from '../dtos/paginationWithPage.dto';
import { DataPagination } from './interfaces/dataPagination.interface';
import { PaginatedResponse } from './interfaces/paginationResponse.interface';

export const PaginationResponse = <T>(
  { data, total }: DataPagination<T>,
  { limit, page }: PaginationWithPageDto,
): PaginatedResponse<T> => ({
  data,
  meta: {
    total,
    limit: limit || PAGINATION.DEFAULT_LIMIT,
    page: page || PAGINATION.DEFAULT_PAGE,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
    lastPage: Math.ceil(total / limit),
  },
});
