import { prisma } from '../../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/utils/AppError';
import { parsePagination } from '../../shared/utils/pagination';
import { CreateCouponInput, UpdateCouponInput, ValidateCouponInput } from './coupon.schema';

export class CouponService {
  async createCoupon(data: CreateCouponInput) {
    // Check for duplicate code
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new ConflictError(`Coupon code "${data.code}" already exists`);
    }

    // Validate percentage value
    if (data.type === 'PERCENTAGE' && data.value > 100) {
      throw new ValidationError('Percentage value cannot exceed 100');
    }

    return prisma.coupon.create({
      data: {
        code: data.code,
        description: data.description,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount ?? null,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        usageLimit: data.usageLimit ?? null,
        isActive: data.isActive,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  async updateCoupon(id: number, data: UpdateCouponInput) {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Coupon not found');
    }

    // Check for duplicate code if changing code
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.coupon.findUnique({ where: { code: data.code } });
      if (duplicate) {
        throw new ConflictError(`Coupon code "${data.code}" already exists`);
      }
    }

    // Validate percentage value
    const type = data.type ?? existing.type;
    const value = data.value ? Number(data.value) : Number(existing.value);
    if (type === 'PERCENTAGE' && value > 100) {
      throw new ValidationError('Percentage value cannot exceed 100');
    }

    return prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount }),
        ...(data.maxDiscountAmount !== undefined && { maxDiscountAmount: data.maxDiscountAmount }),
        ...(data.usageLimit !== undefined && { usageLimit: data.usageLimit }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.startsAt !== undefined && { startsAt: data.startsAt ? new Date(data.startsAt) : null }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
      },
    });
  }

  async toggleCoupon(id: number) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    return prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }

  async deleteCoupon(id: number) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    return prisma.coupon.delete({ where: { id } });
  }

  async getCoupon(id: number) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }
    return coupon;
  }

  async listCoupons(filters?: { page?: number; limit?: number; isActive?: boolean }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const { skip, take } = parsePagination({ page, limit });

    const where: any = {};
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count({ where }),
    ]);

    return { data: coupons, total, page, limit };
  }

  /**
   * Validate a coupon code against an order subtotal.
   * Returns the coupon and calculated discount amount.
   */
  async validateCoupon(data: ValidateCouponInput) {
    const code = data.code.toUpperCase().trim();
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    if (!coupon.isActive) {
      throw new ValidationError('This coupon is no longer active');
    }

    // Check date validity
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new ValidationError('This coupon is not yet valid');
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new ValidationError('This coupon has expired');
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new ValidationError('This coupon has reached its usage limit');
    }

    // Check minimum order amount
    if (coupon.minOrderAmount !== null && data.subtotal < Number(coupon.minOrderAmount)) {
      throw new ValidationError(
        `Minimum order amount is ৳${Number(coupon.minOrderAmount).toLocaleString('en-BD')}`
      );
    }

    // Calculate discount amount
    let discountAmount: number;
    if (coupon.type === 'FIXED') {
      discountAmount = Number(coupon.value);
      // Discount cannot exceed subtotal
      if (discountAmount > data.subtotal) {
        discountAmount = data.subtotal;
      }
    } else {
      // PERCENTAGE
      discountAmount = (data.subtotal * Number(coupon.value)) / 100;
      // Apply max discount cap if set
      if (coupon.maxDiscountAmount !== null) {
        const cap = Number(coupon.maxDiscountAmount);
        if (discountAmount > cap) {
          discountAmount = cap;
        }
      }
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
        maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
      },
      discountAmount,
    };
  }

  /**
   * Increment the usedCount for a coupon (called after order is placed).
   */
  async incrementUsage(couponId: number, tx?: any) {
    const client = tx || prisma;
    return client.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }
}

export default new CouponService();
