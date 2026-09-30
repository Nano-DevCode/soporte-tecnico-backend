import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

export const GetUserWs = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient<{
      data: Record<string, unknown>;
    }>();

    const user = client.data['user'] as User;

    if (!user)
      throw new InternalServerErrorException('User not found (websocket)');

    return !data ? user : (user[data as keyof User] as Partial<User>);
  },
);
