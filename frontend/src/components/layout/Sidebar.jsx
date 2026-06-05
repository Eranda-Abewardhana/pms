import React, { useState } from 'react';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Avatar, Divider, Collapse, Chip, useTheme
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { roleMenuItems } from '../../utils/roleMenuItems';

const drawerWidth = 260;

/* Role → badge color */
const roleBadgeColor = {
  admin: '#FF9F43',
  doctor: '#00C6B3',
  nurse: '#4B9EFF',
  receptionist: '#A78BFA',
  labtech: '#FF6B6B',
  cashier: '#34D399',
  patient: '#8A94A6',
};

/* Group menu items by section label */
const SECTIONS = {
  DASHBOARD: ['Dashboard'],
  MANAGEMENT: ['Patients', 'Doctors', 'Appointments', 'Staff', 'Rooms'],
  COMPONENTS: ['Support', 'Features', 'Forms & Charts', 'Tables', 'Reports'],
};

const getSectionLabel = (label) => {
  for (const [section, items] of Object.entries(SECTIONS)) {
    if (items.includes(label)) return section;
  }
  return 'OTHER';
};

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { role, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [openSubmenu, setOpenSubmenu] = useState('Dashboard');

  const menuItems = role ? roleMenuItems[role] || [] : [];

  /* Build grouped sections */
  const grouped = {};
  menuItems.forEach((item) => {
    const section = getSectionLabel(item.label);
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(item);
  });

  const sidebarBg = theme.palette.background.paper;
  const sidebarBorder = theme.palette.divider;
  const textPrimary = theme.palette.text.primary;
  const textMuted = theme.palette.text.secondary;
  const onlineDotBorder = theme.palette.background.paper;

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: sidebarBg,
        color: textPrimary,
        overflow: 'hidden',
      }}
    >
      {/* ── Brand ── */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${sidebarBorder}`,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00C6B3, #4B9EFF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 198, 179, 0.35)',
          }}
        >
          <HealthAndSafetyIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: '1.1rem',
              letterSpacing: 0.5,
              lineHeight: 1,
              background: 'linear-gradient(90deg, #00C6B3, #4B9EFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            MetroCare
          </Typography>
          <Typography variant="caption" sx={{ color: '#8A94A6', fontSize: '0.65rem', letterSpacing: 1 }}>
            PATIENT MANAGEMENT
          </Typography>
        </Box>
      </Box>

      {/* ── Profile ── */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${sidebarBorder}`,
          background: 'rgba(0, 198, 179, 0.04)',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={user?.avatar || undefined}
            sx={{
              width: 44,
              height: 44,
              border: '2px solid rgba(0, 198, 179, 0.5)',
              bgcolor: '#00C6B3',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          {/* Online indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 10,
              height: 10,
              bgcolor: '#34D399',
              borderRadius: '50%',
              border: `2px solid ${onlineDotBorder}`,
            }}
          />
        </Box>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {user?.name || 'User'}
          </Typography>
          <Chip
            label={(role || 'user').toUpperCase()}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: 0.5,
              bgcolor: `${roleBadgeColor[role] || '#8A94A6'}22`,
              color: roleBadgeColor[role] || '#8A94A6',
              border: `1px solid ${roleBadgeColor[role] || '#8A94A6'}44`,
              borderRadius: '4px',
              mt: 0.5,
            }}
          />
        </Box>
      </Box>

      {/* ── Nav ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {Object.entries(grouped).map(([section, items]) => (
          <Box key={section}>
            {/* Section label */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                px: 3,
                pt: 2,
                pb: 0.5,
                color: textMuted,
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
              }}
            >
              {section}
            </Typography>

            <List dense disablePadding>
              {items.map((item) => {
                const isActive = location.pathname === item.path;
                const isDashboard = item.label === 'Dashboard';

                return (
                  <React.Fragment key={item.label}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => {
                        if (isDashboard) {
                          setOpenSubmenu(openSubmenu === 'Dashboard' ? '' : 'Dashboard');
                        } else {
                          navigate(item.path);
                          if (mobileOpen) handleDrawerToggle();
                        }
                      }}
                      sx={{
                        mx: 1,
                        my: 0.25,
                        borderRadius: '8px',
                        py: 1,
                        px: 1.5,
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                          bgcolor: 'rgba(0, 198, 179, 0.12)',
                          borderLeft: '3px solid #00C6B3',
                          pl: '9px',
                          '&:hover': { bgcolor: 'rgba(0, 198, 179, 0.18)' },
                          '& .MuiListItemIcon-root': { color: '#00C6B3' },
                          '& .MuiListItemText-primary': { color: '#00C6B3', fontWeight: 700 },
                        },
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                        '& .MuiListItemIcon-root': { color: textMuted },
                        '& .MuiListItemText-primary': { color: textMuted },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 34 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={t(item.label)}
                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500, color: textMuted }}
                      />
                      {isDashboard && (
                        openSubmenu === 'Dashboard'
                          ? <ExpandLess sx={{ fontSize: 18, color: textMuted }} />
                          : <ExpandMore sx={{ fontSize: 18, color: textMuted }} />
                      )}
                    </ListItemButton>

                    {/* Submenu for Dashboard */}
                    {isDashboard && (
                      <Collapse in={openSubmenu === 'Dashboard'} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          <ListItemButton
                            onClick={() => {
                              navigate(item.path);
                              if (mobileOpen) handleDrawerToggle();
                            }}
                            sx={{
                              pl: 6,
                              py: 0.8,
                              mx: 1,
                              borderRadius: '6px',
                              '& .MuiListItemText-primary': { color: '#00C6B3', fontWeight: 600 },
                              bgcolor: 'rgba(0,198,179,0.06)',
                              '&:hover': { bgcolor: 'rgba(0,198,179,0.1)' },
                              borderLeft: '2px solid rgba(0,198,179,0.4)',
                            }}
                          >
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: '#00C6B3',
                                mr: 1.5,
                              }}
                            />
                            <ListItemText
                              primary="MetroCare"
                              primaryTypographyProps={{ fontSize: '0.8rem' }}
                            />
                          </ListItemButton>
                        </List>
                      </Collapse>
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* ── Bottom divider ── */}
      <Divider sx={{ borderColor: sidebarBorder }} />
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.65rem' }}>
          MetroCare PMS v2.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            border: 'none',
            bgcolor: sidebarBg,
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            border: 'none',
            bgcolor: sidebarBg,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar;
