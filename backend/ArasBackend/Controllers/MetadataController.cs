using Microsoft.AspNetCore.Mvc;
using global::ArasBackend.Application.Services;
using global::ArasBackend.Core.Models;

namespace ArasBackend.Controllers;

/// <summary>
/// Provides metadata lookup endpoints to power auto-suggest dropdowns in
/// the frontend Action Details editor (ItemTypes, RelationshipTypes, etc.).
/// All endpoints require an active ARAS session via ArasAuthorizeAttribute.
/// </summary>
[ApiController]
[Route("api/aras/metadata")]
[ServiceFilter(typeof(Middleware.ArasAuthorizeAttribute))]
public class MetadataController : ControllerBase
{
    private readonly MetadataAppService _metadataService;
    private readonly ILogger<MetadataController> _logger;

    public MetadataController(MetadataAppService metadataService, ILogger<MetadataController> logger)
    {
        _metadataService = metadataService;
        _logger = logger;
    }

    /// <summary>GET /api/aras/metadata/itemtypes — returns all non-abstract ItemType names.</summary>
    [HttpGet("itemtypes")]
    public async Task<ActionResult<MetadataResponse>> GetItemTypes(CancellationToken cancellationToken)
    {
        var result = await _metadataService.GetItemTypes(cancellationToken);
        return Ok(result);
    }

    /// <summary>GET /api/aras/metadata/relationship-types?parentType=Part — returns RelationshipTypes sourced from the given ItemType.</summary>
    [HttpGet("relationship-types")]
    public async Task<ActionResult<MetadataResponse>> GetRelationshipTypes(
        [FromQuery] string parentType,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(parentType))
            return BadRequest(new { message = "parentType query parameter is required." });

        var result = await _metadataService.GetRelationshipTypes(
            new GetRelationshipTypesRequest { ParentItemType = parentType },
            cancellationToken);
        return Ok(result);
    }

    /// <summary>GET /api/aras/metadata/states?itemType=Part — returns lifecycle states linked to the given ItemType.</summary>
    [HttpGet("states")]
    public async Task<ActionResult<MetadataResponse>> GetLifecycleStates(
        [FromQuery] string itemType,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(itemType))
            return BadRequest(new { message = "itemType query parameter is required." });

        var result = await _metadataService.GetLifecycleStates(
            new GetLifecycleStatesRequest { ItemType = itemType },
            cancellationToken);
        return Ok(result);
    }

    /// <summary>GET /api/aras/metadata/methods — returns all Method names.</summary>
    [HttpGet("methods")]
    public async Task<ActionResult<MetadataResponse>> GetMethods(CancellationToken cancellationToken)
    {
        var result = await _metadataService.GetMethods(cancellationToken);
        return Ok(result);
    }

    /// <summary>GET /api/aras/metadata/sequences — returns all Sequence names.</summary>
    [HttpGet("sequences")]
    public async Task<ActionResult<MetadataResponse>> GetSequences(CancellationToken cancellationToken)
    {
        var result = await _metadataService.GetSequences(cancellationToken);
        return Ok(result);
    }
}
