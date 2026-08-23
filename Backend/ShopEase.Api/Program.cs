using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ShopEase.Api.Middleware;
using ShopEase.Api.Options;
using ShopEase.Api;
using ShopEase.Application.Abstractions;
using ShopEase.Application.Features.Auth.Services;
using ShopEase.Application.Features.Backup.Services;
using ShopEase.Application.Features.Cart.Services;
using ShopEase.Application.Features.Catalog.Services;
using ShopEase.Application.Features.Cms.Services;
using ShopEase.Application.Features.Coupons.Services;
using ShopEase.Application.Features.CustomFields.Services;
using ShopEase.Application.Features.Notifications.Services;
using ShopEase.Application.Features.Orders.Services;
using ShopEase.Application.Features.Payments.Services;
using ShopEase.Application.Options;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.BackgroundJobs;
using ShopEase.Infrastructure.Backup;
using ShopEase.Infrastructure.Caching;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Payments;
using ShopEase.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// ── Options pattern — every cross-cutting setting is bound here once, never read via raw IConfiguration in services ──
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<CacheOptions>(builder.Configuration.GetSection(CacheOptions.SectionName));
builder.Services.Configure<RateLimitOptions>(builder.Configuration.GetSection(RateLimitOptions.SectionName));
builder.Services.Configure<PaymentGatewayOptions>(builder.Configuration.GetSection(PaymentGatewayOptions.SectionName));
builder.Services.Configure<BackgroundJobOptions>(builder.Configuration.GetSection(BackgroundJobOptions.SectionName));

// ── Data ──
// EnableRetryOnFailure matters more here than it did under SQL Server: the
// migration below runs during boot, and Compose gates this container only on
// the db healthcheck — which can pass a moment before Postgres finishes
// accepting real connections.
builder.Services.AddDbContext<ShopEaseDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ShopEaseDb"),
        npgsql => npgsql.EnableRetryOnFailure()));

// ── Repositories (Domain interface -> Infrastructure/EF implementation) ──
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICustomFieldRepository, CustomFieldRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IAddressRepository, AddressRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();
builder.Services.AddScoped<ICouponRepository, CouponRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<ICmsRepository, CmsRepository>();
builder.Services.AddScoped<ILogRepository, LogRepository>();
builder.Services.AddScoped<IBackupJobRepository, BackupJobRepository>();
builder.Services.AddScoped<IBackupSnapshotRepository, BackupSnapshotRepository>();

// ── Application services ──
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<ICustomFieldService, CustomFieldService>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ICmsService, CmsService>();
builder.Services.AddScoped<IBackupDataExporter, BackupDataExporter>();
builder.Services.AddScoped<IBackupService, BackupService>();

// ── Background jobs: the one background job (scheduled backups) uses a plain BackgroundService,
// no external scheduler needed at this scale ──
builder.Services.AddHostedService<BackupJobBackgroundService>();

// ── Payment gateway: Razorpay simulator wrapped in a Polly retry/circuit-breaker/timeout pipeline ──
builder.Services.AddScoped<RazorpaySimulatorGateway>();
builder.Services.AddScoped<IPaymentGateway, ResilientPaymentGateway>();

// ── Caching ──
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();

// ── Auth (JWT bearer) ──
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });
builder.Services.AddAuthorization();

// ── Rate limiting — only the brute-forceable auth endpoints opt into the "auth" policy ──
var rateLimitOptions = builder.Configuration.GetSection(RateLimitOptions.SectionName).Get<RateLimitOptions>() ?? new RateLimitOptions();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    // Partitioned by client IP so one caller's traffic can't exhaust the budget for everyone else.
    options.AddPolicy("auth", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = rateLimitOptions.AuthPermitLimit,
            Window = TimeSpan.FromSeconds(rateLimitOptions.AuthWindowSeconds),
            QueueLimit = 0,
        }));
});

// ── CORS — the Angular dev server only ──
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularDev", policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod());
});

// ── Global exception handling -> RFC7807 ProblemDetails ──
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddControllers();

// ── Swagger (with JWT bearer support so endpoints can be tried authenticated) ──
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "ShopEase API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter a valid JWT access token.",
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        },
    });
});

var app = builder.Build();

app.UseExceptionHandler();

// Schema and lookups must exist in EVERY environment — a containerised run always
// starts against an empty database, so the app is responsible for its own schema.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ShopEaseDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedLookupsAsync(db);

    // Demo rows are a teaching convenience, not part of the schema.
    if (app.Environment.IsDevelopment())
    {
        await DemoDataSeeder.SeedAsync(db);
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// nginx is the entry point and owns TLS. An app behind a reverse proxy speaks plain HTTP.
// app.UseHttpsRedirection();
app.UseCors("AngularDev");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
