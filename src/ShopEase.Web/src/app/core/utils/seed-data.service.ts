import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { Category, LogEntry, Order, Payment, PaymentMethodName, Product, AppNotification, Role, User } from '../models';

// Bump this whenever the seed content changes — clients auto-reseed on next load.
const SEED_VERSION = 2;

const DATA_KEYS = [
  'se_seeded', 'se_seed_version', 'se_counters', 'se_roles', 'se_order_statuses',
  'se_payment_statuses', 'se_payment_methods', 'se_users', 'se_categories',
  'se_products', 'se_orders', 'se_payments', 'se_notifications', 'se_logs',
];

@Injectable({ providedIn: 'root' })
export class SeedDataService {
  private storage = inject(StorageService);

  seed(): void {
    if (this.storage.get('se_seed_version') === SEED_VERSION) return;
    this.buildAll();
    this.storage.set('se_seed_version', SEED_VERSION);
  }

  resetAll(): void {
    DATA_KEYS.forEach((k) => this.storage.remove(k));
    this.storage.clearSession();
    this.buildAll();
    this.storage.set('se_seed_version', SEED_VERSION);
  }

  private buildAll(): void {
    DATA_KEYS.forEach((k) => this.storage.remove(k));
    this.seedRoles();
    this.seedStatuses();
    this.seedUsers();
    this.seedCategories();
    this.seedProducts();
    this.seedOrders();
    this.seedPayments();
    this.seedNotifications();
    this.seedLogs();
    this.initCounters();
  }

  private seedRoles(): void {
    this.storage.set<Role[]>('se_roles', [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'Customer' },
    ]);
  }

  private seedStatuses(): void {
    this.storage.set('se_order_statuses', [
      { id: 1, name: 'Pending' }, { id: 2, name: 'Processing' }, { id: 3, name: 'Shipped' },
      { id: 4, name: 'Delivered' }, { id: 5, name: 'Cancelled' },
    ]);
    this.storage.set('se_payment_statuses', [
      { id: 1, name: 'Pending' }, { id: 2, name: 'Completed' }, { id: 3, name: 'Failed' }, { id: 4, name: 'Refunded' },
    ]);
    this.storage.set('se_payment_methods', [
      { id: 1, name: 'Credit Card' }, { id: 2, name: 'UPI' }, { id: 3, name: 'Cash on Delivery' },
    ]);
  }

  private seedUsers(): void {
    const addr = (id: number, label: string, line: string, city: string, state: string, postalCode: string, isDefault = true) =>
      ({ id, label, line, city, state, postalCode, isDefault });

    this.storage.set<User[]>('se_users', [
      { id: 1, name: 'Admin User', email: 'admin@shopease.com', phone: '9876543210', password: 'Admin@123', roleId: 1, isActive: true,
        addresses: [addr(1, 'Office', '100 Admin Tower, MG Road', 'Chennai', 'Tamil Nadu', '600001')], createdAt: '2026-01-01T00:00:00' },
      { id: 2, name: 'Rahul Kumar', email: 'rahul@email.com', phone: '9876543211', password: 'Rahul@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '42 Green Park, Adyar', 'Chennai', 'Tamil Nadu', '600020'), addr(2, 'Work', '7th Floor, IT Park', 'Chennai', 'Tamil Nadu', '600096', false)],
        createdAt: '2026-01-15T00:00:00' },
      { id: 3, name: 'Priya Sharma', email: 'priya@email.com', phone: '9876543212', password: 'Priya@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '15 Rose Garden, T Nagar', 'Chennai', 'Tamil Nadu', '600017')], createdAt: '2026-02-01T00:00:00' },
      { id: 4, name: 'Arjun Nair', email: 'arjun@email.com', phone: '9876543213', password: 'Arjun@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '8 Marine Drive', 'Kochi', 'Kerala', '682001')], createdAt: '2026-02-05T00:00:00' },
      { id: 5, name: 'Sneha Reddy', email: 'sneha@email.com', phone: '9876543214', password: 'Sneha@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '23 Jubilee Hills', 'Hyderabad', 'Telangana', '500033')], createdAt: '2026-02-10T00:00:00' },
      { id: 6, name: 'Vikram Singh', email: 'vikram@email.com', phone: '9876543215', password: 'Vikram@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '56 Connaught Place', 'New Delhi', 'Delhi', '110001')], createdAt: '2026-02-14T00:00:00' },
      { id: 7, name: 'Anjali Menon', email: 'anjali@email.com', phone: '9876543216', password: 'Anjali@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '12 Brigade Road', 'Bengaluru', 'Karnataka', '560001')], createdAt: '2026-02-18T00:00:00' },
      { id: 8, name: 'Karthik Iyer', email: 'karthik@email.com', phone: '9876543217', password: 'Karthik@123', roleId: 2, isActive: false,
        addresses: [addr(1, 'Home', '90 Anna Nagar', 'Chennai', 'Tamil Nadu', '600040')], createdAt: '2026-02-22T00:00:00' },
      { id: 9, name: 'Divya Pillai', email: 'divya@email.com', phone: '9876543218', password: 'Divya@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '34 FC Road', 'Pune', 'Maharashtra', '411004')], createdAt: '2026-03-01T00:00:00' },
      { id: 10, name: 'Rohan Gupta', email: 'rohan@email.com', phone: '9876543219', password: 'Rohan@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '78 Park Street', 'Kolkata', 'West Bengal', '700016')], createdAt: '2026-03-06T00:00:00' },
      { id: 11, name: 'Meera Krishnan', email: 'meera@email.com', phone: '9876543220', password: 'Meera@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '5 Residency Road', 'Bengaluru', 'Karnataka', '560025')], createdAt: '2026-03-11T00:00:00' },
      { id: 12, name: 'Aditya Rao', email: 'aditya@email.com', phone: '9876543221', password: 'Aditya@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '61 Banjara Hills', 'Hyderabad', 'Telangana', '500034')], createdAt: '2026-03-16T00:00:00' },
      { id: 13, name: 'Pooja Desai', email: 'pooja@email.com', phone: '9876543222', password: 'Pooja@123', roleId: 2, isActive: false,
        addresses: [addr(1, 'Home', '19 CG Road', 'Ahmedabad', 'Gujarat', '380009')], createdAt: '2026-03-21T00:00:00' },
      { id: 14, name: 'Sanjay Verma', email: 'sanjay@email.com', phone: '9876543223', password: 'Sanjay@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '47 Civil Lines', 'Jaipur', 'Rajasthan', '302006')], createdAt: '2026-03-26T00:00:00' },
      { id: 15, name: 'Nisha Joshi', email: 'nisha@email.com', phone: '9876543224', password: 'Nisha@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '3 MG Road', 'Indore', 'Madhya Pradesh', '452001')], createdAt: '2026-04-02T00:00:00' },
      { id: 16, name: 'Manoj Kumar', email: 'manoj@email.com', phone: '9876543225', password: 'Manoj@123', roleId: 2, isActive: true,
        addresses: [addr(1, 'Home', '88 Lajpat Nagar', 'New Delhi', 'Delhi', '110024')], createdAt: '2026-04-08T00:00:00' },
    ]);
  }

  private seedCategories(): void {
    const cat = (id: number, name: string, description: string): Category => ({ id, name, description, isActive: true, createdAt: '2026-01-01T00:00:00' });
    this.storage.set<Category[]>('se_categories', [
      cat(1, 'Electronics', 'Electronic gadgets and devices'),
      cat(2, 'Clothing', 'Men and women apparel'),
      cat(3, 'Home & Kitchen', 'Home appliances and kitchenware'),
      cat(4, 'Books', 'Fiction, non-fiction and educational books'),
      cat(5, 'Sports & Fitness', 'Sports equipment and fitness accessories'),
      cat(6, 'Beauty & Personal Care', 'Skincare, cosmetics and grooming essentials'),
      cat(7, 'Toys & Games', 'Toys, board games and puzzles for all ages'),
      cat(8, 'Automotive', 'Car and bike accessories and care products'),
      cat(9, 'Grocery & Gourmet', 'Everyday groceries and gourmet foods'),
      cat(10, 'Health & Wellness', 'Supplements, wellness and personal health devices'),
      cat(11, 'Furniture', 'Home and office furniture'),
      cat(12, 'Footwear', 'Shoes, sandals and slippers'),
      cat(13, 'Stationery & Office', 'Stationery, organizers and office supplies'),
      cat(14, 'Pet Supplies', 'Food, toys and accessories for pets'),
      cat(15, 'Musical Instruments', 'Instruments and music accessories'),
    ]);
  }

  private seedProducts(): void {
    const p = (id: number, name: string, brand: string, sku: string, price: number, stock: number, categoryId: number, description: string, createdAt: string): Product =>
      ({ id, name, brand, sku, price, stock, categoryId, description, isActive: true, createdAt });

    this.storage.set<Product[]>('se_products', [
      p(1, 'Wireless Bluetooth Headphones', 'SoundMax', 'EL-001', 2499.0, 50, 1, 'Premium over-ear wireless headphones with active noise cancellation and 30-hour battery life.', '2026-01-05T00:00:00'),
      p(2, 'Smart Watch Pro', 'TechFit', 'EL-002', 4999.0, 30, 1, 'Feature-packed smartwatch with heart rate monitor, GPS, and 7-day battery life.', '2026-01-05T00:00:00'),
      p(3, 'USB-C Fast Charger', 'ChargePlus', 'EL-003', 899.0, 100, 1, '65W GaN fast charger with dual USB-C ports for laptops and phones.', '2026-01-10T00:00:00'),
      p(4, 'Men Casual Cotton Shirt', 'StyleCraft', 'CL-001', 1299.0, 80, 2, 'Comfortable slim-fit cotton shirt available in multiple colors. Perfect for casual outings.', '2026-01-12T00:00:00'),
      p(5, 'Women Kurta Set', 'EthnicWear', 'CL-002', 1799.0, 60, 2, 'Traditional cotton kurta with palazzo pants. Hand-block printed design.', '2026-01-12T00:00:00'),
      p(6, 'Running Shoes', 'SpeedRun', 'SP-001', 3499.0, 40, 5, 'Lightweight running shoes with responsive cushioning and breathable mesh upper.', '2026-01-15T00:00:00'),
      p(7, 'Non-Stick Cookware Set', 'KitchenPro', 'HK-001', 2999.0, 25, 3, '5-piece premium non-stick cookware set including frying pan, saucepan, and kadhai.', '2026-01-18T00:00:00'),
      p(8, 'Stainless Steel Water Bottle', 'AquaPure', 'HK-002', 599.0, 150, 3, '1L double-walled insulated bottle. Keeps drinks hot 12hrs / cold 24hrs.', '2026-01-18T00:00:00'),
      p(9, 'Clean Code', 'Pearson', 'BK-001', 499.0, 200, 4, 'Clean Code: A Handbook of Agile Software Craftsmanship by Robert C. Martin.', '2026-01-20T00:00:00'),
      p(10, 'The Pragmatic Programmer', 'Addison-Wesley', 'BK-002', 599.0, 180, 4, 'Your journey to mastery. 20th Anniversary Edition by David Thomas and Andrew Hunt.', '2026-01-20T00:00:00'),
      p(11, 'Yoga Mat Premium', 'FlexFit', 'SP-002', 1299.0, 70, 5, '6mm thick anti-slip yoga mat with alignment lines and carry strap.', '2026-01-22T00:00:00'),
      p(12, 'Resistance Bands Set', 'PowerFlex', 'SP-003', 799.0, 0, 5, 'Set of 5 latex resistance bands with varying resistance levels. Includes carry bag.', '2026-01-22T00:00:00'),
      p(13, 'Portable Bluetooth Speaker', 'BoomBox', 'EL-004', 1999.0, 65, 1, 'Waterproof portable speaker with 360° sound and 20-hour playtime.', '2026-02-02T00:00:00'),
      p(14, 'Vitamin C Face Serum', 'GlowWell', 'BT-001', 749.0, 120, 6, 'Brightening face serum with 10% Vitamin C and hyaluronic acid. 30ml.', '2026-02-06T00:00:00'),
      p(15, 'Wooden Building Blocks', 'PlayWise', 'TG-001', 999.0, 90, 7, '100-piece non-toxic wooden building blocks set for creative play.', '2026-02-10T00:00:00'),
      p(16, 'Car Phone Mount', 'DriveEasy', 'AU-001', 449.0, 110, 8, 'Adjustable dashboard and windshield phone holder with strong suction grip.', '2026-02-14T00:00:00'),
      p(17, 'Digital Body Weighing Scale', 'FitTrack', 'HW-001', 1099.0, 55, 10, 'High-precision digital scale with LCD display and step-on technology.', '2026-02-18T00:00:00'),
      p(18, 'Ergonomic Office Chair', 'ComfortSeat', 'FN-001', 8499.0, 18, 11, 'Mesh-back ergonomic office chair with adjustable lumbar support and armrests.', '2026-02-22T00:00:00'),
      p(19, 'Leather Formal Shoes', 'UrbanStep', 'FW-001', 2799.0, 45, 12, 'Genuine leather lace-up formal shoes with cushioned insole.', '2026-02-26T00:00:00'),
      p(20, 'Premium Notebook Set', 'WriteRight', 'ST-001', 399.0, 160, 13, 'Set of 3 hardcover ruled notebooks, 200 pages each, with elastic closure.', '2026-03-02T00:00:00'),
    ]);
  }

  private seedOrders(): void {
    const products = this.storage.get<Product[]>('se_products') || [];
    const customers = (this.storage.get<User[]>('se_users') || []).filter((u) => u.roleId === 2);
    const statuses: Order['status'][] = ['Delivered', 'Delivered', 'Shipped', 'Processing', 'Pending', 'Cancelled', 'Delivered', 'Shipped', 'Processing', 'Delivered', 'Pending', 'Shipped', 'Delivered', 'Cancelled', 'Processing'];
    const orders: Order[] = [];

    for (let i = 0; i < 15; i++) {
      const user = customers[i % customers.length];
      const numItems = (i % 3) + 1;
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const prod = products[(i * 2 + j) % products.length];
        const quantity = (j % 2) + 1;
        const itemSubtotal = prod.price * quantity;
        subtotal += itemSubtotal;
        items.push({ productId: prod.id, name: prod.name, brand: prod.brand, price: prod.price, quantity, subtotal: itemSubtotal });
      }

      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const shipping = subtotal >= 500 ? 0 : 50;
      const total = Math.round((subtotal + tax + shipping) * 100) / 100;
      const created = new Date(2026, 1 + (i % 4), 3 + i, 9 + (i % 8), 15).toISOString();

      orders.push({
        id: i + 1, orderNumber: `ORD-2026-${1001 + i}`, userId: user.id, items,
        subtotal: Math.round(subtotal * 100) / 100, tax, shipping, discount: 0, total,
        address: { ...user.addresses[0] }, paymentMethodId: (i % 3) + 1, status: statuses[i],
        createdAt: created, updatedAt: created,
      });
    }

    this.storage.set('se_orders', orders);
  }

  private seedPayments(): void {
    const orders = this.storage.get<Order[]>('se_orders') || [];
    const methodNames: Record<number, PaymentMethodName> = { 1: 'Credit Card', 2: 'UPI', 3: 'Cash on Delivery' };
    const payments: Payment[] = [];

    orders.forEach((o, i) => {
      const method = methodNames[o.paymentMethodId];
      let status: Payment['status'] = 'Completed';
      if (o.status === 'Cancelled') status = 'Refunded';
      else if (o.status === 'Pending') status = method === 'Cash on Delivery' ? 'Pending' : 'Completed';
      if (i === 4) status = 'Failed';

      const settled = status === 'Completed' || status === 'Refunded';
      const details = method === 'Credit Card' ? { cardLast4: '4242', cardHolder: 'Card Holder' } : method === 'UPI' ? { upiId: 'customer@upi' } : {};

      payments.push({
        id: i + 1, orderId: o.id, userId: o.userId, method, amount: o.total, status,
        transactionId: settled ? `TXN-${(123456 + i * 911).toString(36).toUpperCase()}` : null,
        details, createdAt: o.createdAt,
      });
    });

    this.storage.set('se_payments', payments);
  }

  private seedNotifications(): void {
    const orders = this.storage.get<Order[]>('se_orders') || [];
    const notifications: AppNotification[] = [];
    let id = 1;

    orders.forEach((o, i) => {
      let title: string, message: string, type: AppNotification['type'], channel: AppNotification['channel'];
      switch (o.status) {
        case 'Delivered':
          title = 'Order Delivered'; message = `Your order ${o.orderNumber} has been delivered. Enjoy!`; type = 'success'; channel = 'email'; break;
        case 'Shipped':
          title = 'Order Shipped'; message = `Good news! Order ${o.orderNumber} is on its way.`; type = 'info'; channel = 'sms'; break;
        case 'Processing':
          title = 'Order Processing'; message = `Order ${o.orderNumber} is being processed.`; type = 'info'; channel = 'email'; break;
        case 'Cancelled':
          title = 'Order Cancelled'; message = `Order ${o.orderNumber} has been cancelled and refund initiated.`; type = 'warning'; channel = 'email'; break;
        default:
          title = 'Order Placed'; message = `Your order ${o.orderNumber} has been placed successfully!`; type = 'success'; channel = 'email';
      }
      notifications.push({ id: id++, userId: o.userId, title, message, type, channel, isRead: i % 3 === 0, createdAt: o.updatedAt });
    });

    this.storage.set('se_notifications', notifications);
  }

  private seedLogs(): void {
    const logs: LogEntry[] = [];
    const samples = [
      'System initialized with seed data.', 'User logged in: rahul@email.com', 'Order placed: ORD-2026-1001 by User #2',
      'Payment Completed: UPI for Order #1', 'Order ORD-2026-1003 status: Shipped', 'New user registered: arjun@email.com',
      'Admin deactivated user: karthik@email.com', 'Product added: Portable Bluetooth Speaker', 'Category added: Beauty & Personal Care',
      'Order ORD-2026-1006 status: Cancelled', 'Payment Refunded: Credit Card for Order #6', 'User logged in: priya@email.com',
      'Order placed: ORD-2026-1010 by User #11', 'Stock updated for Resistance Bands Set', 'Admin generated Sales report.',
    ];
    samples.forEach((message, i) => {
      logs.push({ timestamp: new Date(2026, 0, 2 + i, 8 + (i % 10), 30).toISOString(), message });
    });
    this.storage.set('se_logs', logs);
  }

  private initCounters(): void {
    this.storage.set('se_counters', { users: 16, categories: 15, products: 20, orders: 15, payments: 15, notifications: 15 });
  }
}
