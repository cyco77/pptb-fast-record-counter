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

## Development and Releases

- Create feature branches from `dev` and open pull requests back to `dev`.
- Add a Changeset to every feature pull request with `npm run changeset`, then commit the generated file in `.changeset/`.
- Open a release pull request from `dev` to `main` when changes are ready.
- After that pull request is merged, GitHub Actions creates or updates a `Version Packages` pull request on `main`.
- Review and merge the version pull request. GitHub Actions then builds the package, publishes it to npm, and creates a GitHub Release with downloadable archives.

Changeset release types follow SemVer: `patch` for fixes, `minor` for backwards-compatible features, and `major` for breaking changes.

### Repository Setup

- Create a GitHub Actions secret named `CHANGESETS_GITHUB_TOKEN` with **Contents: read and write** and **Pull requests: read and write** for this repository. A GitHub App token can be used instead.
- In repository settings under **Actions > General**, allow GitHub Actions to create and approve pull requests.
- On npm, configure GitHub Actions trusted publishing for `@cyco77/pptb-fast-record-counter` using owner `cyco77`, repository `pptb-fast-record-counter`, and workflow `release.yml`. Allow direct `npm publish` for this publisher.
- Releases use Node.js 24 and npm 11.20.0 for npm Trusted Publishing and `npm-shrinkwrap.json`. No npm write token is needed.
- Local development and Changesets commands require Node.js 24 or newer.
- Protect `dev` and `main` with required pull requests and CI checks. Keep `main` as the production branch.

## License

MIT - See LICENSE file for details

## Author

Lars Hildebrandt
