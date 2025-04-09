#!/usr/bin/env node
const inquirer = require("inquirer");
const fs = require("fs");

type SliceType = (typeof sliceTypes)[number];
type Complexity = (typeof complexities)[number];
type LayerType = (typeof layers)[number];

type Slice = {
  type: SliceType;
  complexity: Complexity;
  layer: LayerType;
  isSharedAcrossFeatures?: boolean;
  dependencyCount?: number;
  isBusinessCritical?: boolean;
};

const CONFIG_PATH = ".spconfig.json";

type Config = {
  basePoint: {
    [key in SliceType]: number;
  };
  layerWeight: {
    [key in LayerType]: number;
  };
  complexityMultiplier: {
    [key in Complexity]: number;
  };
  dependencyWeight: number;
  maxDependencyPenalty: number;
  bonus: {
    sharedAcrossFeatures: number;
    businessCritical: number;
    hasTest: number;
    isRefactor: number;
  };
};

const DEFAULT_CONFIG = {
  basePoint: {
    ui: 1.5,
    api: 2,
    model: 1.5,
    lib: 2.5,
    route: 1,
    shared: 3,
  },
  layerWeight: {
    shared: 1.2,
    entities: 1,
    features: 0.8,
    widgets: 0.5,
    pages: 0,
    app: 0.3,
  },
  complexityMultiplier: {
    low: 1,
    medium: 1.5,
    high: 2,
  },
  dependencyWeight: 0.2,
  maxDependencyPenalty: 2,
  bonus: {
    sharedAcrossFeatures: 1,
    businessCritical: 1.5,
    hasTest: 1,
    isRefactor: 2,
  },
};

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  }
  return DEFAULT_CONFIG;
}

const sliceTypes = ["ui", "api", "model", "lib", "route", "shared"];
const complexities = ["low", "medium", "high"];
const layers = ["shared", "entities", "features", "widgets", "pages", "app"];

function getSlicePointAdvanced(slice: Slice, config: Config, verbose = false) {
  const basePoint = config.basePoint[slice.type] || 1;
  const multiplier = config.complexityMultiplier[slice.complexity] || 1;
  const layerWeight = config.layerWeight[slice.layer] || 0;
  const dependencyPenalty = Math.min(
    (slice.dependencyCount || 0) * config.dependencyWeight,
    config.maxDependencyPenalty
  );
  const sharedBonus = slice.isSharedAcrossFeatures
    ? config.bonus.sharedAcrossFeatures
    : 0;
  const businessBonus = slice.isBusinessCritical
    ? config.bonus.businessCritical
    : 0;

  const result = Math.ceil(
    basePoint * multiplier +
      dependencyPenalty +
      sharedBonus +
      businessBonus +
      layerWeight
  );

  if (verbose) {
    console.log("-".repeat(40));
    console.log(`📦 Slice: ${slice.type} (${slice.layer})`);
    console.log(`  basePoint(${basePoint}) x multiplier(${multiplier})`);
    console.log(`  + layerWeight(${layerWeight})`);
    console.log(`  + dependencyPenalty(${dependencyPenalty})`);
    console.log(`  + sharedBonus(${sharedBonus})`);
    console.log(`  + businessBonus(${businessBonus})`);
    console.log(`  = 🧮 ${result} pt`);
  }

  return result;
}

function calculateStoryPointAdvanced(
  slices: Slice[],
  hasTest: boolean,
  isRefactor: boolean,
  config: Config,
  verbose = false
) {
  const sliceTotal = slices.reduce(
    (sum, s) => sum + getSlicePointAdvanced(s, config, verbose),
    0
  );
  const testBonus = hasTest ? config.bonus.hasTest : 0;
  const refactorBonus = isRefactor ? config.bonus.isRefactor : 0;
  if (verbose) {
    console.log(`\n✅ 테스트 보정: +${testBonus}`);
    console.log(`🔧 리팩터링 보정: +${refactorBonus}`);
    console.log(`합계: ${sliceTotal + testBonus + refactorBonus}`);
  }
  const total = sliceTotal + testBonus + refactorBonus;
  const fibonacci = [1, 2, 3, 5, 8, 13, 21];
  return fibonacci.find((f) => total <= f) || 21;
}

async function main() {
  const config = loadConfig();
  const slices = [];
  let addMore = true;
  const verbose = process.argv.includes("--report");

  while (addMore) {
    const { layer } = await inquirer.prompt([
      {
        type: "list",
        name: "layer",
        message: "Slice가 속한 Layer를 선택하세요:",
        choices: layers,
      },
    ]);

    const { type, complexity } = await inquirer.prompt([
      {
        type: "list",
        name: "type",
        message: "Slice 타입을 선택하세요:",
        choices: sliceTypes,
      },
      {
        type: "list",
        name: "complexity",
        message: "해당 Slice의 복잡도를 선택하세요:",
        choices: complexities,
      },
    ]);

    const { isSharedAcrossFeatures, dependencyCount, isBusinessCritical } =
      await inquirer.prompt([
        {
          type: "confirm",
          name: "isSharedAcrossFeatures",
          message: "이 Slice는 다른 Feature에서도 참조되나요?",
          default: false,
        },
        {
          type: "number",
          name: "dependencyCount",
          message: "이 Slice가 의존하는 다른 Slice 개수는 몇 개인가요?",
          default: 0,
        },
        {
          type: "confirm",
          name: "isBusinessCritical",
          message: "이 기능은 비즈니스상 중요한 기능인가요?",
          default: false,
        },
      ]);

    slices.push({
      type,
      complexity,
      layer,
      isSharedAcrossFeatures,
      dependencyCount,
      isBusinessCritical,
    });

    const { continueAdding } = await inquirer.prompt([
      {
        type: "confirm",
        name: "continueAdding",
        message: "다른 Slice를 추가하시겠습니까?",
        default: true,
      },
    ]);
    addMore = continueAdding;
  }

  const { hasTest, isRefactor } = await inquirer.prompt([
    {
      type: "confirm",
      name: "hasTest",
      message: "테스트 코드가 포함되었나요?",
      default: true,
    },
    {
      type: "confirm",
      name: "isRefactor",
      message: "기존 기능 리팩토링인가요?",
      default: false,
    },
  ]);

  const result = calculateStoryPointAdvanced(
    slices,
    hasTest,
    isRefactor,
    config,
    verbose
  );
  console.log(`\n✅ 예상 스토리포인트: ${result} SP\n`);
}

main().catch(console.error);
