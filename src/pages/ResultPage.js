import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Alert,
  IconButton,
  Slider
} from '@mui/material';
import {
  CheckCircle,
  PlayArrow,
  Pause,
  Download,
  Favorite,
  FavoriteBorder,
  Refresh,
  Share,
  Home,
  LibraryMusic,
  VolumeUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useMusicContext } from '../context/MusicContext';
import { GENRE_OPTIONS } from '../components/common/GenreSelector';
import { MOOD_OPTIONS } from '../components/common/MoodSelector';

const ResultPage = () => {
  const navigate = useNavigate();
  const { state, actions } = useMusicContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3분 예시
  const [volume, setVolume] = useState(70);
  const [isFavorite, setIsFavorite] = useState(false);

  // Context에서 결과 데이터 가져오기
  const { generatedMusic, convertedMusic } = state.result;
  const musicData = generatedMusic || convertedMusic;

  // 음악 데이터가 없는 경우 처리
  if (!musicData) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          표시할 음악 데이터가 없습니다.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
          startIcon={<Home />}
        >
          홈으로 돌아가기
        </Button>
      </Container>
    );
  }

  // 장르 정보 가져오기
  const getGenreInfo = (genreId) => {
    return GENRE_OPTIONS.find(g => g.id === genreId) || { label: genreId, color: '#6366F1' };
  };

  // 분위기 정보 가져오기
  const getMoodInfo = (moodId) => {
    return MOOD_OPTIONS.find(m => m.id === moodId) || { label: moodId, emoji: '🎵' };
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 이벤트 핸들러들
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    actions.setPlaying(!isPlaying);
  };

  const handleTimeChange = (event, newValue) => {
    setCurrentTime(newValue);
    actions.updateCurrentTime(newValue);
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
  };

  const handleDownload = () => {
    // 실제로는 서버에서 파일을 다운로드
    actions.addNotification({
      type: 'success',
      message: '다운로드가 시작되었습니다.'
    });
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    actions.addNotification({
      type: 'info',
      message: isFavorite ? '즐겨찾기에서 제거되었습니다.' : '즐겨찾기에 추가되었습니다.'
    });
  };

  const handleAddToLibrary = () => {
    actions.addToLibrary(musicData);
    actions.addNotification({
      type: 'success',
      message: '라이브러리에 추가되었습니다.'
    });
  };

  const handleRegenerate = () => {
    if (generatedMusic) {
      navigate('/generate');
    } else {
      navigate('/convert');
    }
  };

  const handleShare = () => {
    actions.addNotification({
      type: 'info',
      message: '공유 기능은 추후 업데이트될 예정입니다.'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 성공 헤더 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <CheckCircle 
          sx={{ 
            fontSize: '4rem', 
            color: 'success.main', 
            mb: 2 
          }} 
        />
        <Typography 
          variant="h3" 
          component="h1"
          sx={{ 
            fontWeight: 700,
            color: 'success.main',
            mb: 1
          }}
        >
          {generatedMusic ? '생성 완료!' : '변환 완료!'}
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
        >
          AI가 {generatedMusic ? '새로운 음악을 생성' : '음악을 변환'}했습니다
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* 메인 컨텐츠 */}
        <Grid item xs={12} lg={8}>
          {/* 음악 플레이어 */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 4,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              mb: 3,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: 'white'
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                🎵 {musicData.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {musicData.description || '음악이 성공적으로 생성되었습니다.'}
              </Typography>
            </Box>

            {/* 재생 컨트롤 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton 
                onClick={handlePlayPause}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
                size="large"
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              
              <Box sx={{ flexGrow: 1 }}>
                <Slider
                  value={currentTime}
                  onChange={handleTimeChange}
                  min={0}
                  max={duration}
                  sx={{
                    color: 'white',
                    '& .MuiSlider-track': { bgcolor: 'white' },
                    '& .MuiSlider-thumb': { 
                      bgcolor: 'white',
                      '&:hover': { boxShadow: '0px 0px 0px 8px rgba(255,255,255,0.16)' }
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {formatTime(currentTime)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {formatTime(duration)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                <VolumeUp sx={{ opacity: 0.8 }} />
                <Slider
                  value={volume}
                  onChange={handleVolumeChange}
                  min={0}
                  max={100}
                  size="small"
                  sx={{
                    color: 'white',
                    '& .MuiSlider-track': { bgcolor: 'white' },
                    '& .MuiSlider-thumb': { bgcolor: 'white' }
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* 음악 정보 */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              🎼 음악 정보
            </Typography>
            
            <Grid container spacing={3}>
              {/* 장르 정보 */}
              {(musicData.genres || [musicData.targetGenre]).filter(Boolean).length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    장르
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(musicData.genres || [musicData.targetGenre]).filter(Boolean).map((genreId) => {
                      const genre = getGenreInfo(genreId);
                      return (
                        <Chip
                          key={genreId}
                          label={genre.label}
                          size="small"
                          sx={{
                            bgcolor: `${genre.color}20`,
                            color: genre.color,
                            border: `1px solid ${genre.color}40`
                          }}
                        />
                      );
                    })}
                  </Box>
                </Grid>
              )}

              {/* 분위기 정보 */}
              {musicData.moods && musicData.moods.length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    분위기
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {musicData.moods.map((moodId) => {
                      const mood = getMoodInfo(moodId);
                      return (
                        <Chip
                          key={moodId}
                          label={`${mood.emoji} ${mood.label}`}
                          size="small"
                          variant="outlined"
                        />
                      );
                    })}
                  </Box>
                </Grid>
              )}

              {/* 추가 정보 */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  길이
                </Typography>
                <Typography variant="body2">
                  {formatTime(musicData.duration || duration)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  생성 시간
                </Typography>
                <Typography variant="body2">
                  {new Date(musicData.createdAt).toLocaleString('ko-KR')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 사이드바 */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            {/* 액션 버튼들 */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 3
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                🎬 액션
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDownload}
                  size="large"
                  sx={{ 
                    bgcolor: 'success.main',
                    '&:hover': { bgcolor: 'success.dark' }
                  }}
                >
                  다운로드
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={isFavorite ? <Favorite /> : <FavoriteBorder />}
                  onClick={handleFavorite}
                  color={isFavorite ? 'error' : 'primary'}
                >
                  {isFavorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LibraryMusic />}
                  onClick={handleAddToLibrary}
                >
                  라이브러리에 추가
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={handleShare}
                >
                  공유하기
                </Button>
              </Box>
            </Paper>

            {/* 추가 액션 */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                🔄 다음 단계
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRegenerate}
                  color="secondary"
                >
                  다시 {generatedMusic ? '생성' : '변환'}하기
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LibraryMusic />}
                  onClick={() => navigate('/library')}
                >
                  라이브러리 보기
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={() => navigate('/')}
                >
                  홈으로 돌아가기
                </Button>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ResultPage; 