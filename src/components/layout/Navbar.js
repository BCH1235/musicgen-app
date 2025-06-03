import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  MusicNote,
  AudioFile,
  Transform,
  LibraryMusic,
  Settings
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 네비게이션 메뉴 아이템 정의
  const navItems = [
    { 
      path: '/generate', 
      label: '음악 생성', 
      icon: <MusicNote />,
      description: '새로운 AI 음악 생성'
    },
    { 
      path: '/convert', 
      label: '음악 변환', 
      icon: <Transform />,
      description: '기존 음악 스타일 변환'
    },
    { 
      path: '/library', 
      label: '라이브러리', 
      icon: <LibraryMusic />,
      description: '내 음악 컬렉션'
    }
  ];

  // 현재 활성 페이지 확인
  const isActivePage = (path) => {
    return location.pathname === path || 
           (path === '/generate' && location.pathname === '/');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar 
          disableGutters
          sx={{
            minHeight: { xs: '64px', md: '80px' },
            justifyContent: 'space-between'
          }}
        >
          {/* 로고 섹션 */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => handleNavigation('/')}
          >
            <AudioFile 
              sx={{ 
                color: 'primary.main', 
                fontSize: { xs: '2rem', md: '2.5rem' },
                mr: 1
              }} 
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                fontSize: { xs: '1.2rem', md: '1.5rem' },
                background: 'linear-gradient(45deg, #6366F1 30%, #8B5CF6 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AI Music Studio
            </Typography>
          </Box>

          {/* 네비게이션 메뉴 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                startIcon={!isMobile ? item.icon : null}
                sx={{
                  minWidth: { xs: '80px', md: '120px' },
                  height: '40px',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  fontWeight: isActivePage(item.path) ? 600 : 400,
                  color: isActivePage(item.path) ? 'primary.main' : 'text.secondary',
                  bgcolor: isActivePage(item.path) ? 'primary.50' : 'transparent',
                  border: isActivePage(item.path) ? '1px solid' : '1px solid transparent',
                  borderColor: isActivePage(item.path) ? 'primary.200' : 'transparent',
                  '&:hover': {
                    bgcolor: isActivePage(item.path) ? 'primary.100' : 'action.hover',
                    borderColor: isActivePage(item.path) ? 'primary.300' : 'action.hover',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {isMobile ? item.icon : item.label}
              </Button>
            ))}
            
            {/* 설정 버튼 (추후 확장용) */}
            <Button
              sx={{
                minWidth: '40px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }}
            >
              <Settings />
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 