# RepoSweep

여러 GitHub 저장소를 한곳에서 검색하고, 일괄 아카이브하거나 영구 삭제할 수 있는 가벼운 관리 도구입니다.

## 주요 기능

- GitHub OAuth 로그인
- 소유한 저장소 검색, 공개 범위 필터, 다중 선택
- GitHub의 실제 저장소 아카이브 및 복원
- 확인 문구를 거친 아카이브 저장소 영구 삭제
- 별도 DB 없이 현재 브라우저에 방문·작업 통계 저장
- GitHub Pages 자동 배포

## 로컬 실행

`.env.example`을 참고해 `.env.local`을 만들고 GitHub OAuth App 값을 입력합니다.

```bash
npm install
npm run dev
```

프런트엔드와 OAuth 브리지를 함께 실행하려면:

```bash
npm run build:sites
npm start
```

## GitHub OAuth 설정

OAuth App의 **Authorization callback URL**은 다음 주소로 설정합니다.

```text
https://jhleeweb.github.io/lazy-repo-management/
```

로그인 시 저장소 관리용 `repo`, 영구 삭제용 `delete_repo` 범위를 요청합니다. Client Secret은 서버의 환경 변수에서만 사용되며 GitHub Pages 번들에는 포함되지 않습니다.

## 배포

- 프런트엔드: GitHub Pages
- OAuth 코드 교환: OpenAI Sites의 서버리스 라우트
- 데이터: 별도 DB 없이 GitHub API와 브라우저 저장소 사용

`main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 정적 빌드를 GitHub Pages에 배포합니다.