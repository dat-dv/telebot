import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { UserEntity } from '../database/entities/user.entity';
import { InviteEntity } from '../database/entities/invite.entity';
import { fromProjectRoot } from '../config/project-root';
import { normalizeLocale, type SupportedLocale } from '@telebot/contracts';

interface LegacyUserJson {
  id: number;
  username?: string;
  firstName?: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

interface LegacyDatabaseJson {
  users?: Record<string, LegacyUserJson>;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly cooldownSeconds = 2;

  // In-memory cache for ultra-fast, zero-latency synchronous checks
  private allowedUserIdsCache: Set<string> = new Set();
  private adminUserIdsCache: Set<string> = new Set();

  // In-memory timestamp tracker for cooldown
  private lastRequestTimes: Map<string, number> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(InviteEntity)
    private readonly inviteRepo: Repository<InviteEntity>,
  ) {}

  public async onModuleInit(): Promise<void> {
    await this.migrateLegacyJson();
    await this.seedInitialUsers();
    await this.refreshMemoryCache();
  }

  private async refreshMemoryCache(): Promise<void> {
    try {
      const users = await this.userRepo.find();
      this.allowedUserIdsCache.clear();
      this.adminUserIdsCache.clear();

      for (const u of users) {
        this.allowedUserIdsCache.add(u.id);
        if (u.role === 'admin') {
          this.adminUserIdsCache.add(u.id);
        }
      }

      // Also include env admin & allowed IDs
      const adminId = this.configService.getOrThrow<number>('telegram.adminId');
      this.adminUserIdsCache.add(adminId.toString());
      this.allowedUserIdsCache.add(adminId.toString());

      const allowedIds = this.configService.getOrThrow<number[]>('telegram.allowedUserIds');
      for (const id of allowedIds) {
        this.allowedUserIdsCache.add(id.toString());
      }

      this.logger.log(
        `SQLite Database initialized with ${users.length} registered users (Admins: ${this.adminUserIdsCache.size}).`,
      );
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error refreshing memory cache: ${error.message}`);
    }
  }

  private async migrateLegacyJson(): Promise<void> {
    const legacyPath = fromProjectRoot('data', 'users.json');
    if (fs.existsSync(legacyPath)) {
      try {
        const raw = fs.readFileSync(legacyPath, 'utf8').trim();
        if (raw) {
          const jsonDb = JSON.parse(raw) as LegacyDatabaseJson;
          if (jsonDb.users) {
            const userList: LegacyUserJson[] = Object.values(jsonDb.users);
            for (const u of userList) {
              const strId = u.id.toString();
              const existing = await this.userRepo.findOne({ where: { id: strId } });
              if (!existing) {
                const newUser = this.userRepo.create({
                  id: strId,
                  username: u.username,
                  firstName: u.firstName,
                  role: u.role || 'user',
                  createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
                });
                await this.userRepo.save(newUser);
              }
            }
            this.logger.log('Successfully migrated legacy users.json data to SQLite.');
          }
        }
      } catch (err) {
        const error = err as Error;
        this.logger.warn(`Could not migrate legacy users.json: ${error.message}`);
      }
    }
  }

  private async seedInitialUsers(): Promise<void> {
    const adminIdEnv = this.configService.getOrThrow<number>('telegram.adminId').toString();
    const allowedIds = this.configService.getOrThrow<number[]>('telegram.allowedUserIds');

    const existing = await this.userRepo.findOne({ where: { id: adminIdEnv } });
    if (!existing) {
      const adminUser = this.userRepo.create({
        id: adminIdEnv,
        role: 'admin',
        createdAt: new Date(),
      });
      await this.userRepo.save(adminUser);
    }

    if (allowedIds && allowedIds.length > 0) {
      for (const [index, idNum] of allowedIds.entries()) {
        const idStr = idNum.toString();
        const existing = await this.userRepo.findOne({ where: { id: idStr } });
        if (!existing) {
          const isFirstOrAdmin = idStr === adminIdEnv || index === 0;
          const user = this.userRepo.create({
            id: idStr,
            role: isFirstOrAdmin ? 'admin' : 'user',
            createdAt: new Date(),
          });
          await this.userRepo.save(user);
        }
      }
    }
  }

  public hasAdminConfigured(): boolean {
    return this.adminUserIdsCache.size > 0;
  }

  public isAdmin(userId: number): boolean {
    return this.adminUserIdsCache.has(userId.toString());
  }

  public isAllowed(userId: number): boolean {
    const strId = userId.toString();
    return this.allowedUserIdsCache.has(strId);
  }

  public async getPreferredLocale(userId: number): Promise<SupportedLocale> {
    const user = await this.userRepo.findOne({ where: { id: userId.toString() } });
    return normalizeLocale(user?.preferredLocale);
  }

  public async setPreferredLocale(
    userId: number,
    locale: SupportedLocale,
  ): Promise<SupportedLocale> {
    const user = await this.upsertUser(userId);
    user.preferredLocale = normalizeLocale(locale);
    await this.userRepo.save(user);
    return user.preferredLocale;
  }

  public async createInvite(adminId: number): Promise<InviteEntity> {
    const code = 'invite_' + crypto.randomBytes(6).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const invite = this.inviteRepo.create({
      code,
      createdBy: adminId.toString(),
      createdAt: now,
      expiresAt,
    });

    const saved = await this.inviteRepo.save(invite);
    return saved;
  }

  public async consumeInvite(
    code: string,
    user: { id: number; username?: string; firstName?: string },
  ): Promise<{ success: boolean; message: string }> {
    const invite = await this.inviteRepo.findOne({ where: { code } });
    if (!invite) {
      return { success: false, message: 'Mã mời không tồn tại hoặc đã hết hạn.' };
    }

    if (invite.usedBy) {
      return { success: false, message: 'Mã mời này đã được sử dụng trước đó.' };
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      return { success: false, message: 'Mã mời này đã hết hạn sử dụng (quá 24 giờ).' };
    }

    const strId = user.id.toString();

    // Mark as used
    invite.usedBy = strId;
    invite.usedAt = new Date().toISOString();
    await this.inviteRepo.save(invite);

    // Add user to database
    let existingUser = await this.userRepo.findOne({ where: { id: strId } });
    if (!existingUser) {
      existingUser = this.userRepo.create({
        id: strId,
        username: user.username,
        firstName: user.firstName,
        role: 'user',
        createdAt: new Date(),
      });
    } else {
      existingUser.username = user.username;
      existingUser.firstName = user.firstName;
    }
    await this.userRepo.save(existingUser);

    this.allowedUserIdsCache.add(strId);
    this.logger.log(`User ${user.id} (${user.firstName}) joined via invite code ${code}`);

    return {
      success: true,
      message: `Chào mừng ${user.firstName || 'bạn'}! Bạn đã kích hoạt quyền sử dụng trợ lý thành công.`,
    };
  }

  public checkCooldown(userId: number): {
    allowed: boolean;
    reason?: string;
    waitSeconds?: number;
  } {
    const strId = userId.toString();
    const now = Date.now();
    const isUserAdmin = this.isAdmin(userId);

    const lastTime = this.lastRequestTimes.get(strId) || 0;
    const timeSinceLast = (now - lastTime) / 1000;

    if (timeSinceLast < this.cooldownSeconds && !isUserAdmin) {
      const waitSeconds = Math.ceil(this.cooldownSeconds - timeSinceLast);
      return {
        allowed: false,
        reason: `⏳ Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ ${waitSeconds} giây trước khi gửi tiếp nhé!`,
        waitSeconds,
      };
    }

    this.lastRequestTimes.set(strId, now);
    return { allowed: true };
  }

  public async allowUser(userId: number, role: 'admin' | 'user' = 'user'): Promise<void> {
    await this.upsertUser(userId, role);
  }

  public async upsertUser(userId: number, role: 'admin' | 'user' = 'user'): Promise<UserEntity> {
    const strId = userId.toString();
    let existing = await this.userRepo.findOne({ where: { id: strId } });
    if (!existing) {
      existing = this.userRepo.create({
        id: strId,
        role,
        createdAt: new Date(),
      });
    } else {
      existing.role = role;
    }
    await this.userRepo.save(existing);
    this.allowedUserIdsCache.add(strId);
    if (role === 'admin') this.adminUserIdsCache.add(strId);
    else this.adminUserIdsCache.delete(strId);
    return existing;
  }

  public async banUser(userId: number): Promise<boolean> {
    if (this.isAdmin(userId)) {
      this.logger.warn(`Attempted to ban admin user ${userId}. Operation aborted.`);
      return false;
    }
    const strId = userId.toString();
    const existing = await this.userRepo.findOne({ where: { id: strId } });
    if (existing) {
      await this.userRepo.remove(existing);
      this.allowedUserIdsCache.delete(strId);
      this.adminUserIdsCache.delete(strId);
      return true;
    }
    return false;
  }

  public async getUsers(): Promise<UserEntity[]> {
    return this.userRepo.find();
  }

  public getUser(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  public async updateRole(id: string, role: 'admin' | 'user'): Promise<UserEntity | null> {
    const user = await this.getUser(id);
    if (!user) return null;
    return this.upsertUser(Number(id), role);
  }

  public listInvites(): Promise<InviteEntity[]> {
    return this.inviteRepo.find({ order: { createdAt: 'DESC' } });
  }

  public async revokeInvite(code: string): Promise<boolean> {
    const invite = await this.inviteRepo.findOne({ where: { code, usedBy: IsNull() } });
    if (!invite) return false;
    await this.inviteRepo.remove(invite);
    return true;
  }
}
