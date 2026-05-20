# FACT_PUBLIC_INTERFACES

**Source**: Publicly exposed classes reachable from entry points.
**Extraction Date**: 2026-01-20
**Constraint**: Only method signatures with explicit route attributes. No inferred behaviors.

---

## Backend API Endpoints

**Base URL**: `/api/aras` (declared via `[Route("api/aras")]` on both controllers)

### ConnectionController (`backend/ArasBackend/Controllers/ConnectionController.cs`)
**Inherits**: `ControllerBase`
**Attribute**: `[ApiController]`

| HTTP Method | Route | Method Name | Request Type | Response Type | Line |
|-------------|-------|-------------|--------------|---------------|------|
| POST | /api/aras/connect | Connect | ConnectionRequest | ConnectionResponse | 18-23 |
| POST | /api/aras/disconnect | Disconnect | (none) | ConnectionResponse | 25-30 |
| GET | /api/aras/connection-status | GetStatus | (none) | ConnectionStatusResponse | 32-37 |
| GET | /api/aras/validate | Validate | (none) | ConnectionResponse | 39-44 |

### ItemController (`backend/ArasBackend/Controllers/ItemController.cs`)
**Inherits**: `ControllerBase`
**Attribute**: `[ApiController]`

| HTTP Method | Route | Method Name | Request Type | Response Type | Line |
|-------------|-------|-------------|--------------|---------------|------|
| POST | /api/aras/query | Query | QueryRequest | ItemResponse | 18-19 |
| POST | /api/aras/get-by-id | GetById | GetByIdRequest | ItemResponse | 21-22 |
| POST | /api/aras/get-by-keyed-name | GetByKeyedName | GetByKeyedNameRequest | ItemResponse | 24-25 |
| POST | /api/aras/create | Create | CreateItemRequest | ItemResponse | 27-28 |
| POST | /api/aras/update | Update | UpdateItemRequest | ItemResponse | 30-31 |
| POST | /api/aras/delete | Delete | DeleteItemRequest | ItemResponse | 33-34 |
| POST | /api/aras/purge | Purge | DeleteItemRequest | ItemResponse | 36-37 |
| POST | /api/aras/lock | Lock | LockRequest | ItemResponse | 39-40 |
| POST | /api/aras/unlock | Unlock | LockRequest | ItemResponse | 42-43 |
| POST | /api/aras/check-lock | CheckLock | LockRequest | ItemResponse | 45-46 |
| POST | /api/aras/promote | Promote | PromoteRequest | ItemResponse | 48-49 |
| POST | /api/aras/get-state | GetState | GetByIdRequest | ItemResponse | 51-52 |
| POST | /api/aras/add-relationship | AddRelationship | AddRelationshipRequest | ItemResponse | 54-55 |
| POST | /api/aras/get-relationships | GetRelationships | GetRelationshipsRequest | ItemResponse | 57-58 |
| POST | /api/aras/delete-relationship | DeleteRelationship | DeleteRelationshipRequest | ItemResponse | 60-61 |
| POST | /api/aras/apply-aml | ApplyAml | ApplyAmlRequest | ItemResponse | 63-64 |
| POST | /api/aras/apply-sql | ApplySql | ApplySqlRequest | ItemResponse | 66-67 |
| POST | /api/aras/apply-method | ApplyMethod | ApplyMethodRequest | ItemResponse | 69-70 |
| POST | /api/aras/assert-exists | AssertExists | AssertExistsRequest | AssertionResponse | 73-74 |
| POST | /api/aras/assert-not-exists | AssertNotExists | AssertExistsRequest | AssertionResponse | 76-77 |
| POST | /api/aras/assert-property | AssertProperty | AssertPropertyRequest | AssertionResponse | 79-80 |
| POST | /api/aras/assert-state | AssertState | AssertStateRequest | AssertionResponse | 82-83 |

### Inline Mapped Endpoint (`backend/ArasBackend/Program.cs`)
| HTTP Method | Route | Response | Line |
|-------------|-------|----------|------|
| GET | /api/status | `{ status, timestamp }` | 39-42 |

---

## Backend Gateways (`backend/ArasBackend.Infrastructure/Gateways/`)

The single `IArasGateway` has been split into 5 domain-focused interfaces defined in `IArasInterfaces.cs` and implemented by corresponding gateway classes.

### ItemGateway (`ItemGateway.cs`)
**Implements**: `IItemGateway`

| Method | Parameter Type | Return Type |
|--------|----------------|-------------|
| QueryItems | QueryRequest | ItemResponse |
| GetItemById | GetByIdRequest | ItemResponse |
| GetItemByKeyedName | GetByKeyedNameRequest | ItemResponse |
| CreateItem | CreateItemRequest | ItemResponse |
| UpdateItem | UpdateItemRequest | ItemResponse |
| DeleteItem | DeleteItemRequest | ItemResponse |
| PurgeItem | DeleteItemRequest | ItemResponse |
| LockItem | LockRequest | ItemResponse |
| UnlockItem | LockRequest | ItemResponse |
| CheckLockStatus | LockRequest | ItemResponse |
| AddRelationship | AddRelationshipRequest | ItemResponse |
| GetRelationships | GetRelationshipsRequest | ItemResponse |
| DeleteRelationship | DeleteRelationshipRequest | ItemResponse |
| PromoteItem | PromoteRequest | ItemResponse |
| GetCurrentState | GetByIdRequest | ItemResponse |

### WorkflowGateway (`WorkflowGateway.cs`)
**Implements**: `IWorkflowGateway`

| Method | Parameter Type | Return Type |
|--------|----------------|-------------|
| StartWorkflow | StartWorkflowRequest | ItemResponse |
| GetAssignedActivities | (none) | ItemResponse |
| CompleteActivity | CompleteActivityRequest | ItemResponse |

### AssertionGateway (`AssertionGateway.cs`)
**Implements**: `IAssertionGateway`

| Method | Parameter Type | Return Type |
|--------|----------------|-------------|
| AssertItemExists | AssertExistsRequest | AssertionResponse |
| AssertItemNotExists | AssertExistsRequest | AssertionResponse |
| AssertPropertyValue | AssertPropertyRequest | AssertionResponse |
| AssertPropertyContains | AssertPropertyContainsRequest | AssertionResponse |
| AssertState | AssertStateRequest | AssertionResponse |
| AssertCount | AssertCountRequest | AssertionResponse |
| AssertLocked | LockRequest | AssertionResponse |
| AssertUnlocked | LockRequest | AssertionResponse |
| VerifyFileExists | VerifyFileExistsRequest | AssertionResponse |

### FileGateway (`FileGateway.cs`)
**Implements**: `IFileGateway`

| Method | Parameter Type | Return Type |
|--------|----------------|-------------|
| UploadFile | UploadFileRequest | ItemResponse |
| DownloadFile | DownloadFileRequest | ItemResponse |

### UtilityGateway (`UtilityGateway.cs`)
**Implements**: `IUtilityGateway`

| Method | Parameter Type | Return Type |
|--------|----------------|-------------|
| ApplyAML | ApplyAmlRequest | ItemResponse |
| ApplySQL | ApplySqlRequest | ItemResponse |
| ApplyMethod | ApplyMethodRequest | ItemResponse |
| GenerateID | (none) | ItemResponse |
| GetNextSequence | GetNextSequenceRequest | ItemResponse |
| Wait | WaitRequest | ItemResponse |
| SetVariable | SetVariableRequest | ItemResponse |
| LogMessage | LogMessageRequest | ItemResponse |
