using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Orders.Dtos;
using ShopEase.Application.Features.Orders.Services;

namespace ShopEase.Api.Features.Orders.Controllers;

[Authorize]
[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;

    public OrdersController(IOrderService orders) => _orders = orders;

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetAll([FromQuery] OrderFiltersQuery filters) =>
        Ok(_orders.ApplyFilters(await _orders.GetAllAsync(), filters));

    [HttpGet("mine")]
    public async Task<ActionResult<List<OrderDto>>> GetMine() => Ok(await _orders.GetByUserIdAsync(UserId()));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await _orders.GetByIdAsync(id);
        if (order == null) return NotFound();
        if (order.UserId != UserId() && !User.IsInRole("Admin")) return Forbid();
        return Ok(order);
    }

    [HttpGet("statuses")]
    public async Task<ActionResult<List<string>>> GetStatuses() => Ok(await _orders.GetOrderStatusesAsync());

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Place(PlaceOrderRequest request)
    {
        var result = await _orders.PlaceOrderAsync(UserId(), request.AddressId, request.PaymentMethodId);
        if (!result.Success) return UnprocessableEntity(new ProblemDetails { Title = result.Message });
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateOrderStatusRequest request)
    {
        var result = await _orders.UpdateStatusAsync(id, request.Status);
        if (!result.Success) return UnprocessableEntity(new ProblemDetails { Title = result.Message });
        return Ok(new { message = result.Message });
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var result = await _orders.CancelAsync(id, UserId());
        if (!result.Success) return UnprocessableEntity(new ProblemDetails { Title = result.Message });
        return Ok(new { message = result.Message });
    }

    [HttpPost("{id:int}/return")]
    public async Task<IActionResult> Return(int id)
    {
        var result = await _orders.ReturnAsync(id, UserId());
        if (!result.Success) return UnprocessableEntity(new ProblemDetails { Title = result.Message });
        return Ok(new { message = result.Message });
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:int}/custom-fields")]
    public async Task<IActionResult> SetCustomFields(int id, SetOrderCustomFieldsRequest request)
    {
        var result = await _orders.SetCustomFieldsAsync(id, request.Custom);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return Ok(new { message = result.Message });
    }

    private int UserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
