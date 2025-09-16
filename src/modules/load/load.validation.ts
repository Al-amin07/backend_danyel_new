import { z } from 'zod';

export const AddressSchema = z.object({
  street: z.string(),
  apartment: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zipCode: z.number(),
  country: z.string(),
});

export const CustomerSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

const createLoadSchema = z.object({
  body: z.object({
    loadId: z.string(),
    quantity: z.number(),
    weight: z.number(),
    loadType: z.string(),
    specialInstructions: z.string().optional(),

    pickupAddress: AddressSchema,
    deliveryAddress: AddressSchema,

    loadStatus: z
      .enum([
        'Pending Assignment',
        'Awaiting Pickup',
        'En Route to Pickup',
        'At Pickup',
        'In Transit',
        'Delivered',
      ])
      .default('Pending Assignment'),

    pickupDate: z.string().datetime().optional(),
    pickupTime: z.string().optional(),
    deliveryDate: z.string().datetime().optional(),
    deliveryTime: z.string().optional(),

    totalDistance: z.number(),
    ratePerMile: z.number(),
    totalPayment: z.number().optional(),

    paymentStatus: z.enum(['PENDING', 'PAID', 'UNPAID']).default('PENDING'),
    customerNotes: z.string().optional(),
    paymentDate: z.string().optional(),

    assignedDriver: z.string().optional(),
    customer: CustomerSchema,
  }),
});
const loadStatusValidationSchema = z.object({
  body: z.object({
    loadStatus: z
      .enum([
        'Pending Assignment',
        'Awaiting Pickup',
        'En Route to Pickup',
        'At Pickup',
        'In Transit',
        'Delivered',
      ])
      .optional(),
    paymentStatus: z.enum(['PENDING', 'PAID', 'REJECTED']).optional(),
  }),
});
export const loadValidationSchema = {
  createLoadSchema,
  loadStatusValidationSchema,
};
