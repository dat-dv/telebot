import { Controller, Get, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { FinanceService } from '../finance/finance.service';
import { signReportsUser, verifyReportsUser } from './reports-access';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly config: ConfigService,
    private readonly finance: FinanceService,
  ) {}

  @Get('access')
  public access(
    @Query('userId') rawUserId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ): void {
    const expected = this.config.get<string>('reports.accessToken');
    const userId = Number(rawUserId);
    if (!expected || !Number.isSafeInteger(userId) || !verifyReportsUser(userId, token, expected))
      throw new UnauthorizedException();
    res.cookie('reports_access', `${userId}.${signReportsUser(userId, expected)}`, {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      maxAge: 86400000,
    });
    res.redirect('/reports');
  }

  @Get()
  public async dashboard(@Req() req: Request, @Res() res: Response): Promise<void> {
    const expected = this.config.get<string>('reports.accessToken');
    if (!expected || !this.hasAccess(req, expected)) throw new UnauthorizedException();
    const userId = this.getUserId(req, expected);
    const now = new Date();
    const startAt = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const [summary, debts] = await Promise.all([
      this.finance.getSummary(userId, startAt, endAt),
      this.finance.getActiveDebts(userId),
    ]);
    const receivable = debts
      .filter((d) => d.direction === 'receivable')
      .reduce((s, d) => s + d.remainingAmount, 0);
    const payable = debts
      .filter((d) => d.direction === 'payable')
      .reduce((s, d) => s + d.remainingAmount, 0);
    const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
    const rows = summary.transactions
      .slice(0, 20)
      .map(
        (t) =>
          `<tr><td>${t.type === 'income' ? 'Thu' : 'Chi'}</td><td>${this.escape(t.category)}</td><td>${this.escape(t.note)}</td><td>${money(t.amount)}</td></tr>`,
      )
      .join('');
    res
      .type('html')
      .send(
        `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Báo cáo tài chính</title><style>body{font:15px system-ui;background:#f6f7fb;color:#152033;margin:0;padding:24px}.wrap{max-width:960px;margin:auto}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card,table{background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px #0001}.label{color:#6b7280}.value{font-size:22px;font-weight:700;margin-top:6px}table{margin-top:18px;width:100%;border-collapse:collapse}td,th{padding:12px;text-align:left;border-bottom:1px solid #eee}@media(max-width:650px){.cards{grid-template-columns:repeat(2,1fr)}body{padding:12px}}</style></head><body><main class="wrap"><h1>💰 Báo cáo tháng này</h1><section class="cards"><div class="card"><div class="label">Tổng thu</div><div class="value">${money(summary.income)}</div></div><div class="card"><div class="label">Tổng chi</div><div class="value">${money(summary.expense)}</div></div><div class="card"><div class="label">Cần thu</div><div class="value">${money(receivable)}</div></div><div class="card"><div class="label">Cần trả</div><div class="value">${money(payable)}</div></div></section><h2>Giao dịch gần đây</h2><table><thead><tr><th>Loại</th><th>Danh mục</th><th>Mô tả</th><th>Số tiền</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Chưa có giao dịch</td></tr>'}</tbody></table></main></body></html>`,
      );
  }

  private hasAccess(req: Request, token: string): boolean {
    try {
      this.getUserId(req, token);
      return true;
    } catch {
      return false;
    }
  }
  private getUserId(req: Request, secret: string): number {
    const value = req.headers.cookie
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('reports_access='))
      ?.slice('reports_access='.length);
    const [rawUserId, signature] = value?.split('.') || [];
    const userId = Number(rawUserId);
    if (
      !Number.isSafeInteger(userId) ||
      !signature ||
      !verifyReportsUser(userId, signature, secret)
    )
      throw new UnauthorizedException();
    return userId;
  }
  private escape(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
