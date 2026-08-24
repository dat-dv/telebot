import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { getDashboardUserId } from '../dashboard-auth/dashboard-user';
import { ReportsTokenService } from '../reports/reports-token.service';
import { FinanceService } from './finance.service';

type RecordBody = Record<string, unknown>;

@ApiTags('Finance & Transactions')
@ApiBearerAuth('bearer-jwt')
@Controller()
export class FinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly tokens: ReportsTokenService,
  ) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Lấy danh sách giao dịch thu/chi' })
  async listTransactions(@Req() req: Request, @Query('type') type?: 'income' | 'expense') {
    return { data: await this.finance.listTransactions(this.userId(req), type) };
  }

  @Get('transactions/:id')
  async getTransaction(@Req() req: Request, @Param('id') id: string) {
    return { data: await this.required(this.finance.getTransaction(this.userId(req), id)) };
  }

  @Post('transactions')
  async createTransaction(@Req() req: Request, @Body() body: RecordBody) {
    return {
      data: await this.finance.createTransaction({
        ...this.transactionInput(body),
        userId: this.userId(req),
      }),
    };
  }

  @Patch('transactions/:id')
  async updateTransaction(@Req() req: Request, @Param('id') id: string, @Body() body: RecordBody) {
    return {
      data: await this.required(
        this.finance.updateTransaction(this.userId(req), id, this.transactionInput(body, true)),
      ),
    };
  }

  @Delete('transactions/:id')
  async deleteTransaction(@Req() req: Request, @Param('id') id: string) {
    if (!(await this.finance.deleteTransaction(this.userId(req), id)))
      throw new NotFoundException();
    return { data: { deleted: true } };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh sách danh mục thu/chi' })
  async listCategories(@Req() req: Request, @Query('type') type?: 'income' | 'expense') {
    const categories = await this.finance.listCategories(this.userId(req), type);
    return {
      data: categories.map((cat) => ({
        id: cat.id,
        type: cat.type,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        isDefault: cat.isDefault,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt?.toISOString(),
      })),
    };
  }

  @Post('categories')
  @ApiOperation({ summary: 'Tạo danh mục thu/chi mới' })
  async createCategory(@Req() req: Request, @Body() body: RecordBody) {
    const type = this.string(body.type, 'type');
    if (type !== 'income' && type !== 'expense') {
      throw new BadRequestException('Loại danh mục phải là income hoặc expense.');
    }
    const name = this.string(body.name, 'name');
    const color = this.optionalString(body.color);
    const icon = this.optionalString(body.icon);
    const cat = await this.finance.createCategory(this.userId(req), {
      type,
      name,
      color,
      icon,
    });
    return {
      data: {
        id: cat.id,
        type: cat.type,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        isDefault: cat.isDefault,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt?.toISOString(),
      },
    };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Cập nhật danh mục thu/chi' })
  async updateCategory(@Req() req: Request, @Param('id') id: string, @Body() body: RecordBody) {
    const name = this.optionalString(body.name);
    const color = this.optionalString(body.color);
    const icon = this.optionalString(body.icon);
    const cat = await this.finance.updateCategory(this.userId(req), id, {
      name,
      color,
      icon,
    });
    if (!cat) throw new NotFoundException('Không tìm thấy danh mục.');
    return {
      data: {
        id: cat.id,
        type: cat.type,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        isDefault: cat.isDefault,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt?.toISOString(),
      },
    };
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Xóa danh mục thu/chi' })
  async deleteCategory(@Req() req: Request, @Param('id') id: string) {
    const deleted = await this.finance.deleteCategory(this.userId(req), id);
    if (!deleted) throw new NotFoundException('Không tìm thấy danh mục.');
    return { data: { deleted: true } };
  }

  @Get('contacts/:id')
  async getContact(@Req() req: Request, @Param('id') id: string) {
    return { data: await this.required(this.finance.getContact(this.userId(req), id)) };
  }

  @Post('contacts')
  async createContact(@Req() req: Request, @Body() body: RecordBody) {
    return {
      data: await this.finance.createContact(
        this.userId(req),
        this.string(body.displayName, 'displayName'),
        this.optionalString(body.alias),
        this.optionalString(body.descriptor),
        this.optionalString(body.phoneNumber),
        this.optionalString(body.bankAccountNumber),
        this.optionalString(body.bankCode),
        this.optionalString(body.bankName),
        this.optionalString(body.avatarUrl),
      ),
    };
  }

  @Patch('contacts/:id')
  async updateContact(@Req() req: Request, @Param('id') id: string, @Body() body: RecordBody) {
    return {
      data: await this.finance.updateContact(
        this.userId(req),
        id,
        this.string(body.displayName, 'displayName'),
        this.optionalString(body.alias),
        this.optionalString(body.descriptor),
        this.optionalString(body.phoneNumber),
        this.optionalString(body.bankAccountNumber),
        this.optionalString(body.bankCode),
        this.optionalString(body.bankName),
        this.optionalString(body.avatarUrl),
      ),
    };
  }

  @Post('contacts/combine')
  @ApiOperation({ summary: 'Gộp nhiều liên hệ thành một liên hệ chính' })
  async combineContacts(@Req() req: Request, @Body() body: RecordBody) {
    const targetContactId = this.string(body.targetContactId, 'targetContactId');
    const sourceContactIds = Array.isArray(body.sourceContactIds)
      ? body.sourceContactIds.filter(
          (item): item is string => typeof item === 'string' && Boolean(item.trim()),
        )
      : [];
    if (sourceContactIds.length === 0) {
      throw new BadRequestException('sourceContactIds must be a non-empty array of strings.');
    }

    const result = await this.finance.combineContacts(this.userId(req), {
      targetContactId,
      sourceContactIds,
      displayName: this.optionalString(body.displayName),
      alias: this.optionalString(body.alias),
      descriptor: this.optionalString(body.descriptor),
    });

    return {
      data: {
        targetContact: {
          id: result.targetContact.id,
          displayName: result.targetContact.displayName,
          alias: result.targetContact.alias,
          descriptor: result.targetContact.descriptor,
          phoneNumber: result.targetContact.phoneNumber,
          bankAccountNumber: result.targetContact.bankAccountNumber,
          bankCode: result.targetContact.bankCode,
          bankName: result.targetContact.bankName,
          avatarUrl: result.targetContact.avatarUrl,
          createdAt: result.targetContact.createdAt.toISOString(),
          updatedAt: result.targetContact.updatedAt?.toISOString(),
        },
        affectedDebtsCount: result.affectedDebtsCount,
        mergedCount: result.mergedCount,
      },
    };
  }

  @Delete('contacts/:id')
  async deleteContact(@Req() req: Request, @Param('id') id: string) {
    if (!(await this.finance.deleteContact(this.userId(req), id))) throw new NotFoundException();
    return { data: { deleted: true } };
  }

  @Get('debts/:id')
  async getDebt(@Req() req: Request, @Param('id') id: string) {
    return { data: await this.required(this.finance.getDebt(this.userId(req), id)) };
  }

  @Post('debts')
  async createDebt(@Req() req: Request, @Body() body: RecordBody) {
    const direction = this.enum(body.direction, ['receivable', 'payable'] as const, 'direction');
    return {
      data: await this.finance.createDebt({
        userId: this.userId(req),
        direction,
        counterparty: this.string(body.counterparty, 'counterparty'),
        counterpartyAlias: this.optionalString(body.counterpartyAlias),
        contactId: this.optionalString(body.contactId),
        createNewContact: body.createNewContact === true,
        amount: this.number(body.amount, 'amount'),
        currency: this.optionalString(body.currency),
        note: this.optionalString(body.note),
        dueAt: this.optionalString(body.dueAt),
      }),
    };
  }

  @Patch('debts/:id')
  async updateDebt(@Req() req: Request, @Param('id') id: string, @Body() body: RecordBody) {
    return {
      data: await this.required(
        this.finance.updateDebt(this.userId(req), id, {
          direction:
            body.direction === undefined
              ? undefined
              : this.enum(body.direction, ['receivable', 'payable'] as const, 'direction'),
          counterparty: this.optionalString(body.counterparty),
          counterpartyAlias: this.optionalString(body.counterpartyAlias),
          contactId: this.optionalString(body.contactId),
          originalAmount:
            body.originalAmount === undefined
              ? undefined
              : this.number(body.originalAmount, 'originalAmount'),
          remainingAmount:
            body.remainingAmount === undefined
              ? undefined
              : this.number(body.remainingAmount, 'remainingAmount'),
          amount: body.amount === undefined ? undefined : this.number(body.amount, 'amount'),
          currency: this.optionalString(body.currency),
          note: this.optionalString(body.note),
          dueAt: this.optionalString(body.dueAt),
        }),
      ),
    };
  }

  @Get('debts/:id/payments')
  @ApiOperation({ summary: 'Lấy lịch sử thanh toán của khoản nợ' })
  async getDebtPayments(@Req() req: Request, @Param('id') id: string) {
    return {
      data: await this.finance.getDebtPayments(this.userId(req), id),
    };
  }

  @Post('debts/:id/payments')
  @ApiOperation({ summary: 'Ghi nhận một lần thanh toán nợ' })
  async recordPayment(@Req() req: Request, @Param('id') id: string, @Body() body: RecordBody) {
    return {
      data: await this.finance.recordDebtPayment(
        this.userId(req),
        id,
        this.number(body.amount, 'amount'),
        this.optionalString(body.paymentDate),
        this.optionalString(body.note),
      ),
    };
  }

  @Delete('debts/:id')
  async deleteDebt(@Req() req: Request, @Param('id') id: string) {
    if (!(await this.finance.deleteDebt(this.userId(req), id))) throw new NotFoundException();
    return { data: { deleted: true } };
  }

  private userId(req: Request): number {
    return getDashboardUserId(req, this.tokens);
  }
  private async required<T>(result: Promise<T | null>): Promise<T> {
    const value = await result;
    if (!value) throw new NotFoundException();
    return value;
  }
  private string(value: unknown, name: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new BadRequestException(`${name} is required.`);
    return value.trim();
  }
  private optionalString(value: unknown): string | undefined {
    return value === undefined || value === null ? undefined : this.string(value, 'value');
  }
  private number(value: unknown, name: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0)
      throw new BadRequestException(`${name} must be a positive number.`);
    return parsed;
  }
  private enum<T extends readonly string[]>(value: unknown, values: T, name: string): T[number] {
    if (typeof value !== 'string' || !values.includes(value))
      throw new BadRequestException(`${name} is invalid.`);
    return value;
  }
  private transactionInput(body: RecordBody, partial = false) {
    return {
      type:
        body.type === undefined && partial
          ? undefined
          : this.enum(body.type, ['income', 'expense'] as const, 'type'),
      amount: body.amount === undefined && partial ? undefined : this.number(body.amount, 'amount'),
      currency: this.optionalString(body.currency),
      category: this.optionalString(body.category),
      paymentMethod: this.optionalString(body.paymentMethod),
      receiptUrl: this.optionalString(body.receiptUrl),
      contactId: this.optionalString(body.contactId),
      note: body.note === undefined && partial ? undefined : this.string(body.note, 'note'),
      occurredAt: this.optionalString(body.occurredAt),
    };
  }
}
