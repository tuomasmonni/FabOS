// ============================================================================
// ROLE BADGE - Näyttää käyttäjän roolin värikoodattuna merkkinä
// ============================================================================
import React from 'react';
import { ROLE_NAMES, ROLE_COLORS, ROLE_ICONS, ROLES } from '../../contexts/AuthContext';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

export default function RoleBadge({
  role,
  size = 'sm', // 'xs', 'sm', 'md', 'lg'
  showIcon = true,
  showLabel = true,
  className = ''
}) {
  const { theme } = useTheme();
  const isLegacy = theme === THEMES.LEGACY;

  // Älä näytä merkintää peruskäyttäjälle tai vierailijalle
  if (!role || role === ROLES.USER || role === ROLES.GUEST) {
    return null;
  }

  const colors = ROLE_COLORS[role] || ROLE_COLORS.user;
  const name = ROLE_NAMES[role] || role;
  const icon = ROLE_ICONS[role] || '👤';

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  // Legacy-teema käyttää eri tyyliä
  const baseClasses = isLegacy
    ? `inline-flex items-center rounded-full font-medium ${sizeClasses[size]} bg-slate-700 text-slate-200 border border-slate-600`
    : `inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${colors.bg} ${colors.text} border ${colors.border}`;

  return (
    <span className={`${baseClasses} ${className}`}>
      {showIcon && <span className="flex-shrink-0">{icon}</span>}
      {showLabel && <span>{name}</span>}
    </span>
  );
}
