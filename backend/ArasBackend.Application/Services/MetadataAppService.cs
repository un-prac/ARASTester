using System.Threading;
using System.Threading.Tasks;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;

namespace ArasBackend.Application.Services;

/// <summary>
/// Application service for metadata lookups used to power auto-suggest dropdowns
/// in the frontend Action Details editor.
/// </summary>
public class MetadataAppService
{
    private readonly IMetadataGateway _metadataGateway;

    public MetadataAppService(IMetadataGateway metadataGateway)
    {
        _metadataGateway = metadataGateway;
    }

    public Task<MetadataResponse> GetItemTypes(CancellationToken cancellationToken = default)
        => _metadataGateway.GetItemTypes(cancellationToken);

    public Task<MetadataResponse> GetRelationshipTypes(GetRelationshipTypesRequest request, CancellationToken cancellationToken = default)
        => _metadataGateway.GetRelationshipTypes(request, cancellationToken);

    public Task<MetadataResponse> GetLifecycleStates(GetLifecycleStatesRequest request, CancellationToken cancellationToken = default)
        => _metadataGateway.GetLifecycleStates(request, cancellationToken);

    public Task<MetadataResponse> GetMethods(CancellationToken cancellationToken = default)
        => _metadataGateway.GetMethods(cancellationToken);

    public Task<MetadataResponse> GetSequences(CancellationToken cancellationToken = default)
        => _metadataGateway.GetSequences(cancellationToken);
}
