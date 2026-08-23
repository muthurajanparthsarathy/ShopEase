using System.Globalization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Enums;
using ShopEase.Domain.Features.Auth.Entities;
using ShopEase.Domain.Features.Backup.Entities;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Domain.Features.Notifications.Entities;
using ShopEase.Domain.Features.Orders.Entities;
using ShopEase.Domain.Features.Payments.Entities;

namespace ShopEase.Infrastructure.Data;

/// <summary>
/// Ports the exact demo dataset from the original app's seed-data.service.ts (same credentials,
/// catalog, and order/payment/notification shapes) so this backend's "out of the box" experience
/// matches. Runs once on an empty Users table; ids are DB-assigned rather than hardcoded, but the
/// content and relationships mirror the original 1:1.
/// </summary>
public static class DemoDataSeeder
{
    /// <summary>
    /// Parses a seed date string as UTC. DateTime.Parse alone yields Kind=Unspecified, which Npgsql
    /// rejects for 'timestamp with time zone' columns. The model-wide UtcDateTimeConverter would
    /// also catch this, but fixing it at the source keeps the seeded values honest.
    /// </summary>
    private static DateTime SeedUtc(string iso) =>
        DateTime.SpecifyKind(DateTime.Parse(iso, CultureInfo.InvariantCulture), DateTimeKind.Utc);

    private static readonly PasswordHasher<User> Hasher = new();

    public static async Task SeedAsync(ShopEaseDbContext db, bool force = false)
    {
        if (!force && await db.Users.AnyAsync()) return;

        var users = await SeedUsersAsync(db);
        var categories = await SeedCategoriesAsync(db);
        var products = await SeedProductsAsync(db, categories);
        var orders = await SeedOrdersAsync(db, users, products);
        await SeedPaymentsAsync(db, orders);
        await SeedNotificationsAsync(db, orders);
        await SeedReviewsAsync(db, users, products);
        await SeedLogsAsync(db);
    }

    private static async Task<List<User>> SeedUsersAsync(ShopEaseDbContext db)
    {
        (string Name, string Email, string Phone, string Password, RoleId Role, bool Active, string Created, (string Label, string Line, string City, string State, string Postal)[] Addresses)[] seed =
        [
            ("Admin User", "admin@shopease.com", "9876543210", "Admin@123", RoleId.Admin, true, "2026-01-01",
                [("Office", "100 Admin Tower, MG Road", "Chennai", "Tamil Nadu", "600001")]),
            ("Rahul Kumar", "rahul@email.com", "9876543211", "Rahul@123", RoleId.Customer, true, "2026-01-15",
                [("Home", "42 Green Park, Adyar", "Chennai", "Tamil Nadu", "600020"), ("Work", "7th Floor, IT Park", "Chennai", "Tamil Nadu", "600096")]),
            ("Priya Sharma", "priya@email.com", "9876543212", "Priya@123", RoleId.Customer, true, "2026-02-01",
                [("Home", "15 Rose Garden, T Nagar", "Chennai", "Tamil Nadu", "600017")]),
            ("Arjun Nair", "arjun@email.com", "9876543213", "Arjun@123", RoleId.Customer, true, "2026-02-05",
                [("Home", "8 Marine Drive", "Kochi", "Kerala", "682001")]),
            ("Sneha Reddy", "sneha@email.com", "9876543214", "Sneha@123", RoleId.Customer, true, "2026-02-10",
                [("Home", "23 Jubilee Hills", "Hyderabad", "Telangana", "500033")]),
            ("Vikram Singh", "vikram@email.com", "9876543215", "Vikram@123", RoleId.Customer, true, "2026-02-14",
                [("Home", "56 Connaught Place", "New Delhi", "Delhi", "110001")]),
            ("Anjali Menon", "anjali@email.com", "9876543216", "Anjali@123", RoleId.Customer, true, "2026-02-18",
                [("Home", "12 Brigade Road", "Bengaluru", "Karnataka", "560001")]),
            ("Karthik Iyer", "karthik@email.com", "9876543217", "Karthik@123", RoleId.Customer, false, "2026-02-22",
                [("Home", "90 Anna Nagar", "Chennai", "Tamil Nadu", "600040")]),
            ("Divya Pillai", "divya@email.com", "9876543218", "Divya@123", RoleId.Customer, true, "2026-03-01",
                [("Home", "34 FC Road", "Pune", "Maharashtra", "411004")]),
            ("Rohan Gupta", "rohan@email.com", "9876543219", "Rohan@123", RoleId.Customer, true, "2026-03-06",
                [("Home", "78 Park Street", "Kolkata", "West Bengal", "700016")]),
            ("Meera Krishnan", "meera@email.com", "9876543220", "Meera@123", RoleId.Customer, true, "2026-03-11",
                [("Home", "5 Residency Road", "Bengaluru", "Karnataka", "560025")]),
            ("Aditya Rao", "aditya@email.com", "9876543221", "Aditya@123", RoleId.Customer, true, "2026-03-16",
                [("Home", "61 Banjara Hills", "Hyderabad", "Telangana", "500034")]),
            ("Pooja Desai", "pooja@email.com", "9876543222", "Pooja@123", RoleId.Customer, false, "2026-03-21",
                [("Home", "19 CG Road", "Ahmedabad", "Gujarat", "380009")]),
            ("Sanjay Verma", "sanjay@email.com", "9876543223", "Sanjay@123", RoleId.Customer, true, "2026-03-26",
                [("Home", "47 Civil Lines", "Jaipur", "Rajasthan", "302006")]),
            ("Nisha Joshi", "nisha@email.com", "9876543224", "Nisha@123", RoleId.Customer, true, "2026-04-02",
                [("Home", "3 MG Road", "Indore", "Madhya Pradesh", "452001")]),
            ("Manoj Kumar", "manoj@email.com", "9876543225", "Manoj@123", RoleId.Customer, true, "2026-04-08",
                [("Home", "88 Lajpat Nagar", "New Delhi", "Delhi", "110024")]),
        ];

        var users = new List<User>();
        foreach (var s in seed)
        {
            var user = new User
            {
                Name = s.Name, Email = s.Email, Phone = s.Phone, RoleId = s.Role, IsActive = s.Active,
                CreatedAt = SeedUtc(s.Created),
            };
            user.PasswordHash = Hasher.HashPassword(user, s.Password);
            for (var i = 0; i < s.Addresses.Length; i++)
            {
                var a = s.Addresses[i];
                user.Addresses.Add(new Address { Label = a.Label, Line = a.Line, City = a.City, State = a.State, PostalCode = a.Postal, IsDefault = i == 0 });
            }
            users.Add(user);
        }

        db.Users.AddRange(users);
        await db.SaveChangesAsync();
        return users;
    }

    private static async Task<List<Category>> SeedCategoriesAsync(ShopEaseDbContext db)
    {
        (string Name, string Description)[] seed =
        [
            ("Electronics", "Electronic gadgets and devices"),
            ("Clothing", "Men and women apparel"),
            ("Home & Kitchen", "Home appliances and kitchenware"),
            ("Books", "Fiction, non-fiction and educational books"),
            ("Sports & Fitness", "Sports equipment and fitness accessories"),
            ("Beauty & Personal Care", "Skincare, cosmetics and grooming essentials"),
            ("Toys & Games", "Toys, board games and puzzles for all ages"),
            ("Automotive", "Car and bike accessories and care products"),
            ("Grocery & Gourmet", "Everyday groceries and gourmet foods"),
            ("Health & Wellness", "Supplements, wellness and personal health devices"),
            ("Furniture", "Home and office furniture"),
            ("Footwear", "Shoes, sandals and slippers"),
            ("Stationery & Office", "Stationery, organizers and office supplies"),
            ("Pet Supplies", "Food, toys and accessories for pets"),
            ("Musical Instruments", "Instruments and music accessories"),
        ];

        var categories = seed.Select(s => new Category { Name = s.Name, Description = s.Description, IsActive = true, CreatedAt = SeedUtc("2026-01-01") }).ToList();
        db.Categories.AddRange(categories);
        await db.SaveChangesAsync();
        return categories;
    }

    private static async Task<List<Product>> SeedProductsAsync(ShopEaseDbContext db, List<Category> categories)
    {
        // categoryIndex is 0-based into `categories` (matches the original 1-based categoryId - 1).
        (string Name, string Brand, string Sku, decimal Price, int Stock, int CategoryIndex, string Description, string Created)[] seed =
        [
            ("Wireless Bluetooth Headphones", "SoundMax", "EL-001", 2499.0m, 50, 0, "Premium over-ear wireless headphones with active noise cancellation and 30-hour battery life.", "2026-01-05"),
            ("Smart Watch Pro", "TechFit", "EL-002", 4999.0m, 30, 0, "Feature-packed smartwatch with heart rate monitor, GPS, and 7-day battery life.", "2026-01-05"),
            ("USB-C Fast Charger", "ChargePlus", "EL-003", 899.0m, 100, 0, "65W GaN fast charger with dual USB-C ports for laptops and phones.", "2026-01-10"),
            ("Men Casual Cotton Shirt", "StyleCraft", "CL-001", 1299.0m, 80, 1, "Comfortable slim-fit cotton shirt available in multiple colors. Perfect for casual outings.", "2026-01-12"),
            ("Women Kurta Set", "EthnicWear", "CL-002", 1799.0m, 60, 1, "Traditional cotton kurta with palazzo pants. Hand-block printed design.", "2026-01-12"),
            ("Running Shoes", "SpeedRun", "SP-001", 3499.0m, 40, 4, "Lightweight running shoes with responsive cushioning and breathable mesh upper.", "2026-01-15"),
            ("Non-Stick Cookware Set", "KitchenPro", "HK-001", 2999.0m, 25, 2, "5-piece premium non-stick cookware set including frying pan, saucepan, and kadhai.", "2026-01-18"),
            ("Stainless Steel Water Bottle", "AquaPure", "HK-002", 599.0m, 150, 2, "1L double-walled insulated bottle. Keeps drinks hot 12hrs / cold 24hrs.", "2026-01-18"),
            ("Clean Code", "Pearson", "BK-001", 499.0m, 200, 3, "Clean Code: A Handbook of Agile Software Craftsmanship by Robert C. Martin.", "2026-01-20"),
            ("The Pragmatic Programmer", "Addison-Wesley", "BK-002", 599.0m, 180, 3, "Your journey to mastery. 20th Anniversary Edition by David Thomas and Andrew Hunt.", "2026-01-20"),
            ("Yoga Mat Premium", "FlexFit", "SP-002", 1299.0m, 70, 4, "6mm thick anti-slip yoga mat with alignment lines and carry strap.", "2026-01-22"),
            ("Resistance Bands Set", "PowerFlex", "SP-003", 799.0m, 0, 4, "Set of 5 latex resistance bands with varying resistance levels. Includes carry bag.", "2026-01-22"),
            ("Portable Bluetooth Speaker", "BoomBox", "EL-004", 1999.0m, 65, 0, "Waterproof portable speaker with 360° sound and 20-hour playtime.", "2026-02-02"),
            ("Vitamin C Face Serum", "GlowWell", "BT-001", 749.0m, 120, 5, "Brightening face serum with 10% Vitamin C and hyaluronic acid. 30ml.", "2026-02-06"),
            ("Wooden Building Blocks", "PlayWise", "TG-001", 999.0m, 90, 6, "100-piece non-toxic wooden building blocks set for creative play.", "2026-02-10"),
            ("Car Phone Mount", "DriveEasy", "AU-001", 449.0m, 110, 7, "Adjustable dashboard and windshield phone holder with strong suction grip.", "2026-02-14"),
            ("Digital Body Weighing Scale", "FitTrack", "HW-001", 1099.0m, 55, 9, "High-precision digital scale with LCD display and step-on technology.", "2026-02-18"),
            ("Ergonomic Office Chair", "ComfortSeat", "FN-001", 8499.0m, 18, 10, "Mesh-back ergonomic office chair with adjustable lumbar support and armrests.", "2026-02-22"),
            ("Leather Formal Shoes", "UrbanStep", "FW-001", 2799.0m, 45, 11, "Genuine leather lace-up formal shoes with cushioned insole.", "2026-02-26"),
            ("Premium Notebook Set", "WriteRight", "ST-001", 399.0m, 160, 12, "Set of 3 hardcover ruled notebooks, 200 pages each, with elastic closure.", "2026-03-02"),
        ];

        var products = seed.Select(s => new Product
        {
            Name = s.Name, Brand = s.Brand, Sku = s.Sku, Price = s.Price, Stock = s.Stock,
            CategoryId = categories[s.CategoryIndex].Id, Description = s.Description, IsActive = true, CreatedAt = SeedUtc(s.Created),
        }).ToList();

        db.Products.AddRange(products);
        await db.SaveChangesAsync();
        return products;
    }

    private static async Task<List<Order>> SeedOrdersAsync(ShopEaseDbContext db, List<User> users, List<Product> products)
    {
        var customers = users.Where(u => u.RoleId == RoleId.Customer).ToList();
        string[] statuses = ["Delivered", "Delivered", "Shipped", "Processing", "Pending", "Cancelled", "Delivered", "Shipped", "Processing", "Delivered", "Pending", "Shipped", "Delivered", "Cancelled", "Processing"];

        // Resolved by name, not assumed to be 1/2/3. SeedLookupsAsync inserts PaymentMethods without
        // explicit ids, so the values are whatever the identity sequence produced — and since
        // Order.PaymentMethodId is not a foreign key, a mismatch corrupts data silently instead of
        // failing loudly.
        var methodIds = await db.PaymentMethods.ToDictionaryAsync(m => m.Name, m => m.Id);
        string[] methodCycle = ["Credit Card", "UPI", "Cash on Delivery"];

        var orders = new List<Order>();
        for (var i = 0; i < 15; i++)
        {
            var user = customers[i % customers.Count];
            var numItems = (i % 3) + 1;
            var items = new List<OrderItem>();
            decimal subtotal = 0;

            for (var j = 0; j < numItems; j++)
            {
                var product = products[(i * 2 + j) % products.Count];
                var quantity = (j % 2) + 1;
                var itemSubtotal = product.Price * quantity;
                subtotal += itemSubtotal;
                items.Add(new OrderItem { ProductId = product.Id, Name = product.Name, Brand = product.Brand, Price = product.Price, Quantity = quantity, Subtotal = itemSubtotal });
            }

            var tax = Math.Round(subtotal * 0.18m, 2);
            var shipping = subtotal >= 500 ? 0m : 50m;
            var total = Math.Round(subtotal + tax + shipping, 2);
            // Mirrors `new Date(2026, 1 + (i%4), 3+i, 9 + (i%8), 15)` from the original (0-based month
            // there vs 1-based here); day tops out at 17 and hour at 16 across i=0..14, so no rollover.
            var created = new DateTime(2026, 2 + (i % 4), 3 + i, 9 + (i % 8), 15, 0, DateTimeKind.Utc);
            var address = user.Addresses.First();

            orders.Add(new Order
            {
                OrderNumber = $"ORD-2026-{1001 + i}",
                UserId = user.Id,
                Items = items,
                Subtotal = Math.Round(subtotal, 2),
                Tax = tax,
                Shipping = shipping,
                Discount = 0,
                Total = total,
                AddressJson = System.Text.Json.JsonSerializer.Serialize(new
                {
                    id = address.Id, label = address.Label, line = address.Line, city = address.City, state = address.State, postalCode = address.PostalCode, isDefault = address.IsDefault,
                }),
                PaymentMethodId = methodIds[methodCycle[i % methodCycle.Length]],
                Status = statuses[i],
                CreatedAt = created,
                UpdatedAt = created,
            });
        }

        db.Orders.AddRange(orders);
        await db.SaveChangesAsync();
        return orders;
    }

    private static async Task SeedPaymentsAsync(ShopEaseDbContext db, List<Order> orders)
    {
        // Mirror of the same assumption on the read side — line below would throw
        // KeyNotFoundException mid-seed if ids were not literally 1/2/3, leaving a half-seeded
        // database (none of this seeder's SaveChangesAsync calls share a transaction).
        var methodNames = await db.PaymentMethods.ToDictionaryAsync(m => m.Id, m => m.Name);
        var payments = new List<Payment>();

        for (var i = 0; i < orders.Count; i++)
        {
            var order = orders[i];
            var method = methodNames[order.PaymentMethodId];
            var status = "Completed";
            if (order.Status == "Cancelled") status = "Refunded";
            else if (order.Status == "Pending") status = method == "Cash on Delivery" ? "Pending" : "Completed";
            if (i == 4) status = "Failed";

            var settled = status is "Completed" or "Refunded";
            var detailsJson = method switch
            {
                "Credit Card" => """{"cardLast4":"4242","cardHolder":"Card Holder"}""",
                "UPI" => """{"upiId":"customer@upi"}""",
                _ => "{}",
            };

            payments.Add(new Payment
            {
                OrderId = order.Id,
                UserId = order.UserId,
                Method = method,
                Amount = order.Total,
                Status = status,
                TransactionId = settled ? $"TXN-{ToBase36(123456 + i * 911)}" : null,
                DetailsJson = detailsJson,
                CreatedAt = order.CreatedAt,
            });
        }

        db.Payments.AddRange(payments);
        await db.SaveChangesAsync();
    }

    private static async Task SeedNotificationsAsync(ShopEaseDbContext db, List<Order> orders)
    {
        var notifications = new List<Notification>();

        for (var i = 0; i < orders.Count; i++)
        {
            var o = orders[i];
            var (title, message, type, channel) = o.Status switch
            {
                "Delivered" => ("Order Delivered", $"Your order {o.OrderNumber} has been delivered. Enjoy!", "success", "email"),
                "Shipped" => ("Order Shipped", $"Good news! Order {o.OrderNumber} is on its way.", "info", "sms"),
                "Processing" => ("Order Processing", $"Order {o.OrderNumber} is being processed.", "info", "email"),
                "Cancelled" => ("Order Cancelled", $"Order {o.OrderNumber} has been cancelled and refund initiated.", "warning", "email"),
                _ => ("Order Placed", $"Your order {o.OrderNumber} has been placed successfully!", "success", "email"),
            };

            notifications.Add(new Notification
            {
                UserId = o.UserId, Title = title, Message = message, Type = type, Channel = channel,
                IsRead = i % 3 == 0, CreatedAt = o.UpdatedAt,
            });
        }

        db.Notifications.AddRange(notifications);
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// The original app generated these lazily client-side on first catalog visit (ensureSeeded()) —
    /// not viable against a real backend, so they're front-loaded here instead, same distribution.
    /// </summary>
    private static async Task SeedReviewsAsync(ShopEaseDbContext db, List<User> users, List<Product> products)
    {
        (string Comment, int Rating)[] comments =
        [
            ("Excellent quality, highly recommend!", 5), ("Great value for the price.", 4),
            ("Works as described, happy with it.", 4), ("Good product but delivery was slow.", 3),
            ("Absolutely love it!", 5), ("Decent, does the job.", 4), ("Better than expected.", 5),
        ];

        var reviewProducts = products.Take(10).ToList();
        var reviewCustomers = users.Where(u => u.RoleId == RoleId.Customer).Take(4).ToList();
        var reviews = new List<Review>();
        var seq = 1;

        for (var i = 0; i < reviewProducts.Count; i++)
        {
            var n = (i % 3) + 1;
            for (var j = 0; j < n; j++)
            {
                var customer = reviewCustomers[(i + j) % reviewCustomers.Count];
                var (comment, rating) = comments[(i + j) % comments.Length];
                reviews.Add(new Review
                {
                    ProductId = reviewProducts[i].Id,
                    UserId = customer.Id,
                    UserName = customer.Name,
                    Rating = rating,
                    Comment = comment,
                    CreatedAt = DateTime.UtcNow.AddHours(-seq),
                });
                seq++;
            }
        }

        db.Reviews.AddRange(reviews);
        await db.SaveChangesAsync();
    }

    private static async Task SeedLogsAsync(ShopEaseDbContext db)
    {
        string[] samples =
        [
            "System initialized with seed data.", "User logged in: rahul@email.com", "Order placed: ORD-2026-1001 by User #2",
            "Payment Completed: UPI for Order #1", "Order ORD-2026-1003 status: Shipped", "New user registered: arjun@email.com",
            "Admin deactivated user: karthik@email.com", "Product added: Portable Bluetooth Speaker", "Category added: Beauty & Personal Care",
            "Order ORD-2026-1006 status: Cancelled", "Payment Refunded: Credit Card for Order #6", "User logged in: priya@email.com",
            "Order placed: ORD-2026-1010 by User #11", "Stock updated for Resistance Bands Set", "Admin generated Sales report.",
        ];

        var logs = samples.Select((message, i) => new LogEntry
        {
            Message = message,
            Timestamp = new DateTime(2026, 1, 2 + i, 8 + (i % 10), 30, 0, DateTimeKind.Utc),
        }).ToList();

        db.Logs.AddRange(logs);
        await db.SaveChangesAsync();
    }

    private static string ToBase36(int value)
    {
        const string chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (value == 0) return "0";
        var sb = new System.Text.StringBuilder();
        while (value > 0)
        {
            sb.Insert(0, chars[value % 36]);
            value /= 36;
        }
        return sb.ToString();
    }
}
