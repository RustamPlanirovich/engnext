'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  AppBar, 
  Box, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography,
  Divider,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Home as HomeIcon,
  Book as BookIcon,
  FitnessCenter as PracticeIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { getActiveProfileId } from '@/utils/clientUtils';
import { fetchProfile } from '@/utils/clientProfileUtils';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

import { ReactNode } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

interface LayoutProps {
  children: ReactNode;
}

// Хук для безопасного использования значений только на стороне клиента
function useClientSideValue<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        setValue(storedValue === 'true' ? true as T : storedValue === 'false' ? false as T : JSON.parse(storedValue));
      }
    } catch (e) {
      console.error(`Error accessing localStorage for key ${key}:`, e);
    }
  }, [key]);

  const setClientValue = useCallback((newValue: T) => {
    setValue(newValue);
    try {
      localStorage.setItem(key, typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue));
    } catch (e) {
      console.error(`Error setting localStorage for key ${key}:`, e);
    }
  }, [key]);

  return [value, setClientValue];
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Используем хук для безопасной работы с localStorage
  const [isMenuCollapsed, setIsMenuCollapsed] = useClientSideValue('menuCollapsed', false);
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleMenuCollapse = () => {
    const newState = !isMenuCollapsed;
    setIsMenuCollapsed(newState);
  };

  // Проверка наличия активного профиля
  useEffect(() => {
    const checkProfile = async () => {
      // Пропускаем проверку, если мы уже на странице профилей
      if (pathname === '/profiles') return;
      
      const activeProfileId = getActiveProfileId();
      
      // Если нет активного профиля, перенаправляем на страницу выбора профиля
      if (!activeProfileId) {
        router.push('/profiles');
        return;
      }
      
      // Загружаем информацию о профиле
      try {
        const { profile } = await fetchProfile(activeProfileId);
        setProfileName(profile.name);
      } catch (error) {
        console.error('Error fetching profile:', error);
        router.push('/profiles');
      }
    };
    
    checkProfile();
  }, [pathname, router]);
  
  // Обработчики меню профиля
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleProfilesClick = () => {
    handleProfileMenuClose();
    router.push('/profiles');
  };
  
  const menuItems = [
    { text: 'Главная', href: '/', icon: <HomeIcon /> },
    { text: 'Уроки', href: '/lessons', icon: <BookIcon /> },
    { text: 'Практика', href: '/practice', icon: <PracticeIcon /> },
    { text: 'Диалоги', href: '/dialogs', icon: <ChatIcon /> },
    //{ text: 'Интервальное повторение', href: '/review', icon: <PracticeIcon /> },
    { text: 'Аналитика', href: '/analytics', icon: <AnalyticsIcon /> },
    { text: 'Настройки', href: '/settings', icon: <SettingsIcon /> },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: isMenuCollapsed ? 'center' : 'space-between', pr: isMenuCollapsed ? 0 : 1 }}>
        {!isMenuCollapsed && (
          <Typography variant="h6" noWrap component="div">
            English Galaxy
          </Typography>
        )}
        <IconButton onClick={toggleMenuCollapse} sx={{ display: { xs: 'none', sm: 'flex' } }}>
          {isMenuCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            {isMenuCollapsed ? (
              <Tooltip title={item.text} placement="right">
                <Link href={item.href} passHref style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                  <ListItemButton selected={pathname === item.href}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                  </ListItemButton>
                </Link>
              </Tooltip>
            ) : (
              <Link href={item.href} passHref style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                <ListItemButton selected={pathname === item.href}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </Link>
            )}
          </ListItem>
        ))}

      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${isMenuCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { sm: `${isMenuCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            English Galaxy
          </Typography>
          
          {/* Меню профиля */}
          {profileName && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Настройки профиля">
                <IconButton
                  onClick={handleProfileMenuOpen}
                  size="large"
                  edge="end"
                  color="inherit"
                  aria-label="профиль пользователя"
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    <PersonIcon />
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Typography variant="body1" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                {profileName}
              </Typography>
            </Box>
          )}
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfilesClick}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Сменить профиль</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { handleProfileMenuClose(); router.push('/settings'); }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Настройки профиля</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {/* Force mobile drawer to always show text regardless of desktop collapsed state */}
          <div>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', pr: 1 }}>
              <Typography variant="h6" noWrap component="div">
                English Galaxy
              </Typography>
              <IconButton onClick={handleDrawerToggle}>
                <ChevronLeftIcon />
              </IconButton>
            </Toolbar>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <Link href={item.href} passHref style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                    <ListItemButton selected={pathname === item.href}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </Link>
                </ListItem>
              ))}
            </List>
          </div>
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: isMenuCollapsed ? collapsedDrawerWidth : drawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${isMenuCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          mt: '64px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 2 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
