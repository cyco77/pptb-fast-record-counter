# MCP Features

This document describes the MCP capabilities exposed by Fast Record Counter.
The machine-readable contract used by Power Platform ToolBox is defined in
[`pptb.config.json`](./pptb.config.json).

## Discovery

- MCP invocation is enabled with `agents.invokable: true`.
- Interactive calls use `executionMode: "windowed"`.
- Automated calls use `executionMode: "headless"`.
- The compiled headless entry point is `dist/headless.js`.
- Both `one-way` and `two-way` invocation modes are supported.

## Input

All fields are optional. If no solution filter is provided, the tool counts
all supported, non-blacklisted entities in the environment.

| Field | Type | Description |
| --- | --- | --- |
| `solutionId` | string | Exact Dataverse solution ID. |
| `solutionName` | string | Solution display name or unique name. |
| `solutionUniqueName` | string | Explicit Dataverse solution unique name. |
| `publisher` | string | Publisher display name or unique name. |
| `entityNames` | string[] | Optional entity logical names to count after solution filtering. |

### Solution Matching

Solution matching is case-insensitive. For display names and unique names, the
comparison also ignores spaces, hyphens, underscores, and diacritics. For
example, these values can resolve the same solution when the underlying name
is `AKQUINET Customizations`:

```json
{
  "solutionName": "AKQUINET Customizations"
}
```

```json
{
  "solutionName": "AKQUINETCustomizations"
}
```

Use `solutionUniqueName` when the caller knows the exact unique name and wants
to distinguish it explicitly from the display name.

## Successful Response

```json
{
  "status": "success",
  "filterApplied": true,
  "requestedSolution": {
    "solutionId": null,
    "solutionName": "AKQUINET Customizations",
    "solutionUniqueName": null,
    "publisher": null
  },
  "solution": {
    "applied": true,
    "solutionId": "00000000-0000-0000-0000-000000000000",
    "solutionName": "AKQUINET Customizations",
    "uniqueName": "akq_customizations",
    "publisher": "AKQUINET",
    "version": "1.0.0"
  },
  "recordCounts": [
    {
      "logicalName": "account",
      "displayName": "Account",
      "recordCount": 1234
    }
  ],
  "totalEntities": 1,
  "totalRecords": 1234
}
```

When no solution filter is supplied, `solution` is still present as an object
with `applied: false` and null metadata values. This keeps the MCP response
schema stable for both filtered and unfiltered counts.

`recordCounts` contains one result per counted entity. `entities` contains the
same entities with their entity set names and record counts.

## Solution Selection Required

The tool never falls back to a full-environment count when a requested
solution cannot be resolved uniquely. It returns:

```json
{
  "status": "solution-selection-required",
  "filterApplied": false,
  "requestedSolution": {
    "solutionId": null,
    "solutionName": "Unknown Solution",
    "solutionUniqueName": null,
    "publisher": null
  },
  "message": "The solution could not be resolved. Please select a solution and retry.",
  "solutions": []
}
```

If multiple solutions match, `solutions` contains the candidate IDs, names,
unique names, publishers, and versions. The caller can ask the user to choose
one and retry with its `solutionId`.

If an exact match is not found, the tool performs a fuzzy search to tolerate
typographical errors. Strongly unique matches are applied automatically. If
the result is not clearly unique, the response includes up to five
`suggestions`, each with a `matchScore` between `0` and `1`, so the caller can
ask the user to choose the intended solution.

## Runtime Behavior

- Entity components are resolved from the selected solution before counting.
- Entity metadata IDs are normalized before comparison.
- Virtual entities and configured blacklisted entities are excluded.
- Progress and diagnostic messages are reported through the PPTB headless
  runtime context.
- Access tokens, connection identifiers, and complete request payloads are not
  logged or returned.

After changing `pptb.config.json`, install or update the tool in PPTB before
testing discovery. Reloading the MCP server alone does not update the contract
of an already installed tool version.
