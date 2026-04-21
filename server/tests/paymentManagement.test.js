import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockApp, createMockDoc, createMockResponse } from './helpers/testUtils.js';

const mocks = vi.hoisted(() => ({
  Order: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateMany: vi.fn()
  },
  Product: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn()
  },
  Promotion: {
    find: vi.fn(),
    findOne: vi.fn(),
    updateMany: vi.fn()
  },
  User: {
    findOne: vi.fn(),
    find: vi.fn(),
    findById: vi.fn()
  },
  Notification: {
    create: vi.fn(),
    insertMany: vi.fn()
  },
  stripe: {
    refunds: {
      create: vi.fn()
    }
  },
  sendEmail: vi.fn().mockResolvedValue(undefined),
  handleLowStockAlert: vi.fn().mockResolvedValue([]),
  applyBestPromotion: vi.fn()
}));

vi.mock('../models/Order.js', () => ({ default: mocks.Order }));
vi.mock('../models/Product.js', () => ({ default: mocks.Product }));
vi.mock('../models/Promotion.js', () => ({ default: mocks.Promotion }));
vi.mock('../models/User.js', () => ({ default: mocks.User }));
vi.mock('../models/Notification.js', () => ({ default: mocks.Notification }));
vi.mock('../config/stripe.js', () => ({ default: mocks.stripe }));
vi.mock('../utils/sendEmail.js', () => ({ sendEmail: mocks.sendEmail }));
vi.mock('../utils/lowStockAlerts.js', () => ({ handleLowStockAlert: mocks.handleLowStockAlert }));
vi.mock('../utils/applyBestPromotion.js', () => ({ applyBestPromotion: mocks.applyBestPromotion }));

let markPaid;
let processRefund;

beforeAll(async () => {
  ({ markPaid, processRefund } = await import('../controllers/orderController.js'));
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Payment Management', () => {
  it('marks an order as paid and notifies the customer', async () => {
    const orderId = 'order-1';
    const customerId = 'customer-1';
    const order = createMockDoc({ _id: orderId, customerId, paymentStatus: 'Pending' });
    mocks.Order.findByIdAndUpdate.mockResolvedValue(order);
    mocks.Notification.create.mockResolvedValue(
      createMockDoc({ _id: 'notification-1', userId: customerId, message: 'Payment received', type: 'payment' })
    );
    mocks.User.findById.mockResolvedValue({ email: 'customer@example.com' });

    const { app, io } = createMockApp();
    const req = {
      params: { id: orderId },
      app
    };
    const res = createMockResponse();
    const next = vi.fn();

    await markPaid(req, res, next);

    expect(mocks.Order.findByIdAndUpdate).toHaveBeenCalledWith(orderId, { paymentStatus: 'Paid' }, { new: true });
    expect(res.json).toHaveBeenCalledWith(order);
    expect(mocks.Notification.create).toHaveBeenCalledWith({
      userId: customerId,
      message: 'Payment received',
      type: 'payment'
    });
    expect(io.to).toHaveBeenCalledWith(customerId.toString());
    expect(io.emit).toHaveBeenCalledWith('notification', { message: 'Payment received' });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        subject: 'Payment received'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects refund processing for cash-on-delivery orders', async () => {
    const orderId = 'order-1';
    mocks.Order.findById.mockResolvedValue(
      createMockDoc({
        _id: orderId,
        customerId: 'customer-1',
        paymentMethod: 'COD',
        orderStatus: 'Cancelled',
        paymentStatus: 'Pending'
      })
    );

    const { app } = createMockApp();
    const req = {
      params: { id: orderId },
      app
    };
    const res = createMockResponse();
    const next = vi.fn();

    await processRefund(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Refund processing is only available for online payments' });
    expect(mocks.stripe.refunds.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
