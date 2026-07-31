# RepoSweep

GitHub 저장소를 여러 개 선택해 아카이브하고, 필요할 때만 완전 삭제하는 가벼운 관리 도구입니다.

## 주요 기능

- GitHub Fine-grained personal access token 연결
- 소유한 저장소 검색, 공개 범위 필터, 다중 선택
- GitHub 실제 아카이브 / 복원
- 확인 문구를 거친 아카이브 저장소 영구 삭제
- 별도 DB 없이 현재 기기에 방문·작업 통계 저장
- GitHub Pages 자동 배포

## 로컬 실행

```bash
npm install
npm run dev
```

## GitHub 토큰 권한

Fine-grained personal access token에서 관리할 저장소를 선택하고
`Administration: Read and write` 권한을 부여하세요. 토큰은 현재 브라우저
탭의 `sessionStorage`에만 저장됩니다.

## 배포

`main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml` 워크플로가
정적 빌드 결과를 GitHub Pages에 배포합니다. 저장소 설정의 **Pages >
Source**를 **GitHub Actions**로 선택해야 합니다.
