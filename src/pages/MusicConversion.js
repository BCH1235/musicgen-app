import React, { useState, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  LinearProgress,
  Slider,
  Chip
} from '@mui/material';
import {
  Transform,
  CloudUpload,
  PlayArrow,
  Delete,
  VolumeUp
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

import GenreSelector from '../components/common/GenreSelector';
import { useMusicContext } from '../context/MusicContext';

const MusicConversion = () => {
  const { state, actions } = useMusicContext();
  const [audioPreview, setAudioPreview] = useState(null);

  const {
    uploadedFile,
    targetGenre,
    conversionIntensity,
    isConverting,
    conversionProgress
  } = state.conversion;

  // 파일 드롭존 설정
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      actions.setUploadedFile(file);
      
      // 오디오 미리보기 URL 생성
      const audioUrl = URL.createObjectURL(file);
      setAudioPreview(audioUrl);
    }
  }, [actions]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isConverting
  });

  // 이벤트 핸들러들
  const handleRemoveFile = () => {
    actions.setUploadedFile(null);
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
      setAudioPreview(null);
    }
  };

  const handleGenreChange = (genres) => {
    actions.setTargetGenre(genres[0] || ''); // 단일 선택
  };

  const handleIntensityChange = (event, newValue) => {
    actions.setConversionIntensity(newValue);
  };

  const handleStartConversion = async () => {
    if (!uploadedFile || !targetGenre) {
      actions.addNotification({
        type: 'error',
        message: '파일과 변환할 장르를 선택해주세요.'
      });
      return;
    }

    try {
      actions.startConversion();
      
      // 시뮬레이션된 변환 과정
      await simulateConversionProcess();
      
      // 변환 완료 (더미 데이터)
      const convertedMusic = {
        id: Date.now(),
        title: `Converted_${uploadedFile.name}`,
        originalFile: uploadedFile.name,
        targetGenre: targetGenre,
        intensity: conversionIntensity,
        audioUrl: '/path/to/converted/audio.mp3',
        createdAt: new Date().toISOString()
      };

      actions.completeConversion(convertedMusic);
      actions.addNotification({
        type: 'success',
        message: '음악 변환이 완료되었습니다!'
      });

    } catch (error) {
      actions.setError('음악 변환 중 오류가 발생했습니다.');
    }
  };

  const simulateConversionProcess = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        actions.updateConversionProgress?.(Math.min(progress, 95));
        
        if (progress >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            actions.updateConversionProgress?.(100);
            resolve();
          }, 500);
        }
      }, 400);
    });
  };

  const isFormValid = uploadedFile && targetGenre;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <Transform 
            sx={{ 
              fontSize: '3rem', 
              color: 'secondary.main', 
              mr: 1 
            }} 
          />
          <Typography 
            variant="h3" 
            component="h1"
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #8B5CF6 30%, #06B6D4 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            음악 스타일 변환
          </Typography>
        </Box>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}
        >
          기존 음악을 새로운 장르와 스타일로 변환해보세요
        </Typography>
      </Box>

      {/* 변환 진행률 표시 */}
      {isConverting && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'secondary.50', border: '1px solid', borderColor: 'secondary.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Transform sx={{ color: 'secondary.main', mr: 1, animation: 'spin 2s linear infinite' }} />
            <Typography variant="h6" color="secondary.main" fontWeight={600}>
              AI가 음악을 변환하고 있습니다...
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={conversionProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'secondary.100',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: 'secondary.main'
              }
            }} 
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {conversionProgress?.toFixed(0) || 0}% 완료 - 예상 소요 시간: 약 45초
          </Typography>
        </Paper>
      )}

      <Grid container spacing={4}>
        {/* 왼쪽 컬럼 */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 파일 업로드 */}
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
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                📁 원본 음악 업로드
              </Typography>

              {!uploadedFile ? (
                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: isDragActive ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50'
                    }
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUpload sx={{ fontSize: '3rem', color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" color="primary.main" sx={{ mb: 1 }}>
                    {isDragActive ? '파일을 여기에 놓아주세요' : '파일을 드래그하거나 클릭하여 업로드'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    지원 형식: MP3, WAV, M4A, FLAC (최대 10MB)
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {uploadedFile.name}
                    </Typography>
                    <Button
                      startIcon={<Delete />}
                      onClick={handleRemoveFile}
                      color="error"
                      size="small"
                      disabled={isConverting}
                    >
                      제거
                    </Button>
                  </Box>
                  
                  {audioPreview && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <VolumeUp sx={{ color: 'primary.main' }} />
                      <audio 
                        controls 
                        style={{ width: '100%' }}
                        disabled={isConverting}
                      >
                        <source src={audioPreview} />
                        브라우저가 오디오를 지원하지 않습니다.
                      </audio>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>

            {/* 변환할 스타일 선택 */}
            <GenreSelector
              selectedGenres={targetGenre ? [targetGenre] : []}
              onGenreChange={handleGenreChange}
              multiSelect={false}
              maxSelection={1}
              title="🎯 변환할 스타일 선택"
            />
          </Box>
        </Grid>

        {/* 오른쪽 컬럼 */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            {/* 변환 강도 설정 */}
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
                🎚️ 변환 강도
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                원곡의 특성을 얼마나 유지할지 조정합니다
              </Typography>
              
              <Slider
                value={conversionIntensity}
                onChange={handleIntensityChange}
                min={1}
                max={5}
                step={1}
                marks={[
                  { value: 1, label: '약간' },
                  { value: 3, label: '보통' },
                  { value: 5, label: '강하게' }
                ]}
                disabled={isConverting}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Chip
                    key={i}
                    label={i + 1}
                    variant={conversionIntensity === i + 1 ? 'filled' : 'outlined'}
                    color={conversionIntensity === i + 1 ? 'secondary' : 'default'}
                    size="small"
                  />
                ))}
              </Box>
            </Paper>

            {/* 변환 버튼 */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleStartConversion}
              disabled={!isFormValid || isConverting}
              startIcon={<Transform />}
              sx={{
                height: 56,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                bgcolor: 'secondary.main',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                '&:hover': {
                  bgcolor: 'secondary.dark',
                  boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  bgcolor: 'grey.300',
                  color: 'grey.500',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {isConverting ? '변환 중...' : '🔄 변환 시작하기'}
            </Button>

            {/* 폼 유효성 안내 */}
            {!isFormValid && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                음악 파일과 변환할 장르를 선택해주세요.
              </Alert>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MusicConversion; 