# Fast Record Counter

![Fast Record Counter - Dark Theme](https://raw.githubusercontent.com/cyco77/pptb-fast-record-counter/HEAD/icon/fast-record-counter_small.png)

A Power Platform Toolbox (PPTB) tool for counting records across all entities in your Dynamics 365/Dataverse environment. This tool provides a fast and efficient way to get record counts for all customizable entities with filtering capabilities.

## Screenshots

### Dark Theme

![Fast Record Counter - Dark Theme](https://raw.githubusercontent.com/cyco77/pptb-fast-record-counter/5838fa58441dfb1647e09161bfae1ef9d10c163c/screenshots/main_dark.png)

### Light Theme

![Fast Record Counter - Light Theme](https://raw.githubusercontent.com/cyco77/pptb-fast-record-counter/5838fa58441dfb1647e09161bfae1ef9d10c163c/screenshots/main_light.png)

## Features

### Core Capabilities

- 📊 **Entity List Display** - View all customizable entities in your Dataverse environment
- 🎯 **Solution Filtering** - Filter entities by solution with dropdown selector (shows only entities in selected solution)
- 🔢 **Fast Record Counting** - Count records for all filtered entities with a single click
- 🔍 **Entity Name Filtering** - Filter entities by display name or logical name in real-time
- 📋 **Sortable Data Grid** - Sort entities by display name, logical name, or record count
- 🎯 **Batch Counting** - Count records for all filtered entities sequentially
- 📢 **Visual Notifications** - Toast notifications for all operations
- 📝 **Progress Tracking** - Real-time loading indicators for each entity being counted
- 🎨 **Theme Support** - Automatic light/dark theme switching based on PPTB settings
- 📏 **Resizable Columns** - Adjust column widths to your preference

## MCP / AI Agent Integration

Fast Record Counter can be discovered and invoked through the Power Platform
ToolBox MCP server. The executable MCP contract is defined in
[`pptb.config.json`](./pptb.config.json), while the supported features and
payloads are documented in [`mcp-features.md`](./mcp-features.md).

### Headless Invocation

The headless runtime counts records without opening the tool UI. It supports
the following optional filters:

- `solutionId` - Exact Dataverse solution ID
- `solutionName` - Solution display name or unique name
- `solutionUniqueName` - Explicit solution unique name
- `publisher` - Publisher display name or unique name
- `entityNames` - Optional list of logical names to count

Solution name matching is case-insensitive and tolerates spaces, hyphens, and
underscores. If a solution cannot be resolved uniquely, the invocation returns
`solution-selection-required` with matching candidates instead of counting the
whole environment. When an exact match is not found, fuzzy matching is used to
handle common typos. Ambiguous fuzzy matches are returned as ranked suggestions
for caller confirmation.

Successful responses include the resolved solution, one record count per
entity, and aggregate totals. Install or update the tool in PPTB after changing
the MCP contract; reloading the MCP server alone does not replace an installed
tool version.

## License

MIT - See LICENSE file for details

## Author

Lars Hildebrandt
