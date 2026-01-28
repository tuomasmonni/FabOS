# Claude Development Instructions for FabOS

## IMPORTANT: Development Focus

**All development happens on the FabOS theme ONLY.**

Legacy theme is hidden and should NOT be modified. If user requests changes to any module, always implement for FabOS theme.

### Theme Structure
- **FabOS** (active): Modern orange/white theme with `#FF6B35` accent color
- **Legacy** (hidden): Dark slate/cyan theme - DO NOT MODIFY

### Key Files
- `src/App.jsx` - Main app, theme selection (FabOS is default, Legacy hidden)
- `src/AppV01.jsx` - Laser cutting module (supports both themes, develop FabOS side)
- `src/components/ModuleShell.jsx` - **Shared module header wrapper** (all modules use this)
- `src/components/ThemeSwitcher.jsx` - Theme switcher (hidden from users)
- `src/contexts/ThemeContext.jsx` - Theme state management

### Module Files
When modifying modules, always check `isFabOS` conditional styling:
- Laser cutting: `src/AppV01.jsx`
- Pipe bending: `src/PipeBendingApp.jsx`
- Grating: `src/GratingConfigurator.jsx`
- Stair: `src/StairConfigurator.jsx`

### Color Palette (FabOS)
- Primary: `#FF6B35` (orange)
- Background: `#F7F7F7`, `white`, `gray-50`
- Text: `gray-800`, `gray-600`, `gray-500`
- Borders: `gray-200`, `gray-300`
- Header: `#1A1A2E` (dark blue)

### DO NOT
- Modify Legacy theme styling
- Add `!isFabOS` conditionals
- Use Legacy color palette (slate, cyan, emerald for dark theme)

### Module Header (Yläbanneri) Rule

All modules MUST use **`<ModuleShell>`** (`src/components/ModuleShell.jsx`) as their outer wrapper. This component renders a consistent header across all modules. **DO NOT write header code directly in module files.**

**ModuleShell renders these elements in the header:**
1. **Takaisin-button** — navigates back to main view
2. **FabOS logo** — "Fab" white + "OS" orange branding
3. **Module version badge** — e.g. `V0.3` in colored pill
4. **Module name** — e.g. "Putkentaivutus"
5. **Current version info** — shows active version name + number (if version system is enabled)
6. **Versiot-button** — opens version gallery (if version system is enabled)
7. **Tee uusi kehitysversio -button** — opens AI development mode (if version system is enabled)

**Usage:**
```jsx
<ModuleShell
  onBack={onBack}
  moduleName="Moduulin nimi"
  badgeVersion="V0.X"
  badgeColor="#HEX"
  versionSystem={null}  // or { currentVersionName, currentVersionNumber, onOpenVersionGallery, onOpenDevelopmentMode }
  layout="scroll"       // 'scroll' (default) or 'fill' (h-screen, for viewport-filling modules like StairConfigurator)
  sticky={true}         // default true
>
  {/* Module content (toolbar, tabs, canvas, etc.) goes here */}
</ModuleShell>
```

**DO NOT place in the header:**
- ThemeSwitcher
- ProfileDropdown
- Tabs (Käyttö/Parametrit, Vakio ritilät/Askelmat etc.)
- Shopping cart / order total
- AI-avustaja button
- Undo/Redo buttons
- Order/Submit buttons
- Any other module-specific controls

**Where do removed controls go?**
- Tabs → content area (`<main>`) as first element
- Shopping cart, order total, order buttons → toolbar bar below header or content area
- AI-avustaja, Undo/Redo → toolbar bar below header
- ThemeSwitcher, ProfileDropdown → NOT needed in modules (available via main navigation)

This rule ensures a **consistent, clean header** across all modules and applies to all new modules as well.

### API Endpoints
- `/api/laser-ai` - Laser cutting AI assistant
- `/api/ai-assistant` - General AI development assistant
- `/api/trigger-code-generation` - Code generation pipeline

## Authentication
- Supabase authentication required
- Login page shown for unauthenticated users
- Sign out redirects to root URL
