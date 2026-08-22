import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { InviteCode, UserProfile, UsersDatabase } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly dbFilePath: string;
  private db: UsersDatabase = {
    users: {},
    invites: {},
    usage: {},
  };

  private readonly defaultDailyLimit = 100;
  private readonly adminDailyLimit = 500;
  private readonly cooldownSeconds = 2;

  constructor(private readonly configService: ConfigService) {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbFilePath = path.join(dataDir, 'users.json');
  }

  public onModuleInit(): void {
    this.loadDatabase();
    this.seedInitialUsers();
  }

  private loadDatabase(): void {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8').trim();
        if (raw) {
          this.db = JSON.parse(raw) as UsersDatabase;
          this.logger.log(`Loaded ${Object.keys(this.db.users).length} users from storage.`);
          return;
        }
      }
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to load users database: ${error.message}`);
    }

    this.saveDatabase();
  }

  private saveDatabase(): void {
    try {
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.db, null, 2), 'utf8');
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to save users database: ${error.message}`);
    }
  }

  private getTodayDateString(): string {
    const timezone = this.configService.get<string>('timezone', 'Asia/Ho_Chi_Minh');
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // "YYYY-MM-DD"
  }

  private seedInitialUsers(): void {
    const allowedIds = this.configService.get<number[]>('telegram.allowedUserIds', []);
    const adminIdEnv = process.env.TELEGRAM_ADMIN_ID ? Number(process.env.TELEGRAM_ADMIN_ID) : null;

    let modified = false;

    if (allowedIds && allowedIds.length > 0) {
      for (const [index, id] of allowedIds.entries()) {
        if (!this.db.users[id]) {
          const isFirstOrAdmin = adminIdEnv ? id === adminIdEnv : index === 0;
          this.db.users[id] = {
            id,
            role: isFirstOrAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
          };
          modified = true;
        }
      }
    }

    if (adminIdEnv && !this.db.users[adminIdEnv]) {
      this.db.users[adminIdEnv] = {
        id: adminIdEnv,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      modified = true;
    }

    if (modified) {
      this.saveDatabase();
    }
  }

  public isAdmin(userId: number): boolean {
    const user = this.db.users[userId];
    if (user?.role === 'admin') return true;

    // Check if explicitly matches TELEGRAM_ADMIN_ID env
    const adminIdEnv = process.env.TELEGRAM_ADMIN_ID ? Number(process.env.TELEGRAM_ADMIN_ID) : null;
    if (adminIdEnv && userId === adminIdEnv) return true;

    // Or if first ID in TELEGRAM_ALLOWED_USER_IDS
    const allowedIds = this.configService.get<number[]>('telegram.allowedUserIds', []);
    return allowedIds.length > 0 && allowedIds[0] === userId;
  }

  public isAllowed(userId: number): boolean {
    // If no users configured at all and no allowed list, allow (public mode)
    const allowedIds = this.configService.get<number[]>('telegram.allowedUserIds', []);
    const hasConfiguredUsers = Object.keys(this.db.users).length > 0 || allowedIds.length > 0;
    if (!hasConfiguredUsers) {
      return true;
    }

    if (this.db.users[userId]) {
      return true;
    }

    return allowedIds.includes(userId);
  }

  public createInvite(adminId: number): InviteCode {
    const code = 'invite_' + crypto.randomBytes(6).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const invite: InviteCode = {
      code,
      createdBy: adminId,
      createdAt: now.toISOString(),
      expiresAt,
    };

    this.db.invites[code] = invite;
    this.saveDatabase();

    return invite;
  }

  public consumeInvite(
    code: string,
    user: { id: number; username?: string; firstName?: string },
  ): { success: boolean; message: string } {
    const invite = this.db.invites[code];
    if (!invite) {
      return { success: false, message: 'Mã mời không tồn tại hoặc đã hết hạn.' };
    }

    if (invite.usedBy) {
      return { success: false, message: 'Mã mời này đã được sử dụng trước đó.' };
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      return { success: false, message: 'Mã mời này đã hết hạn sử dụng (quá 24 giờ).' };
    }

    // Mark as used
    invite.usedBy = user.id;
    invite.usedAt = new Date().toISOString();

    // Add user to database
    this.db.users[user.id] = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    this.saveDatabase();
    this.logger.log(
      `User ${user.id} (${user.firstName}) successfully joined via invite code ${code}`,
    );

    return {
      success: true,
      message: `Chào mừng ${user.firstName || 'bạn'}! Bạn đã kích hoạt quyền sử dụng trợ lý thành công.`,
    };
  }

  public checkRateLimit(userId: number): {
    allowed: boolean;
    reason?: string;
    waitSeconds?: number;
  } {
    const now = Date.now();
    const todayStr = this.getTodayDateString();

    let usage = this.db.usage[userId];
    if (!usage || usage.lastResetDate !== todayStr) {
      const limit = this.isAdmin(userId) ? this.adminDailyLimit : this.defaultDailyLimit;
      usage = {
        usedToday: 0,
        dailyLimit: limit,
        lastRequestTime: 0,
        lastResetDate: todayStr,
      };
      this.db.usage[userId] = usage;
    }

    // 1. Check Cooldown (Throttling)
    const timeSinceLast = (now - usage.lastRequestTime) / 1000;
    if (timeSinceLast < this.cooldownSeconds && !this.isAdmin(userId)) {
      const waitSeconds = Math.ceil(this.cooldownSeconds - timeSinceLast);
      return {
        allowed: false,
        reason: `⏳ Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ ${waitSeconds} giây trước khi gửi tiếp nhé!`,
        waitSeconds,
      };
    }

    // 2. Check Daily Limit
    if (usage.usedToday >= usage.dailyLimit && !this.isAdmin(userId)) {
      return {
        allowed: false,
        reason: `📊 Bạn đã sử dụng hết hạn mức ${usage.dailyLimit} tin nhắn của ngày hôm nay.\nHạn mức sẽ được làm mới lại vào 07:00 sáng mai nhé!`,
      };
    }

    return { allowed: true };
  }

  public recordUsage(userId: number): void {
    const todayStr = this.getTodayDateString();
    let usage = this.db.usage[userId];
    if (!usage || usage.lastResetDate !== todayStr) {
      const limit = this.isAdmin(userId) ? this.adminDailyLimit : this.defaultDailyLimit;
      usage = {
        usedToday: 0,
        dailyLimit: limit,
        lastRequestTime: Date.now(),
        lastResetDate: todayStr,
      };
    }

    usage.usedToday += 1;
    usage.lastRequestTime = Date.now();
    this.db.usage[userId] = usage;
    this.saveDatabase();
  }

  public getUserUsage(userId: number): {
    usedToday: number;
    dailyLimit: number;
    remaining: number;
  } {
    const todayStr = this.getTodayDateString();
    let usage = this.db.usage[userId];
    if (!usage || usage.lastResetDate !== todayStr) {
      const limit = this.isAdmin(userId) ? this.adminDailyLimit : this.defaultDailyLimit;
      usage = {
        usedToday: 0,
        dailyLimit: limit,
        lastRequestTime: 0,
        lastResetDate: todayStr,
      };
      this.db.usage[userId] = usage;
    }

    return {
      usedToday: usage.usedToday,
      dailyLimit: usage.dailyLimit,
      remaining: Math.max(0, usage.dailyLimit - usage.usedToday),
    };
  }

  public allowUser(userId: number, role: 'admin' | 'user' = 'user'): void {
    this.db.users[userId] = {
      id: userId,
      role,
      createdAt: new Date().toISOString(),
    };
    this.saveDatabase();
  }

  public banUser(userId: number): boolean {
    if (this.db.users[userId]) {
      Reflect.deleteProperty(this.db.users, userId);
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public getUsers(): UserProfile[] {
    return Object.values(this.db.users);
  }
}
