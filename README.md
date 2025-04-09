# 🧮 sp-estimator

FSD(Featured Slice Design) 구조 기반 스토리포인트 자동 계산 CLI 도구입니다.

Slice의 타입, 복잡도, 계층(Layer), 의존성, 비즈니스 중요도 등을 기준으로 **Fibonacci 스토리포인트**를 추정합니다.

---

## 🚀 설치 및 실행

### 설치 없이 실행 (권장)

```bash
npx sp-estimator
```

## 🧠 계산 기준

각 Slice는 다음 기준에 따라 점수가 계산됩니다:

- `type`: `ui`, `api`, `model`, `lib`, `route`, `shared`
- `layer`: `shared`, `entities`, `features`, `widgets`, `pages`, `app`
- `complexity`: `low`, `medium`, `high`
- 의존성 개수: 다른 Slice 몇 개에 의존하는가
- Cross-feature 공유 여부
- 비즈니스 중요도
- 테스트 포함 여부
- 리팩토링 여부

## ⚙️ 커스터마이징: `.spconfig.json`

루트 디렉토리에 `.spconfig.json` 파일을 두면 계산 기준을 직접 정의할 수 있습니다:

```json
{
  "basePoint": {
    "ui": 1.5,
    "api": 2,
    "model": 1.5,
    "lib": 2.5,
    "route": 1,
    "shared": 3
  },
  "layerWeight": {
    "shared": 1.2,
    "entities": 1,
    "features": 0.8,
    "widgets": 0.5,
    "pages": 0,
    "app": 0.3
  },
  "complexityMultiplier": {
    "low": 1,
    "medium": 1.5,
    "high": 2
  },
  "dependencyWeight": 0.2,
  "maxDependencyPenalty": 2,
  "bonus": {
    "sharedAcrossFeatures": 1,
    "businessCritical": 1.5,
    "hasTest": 1,
    "isRefactor": 2
  }
}
```

## 📊 옵션

### `-report`

Slice 별로 점수 계산 내역을 상세히 출력합니다:

```bash
npx sp-estimator --report

```

예시 출력:

```
----------------------------------------
📦 Slice: model (features)
  basePoint(1.5) x multiplier(1.5)
  + layerWeight(0.8)
  + dependencyPenalty(0.2)
  + sharedBonus(0)
  + businessBonus(1.5)
  = 🧮 5 pt

✅ 테스트 보정: +1
🔧 리팩터링 보정: +2
합계: 8.5

```

최종 결과는 Fibonacci 수열 중 가장 가까운 수(`5`, `8`, `13`, `21` 등)로 반올림됩니다.

---

## 🗺️ 향후 지원 예정

- `-output result.json`: 결과를 파일로 저장
- `.spconfig.schema.json`: 자동완성 지원용 JSON Schema
- GitHub PR diff 기반 자동 SP 추정기
- Web UI 연동 (React 기반)

---

## 🙌 만든 사람

- @ohseungwan
