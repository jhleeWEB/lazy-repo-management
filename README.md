# RepoSweep

여러 GitHub 저장소를 한곳에서 검색하고, 일괄 아카이브·복원하거나 영구 삭제할 수 있는 무료 GitHub 레포 관리 도구입니다.

**서비스:** [RepoSweep](https://jhleeweb.github.io/lazy-repo-management/)

## 주요 기능

- GitHub OAuth 로그인
- 소유한 저장소 검색, 공개 범위 필터, 다중 선택
- GitHub의 실제 저장소 일괄 아카이브 및 복원
- 확인 문구를 거친 아카이브 저장소 영구 삭제
- 저장소 데이터는 별도 DB에 저장하지 않고 GitHub API에서 직접 조회
- Upstash 기반 익명 누적 방문·아카이브·복원·삭제 통계
- 한국어·영어·스페인어·일본어·포르투갈어·중국어·러시아어·프랑스어·독일어 지원
- GitHub Pages 자동 배포와 검색엔진용 sitemap·구조화 데이터·IndexNow 지원

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
- 저장소 데이터: GitHub API와 브라우저 세션 저장소
- 익명 누적 통계: Upstash Redis

`main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 정적 빌드를 GitHub Pages에 배포하고 IndexNow로 변경 URL을 알립니다.