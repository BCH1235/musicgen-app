import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material';
import {
  LibraryMusic,
  Search,
  PlayArrow,
  Download,
  Delete,
  Favorite,
  Sort,
  FilterList,
  MusicNote
} from '@mui/icons-material';

import { useMusicContext } from '../context/MusicContext';
import { GENRE_OPTIONS } from '../components/common/GenreSelector';

const Library = () => {
  const { state, actions } = useMusicContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');

  const { musicList } = state.library;

  // 더미 데이터 (실제로는 서버에서 가져옴)
  const dummyMusicList = [
    {
      id: 1,
      title: 'AI_Generated_LoFi_001',
      genres: ['lofi'],
      moods: ['calm', 'focused'],
      duration: 120,
      createdAt: '2024-01-15T10:30:00Z',
      type: 'generated',
      isFavorite: true
    },
    {
      id: 2,
      title: 'Converted_Jazz_Mix',
      targetGenre: 'jazz',
      originalFile: 'original_song.mp3',
      duration: 180,
      createdAt: '2024-01-14T15:20:00Z',
      type: 'converted',
      isFavorite: false
    },
    {
      id: 3,
      title: 'AI_Generated_EDM_002',
      genres: ['edm'],
      moods: ['energetic', 'uplifting'],
      duration: 240,
      createdAt: '2024-01-13T09:15:00Z',
      type: 'generated',
      isFavorite: true
    }
  ];

  // 실제 리스트와 더미 데이터 합치기
  const allMusic = [...musicList, ...dummyMusicList];

  // 장르 정보 가져오기
  const getGenreInfo = (genreId) => {
    return GENRE_OPTIONS.find(g => g.id === genreId) || { label: genreId, color: '#6366F1' };
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 필터링 및 정렬된 음악 리스트
  const filteredAndSortedMusic = allMusic
    .filter((music) => {
      // 검색 필터
      if (searchQuery && !music.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 타입 필터
      if (filterBy !== 'all' && music.type !== filterBy) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'duration':
          return b.duration - a.duration;
        case 'favorites':
          return b.isFavorite - a.isFavorite;
        default:
          return 0;
      }
    });

  // 이벤트 핸들러들
  const handlePlay = (music) => {
    actions.addNotification({
      type: 'info',
      message: `"${music.title}" 재생을 시작합니다.`
    });
  };

  const handleDownload = (music) => {
    actions.addNotification({
      type: 'success',
      message: `"${music.title}" 다운로드가 시작되었습니다.`
    });
  };

  const handleDelete = (musicId) => {
    actions.addNotification({
      type: 'success',
      message: '음악이 라이브러리에서 제거되었습니다.'
    });
  };

  const handleToggleFavorite = (musicId) => {
    actions.addNotification({
      type: 'info',
      message: '즐겨찾기 상태가 변경되었습니다.'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LibraryMusic 
            sx={{ 
              fontSize: '3rem', 
              color: 'primary.main', 
              mr: 2 
            }} 
          />
          <Box>
            <Typography 
              variant="h3" 
              component="h1"
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #6366F1 30%, #8B5CF6 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              내 음악 라이브러리
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
            >
              생성하고 변환한 음악들을 관리하세요
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 검색 및 필터 */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          mb: 4
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* 검색 */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="음악 제목으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Grid>

          {/* 정렬 */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>정렬 기준</InputLabel>
              <Select
                value={sortBy}
                label="정렬 기준"
                onChange={(e) => setSortBy(e.target.value)}
                startAdornment={<Sort sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="date">최신순</MenuItem>
                <MenuItem value="title">제목순</MenuItem>
                <MenuItem value="duration">길이순</MenuItem>
                <MenuItem value="favorites">즐겨찾기순</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 필터 */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>타입 필터</InputLabel>
              <Select
                value={filterBy}
                label="타입 필터"
                onChange={(e) => setFilterBy(e.target.value)}
                startAdornment={<FilterList sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="generated">생성된 음악</MenuItem>
                <MenuItem value="converted">변환된 음악</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 통계 */}
          <Grid item xs={12} md={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main" fontWeight={600}>
                {filteredAndSortedMusic.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                총 음악 수
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 음악 목록 */}
      {filteredAndSortedMusic.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: 6,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <MusicNote 
            sx={{ 
              fontSize: '4rem', 
              color: 'text.disabled', 
              mb: 2 
            }} 
          />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {searchQuery || filterBy !== 'all' 
              ? '검색 조건에 맞는 음악이 없습니다'
              : '아직 라이브러리에 음악이 없습니다'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            음악을 생성하거나 변환하여 라이브러리를 채워보세요
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredAndSortedMusic.map((music) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={music.id}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  }
                }}
              >
                {/* 카드 헤더 */}
                <Box 
                  sx={{ 
                    p: 2,
                    background: music.type === 'generated' 
                      ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                      : 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                    color: 'white'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1, fontSize: '1rem' }}>
                      {music.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleFavorite(music.id)}
                      sx={{ 
                        color: music.isFavorite ? '#FFD700' : 'rgba(255,255,255,0.7)',
                        '&:hover': { color: '#FFD700' }
                      }}
                    >
                      <Favorite fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Chip
                    label={music.type === 'generated' ? '생성됨' : '변환됨'}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      mt: 1
                    }}
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1 }}>
                  {/* 장르 표시 */}
                  {(music.genres || [music.targetGenre]).filter(Boolean).length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        장르
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(music.genres || [music.targetGenre]).filter(Boolean).map((genreId) => {
                          const genre = getGenreInfo(genreId);
                          return (
                            <Chip
                              key={genreId}
                              label={genre.label}
                              size="small"
                              sx={{
                                bgcolor: `${genre.color}20`,
                                color: genre.color,
                                fontSize: '0.75rem'
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* 분위기 표시 */}
                  {music.moods && music.moods.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        분위기
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {music.moods.join(', ')}
                      </Typography>
                    </Box>
                  )}

                  {/* 음악 정보 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      길이
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatTime(music.duration)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      생성일
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(music.createdAt).toLocaleDateString('ko-KR')}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <IconButton
                      onClick={() => handlePlay(music)}
                      sx={{ 
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                      size="small"
                    >
                      <PlayArrow />
                    </IconButton>
                    
                    <IconButton
                      onClick={() => handleDownload(music)}
                      sx={{ 
                        bgcolor: 'success.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'success.dark' }
                      }}
                      size="small"
                    >
                      <Download />
                    </IconButton>
                    
                    <IconButton
                      onClick={() => handleDelete(music.id)}
                      sx={{ 
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' }
                      }}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Library; 