import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:    z.string().check(z.email({ error: 'Invalid email address' })),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .check(z.regex(/[A-Z]/, 'Password must contain at least one uppercase letter'))
    .check(z.regex(/[0-9]/, 'Password must contain at least one number')),
  phone:    z.string().max(20).optional(),
});

export const LoginSchema = z.object({
  email:    z.string().check(z.email()),
  password: z.string().min(1),
});

// ─── Menu ─────────────────────────────────────────────────────────────────────

export const MenuItemSchema = z.object({
  name:            z.string().min(1).max(200),
  description:     z.string().max(2000).optional().default(''),
  richDescription: z.string().max(10000).optional().default(''),
  price:           z.number().positive().max(9999),
  category:        z.enum(['snack','rice-bowl','noodle','bibimbap','soup','fried-chicken','side','drink','set-menu','bangladeshi-main','bangladeshi-snack','biryani','curry']),
  cuisine:         z.enum(['korean','bangladeshi','both']).optional().default('korean'),
  images:          z.array(z.url()).max(10).optional().default([]),
  primaryImage:    z.string().optional().default(''),
  tags:            z.array(z.string().max(50)).max(20).optional().default([]),
  sizes:           z.array(z.object({ label: z.string().max(50), price: z.number().positive(), image: z.string().optional().default('') })).max(5).optional().default([]),
  isAvailable:     z.boolean().optional().default(true),
  isFeatured:      z.boolean().optional().default(false),
  sortOrder:       z.number().optional().default(0),
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
  menuItemId:    z.string().min(1),
  name:          z.string().min(1).max(200),
  price:         z.number().positive(),
  originalPrice: z.number().positive().optional(),
  quantity:      z.number().int().positive().max(50),
  image:         z.string().optional().default(''),
  selectedSize:  z.string().optional(),
});

export const CreateOrderSchema = z.object({
  customerName:        z.string().min(1).max(200),
  customerEmail:       z.string().check(z.email()),
  customerPhone:       z.string().max(20).optional(),
  orderType:           z.enum(['takeaway','delivery','dinein']),
  items:               z.array(OrderItemSchema).min(1).max(50),
  subtotal:            z.number().positive(),
  deliveryFee:         z.number().min(0).optional().default(0),
  total:               z.number().positive(),
  tableNumber:         z.number().int().min(1).max(10).optional(),
  deliveryAddress:     z.string().max(500).optional(),
  pickupTime:          z.string().optional(),
  specialInstructions: z.string().max(500).optional(),
});

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const CreateBookingSchema = z.object({
  customerName:    z.string().min(1).max(200),
  customerEmail:   z.string().check(z.email()),
  customerPhone:   z.string().min(8).max(20),
  tableId:         z.string().min(1),
  tableNumber:     z.number().int().positive(),
  date:            z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')),
  time:            z.string().check(z.regex(/^\d{2}:\d{2}$/, 'Invalid time format')),
  partySize:       z.number().int().min(1).max(20),
  specialRequests: z.string().max(500).optional(),
  depositAmount:   z.number().min(0).optional().default(0),
});

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const CreateReviewSchema = z.object({
  rating:        z.number().int().min(1).max(5),
  title:         z.string().min(3).max(120),
  body:          z.string().min(10).max(1000),
  customerName:  z.string().min(1).max(100).optional(),
  customerEmail: z.string().check(z.email()).optional(),
  type:          z.enum(['restaurant','dish']).optional().default('restaurant'),
  menuItemId:    z.string().optional(),
  menuItemName:  z.string().max(200).optional(),
  tags:          z.array(z.string().max(50)).max(10).optional().default([]),
  images:        z.array(z.string()).max(5).optional().default([]),
  orderId:       z.string().optional(),
});

// ─── Tables ───────────────────────────────────────────────────────────────────

export const CreateTableSchema = z.object({
  tableNumber: z.number().int().positive().max(999),
  capacity:    z.number().int().min(1).max(30),
  floor:       z.string().max(50).optional().default('Ground'),
  isActive:    z.boolean().optional().default(true),
});

// ─── Upload ───────────────────────────────────────────────────────────────────

export const UploadSchema = z.object({
  images: z.array(
    z.string()
      .refine(s => s.startsWith('data:image/'), 'Only image files are allowed')
      .refine(s => s.length < 7_000_000, 'Each image must be under 5MB')
  ).min(1).max(10),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { data: null, error: msg };
  }
  return { data: result.data, error: null };
}
