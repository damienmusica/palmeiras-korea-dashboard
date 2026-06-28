# 유지보수 런북 (Maintenance Runbook)

이 앱은 **방치해도 "조용한 거짓말"이 아니라 "정직하게 낡음"으로 degrade**되도록
설계돼 있습니다(신선도 배지·"정보 없음"·무결성 게이트). 이 문서는 *무엇이 알아서
굴러가고 / 무엇이 사람 손을 타는지*, 그리고 *경보가 울리면 무엇을 하는지*의
단일 출처입니다. 자세한 파이프라인 구조는 [`FREE-PIPELINE.md`](./FREE-PIPELINE.md).

---

## 1. 알아서 굴러가는 것 (인프라 $0, 사람 시간 ≈ 0)

GitHub Actions 크론(`.github/workflows/refresh-data.yml`, ~30분)이:
`scripts/ingest.mjs` 실행 → `data/*.json` 갱신 → 커밋 → Vercel 자동 재배포.

| 데이터 | 소스 | 갱신 |
| --- | --- | --- |
| 경기·스코어·라인업·타임라인 | ESPN 공개 JSON (키리스) | 매 실행 |
| 순위 / 대륙·컵 대진 | ESPN 공개 JSON (키리스) | 매 실행 |
| 뉴스 + 한국어 요약 | Google News RSS + LLM(무료) | 매 실행 |
| 스쿼드 사진·현재 시즌 스탯 | API-Football(무료키) + ESPN | 매 실행 |

로컬 맥을 켜둘 필요 없음. 인제스트는 **절대 throw하지 않음**(flaky 피드가 크론을
깨지 않도록 로그 후 종료) — 그래서 아래 **안전망**이 필요합니다.

## 2. 안전망 (조용한 썩음 → 시끄러운 경보)

| 장치 | 무엇을 잡나 | 어디 |
| --- | --- | --- |
| `npm run check` (`scripts/check-freshness.mjs`) | 특정 피드가 몇 시간째 조용히 실패 → 스냅샷 stale/빈값/스키마 드리프트 | 워크플로 인제스트 **직후** 스텝. FAIL이면 워크플로 red → **GitHub가 소유자에게 실패 메일** |
| 읽기측 스키마 가드 (`snapshot.ts` `hasFields`) | 피드가 모양을 바꿔 깨진 스냅샷이 들어와도 앱이 garbage 대신 **시드로 폴백** | 런타임(서버) |
| **Dead-man's-switch**(선택, healthchecks.io 무료) | **크론이 통째로 죽은 경우**(안에서 도는 check로는 못 잡음) | 외부 — 성공 시 ping, ping 끊기면 알림 |
| 신선도 배지(`FreshnessBadge`) | 사용자에게 "갱신 지연" 표시 | 앱 UI |

설정 방법(워크플로 스텝 + healthchecks)은 [`FREE-PIPELINE.md` › 안전망](./FREE-PIPELINE.md#reliability-safety-net) 참고.

## 3. 경보가 울리면 (red 워크플로 / 실패 메일 / healthchecks 알림)

1. **Actions 로그**에서 `[check]` 라인 확인 — 어느 스냅샷이 `stale` / `only N rows`
   / `missing field`인지 나옵니다.
2. **stale 하나만** → 그 피드 소스(ESPN/Google News/API-Football)가 일시 장애일
   가능성. `workflow_dispatch`로 수동 1회 재실행 → 회복되면 끝.
3. **계속 stale / 0 rows / missing field** → 그 소스의 **스키마·엔드포인트가 바뀜**.
   `scripts/ingest.mjs`의 해당 파서(또는 `espn-squad.mjs`)를 점검. 앱은 그동안
   시드/직전 스냅샷으로 정직하게 버팁니다(거짓 표시 아님).
4. **모든 스냅샷 동시 stale + healthchecks 알림** → 크론 자체가 안 돎(레포 60일
   비활성 시 GitHub가 스케줄을 비활성화함, 또는 권한/쿼터). Actions 탭에서 활성화.

## 4. 주기적 편집(baked) 콘텐츠 갱신 — 사람/Opus 빌드타임

자동 갱신 안 되는 "고정·역사" 데이터. **이적시장(연 2회)·시즌 전환(연 1회)** 마다
배치로 갱신. 원칙: 확인 못 한 값은 칸 제거(날조 금지), 다출처 검증, "기준일" 명시.

| 트리거 | 할 일 | 파일 |
| --- | --- | --- |
| 선수 영입/방출 | 한국어 이름 추가(curated), 도시에 추가/이동, 방출 주역은 레전드로 | `i18n/ptKo.ts`(CURATED_PEOPLE), `teams/palmeiras-dossier.ts`, `teams/palmeiras-legends.ts` |
| 가짜/오귀속 선수 출현(피드 오류) | 증거와 함께 allow/blocklist 갱신 | `teams/palmeiras-roster-overrides.ts` (게이트: `data/squad-integrity.ts`) |
| 더비 치를 때마다 | H2H 통산 전적 숫자 갱신(출처·기준일 함께) | `teams/palmeiras.ts` `rivals[].h2h` |
| 감독 교체 | 감독 이름·약력 | `ptKo.ts`, `teams/palmeiras-dossier.ts`(getCoachDossier) |
| 시즌 전환(연 1회) | 새 시즌 대회 slug/season 문자열, 월드컵 등 일정 공백 설명 | `scripts/ingest.mjs`, `interpret/competitions.ts` |
| 구장·트로피 변동 | 구장명/우승 연혁 | `teams/palmeiras.ts`, `teams/palmeiras-history.ts` |

**검증 루프(코드 변경 시):** `npm run format:check && npm run lint && npm run
typecheck && npm run test && npm run build`. 데이터만 손봤으면 `npm run ingest`
(로컬, 키리스) 후 `npm run check`로 확인.

## 5. 새 콘텐츠를 더하기 전 자문 (디시플린)

깊이가 늘수록 편집 표면(유지보수 부채)도 늘어납니다. 새 콘텐츠는:
- 👍 **피드에서 자동 갱신**되거나 (예: 대륙 대진), **우아하게 낡고 날짜가 찍히면**
  (예: H2H — 출처·기준일) OK.
- ⚠️ 손으로만 관리되고 **조용히 틀려지는 것**(예: 수기 부상자 명단)은 피하거나
  반드시 신선도/출처 표기 + degrade 장치를 갖출 것.

## 6. 비밀/키 정책

**무료가 필수, 키리스는 선호일 뿐 — 무료라면 키 OK**(소유자가 GitHub repo
secrets + 로컬 `.env.local`에 발급). 현재 사용: `API_FOOTBALL_KEY`(사진),
`LLM_API_KEY`(뉴스 요약). **키·`.env`·`.github/` 워크플로는 코드 PR에 포함하지
않음** — 워크플로/시크릿 변경은 소유자가 직접 적용(이 문서의 YAML 참고).
