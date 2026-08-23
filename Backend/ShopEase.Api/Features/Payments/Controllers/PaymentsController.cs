using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Payments.Dtos;
using ShopEase.Application.Features.Payments.Services;

namespace ShopEase.Api.Features.Payments.Controllers;

[Authorize]
[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _payments;

    public PaymentsController(IPaymentService payments) => _payments = payments;

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<List<PaymentDto>>> GetAll(
        [FromQuery] string? method, [FromQuery] string? status, [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo, [FromQuery] decimal? minAmount, [FromQuery] decimal? maxAmount) =>
        Ok(_payments.ApplyFilters(await _payments.GetAllAsync(), method, status, dateFrom, dateTo, minAmount, maxAmount));

    [HttpGet("mine")]
    public async Task<ActionResult<List<PaymentDto>>> GetMine() => Ok(await _payments.GetByUserIdAsync(UserId()));

    [HttpGet("order/{orderId:int}")]
    public async Task<ActionResult<PaymentDto>> GetByOrderId(int orderId)
    {
        var payment = await _payments.GetByOrderIdAsync(orderId);
        if (payment == null) return NotFound();
        if (payment.UserId != UserId() && !User.IsInRole("Admin")) return Forbid();
        return Ok(payment);
    }

    [HttpGet("methods")]
    public async Task<ActionResult<List<PaymentMethodDto>>> GetMethods() => Ok(await _payments.GetMethodsAsync());

    [HttpPost]
    public async Task<ActionResult<PaymentDto>> Process(ProcessPaymentRequest request)
    {
        var result = await _payments.ProcessAsync(UserId(), request);
        // Even a "Pending/needs reconciliation" outcome returns 200 with the payment record —
        // it's not an error the client should treat as a failed request, just an unsettled one.
        return Ok(result.Data);
    }

    private int UserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
