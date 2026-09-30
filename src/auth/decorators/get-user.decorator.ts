import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user: User }>();
    const user = req.user;

    if (!user)
      throw new InternalServerErrorException('User not found (request)');

    return !data ? user : (user[data] as Partial<User>);
  },
);
