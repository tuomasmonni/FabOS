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
- `src/components/ThemeSwitcher.jsx` - Theme switcher (hidden from users)
- `src/contexts/ThemeContext.jsx` - Theme state management

### Module Files
When modifying modules, always check `isFabOS` conditional styling:
- Laser cutting: `src/AppV01.jsx`
- Pipe bending: `src/components/PipeBendingApp.jsx`
- Grating: `src/components/GratingConfigurator.jsx`
- Stair: `src/components/StairConfigurator.jsx`

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

### API Endpoints
- `/api/laser-ai` - Laser cutting AI assistant
- `/api/ai-assistant` - General AI development assistant
- `/api/trigger-code-generation` - Code generation pipeline

## Authentication
- Supabase authentication required
- Login page shown for unauthenticated users
- Sign out redirects to root URL
