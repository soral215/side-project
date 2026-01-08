'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@side-project/design-system';
import { useAuthStore } from '../../src/stores/authStore';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { useToast } from '../../src/contexts/ToastContext';
import { ModelViewer } from '../../src/components/ModelViewer';
import { useModel3DJobStore, type Model3DJob as StoredJob } from '../../src/stores/model3dJobStore';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export default function Model3DPage() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuthStore();
  const { showError, showSuccess, showInfo } = useToast();

  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [texturePrompt, setTexturePrompt] = useState('');
  const [textureImage, setTextureImage] = useState<File | null>(null);
  const [enablePbr, setEnablePbr] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [job, setJob] = useState<StoredJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const upsertJob = useModel3DJobStore((s) => s.upsertJob);
  const jobsMap = useModel3DJobStore((s) => s.jobs);

  const jobList = useMemo(() => {
    return Object.values(jobsMap).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [jobsMap]);

  const timeAgo = (iso: string) => {
    const t = new Date(iso).getTime();
    const diffMs = Date.now() - t;
    if (!Number.isFinite(diffMs) || diffMs < 0) return '방금 전';
    const sec = Math.floor(diffMs / 1000);
    if (sec < 5) return '방금 전';
    if (sec < 60) return `${sec}초 전`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const day = Math.floor(hr / 24);
    return `${day}일 전`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) router.push('/login');
  }, [mounted, isAuthenticated, router]);

  const canSubmit = useMemo(() => files.length > 0 && !!token && !isSubmitting, [files.length, token, isSubmitting]);

  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const onlyImages = selected.filter((f) => f.type.startsWith('image/'));
    if (onlyImages.length !== selected.length) {
      showError('이미지 파일만 선택할 수 있어요.');
    }

    // Photogrammetry(권장 20장+)를 위해 넉넉히 받되, 서버에서 provider별로 사용량을 결정합니다.
    const limited = onlyImages.slice(0, 60);
    if (onlyImages.length > 60) {
      showInfo('최대 60장까지 업로드할 수 있어요. 앞의 60장만 사용합니다.');
    }

    setFiles(limited);
  };

  const handlePickTextureImage = () => {
    const el = document.getElementById('textureImageInput') as HTMLInputElement | null;
    el?.click();
  };

  const handleTextureImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      showError('텍스처 가이드도 이미지 파일만 가능해요.');
      return;
    }
    setTextureImage(f);
  };

  const fetchMyJobs = async () => {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/api/3d/jobs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || '작업 목록을 불러오는데 실패했습니다.');
      }

      const jobs = (json.data?.jobs || []) as StoredJob[];
      jobs.forEach((j) => upsertJob(j));
      if (jobs.length > 0 && !job) {
        setJob(jobs[0]);
      }
      showInfo(`과거 작업 ${jobs.length}개를 불러왔어요.`);
    } catch (err) {
      showError(err instanceof Error ? err.message : '작업 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 로그인 후 1회: 서버에서 내 작업 히스토리 로드
  useEffect(() => {
    if (!mounted || !isAuthenticated || !token) return;
    fetchMyJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, token]);

  const createJob = async () => {
    if (!token) return;
    if (!files.length) {
      showError('이미지를 1장 이상 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setJob(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('images', f));
      formData.append('enablePbr', String(enablePbr));

      const promptTrimmed = texturePrompt.trim();
      if (promptTrimmed && textureImage) {
        // Meshy 문서: 둘 다 주면 prompt가 우선이지만, UX는 택1로 강제
        showInfo('텍스처 프롬프트/텍스처 이미지 중 하나만 사용할 수 있어요. 프롬프트를 우선으로 전송합니다.');
      }
      if (promptTrimmed) {
        formData.append('texturePrompt', promptTrimmed);
      } else if (textureImage) {
        formData.append('textureImage', textureImage);
      }

      const res = await fetch(`${API_URL}/api/3d/jobs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || '3D 변환 작업 생성에 실패했습니다.');
      }

      const created = json.data.job as StoredJob;
      setJob(created);
      upsertJob(created);
      showSuccess('3D 변환 작업을 시작했어요. 잠시만 기다려주세요.');
    } catch (err) {
      showError(err instanceof Error ? err.message : '3D 변환 작업 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchJob = async (jobId: string) => {
    if (!token) return null;
    const res = await fetch(`${API_URL}/api/3d/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || '작업 상태 조회에 실패했습니다.');
    }
    return json.data.job as StoredJob;
  };

  useEffect(() => {
    if (!job) return;
    if (job.status === 'SUCCEEDED' || job.status === 'FAILED') {
      setIsPolling(false);
      return;
    }

    let cancelled = false;
    setIsPolling(true);

    const intervalId = window.setInterval(async () => {
      try {
        const next = await fetchJob(job.id);
        if (!next || cancelled) return;
        setJob(next);
        upsertJob(next);
        if (next.status === 'SUCCEEDED' || next.status === 'FAILED') {
          setIsPolling(false);
          window.clearInterval(intervalId);
        }
      } catch {
        // 폴링 중 일시적 에러는 무시(다음 주기에 재시도)
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      setIsPolling(false);
    };
  }, [job?.id, job?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !isAuthenticated) return null;

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">2D → 3D 변환</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              사진을 1장(또는 여러 장) 업로드하면 3D 모델로 변환해서 드래그로 돌려볼 수 있어요.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.name} ({user.email})
              </span>
            )}
            <Button onClick={() => router.push('/')} variant="secondary" size="sm">
              홈
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="elevated" padding="lg" className="dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">이미지 업로드</h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="hidden"
            />

            <input
              id="textureImageInput"
              type="file"
              accept="image/*"
              onChange={handleTextureImageChange}
              className="hidden"
            />

            <div className="flex items-center gap-2 mb-4">
              <Button onClick={handlePickFiles} variant="secondary" size="sm">
                이미지 선택 (최대 60장)
              </Button>
              <Button onClick={createJob} disabled={!canSubmit} isLoading={isSubmitting} size="sm">
                {isSubmitting ? '요청 중...' : '3D 변환 시작'}
              </Button>
              <Button
                onClick={fetchMyJobs}
                variant="secondary"
                size="sm"
                isLoading={isLoadingHistory}
              >
                {isLoadingHistory ? '불러오는 중...' : '내 작업 불러오기'}
              </Button>
            </div>

            {/* 텍스처 가이드 입력 */}
            <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">텍스처 가이드(선택)</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Meshy 문서 기준으로 텍스처 가이드는 <span className="font-semibold">프롬프트</span> 또는 <span className="font-semibold">이미지</span> 중 하나만 권장됩니다.
              </div>

              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">텍스처 프롬프트</label>
              <textarea
                value={texturePrompt}
                onChange={(e) => setTexturePrompt(e.target.value)}
                placeholder="예: 흰 배경의 실사 제품 사진, 가죽 재질, 고해상도 텍스처"
                className="w-full h-20 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center gap-2 mt-3">
                <Button onClick={handlePickTextureImage} variant="secondary" size="sm">
                  텍스처 이미지 선택
                </Button>
                {textureImage && (
                  <span className="text-xs text-gray-600 dark:text-gray-400 break-all">
                    선택됨: {textureImage.name}
                  </span>
                )}
                {textureImage && (
                  <button
                    onClick={() => setTextureImage(null)}
                    className="text-xs text-red-600 dark:text-red-400"
                    type="button"
                  >
                    제거
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <input
                  id="enablePbr"
                  type="checkbox"
                  checked={enablePbr}
                  onChange={(e) => setEnablePbr(e.target.checked)}
                />
                <label htmlFor="enablePbr" className="text-sm text-gray-700 dark:text-gray-300">
                  PBR 텍스처 생성(enable_pbr)
                </label>
              </div>
            </div>

            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <div>
                <span className="font-medium">선택된 파일:</span> {files.length}개
              </div>
              {files.length > 0 && (
                <ul className="list-disc pl-5 space-y-1">
                  {files.map((f) => (
                    <li key={`${f.name}-${f.size}`}>{f.name}</li>
                  ))}
                </ul>
              )}
            </div>

            {job && (
              <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">작업 ID</div>
                    <div className="text-xs text-gray-900 dark:text-gray-100 break-all">{job.id}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">
                      provider: {job.provider}
                      {job.providerJobId ? ` / providerJobId: ${job.providerJobId}` : ''}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">상태: </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {job.status}
                      {isPolling ? ' (진행 중...)' : ''}
                    </span>
                  </div>
                </div>

                {(job.status === 'PROCESSING' || job.status === 'PENDING') && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      엔진 상태: <span className="font-semibold">{job.providerStatus || '알 수 없음'}</span>
                      {job.lastCheckedAt ? (
                        <span className="text-xs text-gray-500 dark:text-gray-500"> · 마지막 확인 {timeAgo(job.lastCheckedAt)}</span>
                      ) : null}
                    </div>

                    {typeof job.progress === 'number' && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>진행률</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{job.progress}%</span>
                        </div>
                        <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden mt-1">
                          <div
                            className="h-2 bg-blue-600"
                            style={{ width: `${Math.max(0, Math.min(100, job.progress))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {job.providerLastError && (
                      <div className="text-[11px] text-yellow-700 dark:text-yellow-400 break-all">
                        상태 조회 중 경고: {job.providerLastError}
                      </div>
                    )}
                  </div>
                )}

                {job.status === 'FAILED' && (
                  <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                    실패: {job.errorMessage || '알 수 없는 오류'}
                  </div>
                )}
                {job.status === 'SUCCEEDED' && job.outputModelUrl && (
                  <div className="mt-3 text-sm text-green-700 dark:text-green-400">
                    완료! 아래에서 3D를 확인해보세요.
                  </div>
                )}
              </div>
            )}

            {/* 히스토리 목록 */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">내 작업 히스토리</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">최대 20개</div>
              </div>
              {jobList.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  아직 작업이 없어요. 이미지를 업로드해서 3D 변환을 시작해보세요.
                </div>
              ) : (
                <div className="max-h-[220px] overflow-auto space-y-2">
                  {jobList.slice(0, 20).map((j) => (
                    <button
                      key={j.id}
                      onClick={() => setJob(j)}
                      className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                        job?.id === j.id
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40'
                      }`}
                      title="클릭하여 보기"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">상태</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">{j.status}</div>
                      </div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400 break-all mt-1">{j.id}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">
                        업데이트: {new Date(j.updatedAt).toLocaleString('ko-KR')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card variant="elevated" padding="lg" className="dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">3D 미리보기</h2>

            {job?.status === 'SUCCEEDED' && job.outputModelUrl ? (
              <ModelViewer url={job.outputModelUrl} />
            ) : (
              <div className="w-full h-[520px] rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    변환이 완료되면 이곳에 3D 모델이 표시됩니다.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    마우스 드래그로 회전 / 휠로 줌
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    현재는 서버 설정에 따라 mock 또는 실제 생성(Replicate) 모드로 동작합니다.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}


