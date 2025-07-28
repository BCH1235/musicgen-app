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
  VolumeUp,
  BookmarkBorder
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useMusicContext } from '../context/MusicContext';
import { GENRE_OPTIONS } from '../components/common/GenreSelector';
import { MOOD_OPTIONS } from '../components/common/MoodSelector';
import AudioWaveform from '../components/common/AudioWaveform';

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
  
  // 변환 결과인지 생성 결과인지 구분
  const isConversion = !!convertedMusic;

  // 검은색 배경에 에메랄드 테마
  const colors = {
    background: '#0A0A0A',         // 검은색 배경
    cardBg: '#1A1A1A',            // 어두운 카드 배경
    primary: '#50E3C2',           // 에메랄드 (Emerald)
    secondary: '#40D9B8',         // 연한 에메랄드
    accent: '#2DD4BF',            // 터콰이즈 (Teal)
    text: '#FFFFFF',              // 흰색 텍스트
    textLight: '#CCCCCC',         // 연한 회색 텍스트
    border: '#333333',            // 어두운 테두리
    shadow: 'rgba(80, 227, 194, 0.3)' // 에메랄드 그림자
  };

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

  const handleSaveToLibrary = () => {
    actions.addToLibrary(musicData);
    actions.addNotification({
      type: 'success',
      message: '라이브러리에 추가되었습니다.'
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* 페이지 헤더 - 생성/변환에 따라 다른 텍스트 */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: '4rem', color: colors.accent, mb: 2 }} />
          <Typography 
            variant="h3" 
            component="h1"
            sx={{ 
              fontWeight: 600, 
              color: colors.text,
              mb: 1,
              letterSpacing: '-0.02em'
            }}
          >
            {isConversion ? '음악 변환 완료' : '음악 생성 완료'}
          </Typography>
          <Typography variant="h6" color={colors.textLight} sx={{ fontWeight: 400, opacity: 0.8 }}>
            {isConversion ? '음악이 성공적으로 변환되었습니다' : '새로운 음악이 성공적으로 생성되었습니다'}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* 메인 콘텐츠 */}
          <Grid item xs={12} lg={9}>
            {/* 음악 플레이어 */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                mb: 3,
                bgcolor: colors.cardBg,
                color: colors.text
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={600} sx={{ mb: 1, color: colors.text }}>
                  {musicData.title}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, color: colors.textLight }}>
                  {isConversion 
                    ? `${musicData.originalFile}을(를) ${musicData.targetGenre} 스타일로 변환했습니다.`
                    : '음악이 성공적으로 생성되었습니다.'
                  }
                </Typography>
              </Box>

              {/* 오디오 웨이브폼 */}
              <Box sx={{ mb: 3 }}>
                <AudioWaveform 
                  isPlaying={isPlaying}
                  progress={(currentTime / duration) * 100}
                  height={100}
                  barCount={80}
                  color={colors.accent}
                />
              </Box>

              {/* 재생 컨트롤 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton 
                  onClick={handlePlayPause}
                  sx={{ 
                    bgcolor: colors.accent, 
                    color: colors.background,
                    '&:hover': { bgcolor: colors.text }
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
                      color: colors.accent,
                      '& .MuiSlider-track': { bgcolor: colors.accent },
                      '& .MuiSlider-thumb': { 
                        bgcolor: colors.accent,
                        '&:hover': { boxShadow: `0px 0px 0px 8px ${colors.shadow}` }
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" sx={{ opacity: 0.8, color: colors.textLight }}>
                      {formatTime(currentTime)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, color: colors.textLight }}>
                      {formatTime(duration)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                  <VolumeUp sx={{ opacity: 0.8, color: colors.textLight }} />
                  <Slider
                    value={volume}
                    onChange={handleVolumeChange}
                    min={0}
                    max={100}
                    size="small"
                    sx={{
                      color: colors.accent,
                      '& .MuiSlider-track': { bgcolor: colors.accent },
                      '& .MuiSlider-thumb': { bgcolor: colors.accent }
                    }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* 음악 정보 - 변환/생성에 따라 다른 정보 표시 */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                bgcolor: colors.cardBg
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3, color: colors.text }}>
                {isConversion ? '변환 정보' : '음악 정보'}
              </Typography>
              
              <Grid container spacing={3}>
                {/* 장르 정보 */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, color: colors.textLight }}>
                    {isConversion ? '변환된 장르' : '장르'}
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
                            bgcolor: colors.cardBg,
                            color: colors.primary,
                            border: `1px solid ${colors.primary}`,
                            fontWeight: 600
                          }}
                        />
                      );
                    })}
                  </Box>
                </Grid>

                {/* 변환 강도 (변환일 때만) */}
                {isConversion && musicData.intensity && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, color: colors.textLight }}>
                      변환 강도
                    </Typography>
                    <Typography variant="body2" color={colors.text}>
                      {musicData.intensity}/5
                    </Typography>
                  </Grid>
                )}

                {/* 분위기 정보 (생성일 때만) */}
                {!isConversion && musicData.moods && musicData.moods.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, color: colors.textLight }}>
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
                            sx={{
                              bgcolor: colors.cardBg,
                              color: colors.primary,
                              border: `1px solid ${colors.primary}`,
                              fontWeight: 600
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Grid>
                )}

                {/* 추가 정보 */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, color: colors.textLight }}>
                    길이
                  </Typography>
                  <Typography variant="body2" color={colors.text}>
                    {formatTime(musicData.duration || duration)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, color: colors.textLight }}>
                    생성 시간
                  </Typography>
                  <Typography variant="body2" color={colors.text}>
                    {new Date(musicData.createdAt).toLocaleString('ko-KR')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* 사이드바 - 버튼 텍스트도 구분 */}
          <Grid item xs={12} lg={3}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 2,
                  bgcolor: colors.cardBg,
                  minHeight: '600px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 3,
                  flex: 1
                }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<BookmarkBorder />}
                    onClick={handleSaveToLibrary}
                    sx={{
                      bgcolor: colors.accent,
                      color: colors.background,
                      fontWeight: 600,
                      textTransform: 'none',
                      py: 2,
                      '&:hover': {
                        bgcolor: colors.text
                      }
                    }}
                  >
                    라이브러리에 저장
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleDownload}
                    sx={{
                      color: colors.text,
                      borderColor: colors.border,
                      fontWeight: 600,
                      textTransform: 'none',
                      py: 2,
                      '&:hover': {
                        bgcolor: colors.accent,
                        borderColor: colors.accent,
                        color: colors.background
                      }
                    }}
                  >
                    다운로드
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={handleShare}
                    sx={{
                      color: colors.text,
                      borderColor: colors.border,
                      fontWeight: 600,
                      textTransform: 'none',
                      py: 2,
                      '&:hover': {
                        bgcolor: colors.accent,
                        borderColor: colors.accent,
                        color: colors.background
                      }
                    }}
                  >
                    공유하기
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRegenerate}
                    sx={{
                      color: colors.text,
                      borderColor: colors.border,
                      fontWeight: 600,
                      textTransform: 'none',
                      py: 2,
                      '&:hover': {
                        bgcolor: colors.accent,
                        borderColor: colors.accent,
                        color: colors.background
                      }
                    }}
                  >
                    다시 {isConversion ? '변환' : '생성'}하기
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LibraryMusic />}
                    onClick={() => navigate('/library')}
                    sx={{
                      color: colors.text,
                      borderColor: colors.border,
                      fontWeight: 600,
                      textTransform: 'none',
                      py: 2,
                      '&:hover': {
                        bgcolor: colors.accent,
                        borderColor: colors.accent,
                        color: colors.background
                      }
                    }}
                  >
                    라이브러리 보기
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Home />}
                    onClick={() => navigate('/')}
                    sx={{
                      color: colors.text,
                      borderColor: colors.border,
                      fontWeight: 600,
                      textTransform: 'none',
                      py: 2,
                      '&:hover': {
                        bgcolor: colors.accent,
                        borderColor: colors.accent,
                        color: colors.background
                      }
                    }}
                  >
                    홈으로 돌아가기
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ResultPage; 