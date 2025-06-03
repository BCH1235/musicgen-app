import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Collapse,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  MusicNote,
  PlayArrow,
  Settings,
  ExpandMore,
  ExpandLess,
  AutoAwesome
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// 컴포넌트 import
import GenreSelector from '../components/common/GenreSelector';
import MoodSelector from '../components/common/MoodSelector';
import { useMusicContext } from '../context/MusicContext';

const MusicGeneration = () => {
  const navigate = useNavigate();
  const { state, actions } = useMusicContext();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [customDuration, setCustomDuration] = useState(120);

  // 로컬 상태에서 Context 상태 가져오기
  const {
    selectedGenres,
    selectedMoods,
    description,
    duration,
    isGenerating,
    generationProgress
  } = state.generation;

  // 음악 길이 옵션
  const durationOptions = [
    { value: 30, label: '30초' },
    { value: 60, label: '1분' },
    { value: 120, label: '2분' },
    { value: 300, label: '5분' },
    { value: 'custom', label: '사용자 정의' }
  ];

  // 폼 유효성 검증
  const isFormValid = selectedGenres.length > 0 || selectedMoods.length > 0;

  // 이벤트 핸들러들
  const handleGenreChange = (genres) => {
    actions.setSelectedGenres(genres);
  };

  const handleMoodChange = (moods) => {
    actions.setSelectedMoods(moods);
  };

  const handleDescriptionChange = (event) => {
    actions.setDescription(event.target.value);
  };

  const handleDurationChange = (event) => {
    const value = event.target.value;
    if (value === 'custom') {
      actions.setDuration(customDuration);
    } else {
      actions.setDuration(parseInt(value));
    }
  };

  const handleCustomDurationChange = (event, newValue) => {
    setCustomDuration(newValue);
    if (duration === 'custom' || typeof duration === 'string') {
      actions.setDuration(newValue);
    }
  };

  // 음악 생성 시작
  const handleGenerateMusic = async () => {
    if (!isFormValid) {
      actions.addNotification({
        type: 'error',
        message: '장르 또는 분위기를 최소 하나 이상 선택해주세요.'
      });
      return;
    }

    try {
      // 생성 시작
      actions.startGeneration();

      // 시뮬레이션된 생성 과정 (실제로는 API 호출)
      await simulateGenerationProcess();

      // 생성 완료 (더미 데이터)
      const generatedMusic = {
        id: Date.now(),
        title: `AI_Generated_${Date.now()}`,
        genres: selectedGenres,
        moods: selectedMoods,
        description: description,
        duration: duration,
        audioUrl: '/path/to/generated/audio.mp3', // 실제로는 API에서 받음
        createdAt: new Date().toISOString()
      };

      actions.completeGeneration(generatedMusic);
      actions.addNotification({
        type: 'success',
        message: '음악이 성공적으로 생성되었습니다!'
      });

      // 결과 페이지로 이동
      navigate('/result');

    } catch (error) {
      actions.setError('음악 생성 중 오류가 발생했습니다.');
      actions.addNotification({
        type: 'error',
        message: '음악 생성에 실패했습니다. 다시 시도해주세요.'
      });
    }
  };

  // 생성 과정 시뮬레이션 함수
  const simulateGenerationProcess = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        actions.updateGenerationProgress(Math.min(progress, 95));
        
        if (progress >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            actions.updateGenerationProgress(100);
            resolve();
          }, 500);
        }
      }, 300);
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <MusicNote 
            sx={{ 
              fontSize: '3rem', 
              color: 'primary.main', 
              mr: 1 
            }} 
          />
          <Typography 
            variant="h3" 
            component="h1"
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #6366F1 30%, #8B5CF6 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            새로운 음악 생성
          </Typography>
        </Box>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}
        >
          AI를 활용하여 원하는 장르와 분위기의 배경음악을 생성해보세요
        </Typography>
      </Box>

      {/* 생성 진행률 표시 */}
      {isGenerating && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AutoAwesome sx={{ color: 'primary.main', mr: 1, animation: 'spin 2s linear infinite' }} />
            <Typography variant="h6" color="primary.main" fontWeight={600}>
              AI가 음악을 생성하고 있습니다...
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={generationProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'primary.100',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              }
            }} 
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {generationProgress.toFixed(0)}% 완료 - 예상 소요 시간: 약 30초
          </Typography>
        </Paper>
      )}

      <Grid container spacing={4}>
        {/* 왼쪽 컬럼 */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 장르 선택 */}
            <GenreSelector
              selectedGenres={selectedGenres}
              onGenreChange={handleGenreChange}
              maxSelection={3}
              title="🎼 장르 선택"
            />

            {/* 분위기 키워드 선택 */}
            <MoodSelector
              selectedMoods={selectedMoods}
              onMoodChange={handleMoodChange}
              maxSelection={5}
              title="🎭 분위기 키워드"
            />

            {/* 상세 설명 입력 */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography 
                variant="h6" 
                component="h3"
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                ✍️ 상세 설명 (선택사항)
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                원하는 음악에 대해 자세히 설명해주시면 더 정확한 음악을 생성할 수 있습니다
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={description}
                onChange={handleDescriptionChange}
                placeholder="예: 카페에서 공부할 때 듣기 좋은 차분한 피아노 음악을 만들어주세요. 너무 졸리지 않으면서도 집중하기 좋은 리듬이었으면 좋겠습니다."
                variant="outlined"
                disabled={isGenerating}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Paper>
          </Box>
        </Grid>

        {/* 오른쪽 컬럼 */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            {/* 음악 길이 설정 */}
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
              <Typography 
                variant="h6" 
                component="h3"
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 2
                }}
              >
                ⏱️ 음악 길이
              </Typography>
              <FormControl component="fieldset" fullWidth disabled={isGenerating}>
                <RadioGroup
                  value={duration === customDuration && typeof duration === 'number' ? 'custom' : duration}
                  onChange={handleDurationChange}
                >
                  {durationOptions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={option.label}
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              {/* 사용자 정의 길이 슬라이더 */}
              {(duration === 'custom' || typeof duration === 'string') && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    사용자 정의: {Math.floor(customDuration / 60)}분 {customDuration % 60}초
                  </Typography>
                  <Slider
                    value={customDuration}
                    onChange={handleCustomDurationChange}
                    min={15}
                    max={600}
                    step={15}
                    disabled={isGenerating}
                    marks={[
                      { value: 30, label: '30초' },
                      { value: 120, label: '2분' },
                      { value: 300, label: '5분' },
                      { value: 600, label: '10분' },
                    ]}
                    sx={{ mt: 2 }}
                  />
                </Box>
              )}
            </Paper>

            {/* 고급 설정 */}
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
              <Button
                fullWidth
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                startIcon={<Settings />}
                endIcon={showAdvancedSettings ? <ExpandLess /> : <ExpandMore />}
                variant="outlined"
                disabled={isGenerating}
                sx={{ mb: 2 }}
              >
                고급 설정
              </Button>
              
              <Collapse in={showAdvancedSettings}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  추후 업데이트에서 템포, 악기, 구조 등의 세부 설정이 추가될 예정입니다.
                </Alert>
              </Collapse>
            </Paper>

            {/* 생성 버튼 */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleGenerateMusic}
              disabled={!isFormValid || isGenerating}
              startIcon={isGenerating ? <AutoAwesome className="spin" /> : <PlayArrow />}
              sx={{
                height: 56,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  bgcolor: 'grey.300',
                  color: 'grey.500',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {isGenerating ? '생성 중...' : '🎵 음악 생성하기'}
            </Button>

            {/* 폼 유효성 안내 */}
            {!isFormValid && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                장르 또는 분위기를 최소 하나 이상 선택해주세요.
              </Alert>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 2s linear infinite;
        }
      `}</style>
    </Container>
  );
};

export default MusicGeneration; 