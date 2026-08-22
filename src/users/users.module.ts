import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserEntity } from '../database/entities/user.entity';
import { InviteEntity } from '../database/entities/invite.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UserEntity, InviteEntity])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
