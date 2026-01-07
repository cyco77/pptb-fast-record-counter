# Fast Record Counter

<p align="center">
  <img src="https://raw.githubusercontent.com/cyco77/pptb-fast-record-counter/HEAD/icon/fast-record-counter_small.png" alt="Fast Record Counter Logo" width="314" height="150">
</p>

<p align="center">
  A Power Platform Toolbox (PPTB) tool for counting records across all entities in your Dynamics 365/Dataverse environment. This tool provides a fast and efficient way to get record counts for all customizable entities with filtering capabilities.
</p>

## Screenshots

### Dark Theme

![Fast Record Counter - Dark Theme](https://github.com/cyco77/pptb-fast-record-counter/blob/HEAD/screenshots/main_dark.png)

### Light Theme

![Fast Record Counter - Light Theme](https://github.com/cyco77/pptb-fast-record-counter/blob/HEAD/screenshots/main_light.png)

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

### Technical Stack

- ✅ React 18 with TypeScript
- ✅ Fluent UI React Components for consistent Microsoft design
- ✅ Vite for fast development and optimized builds
- ✅ Power Platform Toolbox API integration
- ✅ Dataverse API for querying plugin data
- ✅ Custom hooks for state management
- ✅ Centralized logging service
- ✅ Hot Module Replacement (HMR) for development

## Structure

```
pptb-fast-record-counter/
├── src/
│   ├── components/
│   │   ├── EntitiesDataGrid.tsx   # Data grid for entities with record counts
│   │   ├── Filter.tsx             # Entity name filtering and count button
│   │   └── Overview.tsx           # Main container component
│   ├── hooks/
│   │   ├── useConnection.ts       # Dataverse connection management
│   │   ├── useToolboxAPI.ts       # PPTB API integration hook
│   │   └── useToolboxEvents.ts    # PPTB event subscription
│   ├── services/
│   │   ├── dataverseService.ts    # Dataverse API queries
│   │   └── loggerService.ts       # Centralized logging singleton
│   ├── types/
│   │   ├── entity.ts              # Entity type definitions
│   │   └── solution.ts            # Solution type definitions
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styling
├── dist/                          # Build output
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Power Platform Toolbox installed

### Setup

1. Clone the repository:

```bash
git clone https://github.com/cyco77/pptb-fast-record-counter.git
cd pptb-fast-record-counter
```

2. Install dependencies:

```bash
npm install
```

## Development

### Development Server

Start development server with HMR:

```bash
npm run dev
```

The tool will be available at `http://localhost:5173`

### Watch Mode

Build the tool in watch mode for continuous updates:

```bash
npm run watch
```

### Production Build

Build the optimized production version:

```bash
npm run build
```

The output will be in the `dist/` directory.

### Preview Build

Preview the production build locally:

```bash
npm run preview
```

## Usage

### In Power Platform Toolbox

1. Build the tool:

   ```bash
   npm run build
   ```

2. Package the tool (creates npm-shrinkwrap.json):

   ```bash
   npm run finalize-package
   ```

3. Install in Power Platform Toolbox using the PPTB interface

4. Connect to a Dataverse environment

5. Launch the tool to view entities and count records

### User Interface

#### Filter Section

- **Solution Dropdown**: Select a specific solution to view only its entities, or "All" for all customizable entities
- **Filter Entities SearchBox**: Real-time search by entity display name or logical name
- **Count Records Button**: Execute record counting for all filtered entities

#### Data Grid

- **Display Name**: The user-friendly name of the entity
- **Logical Name**: The schema name of the entity
- **Record Count**: Number of records (populated after counting)
- Click column headers to sort
- Drag column borders to resize
- View tooltips on hover for full text content

#### Counting Process

1. Select a solution from the dropdown (optional - leave as "All" for all entities)
2. Filter entities using the search box (optional)
3. Click "Count Records" button
4. Watch as each entity shows "Loading..." status
5. Record counts appear in real-time as they complete
6. Receive a notification when all counts are finished

## API Usage

The tool demonstrates various Power Platform Toolbox and Dataverse API features:

### Connection Management

```typescript
// Get current connection
const connection = await window.toolboxAPI.getConnection();
console.log(connection.connectionUrl);

// Listen for connection changes
window.toolboxAPI.onToolboxEvent((event, payload) => {
  if (event === "connection:updated") {
    // Refresh data with new connection
  }
});
```

### Dataverse Queries

```typescript
// Query solutions
const solutions = await window.dataverseAPI.queryData(
  `solutions?$select=solutionid,friendlyname,uniquename&$filter=isvisible eq true&$orderby=friendlyname asc`
);

// Query entity definitions
const entities = await window.dataverseAPI.queryData(
  `EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName&$filter=IsCustomizable/Value eq true`
);

// Get entities in a solution via solution components
const components = await window.dataverseAPI.queryData(
  `solutioncomponents?$select=objectid&$filter=_solutionid_value eq ${solutionId} and componenttype eq 1`
);

// Count records for an entity
const count = await window.dataverseAPI.queryData(
  `${entitySetName}?$top=1&$count=true`
);
const recordCount = count["@odata.count"];
```

### Notifications

```typescript
await window.toolboxAPI.utils.showNotification({
  title: "Record Count Complete",
  body: "Successfully counted records for 150 entities",
  type: "success",
  duration: 3000,
});
```

### Theme Management

```typescript
// Get current theme
const theme = await window.toolboxAPI.utils.getCurrentTheme();
// Returns 'light' or 'dark'

// Listen for theme changes
window.toolboxAPI.onToolboxEvent((event) => {
  if (event === "settings:updated") {
    updateThemeBasedOnSettings();
  }
});
```

### Event Subscription

```typescript
// Subscribe to all PPTB events
window.toolboxAPI.onToolboxEvent((event, payload) => {
  console.log("Event:", event);
  console.log("Data:", payload.data);

  // Handle specific events
  switch (event) {
    case "connection:created":
    case "connection:updated":
      refreshConnection();
      break;
    case "connection:deleted":
      clearData();
      break;
  }
});
```

## Architecture

### Custom Hooks

- **useConnection**: Manages Dataverse connection state and refresh logic
- **useToolboxEvents**: Subscribes to PPTB events and handles callbacks
- **useToolboxAPI**: Provides access to PPTB API utilities

### Services

- **loggerService**: Singleton service for centralized logging with callback pattern

  - Methods: `info()`, `success()`, `warning()`, `error()`
  - Eliminates prop drilling for logging across components

- **dataverseService**: Handles all Dataverse API queries
  - Queries solutions and entity definitions with metadata
  - Filters entities by solution using solution components
  - Counts records for entities using EntitySetName
  - Maps raw API responses to typed models

### Type Safety

Full TypeScript coverage with:

- Interface definitions for all data models
- Type-safe API responses
- Strongly typed component props
- PPTB API types from `@pptb/types` package

## Configuration

### Vite Build Configuration

The tool uses a custom Vite configuration for PPTB compatibility:

- **IIFE format**: Bundles as Immediately Invoked Function Expression for iframe compatibility
- **Single bundle**: Uses `inlineDynamicImports` to avoid module loading issues with file:// URLs
- **HTML transformation**: Custom plugin removes `type="module"` and moves scripts to end of body
- **Chunk size limit**: Set to 1000 kB to accommodate Fluent UI bundle size

## Data Models

### Entity

```typescript
{
  logicalname: string;      // Schema name (e.g., "account")
  displayname: string;      // User-friendly name (e.g., "Account")
  entitysetname: string;    // Plural API name (e.g., "accounts")
  recordCount?: number;     // Count of records (populated after counting)
  isLoading?: boolean;      // Loading state during counting
}
```

### Solution

```typescript
{
  solutionid: string; // Unique identifier of the solution
  friendlyname: string; // Display name of the solution
  uniquename: string; // Schema name of the solution
}
```

## Troubleshooting

### Build Issues

If you encounter chunk size warnings:

- The tool uses IIFE format which requires a single bundle
- Chunk size limit is configured in `vite.config.ts`
- This is expected for Fluent UI components

### Connection Issues

- Ensure you're connected to a Dataverse environment in PPTB
- Verify permissions to read entity metadata
- Check that you have access to the entities you're trying to count

### Counting Takes Too Long

- The tool counts entities sequentially to avoid API throttling
- Filter entities to count only specific ones
- Large environments with many entities will take longer

### Record Count Shows Zero

- Ensure the entity has records in your environment
- Verify you have permissions to read records from the entity
- Check the console logs for any API errors

### Theme Not Updating

- The tool automatically syncs with PPTB theme settings
- Check console for theme update events
- Verify PPTB version supports theme API

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with appropriate TypeScript types
4. Test the build process
5. Submit a pull request

### GitHub Actions

The project includes automated CI/CD workflows:

#### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches:

- **Build and Test**:

  - Tests on Node.js 18.x and 20.x
  - TypeScript type checking
  - Build verification
  - Uploads build artifacts

- **Lint Check**:

  - Runs ESLint if configured
  - Validates code quality

- **Security Audit**:

  - Checks for npm package vulnerabilities
  - Fails on critical vulnerabilities
  - Warns on high-severity issues

- **Package Validation**:
  - Validates package.json structure
  - Creates npm-shrinkwrap.json
  - Verifies all required fields

#### Release Workflow (`.github/workflows/release.yml`)

Triggered when pushing a version tag (e.g., `v1.0.0`):

- Builds the project
- Creates distribution packages (tar.gz and zip)
- Creates GitHub release with auto-generated notes
- Attaches build artifacts to release

**To create a release:**

```bash
# Update version in package.json
npm version patch  # or minor, major

# Push with tags
git push origin main --tags
```

## License

MIT - See LICENSE file for details

## Author

Lars Hildebrandt
