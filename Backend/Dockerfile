# ═══════════════════════════════════════════════════════════════════
#  ShopEase API — multi-stage build
#
#  Stage 1 (build)   ~900 MB : full .NET SDK, compiler, NuGet packages
#  Stage 2 (runtime) ~230 MB : ASP.NET runtime + published DLLs only
#
#  Only the LAST stage becomes the image. Everything in stage 1 is
#  discarded — that is why the shipped image is a quarter of the size.
# ═══════════════════════════════════════════════════════════════════

# ─────────────── Stage 1: build ───────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy ONLY the project files first, then restore. Docker caches this layer,
# so editing C# code does not re-download every NuGet package.
COPY ShopEase.Domain/ShopEase.Domain.csproj           ShopEase.Domain/
COPY ShopEase.Application/ShopEase.Application.csproj ShopEase.Application/
COPY ShopEase.Infrastructure/ShopEase.Infrastructure.csproj ShopEase.Infrastructure/
COPY ShopEase.Api/ShopEase.Api.csproj                 ShopEase.Api/
RUN dotnet restore ShopEase.Api/ShopEase.Api.csproj

# Now the source. This layer changes on every edit — hence it comes last.
COPY . .
RUN dotnet publish ShopEase.Api/ShopEase.Api.csproj \
        -c Release \
        -o /app/publish \
        --no-restore

# ─────────────── Stage 2: runtime ───────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# Kestrel listens on plain HTTP. TLS is nginx's job.
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ShopEase.Api.dll"]
