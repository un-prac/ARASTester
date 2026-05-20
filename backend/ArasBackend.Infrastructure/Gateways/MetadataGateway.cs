using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Aras.IOM;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;
using ArasBackend.Infrastructure.Options;
using ArasBackend.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace ArasBackend.Infrastructure.Gateways;

/// <summary>
/// Gateway for querying ARAS system metadata (ItemTypes, RelationshipTypes,
/// Lifecycle States, Methods, Sequences) to support auto-suggest UI dropdowns.
/// </summary>
public class MetadataGateway : BaseGateway, IMetadataGateway
{
    public MetadataGateway(ArasSessionManager sessionManager, IOptions<GatewayResponseOptions> gatewayResponseOptions)
        : base(sessionManager, gatewayResponseOptions) { }

    /// <summary>
    /// Returns all user-visible ItemTypes ordered by label.
    /// </summary>
    public Task<MetadataResponse> GetItemTypes(CancellationToken cancellationToken = default)
    {
        return RunAsync(() =>
        {
            return _sessionManager.Execute(inn =>
            {
                var item = inn.newItem("ItemType", "get");
                item.setAttribute("select", "name,label");
                item.setAttribute("orderBy", "label");
                // Only fetch ItemTypes that are not abstract (is_relationship=0, is_relationship is null covers plain types)
                item.setProperty("is_abstract", "0");
                var result = item.apply();

                if (result.isError())
                    return ErrorResponse(result.getErrorString());

                return BuildMetadataResponse(inn, result, nameProperty: "name", labelProperty: "label");
            });
        }, cancellationToken);
    }

    /// <summary>
    /// Returns RelationshipTypes whose source ItemType matches the given parent.
    /// </summary>
    public Task<MetadataResponse> GetRelationshipTypes(GetRelationshipTypesRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() =>
        {
            return _sessionManager.Execute(inn =>
            {
                // Query RelationshipType where source_id references the ItemType by name
                var aml = $@"<AML>
  <Item type=""RelationshipType"" action=""get"" select=""name,label"">
    <source_id>
      <Item type=""ItemType"" action=""get"">
        <name>{EscapeXml(request.ParentItemType)}</name>
      </Item>
    </source_id>
  </Item>
</AML>";
                var result = inn.applyAML(aml);
                if (result.isError())
                    return ErrorResponse(result.getErrorString());

                return BuildMetadataResponse(inn, result, nameProperty: "name", labelProperty: "label");
            });
        }, cancellationToken);
    }

    /// <summary>
    /// Returns the lifecycle states associated with the given ItemType.
    /// </summary>
    public Task<MetadataResponse> GetLifecycleStates(GetLifecycleStatesRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() =>
        {
            return _sessionManager.Execute(inn =>
            {
                // Get the lifecycle map linked to this ItemType
                var aml = $@"<AML>
  <Item type=""Life Cycle State"" action=""get"" select=""name,label"">
    <source_id>
      <Item type=""Life Cycle Map"" action=""get"">
        <member_of_list>
          <Item type=""ItemType"" action=""get"">
            <name>{EscapeXml(request.ItemType)}</name>
          </Item>
        </member_of_list>
      </Item>
    </source_id>
  </Item>
</AML>";
                var result = inn.applyAML(aml);
                if (result.isError())
                    return ErrorResponse(result.getErrorString());

                return BuildMetadataResponse(inn, result, nameProperty: "name", labelProperty: "label");
            });
        }, cancellationToken);
    }

    /// <summary>
    /// Returns all Method names available in ARAS.
    /// </summary>
    public Task<MetadataResponse> GetMethods(CancellationToken cancellationToken = default)
    {
        return RunAsync(() =>
        {
            return _sessionManager.Execute(inn =>
            {
                var item = inn.newItem("Method", "get");
                item.setAttribute("select", "name");
                item.setAttribute("orderBy", "name");
                var result = item.apply();
                if (result.isError())
                    return ErrorResponse(result.getErrorString());

                return BuildMetadataResponse(inn, result, nameProperty: "name", labelProperty: "name");
            });
        }, cancellationToken);
    }

    /// <summary>
    /// Returns all Sequence names available in ARAS.
    /// </summary>
    public Task<MetadataResponse> GetSequences(CancellationToken cancellationToken = default)
    {
        return RunAsync(() =>
        {
            return _sessionManager.Execute(inn =>
            {
                var item = inn.newItem("Sequence", "get");
                item.setAttribute("select", "name");
                item.setAttribute("orderBy", "name");
                var result = item.apply();
                if (result.isError())
                    return ErrorResponse(result.getErrorString());

                return BuildMetadataResponse(inn, result, nameProperty: "name", labelProperty: "name");
            });
        }, cancellationToken);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static MetadataResponse ErrorResponse(string message) =>
        new() { Success = false, Message = message };

    private static MetadataResponse BuildMetadataResponse(
        Innovator inn,
        Item result,
        string nameProperty,
        string labelProperty)
    {
        var items = new List<MetadataEntry>();
        var count = result.getItemCount();

        for (int i = 0; i < count; i++)
        {
            var child = result.getItemByIndex(i);
            var name = SafeGetProperty(child, nameProperty);
            var label = SafeGetProperty(child, labelProperty);
            if (!string.IsNullOrEmpty(name))
            {
                items.Add(new MetadataEntry
                {
                    Name = name,
                    Label = string.IsNullOrEmpty(label) || label == name ? null : label
                });
            }
        }

        return new MetadataResponse
        {
            Success = true,
            Items = items
        };
    }

    private static string SafeGetProperty(Item item, string property)
    {
        try { return item.getProperty(property, string.Empty); }
        catch { return string.Empty; }
    }

    private static string EscapeXml(string value) =>
        System.Security.SecurityElement.Escape(value) ?? value;
}
