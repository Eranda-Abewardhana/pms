import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar, Toolbar, IconButton, Box, Avatar, Tooltip,
  InputBase, Badge, Typography, Popover, List, ListItem,
  ListItemAvatar, ListItemText, Divider, Switch, Stack,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  ListItemButton, Chip, useTheme, CircularProgress,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ScienceIcon from '@mui/icons-material/Science';
import PaymentIcon from '@mui/icons-material/Payment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { toggleTheme } from '../../features/theme/themeSlice';
import { fetchMyNotifications, markAllRead } from '../../features/notification/notificationSlice';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 260;

const TYPE_ICON = {
  appointment: <EventNoteIcon fontSize="small" />,
  lab: <ScienceIcon fontSize="small" />,
  schedule: <CalendarTodayIcon fontSize="small" />,
  billing: <PaymentIcon fontSize="small" />,
};
const TYPE_COLOR = {
  appointment: '#2563eb',
  lab: '#7c3aed',
  schedule: '#059669',
  billing: '#d97706',
};

const MESSAGES = [
  { id: 1, from: 'Dr. Nimal Silva', initials: 'NS', color: '#2563eb', text: 'Can you review the ECG report?', time: '10 min ago', unread: true },
  { id: 2, from: 'Receptionist', initials: 'RC', color: '#059669', text: 'Patient arrived – Room 3 ready', time: '25 min ago', unread: true },
  { id: 3, from: 'Lab Tech', initials: 'LT', color: '#7c3aed', text: 'Urgent: blood results attached', time: '1 hr ago', unread: false },
];

const Navbar = ({ handleDrawerToggle }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notifications: liveNotifications, unreadCount, loading: notifLoading } = useSelector((s) => s.notification);

  const [searchFocused, setSearchFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [msgAnchor, setMsgAnchor] = useState(null);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [messages, setMessages] = useState(MESSAGES);
  const unreadMsgs = messages.filter((m) => m.unread).length;

  // Fetch notifications on mount + poll every 60s
  useEffect(() => {
    dispatch(fetchMyNotifications());
    const interval = setInterval(() => dispatch(fetchMyNotifications()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleNotifOpen = (e) => {
    setNotifAnchor(e.currentTarget);
    dispatch(fetchMyNotifications());
  };

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    dispatch(logout());
    navigate('/login');
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const markAllMsgsRead = () =>
    setMessages((prev) => prev.map((m) => ({ ...m, unread: false })));

  const popoverPaperSx = {
    mt: 1,
    width: 340,
    bgcolor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2,
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2, minHeight: '64px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: 'none' }, color: theme.palette.text.secondary }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: searchFocused 
                  ? (isDark ? 'rgba(0,198,179,0.08)' : 'rgba(0,198,179,0.05)') 
                  : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                border: `1px solid ${searchFocused ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: '10px',
                px: 2,
                py: 0.75,
                width: { xs: '100%', sm: 280 },
                maxWidth: 340,
                transition: 'all 0.2s ease',
              }}
            >
              <SearchIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, flexShrink: 0 }} />
              <InputBase
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: '0.875rem',
                  flex: 1,
                  '& input::placeholder': { color: theme.palette.text.secondary },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={isDark ? 'Light Mode' : 'Dark Mode'} placement="bottom" disableInteractive>
              <IconButton
                size="small"
                onClick={handleThemeToggle}
                sx={{ color: isDark ? '#FF9F43' : theme.palette.text.secondary, '&:hover': { color: '#FF9F43', bgcolor: 'rgba(255,159,67,0.1)' }, transition: 'all 0.2s' }}
              >
                {isDark ? <WbSunnyOutlinedIcon fontSize="small" /> : <NightlightRoundIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications" placement="bottom" disableInteractive>
              <IconButton
                size="small"
                onClick={handleNotifOpen}
                sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main, bgcolor: 'rgba(0,198,179,0.1)' }, transition: 'all 0.2s' }}
              >
                <Badge
                  badgeContent={unreadCount}
                  sx={{ '& .MuiBadge-badge': { bgcolor: '#FF6B6B', color: '#fff', fontSize: '0.6rem', minWidth: 16, height: 16 } }}
                >
                  <NotificationsNoneIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Messages" placement="bottom" disableInteractive>
              <IconButton
                size="small"
                onClick={(e) => setMsgAnchor(e.currentTarget)}
                sx={{ color: theme.palette.text.secondary, '&:hover': { color: '#4B9EFF', bgcolor: 'rgba(75,158,255,0.1)' }, transition: 'all 0.2s' }}
              >
                <Badge
                  badgeContent={unreadMsgs}
                  sx={{ '& .MuiBadge-badge': { bgcolor: '#4B9EFF', color: '#fff', fontSize: '0.6rem', minWidth: 16, height: 16 } }}
                >
                  <ChatBubbleOutlineIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} placement="bottom" disableInteractive>
              <IconButton
                size="small"
                onClick={handleFullscreen}
                sx={{ color: theme.palette.text.secondary, display: { xs: 'none', md: 'flex' }, '&:hover': { color: theme.palette.text.primary, bgcolor: theme.palette.action.hover }, transition: 'all 0.2s' }}
              >
                {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Settings" placement="bottom" disableInteractive>
              <IconButton
                size="small"
                onClick={(e) => setSettingsAnchor(e.currentTarget)}
                sx={{ color: theme.palette.text.secondary, display: { xs: 'none', md: 'flex' }, '&:hover': { color: '#A78BFA', bgcolor: 'rgba(167,139,250,0.1)' }, transition: 'all 0.2s' }}
              >
                <SettingsOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Box sx={{ width: 1, height: 28, bgcolor: theme.palette.divider, mx: 0.5, display: { xs: 'none', sm: 'block' } }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 0.5 }}>
              <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                  {user?.role || 'Staff'}
                </Typography>
              </Box>
              <Avatar
                src={user?.avatar || undefined}
                sx={{ width: 36, height: 36, border: `2px solid ${theme.palette.primary.main}88`, bgcolor: theme.palette.primary.main, fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'border-color 0.2s', '&:hover': { borderColor: theme.palette.primary.main } }}
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>

              <Tooltip title="Logout" placement="bottom" disableInteractive>
                <IconButton
                  onClick={() => setLogoutDialogOpen(true)}
                  size="small"
                  sx={{ color: theme.palette.text.secondary, '&:hover': { color: '#FF6B6B', bgcolor: 'rgba(255,107,107,0.1)' }, transition: 'all 0.2s' }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: popoverPaperSx }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            Notifications {unreadCount > 0 && <Chip label={unreadCount} size="small" sx={{ ml: 0.5, bgcolor: '#FF6B6B', color: '#fff', height: 18, fontSize: '0.65rem' }} />}
          </Typography>
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={handleMarkAllRead} sx={{ color: theme.palette.primary.main }}>
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        <Divider />
        {notifLoading && liveNotifications.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={24} sx={{ color: '#00C6B3' }} /></Box>
        ) : liveNotifications.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 36, color: 'text.secondary', opacity: 0.4 }} />
            <Typography variant="caption" color="text.secondary" display="block">No new notifications</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {liveNotifications.map((n, i) => {
              const iconColor = n.isAbnormal ? '#ef4444' : (TYPE_COLOR[n.type] || '#64748b');
              const icon = TYPE_ICON[n.type] || <NotificationsNoneIcon fontSize="small" />;
              return (
                <React.Fragment key={n.id}>
                  <ListItemButton sx={{ px: 2, py: 1.25 }}>
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: `${iconColor}22`, color: iconColor }}>
                        {icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '0.82rem' }}>
                          {n.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>{n.message}</Typography>
                          {n.time && <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.68rem', opacity: 0.8 }}>
                            {new Date(n.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>}
                        </Box>
                      }
                    />
                    {n.isAbnormal && <Box sx={{ width: 7, height: 7, bgcolor: '#ef4444', borderRadius: '50%', flexShrink: 0, ml: 1 }} />}
                  </ListItemButton>
                  {i < liveNotifications.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
        <Divider />
        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Button size="small" sx={{ color: theme.palette.primary.main, fontSize: '0.75rem', textTransform: 'none' }}>
            View all notifications
          </Button>
        </Box>
      </Popover>

      <Popover
        open={Boolean(msgAnchor)}
        anchorEl={msgAnchor}
        onClose={() => setMsgAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: popoverPaperSx }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            Messages {unreadMsgs > 0 && <Chip label={unreadMsgs} size="small" sx={{ ml: 0.5, bgcolor: theme.palette.info.main, color: '#fff', height: 18, fontSize: '0.65rem' }} />}
          </Typography>
          {unreadMsgs > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={markAllMsgsRead} sx={{ color: theme.palette.info.main }}>
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        <Divider />
        <List disablePadding>
          {messages.map((m, i) => (
            <React.Fragment key={m.id}>
              <ListItemButton
                onClick={() => setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, unread: false } : x))}
                sx={{ px: 2, py: 1.25, bgcolor: m.unread ? 'rgba(75,158,255,0.05)' : 'transparent' }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: m.color, fontSize: '0.75rem', fontWeight: 700 }}>
                    {m.initials}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: m.unread ? 700 : 500, color: theme.palette.text.primary, fontSize: '0.82rem' }}>
                      {m.from}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>{m.text}</Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.68rem', opacity: 0.8 }}>{m.time}</Typography>
                    </Box>
                  }
                />
                {m.unread && <Box sx={{ width: 7, height: 7, bgcolor: theme.palette.info.main, borderRadius: '50%', flexShrink: 0, ml: 1 }} />}
              </ListItemButton>
              {i < messages.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Button size="small" sx={{ color: theme.palette.info.main, fontSize: '0.75rem', textTransform: 'none' }}>
            Open full inbox
          </Button>
        </Box>
      </Popover>

      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { ...popoverPaperSx, width: 280 } }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary, px: 2, py: 1.5 }}>
          Quick Settings
        </Typography>
        <Divider />
        <List disablePadding>
          {[
            { label: 'Dark Mode', sub: 'Toggle light / dark theme', value: isDark, onChange: handleThemeToggle },
            { label: 'Notifications', sub: 'Enable desktop alerts', value: true, onChange: () => {} },
            { label: 'Compact View', sub: 'Reduce sidebar spacing', value: false, onChange: () => {} },
          ].map((item, i) => (
            <ListItem key={i} sx={{ px: 2, py: 1 }}>
              <ListItemText
                primary={<Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</Typography>}
                secondary={<Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{item.sub}</Typography>}
              />
              <Switch
                checked={item.value}
                onChange={item.onChange}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: theme.palette.primary.main },
                }}
              />
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 1.5 }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => { setSettingsAnchor(null); setLogoutDialogOpen(true); }}
            startIcon={<LogoutIcon fontSize="small" />}
            sx={{ color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.3)', textTransform: 'none', '&:hover': { borderColor: '#FF6B6B', bgcolor: 'rgba(255,107,107,0.08)' } }}
          >
            Sign Out
          </Button>
        </Box>
      </Popover>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            color: theme.palette.text.primary,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'rgba(255,107,107,0.15)', color: '#FF6B6B', width: 44, height: 44 }}>
              <LogoutIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Sign Out
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Confirm your action
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
            Are you sure you want to sign out? Any unsaved work will be lost. You will be redirected to the login page.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ flex: 1, textTransform: 'none', borderColor: theme.palette.divider, color: theme.palette.text.secondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleLogoutConfirm}
            startIcon={<LogoutIcon />}
            sx={{ flex: 1, textTransform: 'none', bgcolor: '#FF6B6B', '&:hover': { bgcolor: '#ef4444' }, fontWeight: 700 }}
          >
            Yes, Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;
