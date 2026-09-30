import { SetMetadata } from '@nestjs/common';
import { ValidRole } from '../interfaces/valid-roles';

export const META_ROLES = 'roles';

export const RoleProtected = (...args: ValidRole[]) => {
  return SetMetadata(META_ROLES, args);
};
