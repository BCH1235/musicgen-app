/**
 * AI 음악 생성 및 변환 API 서비스
 * 백엔드 Flask API와의 통신을 담당하는 모듈
 */

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 30000; // 30초

/**
 * HTTP 요청을 위한 기본 fetch wrapper
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} options - fetch 옵션
 * @returns {Promise} API 응답
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    timeout: API_TIMEOUT,
    ...options,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
    }
    throw error;
  }
}

/**
 * FormData를 사용하는 파일 업로드 요청
 * @param {string} endpoint - API 엔드포인트
 * @param {FormData} formData - 업로드할 FormData
 * @param {Function} onProgress - 진행률 콜백 (선택사항)
 * @returns {Promise} API 응답
 */
async function uploadRequest(endpoint, formData, onProgress) {
  const url = `${API_BASE_URL}${endpoint}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // 진행률 추적
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (error) {
          reject(new Error('응답 파싱 오류'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.message || `HTTP ${xhr.status}: ${xhr.statusText}`));
        } catch (error) {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = function() {
      reject(new Error('네트워크 오류가 발생했습니다.'));
    };

    xhr.ontimeout = function() {
      reject(new Error('요청 시간이 초과되었습니다.'));
    };

    xhr.timeout = API_TIMEOUT;
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

// ===========================================
// 음악 생성 API
// ===========================================

/**
 * 새로운 음악 생성 요청
 * @param {Object} generationParams - 생성 파라미터
 * @param {Array} generationParams.genres - 선택된 장르 배열
 * @param {Array} generationParams.moods - 선택된 분위기 배열
 * @param {string} generationParams.description - 상세 설명
 * @param {number} generationParams.duration - 음악 길이 (초)
 * @param {Function} onProgress - 진행률 콜백
 * @returns {Promise} 생성된 음악 정보
 */
export async function generateMusic(generationParams, onProgress) {
  try {
    // 1단계: 생성 작업 시작
    const startResponse = await apiRequest('/music/generate', {
      method: 'POST',
      body: JSON.stringify(generationParams),
    });

    const { taskId } = startResponse;

    // 2단계: 진행률 폴링
    return await pollTaskProgress(taskId, onProgress);

  } catch (error) {
    console.error('음악 생성 오류:', error);
    throw error;
  }
}

/**
 * 음악 생성 진행률 확인
 * @param {string} taskId - 작업 ID
 * @returns {Promise} 진행률 정보
 */
export async function getGenerationStatus(taskId) {
  return await apiRequest(`/music/generate/status/${taskId}`);
}

// ===========================================
// 음악 변환 API
// ===========================================

/**
 * 음악 스타일 변환 요청
 * @param {Object} conversionParams - 변환 파라미터
 * @param {File} conversionParams.audioFile - 원본 오디오 파일
 * @param {string} conversionParams.targetGenre - 변환할 장르
 * @param {number} conversionParams.intensity - 변환 강도 (1-5)
 * @param {Function} onProgress - 진행률 콜백
 * @returns {Promise} 변환된 음악 정보
 */
export async function convertMusic(conversionParams, onProgress) {
  try {
    const formData = new FormData();
    formData.append('audio_file', conversionParams.audioFile);
    formData.append('target_genre', conversionParams.targetGenre);
    formData.append('intensity', conversionParams.intensity.toString());

    // 1단계: 파일 업로드 및 변환 작업 시작
    const uploadProgress = (progress) => {
      if (onProgress) onProgress(progress * 0.3); // 업로드는 전체 진행률의 30%
    };

    const startResponse = await uploadRequest('/music/convert', formData, uploadProgress);
    const { taskId } = startResponse;

    // 2단계: 변환 진행률 폴링
    const conversionProgress = (progress) => {
      if (onProgress) onProgress(30 + (progress * 0.7)); // 변환은 나머지 70%
    };

    return await pollTaskProgress(taskId, conversionProgress);

  } catch (error) {
    console.error('음악 변환 오류:', error);
    throw error;
  }
}

/**
 * 음악 변환 진행률 확인
 * @param {string} taskId - 작업 ID
 * @returns {Promise} 진행률 정보
 */
export async function getConversionStatus(taskId) {
  return await apiRequest(`/music/convert/status/${taskId}`);
}

// ===========================================
// 공통 유틸리티
// ===========================================

/**
 * 작업 진행률을 폴링하여 완료까지 대기
 * @param {string} taskId - 작업 ID
 * @param {Function} onProgress - 진행률 콜백
 * @returns {Promise} 최종 결과
 */
async function pollTaskProgress(taskId, onProgress) {
  const POLL_INTERVAL = 1000; // 1초마다 확인
  const MAX_ATTEMPTS = 300; // 최대 5분 대기

  let attempts = 0;

  return new Promise((resolve, reject) => {
    const checkProgress = async () => {
      try {
        attempts++;
        
        if (attempts > MAX_ATTEMPTS) {
          reject(new Error('작업 시간이 초과되었습니다.'));
          return;
        }

        const statusResponse = await apiRequest(`/music/task/status/${taskId}`);
        const { status, progress, result, error } = statusResponse;

        // 진행률 업데이트
        if (onProgress && typeof progress === 'number') {
          onProgress(progress);
        }

        switch (status) {
          case 'completed':
            resolve(result);
            break;
          
          case 'failed':
            reject(new Error(error || '작업이 실패했습니다.'));
            break;
          
          case 'in_progress':
          case 'pending':
            setTimeout(checkProgress, POLL_INTERVAL);
            break;
          
          default:
            reject(new Error(`알 수 없는 작업 상태: ${status}`));
            break;
        }

      } catch (error) {
        reject(error);
      }
    };

    checkProgress();
  });
}

// ===========================================
// 라이브러리 관리 API
// ===========================================

/**
 * 사용자 음악 라이브러리 조회
 * @param {Object} filters - 필터 옵션
 * @param {string} filters.sortBy - 정렬 기준
 * @param {string} filters.filterBy - 필터 기준
 * @param {number} filters.page - 페이지 번호
 * @param {number} filters.limit - 페이지당 항목 수
 * @returns {Promise} 음악 목록
 */
export async function getMusicLibrary(filters = {}) {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const endpoint = queryString ? `/music/library?${queryString}` : '/music/library';

  return await apiRequest(endpoint);
}

/**
 * 음악을 라이브러리에 추가
 * @param {string} musicId - 음악 ID
 * @returns {Promise} 결과
 */
export async function addToLibrary(musicId) {
  return await apiRequest('/music/library', {
    method: 'POST',
    body: JSON.stringify({ musicId }),
  });
}

/**
 * 라이브러리에서 음악 제거
 * @param {string} musicId - 음악 ID
 * @returns {Promise} 결과
 */
export async function removeFromLibrary(musicId) {
  return await apiRequest(`/music/library/${musicId}`, {
    method: 'DELETE',
  });
}

// ===========================================
// 파일 다운로드 API
// ===========================================

/**
 * 음악 파일 다운로드
 * @param {string} musicId - 음악 ID
 * @param {string} filename - 저장할 파일명
 * @returns {Promise} 다운로드 시작
 */
export async function downloadMusic(musicId, filename) {
  const url = `${API_BASE_URL}/music/download/${musicId}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`다운로드 실패: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // 브라우저에서 파일 다운로드 시작
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || `music_${musicId}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

  } catch (error) {
    console.error('다운로드 오류:', error);
    throw error;
  }
}

// ===========================================
// 시스템 정보 API
// ===========================================

/**
 * API 서버 상태 확인
 * @returns {Promise} 서버 상태
 */
export async function getServerStatus() {
  return await apiRequest('/health');
}

/**
 * 지원되는 장르 목록 조회
 * @returns {Promise} 장르 목록
 */
export async function getSupportedGenres() {
  return await apiRequest('/music/genres');
}

/**
 * 지원되는 분위기 목록 조회
 * @returns {Promise} 분위기 목록
 */
export async function getSupportedMoods() {
  return await apiRequest('/music/moods');
}

// 기본 export
export default {
  generateMusic,
  getGenerationStatus,
  convertMusic,
  getConversionStatus,
  getMusicLibrary,
  addToLibrary,
  removeFromLibrary,
  downloadMusic,
  getServerStatus,
  getSupportedGenres,
  getSupportedMoods,
}; 