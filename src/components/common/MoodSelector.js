import React from 'react';
import { 
  Box, 
  Chip, 
  Typography, 
  Paper 
} from '@mui/material';
import { Tag } from '@mui/icons-material';

// 분위기 키워드 옵션 정의
const MOOD_OPTIONS = [
  { id: 'energetic', label: '신나는', emoji: '🎉', color: '#FF6B6B' },
  { id: 'calm', label: '차분한', emoji: '🧘', color: '#4ECDC4' },
  { id: 'dreamy', label: '몽환적인', emoji: '🌙', color: '#B19CD9' },
  { id: 'uplifting', label: '에너지틱', emoji: '⚡', color: '#FFB347' },
  { id: 'romantic', label: '로맨틱', emoji: '💕', color: '#FFB6C1' },
  { id: 'focused', label: '집중', emoji: '🎯', color: '#45B7D1' },
  { id: 'sad', label: '슬픈', emoji: '😢', color: '#87CEEB' },
  { id: 'hopeful', label: '희망적인', emoji: '🌅', color: '#96CEB4' },
  { id: 'tense', label: '긴장감', emoji: '⚡', color: '#FF7F7F' },
  { id: 'peaceful', label: '편안한', emoji: '🕊️', color: '#DDA0DD' },
  { id: 'mysterious', label: '신비로운', emoji: '🔮', color: '#9370DB' },
  { id: 'playful', label: '장난스러운', emoji: '🎪', color: '#F0E68C' },
  { id: 'nostalgic', label: '그리운', emoji: '🏛️', color: '#D2B48C' },
  { id: 'powerful', label: '파워풀한', emoji: '💪', color: '#DC143C' },
  { id: 'gentle', label: '부드러운', emoji: '🌸', color: '#FFC0CB' },
];

/**
 * 분위기 키워드 선택 컴포넌트
 * @param {Array} selectedMoods - 선택된 분위기 ID 배열
 * @param {Function} onMoodChange - 분위기 선택 변경 핸들러
 * @param {Number} maxSelection - 최대 선택 가능 개수 (기본값: 5)
 * @param {String} title - 섹션 제목
 */
const MoodSelector = ({ 
  selectedMoods = [], 
  onMoodChange, 
  maxSelection = 5,
  title = "분위기 키워드"
}) => {

  const handleMoodClick = (moodId) => {
    if (!onMoodChange) return;

    if (selectedMoods.includes(moodId)) {
      // 이미 선택된 분위기 제거
      onMoodChange(selectedMoods.filter(id => id !== moodId));
    } else {
      // 새 분위기 추가 (최대 선택 개수 확인)
      if (selectedMoods.length < maxSelection) {
        onMoodChange([...selectedMoods, moodId]);
      }
    }
  };

  const isMoodSelected = (moodId) => selectedMoods.includes(moodId);
  const isMaxSelectionReached = selectedMoods.length >= maxSelection;

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      {/* 섹션 헤더 */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tag sx={{ color: 'primary.main' }} />
        <Box>
          <Typography 
            variant="h6" 
            component="h3"
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
          >
            음악의 느낌과 분위기를 표현하는 키워드를 선택해주세요 ({selectedMoods.length}/{maxSelection})
          </Typography>
        </Box>
      </Box>

      {/* 분위기 칩 목록 */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1,
          alignItems: 'center'
        }}
      >
        {MOOD_OPTIONS.map((mood) => {
          const isSelected = isMoodSelected(mood.id);
          const isDisabled = !isSelected && isMaxSelectionReached;

          return (
            <Chip
              key={mood.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{mood.emoji}</span>
                  <span>#{mood.label}</span>
                </Box>
              }
              onClick={() => handleMoodClick(mood.id)}
              variant={isSelected ? 'filled' : 'outlined'}
              disabled={isDisabled}
              size="medium"
              sx={{
                height: 36,
                fontSize: '0.875rem',
                fontWeight: isSelected ? 600 : 400,
                borderWidth: 1.5,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                bgcolor: isSelected ? `${mood.color}15` : 'transparent',
                color: isSelected ? mood.color : 'text.secondary',
                borderColor: isSelected ? mood.color : 'divider',
                '&:hover': !isDisabled ? {
                  bgcolor: isSelected ? `${mood.color}25` : `${mood.color}08`,
                  borderColor: mood.color,
                  transform: 'scale(1.05)',
                  boxShadow: `0 2px 8px ${mood.color}40`,
                } : {},
                '&.Mui-disabled': {
                  opacity: 0.4,
                  cursor: 'not-allowed',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            />
          );
        })}
      </Box>

      {/* 선택된 분위기 요약 */}
      {selectedMoods.length > 0 && (
        <Box 
          sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: 'primary.50', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'primary.200'
          }}
        >
          <Typography 
            variant="body2" 
            color="primary.main" 
            sx={{ mb: 1, fontWeight: 500 }}
          >
            선택된 분위기: 
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            {selectedMoods.map(moodId => {
              const mood = MOOD_OPTIONS.find(m => m.id === moodId);
              return mood ? `${mood.emoji} ${mood.label}` : '';
            }).join(' · ')}
          </Typography>
          
          {/* 진행률 표시 */}
          <Box sx={{ mt: 1.5 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 0.5 
              }}
            >
              <Typography variant="caption" color="text.secondary">
                선택 진행률
              </Typography>
              <Typography variant="caption" color="primary.main" fontWeight={500}>
                {Math.round((selectedMoods.length / maxSelection) * 100)}%
              </Typography>
            </Box>
            <Box 
              sx={{ 
                width: '100%', 
                height: 4, 
                bgcolor: 'grey.200', 
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  width: `${(selectedMoods.length / maxSelection) * 100}%`, 
                  height: '100%', 
                  bgcolor: 'primary.main',
                  transition: 'width 0.3s ease',
                  borderRadius: 2
                }}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// 분위기 옵션을 외부에서 사용할 수 있도록 export
export { MOOD_OPTIONS };
export default MoodSelector; 