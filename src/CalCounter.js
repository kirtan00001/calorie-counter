
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Cal.css";
import Swal from "sweetalert2";
import "animate.css";
import Quagga from "quagga";
import axios from "axios";

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];
const DEFAULT_GOALS = {
  calories: 2000,
  protein: 150,
  fat: 70,
  carbs: 250,
  waterOz: 64,
};
const WATER_ML_PER_OZ = 29.5735;
const DEFAULT_PREFS = {
  waterStep: 8,
  waterUnit: "oz",
  theme: "aurora",
  density: "comfy",
  defaultMeal: "Auto",
};
const OZ_TO_G = 28.3495;
const LB_TO_G = 453.592;
const KG_TO_G = 1000;
const ML_TO_G = 1;
const L_TO_G = 1000;
const FL_OZ_TO_G = WATER_ML_PER_OZ;
const TBSP_TO_G = 14.7868;
const TSP_TO_G = 4.92892;
const CUP_TO_G = 236.588;
const PINT_TO_G = 473.176;
const QUART_TO_G = 946.353;
const GAL_TO_G = 3785.41;

const UNIT_TO_G = {
  g: 1,
  kg: KG_TO_G,
  oz: OZ_TO_G,
  lb: LB_TO_G,
  ml: ML_TO_G,
  l: L_TO_G,
  cup: CUP_TO_G,
  tbsp: TBSP_TO_G,
  tsp: TSP_TO_G,
  "fl oz": FL_OZ_TO_G,
  pint: PINT_TO_G,
  quart: QUART_TO_G,
  gal: GAL_TO_G,
};
const THEME_PRESETS = {
  aurora: {
    "--bg": "#0b1117",
    "--bg-deep": "#070b0f",
    "--card": "rgba(18, 27, 38, 0.88)",
    "--accent-1": "#00d4ff",
    "--accent-2": "#ff9f1c",
    "--accent-3": "#2ec4b6",
    "--accent-4": "#ff6b6b",
    "--accent-5": "#6ee7b7",
  },
  sunset: {
    "--bg": "#140d12",
    "--bg-deep": "#0b070a",
    "--card": "rgba(28, 18, 24, 0.9)",
    "--accent-1": "#ff7a18",
    "--accent-2": "#ffd166",
    "--accent-3": "#ff5c8a",
    "--accent-4": "#ff9a62",
    "--accent-5": "#ffe29a",
  },
  tide: {
    "--bg": "#07151a",
    "--bg-deep": "#051014",
    "--card": "rgba(12, 26, 32, 0.9)",
    "--accent-1": "#38bdf8",
    "--accent-2": "#22d3ee",
    "--accent-3": "#34d399",
    "--accent-4": "#fb7185",
    "--accent-5": "#fbbf24",
  },
  mono: {
    "--bg": "#101213",
    "--bg-deep": "#0a0c0d",
    "--card": "rgba(20, 22, 24, 0.9)",
    "--accent-1": "#e2e8f0",
    "--accent-2": "#94a3b8",
    "--accent-3": "#cbd5f5",
    "--accent-4": "#f8fafc",
    "--accent-5": "#a7f3d0",
  },
};
const MACRO_PRESETS = {
  Balanced: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  "High Protein": { protein: 0.4, carbs: 0.3, fat: 0.3 },
  "Low Carb": { protein: 0.35, carbs: 0.25, fat: 0.4 },
  Endurance: { protein: 0.25, carbs: 0.5, fat: 0.25 },
  Keto: { protein: 0.25, carbs: 0.05, fat: 0.7 },
};
const TDEE_FORMULAS = [
  { value: "mifflin", label: "Mifflin-St Jeor" },
  { value: "harris", label: "Harris-Benedict (1919)" },
  { value: "revised", label: "Revised Harris-Benedict (1984)" },
  { value: "katch", label: "Katch-McArdle" },
  { value: "cunningham", label: "Cunningham" },
  { value: "owen", label: "Owen" },
  { value: "schofield", label: "Schofield (18-30)" },
  { value: "who", label: "WHO" },
];
const ACTIVITY_LEVELS = [
  { value: 1.2, label: "Sedentary (1.20)" },
  { value: 1.375, label: "Light (1.375)" },
  { value: 1.55, label: "Moderate (1.55)" },
  { value: 1.725, label: "Very Active (1.725)" },
  { value: 1.9, label: "Extremely Active (1.90)" },
];

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const createDay = () => {
  const now = new Date();
  return {
    date: now.toLocaleDateString(),
    dateISO: now.toISOString().slice(0, 10),
    dateLabel: "",
    foods: [],
    notes: "",
    waterOz: 0,
    burnedCalories: 0,
    goalOverrides: {},
  };
};

const numberOrZero = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const optionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeServingUnit = (unit) => {
  const raw = (unit || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
  if (!raw) return "";

  const aliases = {
    g: "g",
    gram: "g",
    grams: "g",
    grm: "g",
    kg: "kg",
    kilogram: "kg",
    kilograms: "kg",
    oz: "oz",
    ounce: "oz",
    ounces: "oz",
    lb: "lb",
    lbs: "lb",
    pound: "lb",
    pounds: "lb",
    ml: "ml",
    milliliter: "ml",
    milliliters: "ml",
    millilitre: "ml",
    millilitres: "ml",
    l: "l",
    liter: "l",
    liters: "l",
    litre: "l",
    litres: "l",
    cup: "cup",
    cups: "cup",
    tbsp: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    tsp: "tsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    floz: "fl oz",
    "fl oz": "fl oz",
    "fluid ounce": "fl oz",
    "fluid ounces": "fl oz",
    pint: "pint",
    pints: "pint",
    pt: "pint",
    pts: "pint",
    quart: "quart",
    quarts: "quart",
    qt: "quart",
    qts: "quart",
    gal: "gal",
    gallon: "gal",
    gallons: "gal",
  };

  return aliases[raw] || "";
};

const convertAmount = (value, fromUnit, toUnit) => {
  const amount = numberOrZero(value);
  const from = normalizeServingUnit(fromUnit);
  const to = normalizeServingUnit(toUnit);
  if (!amount || !from || !to || from === to) return amount;

  const fromFactor = UNIT_TO_G[from];
  const toFactor = UNIT_TO_G[to];
  if (!fromFactor || !toFactor) return amount;
  return (amount * fromFactor) / toFactor;
};

const getServingsFromAmount = (amount, amountUnit, servingSize, servingUnit) => {
  const amt = numberOrZero(amount);
  if (!amt) return null;
  if (amountUnit === "servings") return amt;
  const size = numberOrZero(servingSize);
  const unit = normalizeServingUnit(servingUnit);
  if (!size || !unit) return null;
  const converted = convertAmount(amt, amountUnit, unit);
  if (!converted) return null;
  return converted / size;
};

const formatCount = (value) => {
  const num = numberOrZero(value);
  if (!Number.isFinite(num)) return "0";
  if (num % 1 === 0) return String(num);
  return num.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

const getServingConversions = (size, unit) => {
  const amount = numberOrZero(size);
  if (!amount || amount <= 0) return "";
  const normalized = normalizeServingUnit(unit);
  const factor = UNIT_TO_G[normalized];
  if (!factor) return "";
  const grams = amount * factor;
  const ounces = grams / OZ_TO_G;
  const pounds = grams / LB_TO_G;
  const milliliters = grams / ML_TO_G;
  const cups = grams / CUP_TO_G;
  const mlDisplay =
    milliliters >= 1000
      ? `${formatCount(milliliters / 1000)} l`
      : `${formatCount(milliliters)} ml`;

  return `approx ${formatCount(grams)} g | ${formatCount(ounces)} oz | ${formatCount(
    pounds
  )} lb | ${mlDisplay} | ${formatCount(cups)} cup`;
};

const buildUsdaServingOptions = (food) => {
  if (!food) return [];
  const options = [];
  const baseSize = numberOrZero(food.servingSize);
  const baseUnit =
    normalizeServingUnit(food.servingSizeUnit) || food.servingSizeUnit || "";
  if (baseSize && baseUnit) {
    const label = food.householdServingFullText
      ? `${food.householdServingFullText} (${formatCount(baseSize)} ${baseUnit})`
      : `${formatCount(baseSize)} ${baseUnit}`;
    options.push({ label, size: baseSize, unit: baseUnit });
  }
  const portions = Array.isArray(food.foodPortions) ? food.foodPortions : [];
  portions.forEach((portion) => {
    const grams = numberOrZero(portion.gramWeight);
    if (!grams) return;
    const desc = [portion.portionDescription, portion.modifier]
      .filter(Boolean)
      .join(" ");
    const label = `${desc || "Portion"} (${formatCount(grams)} g)`;
    options.push({ label, size: grams, unit: "g" });
  });
  if (options.length === 0) {
    options.push({ label: "Serving size not listed", size: 1, unit: "servings" });
  }
  return options;
};

const calculateTDEE = ({
  formula,
  sex,
  age,
  weightKg,
  heightCm,
  bodyFat,
  activity,
}) => {
  const weight = numberOrZero(weightKg);
  const height = numberOrZero(heightCm);
  const years = numberOrZero(age);
  const activityLevel = numberOrZero(activity) || 1;
  const normalizedSex =
    sex && sex.toString().toLowerCase().startsWith("m") ? "male" : "female";
  let bmr = 0;

  switch (formula) {
    case "mifflin":
      bmr =
        10 * weight +
        6.25 * height -
        5 * years +
        (normalizedSex === "male" ? 5 : -161);
      break;
    case "harris":
      bmr =
        normalizedSex === "male"
          ? 66.5 + 13.75 * weight + 5.003 * height - 6.755 * years
          : 655.1 + 9.563 * weight + 1.85 * height - 4.676 * years;
      break;
    case "revised":
      bmr =
        normalizedSex === "male"
          ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * years
          : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * years;
      break;
    case "katch": {
      const leanMass = weight * (1 - numberOrZero(bodyFat) / 100);
      bmr = 370 + 21.6 * leanMass;
      break;
    }
    case "cunningham": {
      const leanMass = weight * (1 - numberOrZero(bodyFat) / 100);
      bmr = 500 + 22 * leanMass;
      break;
    }
    case "owen":
      bmr =
        normalizedSex === "male"
          ? 879 + 10.2 * weight
          : 795 + 7.18 * weight;
      break;
    case "schofield":
      bmr =
        normalizedSex === "male"
          ? 15.057 * weight + 692.2
          : 14.818 * weight + 486.6;
      break;
    case "who":
      bmr =
        normalizedSex === "male"
          ? (0.063 * weight + 2.896) * 239
          : (0.062 * weight + 2.036) * 239;
      break;
    default:
      return null;
  }

  if (!Number.isFinite(bmr) || bmr <= 0) return null;
  const tdee = bmr * activityLevel;
  return Number.isFinite(tdee) ? tdee : null;
};

const sumFoods = (foods) =>
  foods.reduce(
    (acc, f) => {
      acc.calories += numberOrZero(f.calories);
      acc.protein += numberOrZero(f.protein);
      acc.fat += numberOrZero(f.fat);
      acc.carbs += numberOrZero(f.carbs);
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

const normalizeGoalOverrides = (overrides) => {
  if (!overrides || typeof overrides !== "object") return {};
  const next = {};
  ["calories", "protein", "fat", "carbs", "waterOz"].forEach((key) => {
    const value = numberOrZero(overrides[key]);
    if (value > 0) next[key] = value;
  });
  return next;
};

const formatDate = (dateISO) => {
  if (!dateISO) return "";
  const parsed = new Date(dateISO);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
};

const getDisplayDate = (day) =>
  day.dateLabel || formatDate(day.dateISO) || day.date || "";

const toDisplayWater = (oz, unit) =>
  unit === "ml" ? Math.round(oz * WATER_ML_PER_OZ) : Math.round(oz);

const toWaterOz = (value, unit) =>
  unit === "ml" ? value / WATER_ML_PER_OZ : value;

const resolveDefaultMeal = (prefs) => {
  if (prefs?.defaultMeal && prefs.defaultMeal !== "Auto") {
    return prefs.defaultMeal;
  }
  return getDefaultMeal();
};

const normalizeFood = (food) => {
  const baseServings = numberOrZero(food.servings) || 1;
  const legacyItems = numberOrZero(food.items) || 1;
  const servings = baseServings * legacyItems;
  const calories = numberOrZero(food.calories);
  const protein = numberOrZero(food.protein);
  const fat = numberOrZero(food.fat);
  const carbs = numberOrZero(food.carbs);

  const perServing =
    food.perServing && typeof food.perServing === "object"
      ? {
          calories: numberOrZero(food.perServing.calories),
          protein: numberOrZero(food.perServing.protein),
          fat: numberOrZero(food.perServing.fat),
          carbs: numberOrZero(food.perServing.carbs),
        }
      : {
          calories: servings ? calories / servings : calories,
          protein: servings ? protein / servings : protein,
          fat: servings ? fat / servings : fat,
          carbs: servings ? carbs / servings : carbs,
        };

  return {
    id: food.id || createId(),
    food: food.food || "Unknown",
    brand: food.brand || "",
    servingSize: numberOrZero(food.servingSize),
    servingUnit:
      normalizeServingUnit(food.servingUnit) || food.servingUnit || "",
    notes: food.notes || "",
    tags: Array.isArray(food.tags) ? food.tags : [],
    calories,
    protein,
    fat,
    carbs,
    servings,
    perServing,
    meal: food.meal || "Snack",
    createdAt: food.createdAt || Date.now(),
    source: food.source || "manual",
  };
};

const normalizeDay = (day) => {
  const safe = { ...createDay(), ...day };
  safe.foods = Array.isArray(safe.foods) ? safe.foods.map(normalizeFood) : [];
  safe.notes = safe.notes || "";
  safe.waterOz = numberOrZero(safe.waterOz);
  safe.burnedCalories = numberOrZero(safe.burnedCalories);
  safe.dateLabel = safe.dateLabel || "";
  safe.goalOverrides = normalizeGoalOverrides(safe.goalOverrides);
  if (!safe.dateISO && safe.date) {
    const parsed = new Date(safe.date);
    safe.dateISO = Number.isNaN(parsed.getTime())
      ? new Date().toISOString().slice(0, 10)
      : parsed.toISOString().slice(0, 10);
  }
  return safe;
};

const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (err) {
    return fallback;
  }
};

const loadArray = (key) => {
  const saved = loadFromStorage(key, []);
  return Array.isArray(saved) ? saved : [];
};

const getDefaultMeal = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Breakfast";
  if (hour < 15) return "Lunch";
  if (hour < 19) return "Dinner";
  return "Snack";
};

const formatNumber = (value) => {
  const num = numberOrZero(value);
  return num.toFixed(1);
};

const clampPercent = (value, goal) => {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, (value / goal) * 100);
};

const CollapsibleSection = ({
  id,
  title,
  subtitle,
  badge,
  isOpen,
  onToggle,
  headerRef,
  children,
}) => {
  const headerId = `${id}-header`;
  const contentId = `${id}-content`;
  return (
    <section
      className={`collapsible-section ${isOpen ? "open" : ""}`}
      id={id}
    >
      <button
        type="button"
        className="collapsible-toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        id={headerId}
        ref={headerRef}
      >
        <span className="collapsible-chevron">{isOpen ? "v" : ">"}</span>
        <div className="collapsible-title">
          <span className="collapsible-heading">{title}</span>
          {subtitle && (
            <span className="collapsible-subtitle muted">{subtitle}</span>
          )}
        </div>
        {badge && <span className="chip">{badge}</span>}
      </button>
      <div
        className="collapsible-body"
        id={contentId}
        role="region"
        aria-labelledby={headerId}
      >
        <div className="collapsible-content">{children}</div>
      </div>
    </section>
  );
};

const SidebarSection = ({
  id,
  title,
  badge,
  isOpen,
  onToggle,
  children,
}) => {
  const headerId = `${id}-toggle`;
  const contentId = `${id}-panel`;
  return (
    <div className={`sidebar-section ${isOpen ? "open" : ""}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        id={headerId}
      >
        <span className="sidebar-chevron">{isOpen ? "v" : ">"}</span>
        <span className="sidebar-title">{title}</span>
        {badge && <span className="chip">{badge}</span>}
      </button>
      <div
        className="sidebar-body"
        id={contentId}
        role="region"
        aria-labelledby={headerId}
      >
        <div className="sidebar-content">{children}</div>
      </div>
    </div>
  );
};

export default function CalCounter() {
  useEffect(() => {
    document.title = "Calorie Counter";

    const link =
      document.querySelector("link[rel*='icon']") ||
      document.createElement("link");
    link.type = "image/png";
    link.rel = "icon";
    link.href = `${process.env.PUBLIC_URL}/cal.png`;
    document.getElementsByTagName("head")[0].appendChild(link);

    return () => {
      const defaultLink = document.querySelector("link[rel*='icon']");
      if (defaultLink) defaultLink.href = `${process.env.PUBLIC_URL}/favicon.ico`;
    };
  }, []);

  const [days, setDays] = useState(() => {
    const saved = loadFromStorage("calorieDays", []);
    if (!Array.isArray(saved) || saved.length === 0) {
      return [createDay()];
    }
    return saved.map(normalizeDay);
  });

  const [currentDayIndex, setCurrentDayIndex] = useState(() => {
    const saved = Number(localStorage.getItem("currentDayIndex"));
    return Number.isFinite(saved) ? saved : 0;
  });

  const [globalTDEE, setGlobalTDEE] = useState(() => {
    const saved = Number(localStorage.getItem("globalTDEE"));
    return Number.isFinite(saved) ? saved : null;
  });

  const [goals, setGoals] = useState(() => {
    const saved = loadFromStorage("calorieGoals", DEFAULT_GOALS);
    return { ...DEFAULT_GOALS, ...(saved || {}) };
  });

  const initialPrefs = loadFromStorage("caloriePrefs", DEFAULT_PREFS);
  const [prefs, setPrefs] = useState(() => ({
    ...DEFAULT_PREFS,
    ...(initialPrefs || {}),
  }));

  const [favorites, setFavorites] = useState(() =>
    loadFromStorage("calorieFavorites", [])
  );
  const [searchHistory, setSearchHistory] = useState(() =>
    loadFromStorage("calorieSearchHistory", [])
  );

  const [apiFoods, setApiFoods] = useState([]);
  const [loaded, setLoaded] = useState(5);
  const [showFoodDialog, setShowFoodDialog] = useState(false);
  const [selectedFoodIndex, setSelectedFoodIndex] = useState(0);
  const [dialogAmountValue, setDialogAmountValue] = useState(1);
  const [dialogAmountUnit, setDialogAmountUnit] = useState("servings");
  const [dialogServingOption, setDialogServingOption] = useState(0);
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMeal, setSelectedMeal] = useState(() =>
    resolveDefaultMeal(initialPrefs)
  );
  const [mealFilter, setMealFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    dir: "desc",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [waterCustomAmount, setWaterCustomAmount] = useState(
    DEFAULT_PREFS.waterStep
  );
  const [activePage, setActivePage] = useState("dashboard");
  const [recipes, setRecipes] = useState(() => loadArray("calorieRecipes"));
  const [plans, setPlans] = useState(() => loadArray("caloriePlans"));
  const [measurements, setMeasurements] = useState(() =>
    loadArray("calorieMeasurements")
  );
  const [workouts, setWorkouts] = useState(() => loadArray("calorieWorkouts"));
  const [dashboardSectionsOpen, setDashboardSectionsOpen] = useState(() => ({
    overview: true,
    log: true,
    breakdown: false,
    notes: false,
    insights: false,
  }));
  const [sidebarSection, setSidebarSection] = useState("nav");

  const [recipeForm, setRecipeForm] = useState(() => ({
    name: "",
    servings: 1,
    calories: "",
    protein: "",
    fat: "",
    carbs: "",
    ingredients: "",
    notes: "",
  }));
  const [planForm, setPlanForm] = useState(() => ({
    dateISO: new Date().toISOString().slice(0, 10),
    meal: "Breakfast",
    name: "",
    calories: "",
    protein: "",
    fat: "",
    carbs: "",
    servings: 1,
    notes: "",
  }));
  const [measurementForm, setMeasurementForm] = useState(() => ({
    dateISO: new Date().toISOString().slice(0, 10),
    weight: "",
    bodyFat: "",
    waist: "",
    hips: "",
    chest: "",
    notes: "",
  }));
  const [workoutForm, setWorkoutForm] = useState(() => ({
    dateISO: new Date().toISOString().slice(0, 10),
    title: "",
    duration: "",
    calories: "",
    notes: "",
  }));
  const [exerciseDraft, setExerciseDraft] = useState(() => ({
    name: "",
    sets: "",
    reps: "",
    weight: "",
  }));
  const [workoutExercises, setWorkoutExercises] = useState([]);

  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);
  const settingsRef = useRef(null);
  const logRef = useRef(null);
  const insightsRef = useRef(null);
  const overviewRef = useRef(null);
  const topRef = useRef(null);
  const prevWaterUnitRef = useRef(prefs.waterUnit);

  useEffect(() => {
    localStorage.setItem("calorieDays", JSON.stringify(days));
  }, [days]);

  useEffect(() => {
    localStorage.setItem("currentDayIndex", String(currentDayIndex));
  }, [currentDayIndex]);

  useEffect(() => {
    localStorage.setItem("calorieGoals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("caloriePrefs", JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    localStorage.setItem("calorieFavorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("calorieSearchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem("calorieRecipes", JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem("caloriePlans", JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem("calorieMeasurements", JSON.stringify(measurements));
  }, [measurements]);

  useEffect(() => {
    localStorage.setItem("calorieWorkouts", JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    const theme = THEME_PRESETS[prefs.theme] || THEME_PRESETS.aurora;
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [prefs.theme]);

  useEffect(() => {
    if (prefs.defaultMeal === "Auto") {
      setSelectedMeal(getDefaultMeal());
      return;
    }
    if (prefs.defaultMeal) {
      setSelectedMeal(prefs.defaultMeal);
    }
  }, [prefs.defaultMeal]);

  useEffect(() => {
    if (prevWaterUnitRef.current !== prefs.waterUnit) {
      setWaterCustomAmount(prefs.waterStep);
      prevWaterUnitRef.current = prefs.waterUnit;
    }
  }, [prefs.waterStep, prefs.waterUnit]);

  useEffect(() => {
    if (activePage !== "dashboard") {
      setShowSettings(false);
    }
  }, [activePage]);

  useEffect(() => {
    if (currentDayIndex > days.length - 1) {
      setCurrentDayIndex(Math.max(0, days.length - 1));
    }
  }, [days, currentDayIndex]);

  useEffect(() => {
    setDialogAmountValue(1);
    setDialogAmountUnit("servings");
    setDialogServingOption(0);
  }, [selectedFoodIndex, apiFoods]);

  const activeDay = days[currentDayIndex] || createDay();
  const dayGoalOverrides = activeDay.goalOverrides || {};
  const hasDayOverrides = Object.keys(dayGoalOverrides).length > 0;
  const effectiveGoals = useMemo(
    () => ({ ...goals, ...dayGoalOverrides }),
    [goals, dayGoalOverrides]
  );
  const burnedCalories = Math.max(0, numberOrZero(activeDay.burnedCalories));
  const calorieGoal = Math.max(0, effectiveGoals.calories + burnedCalories);

  const updateDay = useCallback((index, updater) => {
    setDays((prev) =>
      prev.map((day, i) => (i === index ? updater(day) : day))
    );
  }, []);

  const updateCurrentDay = useCallback(
    (updater) => {
      updateDay(currentDayIndex, updater);
    },
    [currentDayIndex, updateDay]
  );

  const addFoodToCurrentDay = useCallback(
    (food) => {
      updateCurrentDay((day) => ({
        ...day,
        foods: [...day.foods, normalizeFood(food)],
      }));
    },
    [updateCurrentDay]
  );

  const totals = useMemo(() => sumFoods(activeDay.foods), [activeDay.foods]);

  const mealTotals = useMemo(() => {
    const map = {};
    MEALS.forEach((meal) => {
      map[meal] = { calories: 0, protein: 0, fat: 0, carbs: 0, count: 0 };
    });
    activeDay.foods.forEach((food) => {
      const meal = food.meal || "Snack";
      if (!map[meal]) {
        map[meal] = { calories: 0, protein: 0, fat: 0, carbs: 0, count: 0 };
      }
      map[meal].calories += numberOrZero(food.calories);
      map[meal].protein += numberOrZero(food.protein);
      map[meal].fat += numberOrZero(food.fat);
      map[meal].carbs += numberOrZero(food.carbs);
      map[meal].count += 1;
    });
    return map;
  }, [activeDay.foods]);

  const macroCalories = useMemo(() => {
    const proteinCal = totals.protein * 4;
    const carbCal = totals.carbs * 4;
    const fatCal = totals.fat * 9;
    const total = proteinCal + carbCal + fatCal;
    return { proteinCal, carbCal, fatCal, total };
  }, [totals]);

  const macroSplit = useMemo(() => {
    if (!macroCalories.total) {
      return { protein: 0, carbs: 0, fat: 0 };
    }
    return {
      protein: Math.round((macroCalories.proteinCal / macroCalories.total) * 100),
      carbs: Math.round((macroCalories.carbCal / macroCalories.total) * 100),
      fat: Math.round((macroCalories.fatCal / macroCalories.total) * 100),
    };
  }, [macroCalories]);

  const insights = useMemo(() => {
    if (!days.length) {
      return {
        averages: { calories: 0, protein: 0, carbs: 0, fat: 0, waterOz: 0 },
        streak: 0,
        topFoods: [],
        bestDay: null,
      };
    }

    const summaries = days.map((day) => ({
      day,
      totals: sumFoods(day.foods || []),
    }));

    const last7 = summaries.slice(-7);
    const averages = last7.reduce(
      (acc, entry) => {
        acc.calories += entry.totals.calories;
        acc.protein += entry.totals.protein;
        acc.carbs += entry.totals.carbs;
        acc.fat += entry.totals.fat;
        acc.waterOz += numberOrZero(entry.day.waterOz);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, waterOz: 0 }
    );
    const divisor = Math.max(1, last7.length);
    Object.keys(averages).forEach((key) => {
      averages[key] = averages[key] / divisor;
    });

    const foodCounts = summaries.reduce((acc, entry) => {
      (entry.day.foods || []).forEach((food) => {
        const key = food.food || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
      });
      return acc;
    }, {});

    const topFoods = Object.entries(foodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([food, count]) => ({ food, count }));

    let streak = 0;
    for (let i = summaries.length - 1; i >= 0; i -= 1) {
      if ((summaries[i].day.foods || []).length === 0) break;
      streak += 1;
    }

    const bestDay = summaries.reduce((best, entry) => {
      const goal = goals.calories || 0;
      const diff = Math.abs(entry.totals.calories - goal);
      if (!best || diff < best.diff) {
        return { diff, entry };
      }
      return best;
    }, null);

    return {
      averages,
      streak,
      topFoods,
      bestDay: bestDay ? bestDay.entry : null,
    };
  }, [days, goals.calories]);

  const plansByDate = useMemo(() => {
    return plans.reduce((acc, item) => {
      const key = item.dateISO || "unscheduled";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [plans]);

  const sortedPlanDates = useMemo(() => {
    return Object.keys(plansByDate).sort((a, b) => b.localeCompare(a));
  }, [plansByDate]);

  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) =>
      (b.dateISO || "").localeCompare(a.dateISO || "")
    );
  }, [measurements]);

  const sortedWorkouts = useMemo(() => {
    return [...workouts].sort((a, b) =>
      (b.dateISO || "").localeCompare(a.dateISO || "")
    );
  }, [workouts]);

  const latestMeasurement = sortedMeasurements[0] || null;
  const previousMeasurement = sortedMeasurements[1] || null;
  const measurementDelta = (field) => {
    if (!latestMeasurement || !previousMeasurement) return null;
    const latestVal = latestMeasurement[field];
    const previousVal = previousMeasurement[field];
    if (latestVal === null || latestVal === undefined) return null;
    if (previousVal === null || previousVal === undefined) return null;
    const delta = numberOrZero(latestVal) - numberOrZero(previousVal);
    return Number.isFinite(delta) ? delta : null;
  };

  const formatDelta = (value) => {
    if (value === null || value === undefined) return "";
    const rounded = Math.round(value * 10) / 10;
    const sign = rounded > 0 ? "+" : "";
    return `${sign}${rounded}`;
  };

  const visibleFoods = useMemo(() => {
    let list = activeDay.foods;
    if (mealFilter !== "All") {
      list = list.filter((f) => f.meal === mealFilter);
    }
    if (sourceFilter !== "All") {
      list = list.filter((f) => (f.source || "manual") === sourceFilter);
    }
    const sorted = [...list].sort((a, b) => {
      const { key } = sortConfig;
      let aVal = a[key];
      let bVal = b[key];

      if (key === "food" || key === "meal") {
        const aText = (aVal || "").toString();
        const bText = (bVal || "").toString();
        return aText.localeCompare(bText);
      }

      if (key === "createdAt") {
        aVal = numberOrZero(aVal);
        bVal = numberOrZero(bVal);
        return aVal - bVal;
      }

      aVal = numberOrZero(aVal);
      bVal = numberOrZero(bVal);
      return aVal - bVal;
    });

    if (sortConfig.dir === "desc") {
      sorted.reverse();
    }
    return sorted;
  }, [activeDay.foods, mealFilter, sortConfig]);

  const calorieRemaining = Math.max(0, calorieGoal - totals.calories);
  const calorieOver = totals.calories - calorieGoal;
  const caloriePercent = clampPercent(totals.calories, calorieGoal);
  const waterPercent = clampPercent(
    activeDay.waterOz,
    effectiveGoals.waterOz
  );
  const waterDisplay = toDisplayWater(activeDay.waterOz, prefs.waterUnit);
  const waterGoalDisplay = toDisplayWater(
    effectiveGoals.waterOz,
    prefs.waterUnit
  );
  const waterGoalInput = toDisplayWater(goals.waterOz, prefs.waterUnit);
  const dayWaterGoalInput =
    dayGoalOverrides.waterOz && dayGoalOverrides.waterOz > 0
      ? toDisplayWater(dayGoalOverrides.waterOz, prefs.waterUnit)
      : "";
  const waterRemainingDisplay = Math.max(
    0,
    waterGoalDisplay - waterDisplay
  );

  const updateSearchHistory = (term) => {
    setSearchHistory((prev) => {
      const cleaned = term.trim();
      if (!cleaned) return prev;
      const next = [cleaned, ...prev.filter((t) => t !== cleaned)];
      return next.slice(0, 8);
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const handleGoalChange = (field, value) => {
    let numeric = numberOrZero(value);
    if (field === "waterOz" && prefs.waterUnit === "ml") {
      numeric = toWaterOz(numeric, prefs.waterUnit);
    }
    setGoals((prev) => ({
      ...prev,
      [field]: Math.max(0, numeric),
    }));
  };

  const applyMacroPreset = (presetKey) => {
    const preset = MACRO_PRESETS[presetKey];
    if (!preset) return;

    setGoals((prev) => {
      const calories = numberOrZero(prev.calories);
      if (!calories) return prev;
      const protein = Math.round((calories * preset.protein) / 4);
      const carbs = Math.round((calories * preset.carbs) / 4);
      const fat = Math.round((calories * preset.fat) / 9);
      return { ...prev, protein, carbs, fat };
    });
  };

  const handlePrefChange = (field, value) => {
    setPrefs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDayMetaChange = (field, value) => {
    updateCurrentDay((day) => ({
      ...day,
      [field]: value,
    }));
  };

  const handleDayGoalChange = (field, value) => {
    let numeric = numberOrZero(value);
    if (field === "waterOz" && prefs.waterUnit === "ml") {
      numeric = toWaterOz(numeric, prefs.waterUnit);
    }

    updateCurrentDay((day) => {
      const nextOverrides = { ...(day.goalOverrides || {}) };
      if (!numeric || numeric <= 0) {
        delete nextOverrides[field];
      } else {
        nextOverrides[field] = numeric;
      }
      return { ...day, goalOverrides: nextOverrides };
    });
  };

  const enableDayOverrides = () => {
    updateCurrentDay((day) => ({
      ...day,
      goalOverrides: {
        calories: effectiveGoals.calories,
        protein: effectiveGoals.protein,
        fat: effectiveGoals.fat,
        carbs: effectiveGoals.carbs,
        waterOz: effectiveGoals.waterOz,
      },
    }));
  };

  const clearDayOverrides = () => {
    updateCurrentDay((day) => ({ ...day, goalOverrides: {} }));
  };

  const scrollToRef = (ref) => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleDashboardSection = (sectionId) => {
    setDashboardSectionsOpen((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const openDashboardSection = (sectionId) => {
    setDashboardSectionsOpen((prev) => ({
      ...prev,
      [sectionId]: true,
    }));
  };

  const toggleSidebarSection = (sectionId) => {
    setSidebarSection((prev) => (prev === sectionId ? "" : sectionId));
  };

  const toggleSettings = () => {
    setActivePage("dashboard");
    setShowSettings((prev) => {
      const next = !prev;
      if (!prev) {
        setTimeout(() => scrollToRef(settingsRef), 0);
      }
      return next;
    });
  };

  const openTdeeCalculator = async () => {
    const formulaOptions = TDEE_FORMULAS.map(
      (item) => `<option value="${item.value}">${item.label}</option>`
    ).join("");
    const activityOptions = ACTIVITY_LEVELS.map(
      (item) => `<option value="${item.value}">${item.label}</option>`
    ).join("");

    const result = await Swal.fire({
      title: "Calculate My TDEE",
      customClass: {
        popup: "tdee-swal",
      },
      html: `
        <div class="tdee-grid">
          <div class="tdee-field">
            <div class="swal2-label">Formula</div>
            <select id="tdeeFormula" class="swal2-select">${formulaOptions}</select>
          </div>
          <div class="tdee-field" id="tdeeSexRow">
            <div class="swal2-label">Sex</div>
            <select id="tdeeSex" class="swal2-select">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div class="tdee-field">
            <div class="swal2-label">Age</div>
            <input id="tdeeAge" type="number" class="swal2-input" placeholder="Age" min="0" step="1">
          </div>
          <div class="tdee-field">
            <div class="swal2-label">Height</div>
            <div class="swal2-row">
              <input id="tdeeHeight" type="number" class="swal2-input" placeholder="Height" min="0" step="0.1">
              <select id="tdeeHeightUnit" class="swal2-select">
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>
          <div class="tdee-field">
            <div class="swal2-label">Weight</div>
            <div class="swal2-row">
              <input id="tdeeWeight" type="number" class="swal2-input" placeholder="Weight" min="0" step="0.1">
              <select id="tdeeWeightUnit" class="swal2-select">
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>
          <div class="tdee-field" id="tdeeBodyFatRow">
            <div class="swal2-label">Body fat %</div>
            <input id="tdeeBodyFat" type="number" class="swal2-input" placeholder="Body fat %" min="0" max="70" step="0.1">
          </div>
          <div class="tdee-field">
            <div class="swal2-label">Activity level</div>
            <select id="tdeeActivity" class="swal2-select">${activityOptions}</select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Calculate",
      focusConfirm: false,
      didOpen: () => {
        const formulaEl = document.getElementById("tdeeFormula");
        const bodyFatRow = document.getElementById("tdeeBodyFatRow");
        const sexRow = document.getElementById("tdeeSexRow");

        const updateVisibility = () => {
          const formula = formulaEl.value;
          const needsBodyFat = ["katch", "cunningham"].includes(formula);
          const needsSex = !["katch", "cunningham"].includes(formula);
          if (bodyFatRow) {
            bodyFatRow.style.display = needsBodyFat ? "block" : "none";
          }
          if (sexRow) {
            sexRow.style.display = needsSex ? "block" : "none";
          }
        };

        updateVisibility();
        formulaEl.addEventListener("change", updateVisibility);
      },
      preConfirm: () => {
        const formula = document.getElementById("tdeeFormula").value;
        const sex = document.getElementById("tdeeSex")?.value || "female";
        const age = numberOrZero(document.getElementById("tdeeAge").value);
        const heightValue = numberOrZero(
          document.getElementById("tdeeHeight").value
        );
        const heightUnit = document.getElementById("tdeeHeightUnit").value;
        const weightValue = numberOrZero(
          document.getElementById("tdeeWeight").value
        );
        const weightUnit = document.getElementById("tdeeWeightUnit").value;
        const bodyFatValue = numberOrZero(
          document.getElementById("tdeeBodyFat")?.value
        );
        const activity = numberOrZero(
          document.getElementById("tdeeActivity").value
        );

        const needsSex = [
          "mifflin",
          "harris",
          "revised",
          "owen",
          "schofield",
          "who",
        ].includes(formula);
        const needsAge = ["mifflin", "harris", "revised", "schofield"].includes(
          formula
        );
        const needsHeight = ["mifflin", "harris", "revised"].includes(formula);
        const needsBodyFat = ["katch", "cunningham"].includes(formula);

        if (!weightValue || weightValue <= 0) {
          Swal.showValidationMessage("Enter a valid weight.");
          return false;
        }
        if (needsHeight && (!heightValue || heightValue <= 0)) {
          Swal.showValidationMessage("Enter a valid height.");
          return false;
        }
        if (needsAge && (!age || age <= 0)) {
          Swal.showValidationMessage("Enter a valid age.");
          return false;
        }
        if (needsBodyFat && (!bodyFatValue || bodyFatValue <= 0)) {
          Swal.showValidationMessage("Enter a valid body fat %.");
          return false;
        }
        if (formula === "schofield" && (age < 18 || age > 30)) {
          Swal.showValidationMessage(
            "Schofield formula here is set for ages 18-30."
          );
          return false;
        }
        if (needsSex && !sex) {
          Swal.showValidationMessage("Select a sex.");
          return false;
        }

        const weightKg =
          weightUnit === "lb" ? weightValue * 0.453592 : weightValue;
        const heightCm =
          heightUnit === "in" ? heightValue * 2.54 : heightValue;

        return {
          formula,
          sex,
          age,
          weightKg,
          heightCm,
          bodyFat: needsBodyFat ? bodyFatValue : null,
          activity,
        };
      },
    });

    if (!result.value) return;

    const tdeeValue = calculateTDEE(result.value);
    if (!tdeeValue) {
      await Swal.fire("Unable to calculate", "Check your inputs.", "error");
      return;
    }

    const rounded = Math.round(tdeeValue);
    const confirmation = await Swal.fire({
      title: "Your TDEE Estimate",
      html: `Estimated TDEE: <strong>${rounded}</strong> kcal/day.<br/>Set this as my daily calorie goal?`,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Set Goal",
      cancelButtonText: "Not now",
    });

    if (confirmation.isConfirmed) {
      setGlobalTDEE(rounded);
      localStorage.setItem("globalTDEE", String(rounded));
      setGoals((prev) => ({ ...prev, calories: rounded }));
      Swal.fire("Updated", "Daily calorie goal updated.", "success");
    }
  };

  const applySavedTdeeGoal = async () => {
    if (!globalTDEE) return;
    const rounded = Math.round(globalTDEE);
    const confirmation = await Swal.fire({
      title: "Use saved TDEE?",
      text: `Set daily calorie goal to ${rounded} kcal?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Set Goal",
      cancelButtonText: "Cancel",
    });

    if (confirmation.isConfirmed) {
      setGoals((prev) => ({ ...prev, calories: rounded }));
      Swal.fire("Updated", "Daily calorie goal updated.", "success");
    }
  };

  const jumpToLog = () => {
    setActivePage("dashboard");
    openDashboardSection("log");
    setTimeout(() => scrollToRef(logRef), 0);
  };

  const jumpToInsights = () => {
    setActivePage("dashboard");
    openDashboardSection("insights");
    setTimeout(() => scrollToRef(insightsRef), 0);
  };

  const resetRecipeForm = () => {
    setRecipeForm({
      name: "",
      servings: 1,
      calories: "",
      protein: "",
      fat: "",
      carbs: "",
      ingredients: "",
      notes: "",
    });
  };

  const handleAddRecipe = () => {
    const name = recipeForm.name.trim();
    if (!name) {
      Swal.fire("Name required", "Give your recipe a name.", "info");
      return;
    }
    const servings = Math.max(1, numberOrZero(recipeForm.servings));
    const calories = numberOrZero(recipeForm.calories);
    const protein = numberOrZero(recipeForm.protein);
    const fat = numberOrZero(recipeForm.fat);
    const carbs = numberOrZero(recipeForm.carbs);
    const ingredients = recipeForm.ingredients
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const nextRecipe = {
      id: createId(),
      name,
      servings,
      calories,
      protein,
      fat,
      carbs,
      ingredients,
      notes: recipeForm.notes.trim(),
      createdAt: Date.now(),
    };
    setRecipes((prev) => [nextRecipe, ...prev]);
    resetRecipeForm();
    Swal.fire({
      icon: "success",
      title: "Recipe saved",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const removeRecipe = (id) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
  };

  const duplicateRecipe = (recipe) => {
    setRecipes((prev) => [
      {
        ...recipe,
        id: createId(),
        name: `${recipe.name} (Copy)`,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  };

  const addRecipeToDay = (recipe) => {
    Swal.fire({
      title: `Add ${recipe.name}`,
      input: "number",
      inputValue: recipe.servings || 1,
      inputAttributes: { min: 0.25, step: 0.25 },
      confirmButtonText: "Add to Log",
      showCancelButton: true,
    }).then((result) => {
      if (!result.isConfirmed) return;
      const servings = Math.max(0.25, numberOrZero(result.value));
        addFoodToCurrentDay({
          id: createId(),
          food: recipe.name,
          calories: recipe.calories * servings,
          protein: recipe.protein * servings,
          fat: recipe.fat * servings,
          carbs: recipe.carbs * servings,
          servings,
          perServing: {
            calories: recipe.calories,
            protein: recipe.protein,
            fat: recipe.fat,
          carbs: recipe.carbs,
        },
        meal: selectedMeal,
        createdAt: Date.now(),
        source: "recipe",
        notes: recipe.notes || "",
      });
    });
  };

  const resetPlanForm = () => {
    setPlanForm((prev) => ({
      ...prev,
      name: "",
      calories: "",
      protein: "",
      fat: "",
      carbs: "",
      servings: 1,
      notes: "",
    }));
  };

  const handleAddPlanItem = () => {
    const name = planForm.name.trim();
    if (!name) {
      Swal.fire("Plan item needed", "Add a meal name first.", "info");
      return;
    }
    const item = {
      id: createId(),
      dateISO: planForm.dateISO,
      meal: planForm.meal,
      name,
      calories: numberOrZero(planForm.calories),
      protein: numberOrZero(planForm.protein),
      fat: numberOrZero(planForm.fat),
      carbs: numberOrZero(planForm.carbs),
      servings: Math.max(0.25, numberOrZero(planForm.servings)),
      notes: planForm.notes.trim(),
    };
    setPlans((prev) => [item, ...prev]);
    resetPlanForm();
  };

  const removePlanItem = (id) => {
    setPlans((prev) => prev.filter((item) => item.id !== id));
  };

  const removePlanDate = (dateISO) => {
    setPlans((prev) => prev.filter((item) => item.dateISO !== dateISO));
  };

  const applyPlanForDate = (dateISO) => {
    const items = plans.filter((item) => item.dateISO === dateISO);
    if (!items.length) {
      Swal.fire("No plan", "No entries planned for that day.", "info");
      return;
    }
    items.forEach((item) => {
        addFoodToCurrentDay({
          id: createId(),
          food: item.name,
          calories: item.calories * item.servings,
          protein: item.protein * item.servings,
          fat: item.fat * item.servings,
          carbs: item.carbs * item.servings,
          servings: item.servings,
          perServing: {
            calories: item.calories,
            protein: item.protein,
            fat: item.fat,
          carbs: item.carbs,
        },
        meal: item.meal,
        createdAt: Date.now(),
        source: "plan",
        notes: item.notes || "",
      });
    });
    Swal.fire({
      icon: "success",
      title: "Plan added to log",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleAddMeasurement = () => {
    const hasValues = ["weight", "bodyFat", "waist", "hips", "chest"].some(
      (field) => optionalNumber(measurementForm[field]) !== null
    );
    if (!hasValues) {
      Swal.fire("Add a value", "Enter at least one metric.", "info");
      return;
    }
    const entry = {
      id: createId(),
      dateISO: measurementForm.dateISO,
      weight: optionalNumber(measurementForm.weight),
      bodyFat: optionalNumber(measurementForm.bodyFat),
      waist: optionalNumber(measurementForm.waist),
      hips: optionalNumber(measurementForm.hips),
      chest: optionalNumber(measurementForm.chest),
      notes: measurementForm.notes.trim(),
    };
    setMeasurements((prev) => [entry, ...prev]);
    setMeasurementForm((prev) => ({
      ...prev,
      weight: "",
      bodyFat: "",
      waist: "",
      hips: "",
      chest: "",
      notes: "",
    }));
  };

  const removeMeasurement = (id) => {
    setMeasurements((prev) => prev.filter((item) => item.id !== id));
  };

  const addExerciseToDraft = () => {
    const name = exerciseDraft.name.trim();
    if (!name) return;
    const next = {
      name,
      sets: numberOrZero(exerciseDraft.sets),
      reps: numberOrZero(exerciseDraft.reps),
      weight: numberOrZero(exerciseDraft.weight),
    };
    setWorkoutExercises((prev) => [...prev, next]);
    setExerciseDraft({ name: "", sets: "", reps: "", weight: "" });
  };

  const removeDraftExercise = (index) => {
    setWorkoutExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const saveWorkout = () => {
    const title = workoutForm.title.trim();
    if (!title && workoutExercises.length === 0) {
      Swal.fire("Add a title or exercise", "Log at least one detail.", "info");
      return;
    }
    const entry = {
      id: createId(),
      dateISO: workoutForm.dateISO,
      title: title || "Workout",
      duration: numberOrZero(workoutForm.duration),
      calories: numberOrZero(workoutForm.calories),
      notes: workoutForm.notes.trim(),
      exercises: workoutExercises,
    };
    setWorkouts((prev) => [entry, ...prev]);
    setWorkoutForm((prev) => ({
      ...prev,
      title: "",
      duration: "",
      calories: "",
      notes: "",
    }));
    setWorkoutExercises([]);
    Swal.fire({
      icon: "success",
      title: "Workout saved",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const removeWorkout = (id) => {
    setWorkouts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleNewDay = () => {
    const newDay = createDay();
    setDays((prev) => [...prev, newDay]);
    setCurrentDayIndex((prev) => prev + 1);
    setMealFilter("All");
    setSelectedMeal(resolveDefaultMeal(prefs));
  };

  const handleCopyDay = () => {
    const clonedFoods = activeDay.foods.map((food) => ({
      ...food,
      id: createId(),
      createdAt: Date.now(),
    }));

    const newDay = {
      ...createDay(),
      foods: clonedFoods,
      notes: activeDay.notes,
      waterOz: activeDay.waterOz,
      burnedCalories: numberOrZero(activeDay.burnedCalories),
      goalOverrides: { ...(activeDay.goalOverrides || {}) },
    };

    setDays((prev) => [...prev, newDay]);
    setCurrentDayIndex((prev) => prev + 1);
    setSelectedMeal(resolveDefaultMeal(prefs));
  };

  const handleClearDay = () => {
    Swal.fire({
      title: "Clear this day?",
      text: "This removes all foods and resets water and notes.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Clear Day",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        updateCurrentDay((day) => ({
          ...day,
          foods: [],
          notes: "",
          waterOz: 0,
          burnedCalories: 0,
        }));
      }
    });
  };

  const handleDeleteDay = () => {
    if (days.length <= 1) {
      Swal.fire("Cannot delete", "You must keep at least one day.", "info");
      return;
    }
    Swal.fire({
      title: "Delete this day?",
      text: "This removes the entire day entry.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete Day",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (!result.isConfirmed) return;
      setDays((prev) => prev.filter((_, i) => i !== currentDayIndex));
      const nextIndex = Math.max(
        0,
        Math.min(currentDayIndex, days.length - 2)
      );
      setCurrentDayIndex(nextIndex);
      setMealFilter("All");
      setSelectedMeal(resolveDefaultMeal(prefs));
    });
  };

  const handleExport = () => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      days,
      goals,
      favorites,
      prefs,
      recipes,
      plans,
      measurements,
      workouts,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calorie-counter-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed)) {
          setDays(parsed.map(normalizeDay));
          setCurrentDayIndex(Math.max(0, parsed.length - 1));
        } else {
          const importedDays = Array.isArray(parsed.days)
            ? parsed.days.map(normalizeDay)
            : [];
          if (importedDays.length) {
            setDays(importedDays);
            setCurrentDayIndex(Math.max(0, importedDays.length - 1));
          }
          if (parsed.goals) {
            setGoals({ ...DEFAULT_GOALS, ...parsed.goals });
          }
          if (Array.isArray(parsed.favorites)) {
            setFavorites(parsed.favorites);
          }
          if (parsed.prefs) {
            setPrefs({ ...DEFAULT_PREFS, ...parsed.prefs });
          }
          if (Array.isArray(parsed.recipes)) {
            setRecipes(parsed.recipes);
          }
          if (Array.isArray(parsed.plans)) {
            setPlans(parsed.plans);
          }
          if (Array.isArray(parsed.measurements)) {
            setMeasurements(parsed.measurements);
          }
          if (Array.isArray(parsed.workouts)) {
            setWorkouts(parsed.workouts);
          }
        }

        Swal.fire("Imported", "Your data has been loaded.", "success");
      } catch (err) {
        Swal.fire("Import failed", "Invalid JSON file.", "error");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleCustomFood = () => {
    Swal.fire({
      title: "Add Custom Food",
      html: `
        <input id="foodName" class="swal2-input" placeholder="Food name">
        <input id="foodBrand" class="swal2-input" placeholder="Brand (optional)">
        <div class="swal2-label">Serving size per serving</div>
        <div class="swal2-row">
          <input id="servingSize" type="number" class="swal2-input" placeholder="Serving size" min="0" step="0.1">
          <select id="servingUnit" class="swal2-select">
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="oz">oz</option>
            <option value="lb">lb</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            <option value="cup">cup</option>
            <option value="tbsp">tbsp</option>
            <option value="tsp">tsp</option>
            <option value="fl oz">fl oz</option>
            <option value="pint">pint</option>
            <option value="quart">quart</option>
            <option value="gal">gal</option>
          </select>
        </div>
        <div id="servingConvert" class="swal2-helper"></div>
        <div class="swal2-label">Amount consumed (servings, g, oz, or cup)</div>
        <div class="swal2-row">
          <input id="amountValue" type="number" class="swal2-input" placeholder="Amount consumed" min="0" step="0.1">
          <select id="amountUnit" class="swal2-select">
            <option value="servings">servings</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="oz">oz</option>
            <option value="lb">lb</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            <option value="cup">cup</option>
            <option value="tbsp">tbsp</option>
            <option value="tsp">tsp</option>
            <option value="fl oz">fl oz</option>
            <option value="pint">pint</option>
            <option value="quart">quart</option>
            <option value="gal">gal</option>
          </select>
        </div>
        <div id="amountConvert" class="swal2-helper"></div>
        <input id="calories" type="number" class="swal2-input" placeholder="Calories per serving" min="0" step="0.1">
        <input id="protein" type="number" class="swal2-input" placeholder="Protein (g)" min="0" step="0.1">
        <input id="fat" type="number" class="swal2-input" placeholder="Fat (g)" min="0" step="0.1">
        <input id="carbs" type="number" class="swal2-input" placeholder="Carbs (g)" min="0" step="0.1">
        <textarea id="foodNotes" class="swal2-textarea" placeholder="Notes (optional)"></textarea>
      `,
      confirmButtonText: "Add Food",
      showClass: { popup: "animate__animated animate__fadeInDown" },
      hideClass: { popup: "animate__animated animate__fadeOutUp" },
      focusConfirm: false,
      didOpen: () => {
        const sizeEl = document.getElementById("servingSize");
        const unitEl = document.getElementById("servingUnit");
        const helperEl = document.getElementById("servingConvert");
        const amountEl = document.getElementById("amountValue");
        const amountUnitEl = document.getElementById("amountUnit");
        const amountHelperEl = document.getElementById("amountConvert");
        const updateHelper = () => {
          if (!helperEl) return;
          const text = getServingConversions(sizeEl.value, unitEl.value);
          helperEl.textContent = text || "";
        };
        const updateAmountHelper = () => {
          if (!amountHelperEl) return;
          const servings = getServingsFromAmount(
            amountEl.value,
            amountUnitEl.value,
            sizeEl.value,
            unitEl.value
          );
          amountHelperEl.textContent = servings
            ? `Calculated servings: ${formatCount(servings)}`
            : "";
        };
        if (unitEl) {
          unitEl.value = "g";
        }
        if (amountUnitEl) {
          amountUnitEl.value = "servings";
        }
        if (sizeEl && unitEl) {
          sizeEl.addEventListener("input", updateHelper);
          unitEl.addEventListener("change", updateHelper);
        }
        if (amountEl && amountUnitEl) {
          amountEl.addEventListener("input", updateAmountHelper);
          amountUnitEl.addEventListener("change", updateAmountHelper);
        }
        updateHelper();
        updateAmountHelper();
      },
      preConfirm: () => {
        const foodName = document.getElementById("foodName").value.trim();
        if (!foodName) {
          Swal.showValidationMessage("Food name is required");
          return false;
        }
        const brand = document.getElementById("foodBrand").value.trim();
        const servingSize = numberOrZero(
          document.getElementById("servingSize").value
        );
        const servingUnit = document.getElementById("servingUnit").value;
        const calories = numberOrZero(
          document.getElementById("calories").value
        );
        const protein = numberOrZero(document.getElementById("protein").value);
        const fat = numberOrZero(document.getElementById("fat").value);
        const carbs = numberOrZero(document.getElementById("carbs").value);
        let servings = 1;
        const amountValue = numberOrZero(
          document.getElementById("amountValue").value
        );
        const amountUnit = document.getElementById("amountUnit").value;
        if (servingSize < 0 || calories < 0 || protein < 0 || fat < 0 || carbs < 0) {
          Swal.showValidationMessage("Values cannot be negative.");
          return false;
        }
        if (amountValue < 0) {
          Swal.showValidationMessage("Amount cannot be negative.");
          return false;
        }
        if (amountValue > 0) {
          const computed = getServingsFromAmount(
            amountValue,
            amountUnit,
            servingSize,
            servingUnit
          );
          if (computed) {
            servings = Math.max(0.25, computed);
          } else if (amountUnit !== "servings") {
            Swal.showValidationMessage(
              "Enter a serving size to convert g/oz/cup."
            );
            return false;
          }
        }
        const notes = document.getElementById("foodNotes").value.trim();

        return {
          foodName,
          brand,
          servingSize,
          servingUnit,
          calories,
          protein,
          fat,
          carbs,
          servings,
          notes,
        };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const {
          foodName,
          brand,
          servingSize,
          servingUnit,
          calories,
          protein,
          fat,
          carbs,
          servings,
          notes,
        } = result.value;

        const totalMultiplier = servings;
        const totalFood = {
          id: createId(),
          food: foodName,
          brand,
          servingSize,
          servingUnit,
          notes,
          calories: calories * totalMultiplier,
          protein: protein * totalMultiplier,
          fat: fat * totalMultiplier,
          carbs: carbs * totalMultiplier,
          servings,
          perServing: { calories, protein, fat, carbs },
          meal: selectedMeal,
          createdAt: Date.now(),
          source: "custom",
        };

        addFoodToCurrentDay(totalFood);

        Swal.fire({
          icon: "success",
          title: `Added ${totalFood.food}`,
          html: `Added ${servings} serving(s) to ${selectedMeal}`,
          confirmButtonText: "OK",
        });
      }
    });
  };

  const handleQuickAdd = () => {
    Swal.fire({
      title: "Quick Add Calories",
      html: `
        <input id="quickName" class="swal2-input" placeholder="Label (optional)">
        <input id="quickCalories" type="number" class="swal2-input" placeholder="Total calories">
        <textarea id="quickNotes" class="swal2-textarea" placeholder="Notes (optional)"></textarea>
      `,
      confirmButtonText: "Add",
      focusConfirm: false,
      preConfirm: () => {
        const name =
          document.getElementById("quickName").value.trim() || "Quick Add";
        const calories = numberOrZero(
          document.getElementById("quickCalories").value
        );
        const notes = document.getElementById("quickNotes").value.trim();

        if (!calories || calories <= 0) {
          Swal.showValidationMessage("Calories are required");
          return false;
        }

        return { name, calories, notes };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const { name, calories, notes } = result.value;
          addFoodToCurrentDay({
            id: createId(),
            food: name,
            calories,
            protein: 0,
            fat: 0,
            carbs: 0,
            servings: 1,
            notes,
            perServing: { calories, protein: 0, fat: 0, carbs: 0 },
            meal: selectedMeal,
            createdAt: Date.now(),
          source: "quick",
        });

        Swal.fire({
          icon: "success",
          title: "Added",
          text: `${name} added to ${selectedMeal}`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleSearchFood = async (termOverride) => {
    const term = (termOverride ?? searchTerm).trim();
    if (!term) return;

    try {
      const apiKey = "44DJ4j0MDlGTmxsECDh7z64TVyWLfWNVSMnZbcJ3";
      setSearchTerm(term);
      if (apiFoods.length === 0 || currentSearchTerm !== term) {
        const response = await axios.get(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
            term
          )}&api_key=${apiKey}`
        );
        const foods = response.data.foods || [];
        setApiFoods(foods);
        setCurrentSearchTerm(term);
        setLoaded(5);
        updateSearchHistory(term);

        if (!foods || foods.length === 0) {
          Swal.fire("No Results", "No foods found for that search.", "info");
          return;
        }
      }

      setShowFoodDialog(true);
      setSelectedFoodIndex(0);
    } catch (err) {
      Swal.fire("Error", "Food search failed", "error");
    }
  };

  const addSelectedFood = () => {
    if (apiFoods.length === 0) return;

    const food = apiFoods[selectedFoodIndex];
    const brand = food.brandOwner || food.brandName || "";
    const servingOptions = buildUsdaServingOptions(food);
    const selectedServing =
      servingOptions[dialogServingOption] || servingOptions[0] || {};
    const baseServingSize = numberOrZero(food.servingSize);
    const baseServingUnit =
      normalizeServingUnit(food.servingSizeUnit) || food.servingSizeUnit || "";
    const servingSize =
      numberOrZero(selectedServing.size) || baseServingSize || 0;
    const servingUnit =
      normalizeServingUnit(selectedServing.unit) ||
      selectedServing.unit ||
      baseServingUnit ||
      "";
    const calories =
      food.foodNutrients?.find((n) => n.nutrientName === "Energy")?.value || 0;
    const protein =
      food.foodNutrients?.find((n) => n.nutrientName === "Protein")?.value || 0;
    const fat =
      food.foodNutrients?.find((n) => n.nutrientName === "Total lipid (fat)")
        ?.value || 0;
    const carbs =
      food.foodNutrients?.find(
        (n) => n.nutrientName === "Carbohydrate, by difference"
      )?.value || 0;

    const amountValue = numberOrZero(dialogAmountValue);
    const amountUnit = dialogAmountUnit;
    let servings = amountValue > 0 ? amountValue : 1;
    if (amountUnit !== "servings") {
      if (!servingSize || !servingUnit) {
        Swal.fire(
          "Missing serving size",
          "Select a serving size to convert units.",
          "info"
        );
        return;
      }
      const computed = getServingsFromAmount(
        amountValue,
        amountUnit,
        servingSize,
        servingUnit
      );
      if (computed) {
        servings = Math.max(0.25, computed);
      } else {
        Swal.fire("Conversion failed", "Check the serving size.", "info");
        return;
      }
    } else {
      servings = Math.max(0.25, servings);
    }

    let perServingCalories = calories;
    let perServingProtein = protein;
    let perServingFat = fat;
    let perServingCarbs = carbs;
    if (baseServingSize && baseServingUnit && servingSize && servingUnit) {
      const ratio =
        convertAmount(servingSize, servingUnit, baseServingUnit) /
        baseServingSize;
      if (Number.isFinite(ratio) && ratio > 0) {
        perServingCalories = calories * ratio;
        perServingProtein = protein * ratio;
        perServingFat = fat * ratio;
        perServingCarbs = carbs * ratio;
      }
    }

    const totalMultiplier = servings;
    const total = {
      id: createId(),
      food: food.description || "Unknown",
      brand,
      servingSize,
      servingUnit,
      calories: perServingCalories * totalMultiplier,
      protein: perServingProtein * totalMultiplier,
      fat: perServingFat * totalMultiplier,
      carbs: perServingCarbs * totalMultiplier,
      servings,
      perServing: {
        calories: perServingCalories,
        protein: perServingProtein,
        fat: perServingFat,
        carbs: perServingCarbs,
      },
      meal: selectedMeal,
      createdAt: Date.now(),
      source: "usda",
    };

    addFoodToCurrentDay(total);

    setShowFoodDialog(false);
    setSearchTerm("");

    Swal.fire({
      icon: "success",
      title: `Added ${total.food}`,
      html: `
          <strong>Total for ${formatCount(servings)} serving(s):</strong><br/>
          Calories: ${formatNumber(total.calories)} |
          Protein: ${formatNumber(total.protein)}g |
          Fat: ${formatNumber(total.fat)}g |
          Carbs: ${formatNumber(total.carbs)}g
        `,
      confirmButtonText: "OK",
    });
  };

  const handleLoadMore = () => {
    setLoaded((prev) => prev + 5);
  };

  const handleBarcodeUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      Quagga.decodeSingle(
        {
          src: reader.result,
          numOfWorkers: 0,
          inputStream: { size: 800 },
          decoder: { readers: ["code_128_reader", "ean_reader", "ean_8_reader"] },
        },
        async (result) => {
          if (result && result.codeResult) {
            const barcode = result.codeResult.code;
            try {
              const response = await axios.get(
                `https://world.openfoodfacts.net/api/v2/product/${barcode}.json`
              );

              const product = response.data.product || {};
              const nutriments = product.nutriments || {};
              const baseCalories = numberOrZero(nutriments["energy-kcal_100g"]);
              const baseProtein = numberOrZero(nutriments["proteins_100g"]);
              const baseFat = numberOrZero(nutriments["fat_100g"]);
              const baseCarbs = numberOrZero(nutriments["carbohydrates_100g"]);

              const { value: grams } = await Swal.fire({
                title: "Serving size (g)",
                input: "number",
                inputValue: 100,
                inputAttributes: { min: 1 },
                showCancelButton: true,
              });

              if (!grams) return;

              const multiplier = numberOrZero(grams) / 100;

                const foodData = {
                  id: createId(),
                  food: product.product_name || "Unknown",
                  calories: baseCalories * multiplier,
                  protein: baseProtein * multiplier,
                  fat: baseFat * multiplier,
                  carbs: baseCarbs * multiplier,
                  servings: 1,
                  perServing: {
                    calories: baseCalories * multiplier,
                    protein: baseProtein * multiplier,
                  fat: baseFat * multiplier,
                  carbs: baseCarbs * multiplier,
                },
                meal: selectedMeal,
                createdAt: Date.now(),
                source: "barcode",
              };

              addFoodToCurrentDay(foodData);

              Swal.fire({
                icon: "success",
                title: `Added ${foodData.food}`,
                html: `
                  Calories: ${formatNumber(foodData.calories)} <br/>
                  Protein: ${formatNumber(foodData.protein)}g <br/>
                  Fat: ${formatNumber(foodData.fat)}g <br/>
                  Carbs: ${formatNumber(foodData.carbs)}g
                `,
                timer: 4000,
                timerProgressBar: true,
              });
            } catch (err) {
              Swal.fire("Error", "Product not found in OpenFoodFacts", "error");
            }
          } else {
            Swal.fire("Error", "No barcode detected", "error");
          }
        }
      );
    };
    reader.readAsDataURL(file);
  };

  const removeFood = (id) => {
    const index = activeDay.foods.findIndex((food) => food.id === id);
    if (index === -1) return;

    const removed = activeDay.foods[index];
    const removal = { item: removed, index, dayIndex: currentDayIndex };

    updateCurrentDay((day) => {
      const nextFoods = [...day.foods];
      nextFoods.splice(index, 1);
      return { ...day, foods: nextFoods };
    });

    Swal.fire({
      toast: true,
      position: "bottom-end",
      icon: "info",
      title: "Food removed",
      showConfirmButton: true,
      confirmButtonText: "Undo",
      timer: 5000,
      timerProgressBar: true,
    }).then((result) => {
      if (result.isConfirmed && removal) {
        updateDay(removal.dayIndex, (day) => {
          const nextFoods = [...day.foods];
          nextFoods.splice(removal.index, 0, removal.item);
          return { ...day, foods: nextFoods };
        });
      }
    });
  };

  const handleEditFood = (id) => {
    const food = activeDay.foods.find((item) => item.id === id);
    if (!food) return;

    const servings = numberOrZero(food.servings) || 1;
    const perServing = food.perServing || {
      calories: servings ? food.calories / servings : food.calories,
      protein: servings ? food.protein / servings : food.protein,
      fat: servings ? food.fat / servings : food.fat,
      carbs: servings ? food.carbs / servings : food.carbs,
    };
    const mealOptions = MEALS.map(
      (meal) =>
        `<option value="${meal}" ${
          meal === (food.meal || "Snack") ? "selected" : ""
        }>${meal}</option>`
    ).join("");

    Swal.fire({
      title: "Edit Food",
      html: `
        <input id="editName" class="swal2-input" placeholder="Food name" value="${food.food}">
        <input id="editBrand" class="swal2-input" placeholder="Brand (optional)" value="${food.brand || ""}">
        <div class="swal2-label">Meal</div>
        <select id="editMeal" class="swal2-select">
          ${mealOptions}
        </select>
        <div class="swal2-label">Serving size per serving</div>
        <div class="swal2-row">
          <input id="editServingSize" type="number" class="swal2-input" placeholder="Serving size" value="${formatNumber(
            food.servingSize || 0
          )}" min="0" step="0.1">
          <select id="editServingUnit" class="swal2-select">
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="oz">oz</option>
            <option value="lb">lb</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            <option value="cup">cup</option>
            <option value="tbsp">tbsp</option>
            <option value="tsp">tsp</option>
            <option value="fl oz">fl oz</option>
            <option value="pint">pint</option>
            <option value="quart">quart</option>
            <option value="gal">gal</option>
          </select>
        </div>
        <div id="editServingConvert" class="swal2-helper"></div>
        <div class="swal2-label">Amount consumed (servings, g, oz, or cup)</div>
        <div class="swal2-row">
          <input id="editAmountValue" type="number" class="swal2-input" placeholder="Amount consumed" min="0" step="0.1">
          <select id="editAmountUnit" class="swal2-select">
            <option value="servings">servings</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="oz">oz</option>
            <option value="lb">lb</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            <option value="cup">cup</option>
            <option value="tbsp">tbsp</option>
            <option value="tsp">tsp</option>
            <option value="fl oz">fl oz</option>
            <option value="pint">pint</option>
            <option value="quart">quart</option>
            <option value="gal">gal</option>
          </select>
        </div>
        <div id="editAmountConvert" class="swal2-helper"></div>
        <input id="editCalories" type="number" class="swal2-input" placeholder="Calories per serving" value="${formatNumber(
          perServing.calories
        )}" min="0" step="0.1">
        <input id="editProtein" type="number" class="swal2-input" placeholder="Protein (g)" value="${formatNumber(
          perServing.protein
        )}" min="0" step="0.1">
        <input id="editFat" type="number" class="swal2-input" placeholder="Fat (g)" value="${formatNumber(
          perServing.fat
        )}" min="0" step="0.1">
        <input id="editCarbs" type="number" class="swal2-input" placeholder="Carbs (g)" value="${formatNumber(
          perServing.carbs
        )}" min="0" step="0.1">
        <textarea id="editNotes" class="swal2-textarea" placeholder="Notes (optional)">${food.notes || ""}</textarea>
      `,
      confirmButtonText: "Save",
      focusConfirm: false,
      didOpen: () => {
        const sizeEl = document.getElementById("editServingSize");
        const unitEl = document.getElementById("editServingUnit");
        const helperEl = document.getElementById("editServingConvert");
        const amountEl = document.getElementById("editAmountValue");
        const amountUnitEl = document.getElementById("editAmountUnit");
        const amountHelperEl = document.getElementById("editAmountConvert");
        if (unitEl) {
          unitEl.value = normalizeServingUnit(food.servingUnit) || "g";
        }
        const updateHelper = () => {
          if (!helperEl) return;
          const text = getServingConversions(sizeEl.value, unitEl.value);
          helperEl.textContent = text || "";
        };
        const updateAmountHelper = () => {
          if (!amountHelperEl) return;
          const servings = getServingsFromAmount(
            amountEl.value,
            amountUnitEl.value,
            sizeEl.value,
            unitEl.value
          );
          amountHelperEl.textContent = servings
            ? `Calculated servings: ${formatCount(servings)}`
            : "";
        };
        if (amountUnitEl) {
          amountUnitEl.value = "servings";
        }
        if (sizeEl && unitEl) {
          sizeEl.addEventListener("input", updateHelper);
          unitEl.addEventListener("change", updateHelper);
        }
        if (amountEl && amountUnitEl) {
          amountEl.addEventListener("input", updateAmountHelper);
          amountUnitEl.addEventListener("change", updateAmountHelper);
        }
        updateHelper();
        updateAmountHelper();
      },
        preConfirm: () => {
          const name = document.getElementById("editName").value.trim();
          if (!name) {
            Swal.showValidationMessage("Food name is required");
            return false;
          }
          const brand = document.getElementById("editBrand").value.trim();
          const meal = document.getElementById("editMeal").value;
          const servingSize = numberOrZero(
            document.getElementById("editServingSize").value
          );
        const servingUnit = document.getElementById("editServingUnit").value;
        const calories = numberOrZero(
          document.getElementById("editCalories").value
        );
        const protein = numberOrZero(
          document.getElementById("editProtein").value
        );
        const fat = numberOrZero(document.getElementById("editFat").value);
        const carbs = numberOrZero(document.getElementById("editCarbs").value);
          let servings = Math.max(0.25, numberOrZero(food.servings) || 1);
        const amountValue = numberOrZero(
          document.getElementById("editAmountValue").value
        );
        const amountUnit = document.getElementById("editAmountUnit").value;
        if (servingSize < 0 || calories < 0 || protein < 0 || fat < 0 || carbs < 0) {
          Swal.showValidationMessage("Values cannot be negative.");
          return false;
        }
        if (amountValue < 0) {
          Swal.showValidationMessage("Amount cannot be negative.");
          return false;
        }
        if (amountValue > 0) {
          const computed = getServingsFromAmount(
            amountValue,
            amountUnit,
            servingSize,
            servingUnit
          );
          if (computed) {
            servings = Math.max(0.25, computed);
          } else if (amountUnit !== "servings") {
            Swal.showValidationMessage(
              "Enter a serving size to convert g/oz/cup."
            );
            return false;
          }
        }
          const notes = document.getElementById("editNotes").value.trim();

          return {
            name,
            brand,
            meal,
            servingSize,
            servingUnit,
            calories,
            protein,
            fat,
            carbs,
            servings,
            notes,
          };
      },
        }).then((result) => {
          if (result.isConfirmed && result.value) {
            const {
              name,
              brand,
              meal,
              servingSize,
              servingUnit,
              calories,
              protein,
            fat,
            carbs,
            servings,
            notes,
          } = result.value;
        const totalMultiplier = servings;
        updateCurrentDay((day) => ({
          ...day,
          foods: day.foods.map((item) =>
            item.id === id
                ? {
                    ...item,
                    food: name,
                    brand,
                    meal,
                    servingSize,
                    servingUnit,
                    notes,
                  calories: calories * totalMultiplier,
                  protein: protein * totalMultiplier,
                  fat: fat * totalMultiplier,
                  carbs: carbs * totalMultiplier,
                  servings,
                  perServing: { calories, protein, fat, carbs },
                }
              : item
          ),
        }));
      }
    });
  };

  const duplicateFood = (id) => {
    const food = activeDay.foods.find((item) => item.id === id);
    if (!food) return;

    addFoodToCurrentDay({
      ...food,
      id: createId(),
      createdAt: Date.now(),
    });
  };

  const toggleFavorite = (food) => {
    setFavorites((prev) => {
      const exists = prev.find((fav) => fav.food === food.food);
      if (exists) {
        return prev.filter((fav) => fav.food !== food.food);
      }
      const perServing = food.perServing || {
        calories: food.servings ? food.calories / food.servings : food.calories,
        protein: food.servings ? food.protein / food.servings : food.protein,
        fat: food.servings ? food.fat / food.servings : food.fat,
        carbs: food.servings ? food.carbs / food.servings : food.carbs,
      };
      const next = [
        {
          id: createId(),
          food: food.food,
          brand: food.brand || "",
          servingSize: food.servingSize || 0,
          servingUnit: food.servingUnit || "",
          notes: food.notes || "",
          perServing,
        },
        ...prev,
      ];
      return next.slice(0, 12);
    });
  };

  const removeFavorite = (foodName) => {
    setFavorites((prev) => prev.filter((fav) => fav.food !== foodName));
  };

  const addFromFavorite = (fav) => {
    Swal.fire({
      title: `Add ${fav.food}`,
      html: `
        <input id="favServings" type="number" class="swal2-input" placeholder="Servings" value="1" min="0.25" step="0.25">
        `,
        confirmButtonText: "Add",
        focusConfirm: false,
        preConfirm: () => {
          const servings = Math.max(
            0.25,
            numberOrZero(document.getElementById("favServings").value)
          );
          return { servings };
        },
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const { servings } = result.value;
          const calories = numberOrZero(fav.perServing?.calories);
          const protein = numberOrZero(fav.perServing?.protein);
          const fat = numberOrZero(fav.perServing?.fat);
          const carbs = numberOrZero(fav.perServing?.carbs);
          const totalMultiplier = servings;

          addFoodToCurrentDay({
            id: createId(),
            food: fav.food,
            brand: fav.brand || "",
            servingSize: fav.servingSize || 0,
            servingUnit: fav.servingUnit || "",
            notes: fav.notes || "",
            calories: calories * totalMultiplier,
            protein: protein * totalMultiplier,
            fat: fat * totalMultiplier,
          carbs: carbs * totalMultiplier,
          servings,
          perServing: { calories, protein, fat, carbs },
          meal: selectedMeal,
          createdAt: Date.now(),
          source: "favorite",
        });
      }
    });
  };

  const adjustWater = (delta) => {
    const deltaOz = toWaterOz(delta, prefs.waterUnit);
    updateCurrentDay((day) => ({
      ...day,
      waterOz: Math.max(0, numberOrZero(day.waterOz) + deltaOz),
    }));
  };

  const handleCustomWaterAdd = () => {
    const amount = numberOrZero(waterCustomAmount);
    if (!amount || amount <= 0) return;
    adjustWater(amount);
  };

  const toggleSortDir = () => {
    setSortConfig((prev) => ({
      ...prev,
      dir: prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const switchDay = (index) => {
    setCurrentDayIndex(index);
  };

  return (
    <div
      className={`cal-page ${
        prefs.density === "compact" ? "density-compact" : ""
      }`}
    >
      {showFoodDialog && (
        <div className="food-dialog-overlay">
          <div className="food-dialog">
            <h2>Select Food</h2>
            <div className="food-options-list">
              {apiFoods.slice(0, loaded).map((food, index) => {
                const servingSize = numberOrZero(food.servingSize);
                const servingUnit =
                  normalizeServingUnit(food.servingSizeUnit) ||
                  food.servingSizeUnit ||
                  "";
                const householdText = food.householdServingFullText || "";
                const portionCount = Array.isArray(food.foodPortions)
                  ? food.foodPortions.length
                  : 0;
                const servingLabel = householdText
                  ? householdText
                  : servingSize && servingUnit
                  ? `${formatCount(servingSize)} ${servingUnit}`
                  : "Serving size not listed";
                const calories =
                  food.foodNutrients?.find(
                    (n) => n.nutrientName === "Energy"
                  )?.value || 0;
                const protein =
                  food.foodNutrients?.find(
                    (n) => n.nutrientName === "Protein"
                  )?.value || 0;
                const fat =
                  food.foodNutrients?.find(
                    (n) => n.nutrientName === "Total lipid (fat)"
                  )?.value || 0;
                const carbs =
                  food.foodNutrients?.find(
                    (n) =>
                      n.nutrientName === "Carbohydrate, by difference"
                  )?.value || 0;

                return (
                  <div
                    key={food.fdcId || index}
                    className={`food-option ${
                      selectedFoodIndex === index ? "selected" : ""
                    }`}
                    onClick={() => setSelectedFoodIndex(index)}
                  >
                    <strong>{food.description || "Unknown"}</strong>
                      <span>
                        Calories: {formatNumber(calories)} | Protein:{" "}
                        {formatNumber(protein)}g | Fat: {formatNumber(fat)}g |
                        Carbs: {formatNumber(carbs)}g
                      </span>
                      <span className="food-serving">
                        Serving: {servingLabel}
                        {portionCount ? ` • ${portionCount} portions` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>

            {loaded < apiFoods.length && (
              <button className="btn ghost full" onClick={handleLoadMore}>
                Load More
              </button>
            )}

              {apiFoods[selectedFoodIndex] && (
                <>
                  <div className="dialog-field">
                    <label>Serving size basis</label>
                    <select
                      className="select"
                      value={dialogServingOption}
                      onChange={(e) =>
                        setDialogServingOption(Number(e.target.value))
                      }
                    >
                      {buildUsdaServingOptions(
                        apiFoods[selectedFoodIndex]
                      ).map((option, idx) => (
                        <option key={`${option.label}-${idx}`} value={idx}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const options = buildUsdaServingOptions(
                        apiFoods[selectedFoodIndex]
                      );
                      const selected =
                        options[dialogServingOption] || options[0];
                      if (!selected) return null;
                      const helper = getServingConversions(
                        selected.size,
                        selected.unit
                      );
                      return helper ? (
                        <span className="muted dialog-helper">{helper}</span>
                      ) : null;
                    })()}
                  </div>

                  <div className="dialog-field">
                    <label>Amount consumed</label>
                    <div className="dialog-row">
                      <input
                        type="number"
                        value={dialogAmountValue}
                        onChange={(e) =>
                          setDialogAmountValue(e.target.value)
                        }
                        min="0"
                        step="0.1"
                      />
                      <select
                        className="select"
                        value={dialogAmountUnit}
                        onChange={(e) =>
                          setDialogAmountUnit(e.target.value)
                        }
                      >
                        <option value="servings">servings</option>
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="oz">oz</option>
                        <option value="lb">lb</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="cup">cup</option>
                        <option value="tbsp">tbsp</option>
                        <option value="tsp">tsp</option>
                        <option value="fl oz">fl oz</option>
                        <option value="pint">pint</option>
                        <option value="quart">quart</option>
                        <option value="gal">gal</option>
                      </select>
                    </div>
                    {(() => {
                      const options = buildUsdaServingOptions(
                        apiFoods[selectedFoodIndex]
                      );
                      const selected =
                        options[dialogServingOption] || options[0];
                      if (!selected || dialogAmountUnit === "servings") {
                        return null;
                      }
                      const computed = getServingsFromAmount(
                        dialogAmountValue,
                        dialogAmountUnit,
                        selected.size,
                        selected.unit
                      );
                      return computed ? (
                        <span className="muted dialog-helper">
                          Calculated servings: {formatCount(computed)}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </>
              )}

            <div className="dialog-actions">
              <button
                className="btn ghost"
                onClick={() => setShowFoodDialog(false)}
              >
                Cancel
              </button>
              <button className="btn primary" onClick={addSelectedFood}>
                Add Food
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cal-shell">
        <aside className="cal-sidebar">
          <div className="side-brand">
            <h2>Calorie HQ</h2>
            <p className="muted">Local-first performance tracker.</p>
          </div>
          <div className="sidebar-accordion">
            <SidebarSection
              id="sidebar-nav"
              title="Navigation"
              isOpen={sidebarSection === "nav"}
              onToggle={() => toggleSidebarSection("nav")}
            >
              <div className="side-nav">
                {[
                  { id: "dashboard", label: "Dashboard" },
                  { id: "planner", label: "Planner" },
                  { id: "recipes", label: "Recipes" },
                  { id: "measurements", label: "Measurements" },
                  { id: "training", label: "Training" },
                ].map((page) => (
                  <button
                    key={page.id}
                    className={`side-item ${
                      activePage === page.id ? "active" : ""
                    }`}
                    onClick={() => setActivePage(page.id)}
                  >
                    {page.label}
                  </button>
                ))}
              </div>
            </SidebarSection>

            <SidebarSection
              id="sidebar-actions"
              title="Quick Actions"
              badge="4 actions"
              isOpen={sidebarSection === "actions"}
              onToggle={() => toggleSidebarSection("actions")}
            >
              <div className="side-quick">
                <button className="btn ghost full" onClick={handleNewDay}>
                  New Day
                </button>
                <button className="btn ghost full" onClick={jumpToLog}>
                  Log Food
                </button>
                <button className="btn ghost full" onClick={jumpToInsights}>
                  Insights
                </button>
                <button className="btn primary full" onClick={toggleSettings}>
                  Settings
                </button>
              </div>
            </SidebarSection>

            <SidebarSection
              id="sidebar-snapshot"
              title="Daily Snapshot"
              badge={`${activeDay.foods.length} foods`}
              isOpen={sidebarSection === "snapshot"}
              onToggle={() => toggleSidebarSection("snapshot")}
            >
              <div className="side-stats">
                <div className="mini-stat">
                  <span>Calories</span>
                  <strong>{Math.round(totals.calories)} kcal</strong>
                </div>
                <div className="mini-stat">
                  <span>Protein</span>
                  <strong>{Math.round(totals.protein)} g</strong>
                </div>
                <div className="mini-stat">
                  <span>Hydration</span>
                  <strong>
                    {waterDisplay} {prefs.waterUnit}
                  </strong>
                </div>
                <div className="mini-stat">
                  <span>Streak</span>
                  <strong>{insights.streak} days</strong>
                </div>
              </div>
            </SidebarSection>
          </div>
        </aside>

        <main className="cal-main">
          {activePage === "dashboard" && (
            <>
              <header className="hero" ref={topRef}>
        <div>
          <h1 data-text="Calorie Counter">Calorie Counter</h1>
          <p className="subtitle">
            Track meals, macros, and hydration with goals you can actually hit.
          </p>
          <div className="day-meta">
            <span>Day {currentDayIndex + 1}</span>
            {activeDay.dateLabel && <span>{activeDay.dateLabel}</span>}
            <span>{formatDate(activeDay.dateISO) || activeDay.date}</span>
            <span>{activeDay.foods.length} foods logged</span>
          </div>
        </div>
        <div className="hero-actions">
          <button className="btn primary" onClick={handleNewDay}>
            New Day
          </button>
          <button className="btn ghost" onClick={handleCopyDay}>
            Copy Day
          </button>
          <button className="btn warning" onClick={handleClearDay}>
            Clear Day
          </button>
          <button className="btn danger" onClick={handleDeleteDay}>
            Delete Day
          </button>
        </div>
      </header>

      <div className="section-nav">
        <button
          className="nav-btn"
          onClick={() => {
            openDashboardSection("overview");
            setTimeout(() => scrollToRef(overviewRef), 0);
          }}
        >
          Overview
        </button>
        <button
          className="nav-btn"
          onClick={() => {
            openDashboardSection("log");
            setTimeout(() => scrollToRef(logRef), 0);
          }}
        >
          Log Food
        </button>
        <button
          className="nav-btn"
          onClick={() => {
            openDashboardSection("insights");
            setTimeout(() => scrollToRef(insightsRef), 0);
          }}
        >
          Insights
        </button>
        <button className="nav-btn primary" onClick={toggleSettings}>
          Settings
        </button>
      </div>

      <CollapsibleSection
        id="overview"
        title="Overview"
        subtitle="Day plan, calories, macros, hydration"
        badge={`${Math.round(caloriePercent)}% of goal`}
        isOpen={dashboardSectionsOpen.overview}
        onToggle={() => toggleDashboardSection("overview")}
        headerRef={overviewRef}
      >
      <section className="day-editor">
        <div className="section-header">
          <div>
            <h2>Day Planner</h2>
            <p className="muted">Name the day and adjust the date.</p>
          </div>
        </div>
        <div className="day-editor-grid">
          <label>
            Day Title
            <input
              type="text"
              value={activeDay.dateLabel}
              onChange={(e) => handleDayMetaChange("dateLabel", e.target.value)}
              placeholder="e.g. Heavy Training, Rest Day"
            />
          </label>
            <label>
              Date
              <input
                type="date"
                value={activeDay.dateISO || ""}
                onChange={(e) => {
                  const nextISO = e.target.value;
                  const nextLabel = nextISO ? formatDate(nextISO) : "";
                  handleDayMetaChange("dateISO", nextISO);
                  if (!activeDay.dateLabel && nextISO) {
                    handleDayMetaChange("date", nextLabel);
                  }
                }}
              />
            </label>
            <label>
              Burned Calories
              <input
                type="number"
                value={activeDay.burnedCalories || ""}
                onChange={(e) =>
                  handleDayMetaChange(
                    "burnedCalories",
                    Math.max(0, numberOrZero(e.target.value))
                  )
                }
                placeholder="e.g. 200"
                min="0"
                step="1"
              />
              <span className="muted">Adds to today's calorie goal</span>
            </label>
          </div>

      </section>

      <section className="summary-grid">
        <div className="summary-card tone-calories">
          <div className="summary-header">
            <h3>Calories</h3>
            <button className="chip" onClick={toggleSettings}>
              Set Goals
            </button>
          </div>
          <div
            className="ring"
            style={{ "--value": `${caloriePercent.toFixed(0)}` }}
          >
            <div className="ring-inner">
              <strong>{Math.round(totals.calories)}</strong>
              <span>kcal</span>
            </div>
          </div>
            <p className={`summary-note ${calorieOver > 0 ? "over" : ""}`}>
              {calorieOver > 0
                ? `${Math.round(calorieOver)} kcal over`
                : `${Math.round(calorieRemaining)} kcal remaining`}
            </p>
            {burnedCalories > 0 && (
              <p className="summary-note muted">
                Goal includes +{Math.round(burnedCalories)} kcal burned
              </p>
            )}
          </div>

        <div className="summary-card tone-macros">
          <h3>Macros</h3>
          <div className="macro-grid">
            <div>
              <span>Protein</span>
              <strong>{formatNumber(totals.protein)}g</strong>
            </div>
            <div>
              <span>Carbs</span>
              <strong>{formatNumber(totals.carbs)}g</strong>
            </div>
            <div>
              <span>Fat</span>
              <strong>{formatNumber(totals.fat)}g</strong>
            </div>
          </div>
          <div className="macro-bars">
            <div className="macro-bar">
              <span>Protein</span>
              <div className="bar">
                <div
                  className="fill protein"
                  style={{
                    width: `${clampPercent(
                      totals.protein,
                      effectiveGoals.protein
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div className="macro-bar">
              <span>Carbs</span>
              <div className="bar">
                <div
                  className="fill carbs"
                  style={{
                    width: `${clampPercent(
                      totals.carbs,
                      effectiveGoals.carbs
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div className="macro-bar">
              <span>Fat</span>
              <div className="bar">
                <div
                  className="fill fat"
                  style={{
                    width: `${clampPercent(totals.fat, effectiveGoals.fat)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card tone-split">
          <h3>Macro Split</h3>
          <div className="split-grid">
            <div>
              <span>Protein</span>
              <strong>{macroSplit.protein}%</strong>
            </div>
            <div>
              <span>Carbs</span>
              <strong>{macroSplit.carbs}%</strong>
            </div>
            <div>
              <span>Fat</span>
              <strong>{macroSplit.fat}%</strong>
            </div>
          </div>
          <div className="split-bar">
            <span
              className="split protein"
              style={{ width: `${macroSplit.protein}%` }}
            />
            <span
              className="split carbs"
              style={{ width: `${macroSplit.carbs}%` }}
            />
            <span
              className="split fat"
              style={{ width: `${macroSplit.fat}%` }}
            />
          </div>
          <p className="summary-note">
            {macroCalories.total ? `${Math.round(macroCalories.total)} kcal` : "Log foods to see split"}
          </p>
        </div>

        <div className="summary-card tone-water">
          <h3>Hydration</h3>
          <div
            className="ring small"
            style={{ "--value": `${waterPercent.toFixed(0)}` }}
          >
            <div className="ring-inner">
              <strong>{waterDisplay}</strong>
              <span>{prefs.waterUnit}</span>
            </div>
          </div>
          <div className="water-controls">
            <button
              className="btn ghost"
              onClick={() => adjustWater(-prefs.waterStep)}
            >
              -{prefs.waterStep} {prefs.waterUnit}
            </button>
            <button
              className="btn primary"
              onClick={() => adjustWater(prefs.waterStep)}
            >
              +{prefs.waterStep} {prefs.waterUnit}
            </button>
          </div>
          <div className="water-custom">
            <input
              type="number"
              value={waterCustomAmount}
              onChange={(e) => setWaterCustomAmount(e.target.value)}
              placeholder={`Custom ${prefs.waterUnit}`}
            />
            <button className="btn ghost" onClick={handleCustomWaterAdd}>
              Add Custom
            </button>
          </div>
          <p className="summary-note">
            {waterRemainingDisplay.toFixed(0)} {prefs.waterUnit} to goal
          </p>
        </div>
      </section>

      <section className="progress-grid">
        <div className="progress-card">
          <div className="progress-header">
            <span>Calories</span>
            <span>
              {Math.round(totals.calories)} /{" "}
              {Math.round(calorieGoal)} kcal
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill calories"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
          <div className="progress-sub">
            {Math.max(
              0,
                Math.round(calorieGoal - totals.calories)
            )}{" "}
            kcal left
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-header">
            <span>Protein</span>
            <span>
              {Math.round(totals.protein)} /{" "}
              {Math.round(effectiveGoals.protein)} g
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill protein"
              style={{
                width: `${clampPercent(
                  totals.protein,
                  effectiveGoals.protein
                )}%`,
              }}
            />
          </div>
          <div className="progress-sub">
            {Math.max(
              0,
              Math.round(effectiveGoals.protein - totals.protein)
            )}{" "}
            g left
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-header">
            <span>Carbs</span>
            <span>
              {Math.round(totals.carbs)} / {Math.round(effectiveGoals.carbs)} g
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill carbs"
              style={{
                width: `${clampPercent(totals.carbs, effectiveGoals.carbs)}%`,
              }}
            />
          </div>
          <div className="progress-sub">
            {Math.max(0, Math.round(effectiveGoals.carbs - totals.carbs))} g
            left
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-header">
            <span>Fat</span>
            <span>
              {Math.round(totals.fat)} / {Math.round(effectiveGoals.fat)} g
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill fat"
              style={{ width: `${clampPercent(totals.fat, effectiveGoals.fat)}%` }}
            />
          </div>
          <div className="progress-sub">
            {Math.max(0, Math.round(effectiveGoals.fat - totals.fat))} g left
          </div>
        </div>
      </section>
      </CollapsibleSection>

      {showSettings && (
        <section className="settings-panel" ref={settingsRef}>
          <div className="settings-header">
            <div>
              <h2>Goals & Preferences</h2>
              <p className="muted">Dial in targets and personalize the UI.</p>
            </div>
            <button className="btn ghost" onClick={toggleSettings}>
              Hide
            </button>
          </div>
          <div className="settings-stack">
              <div className="settings-block">
                <h3>Daily Goals</h3>
                <div className="settings-grid">
                <label>
                  Calories
                  <input
                    type="number"
                    value={goals.calories}
                    onChange={(e) =>
                      handleGoalChange("calories", e.target.value)
                    }
                  />
                </label>
                <label>
                  Protein (g)
                  <input
                    type="number"
                    value={goals.protein}
                    onChange={(e) =>
                      handleGoalChange("protein", e.target.value)
                    }
                  />
                </label>
                <label>
                  Fat (g)
                  <input
                    type="number"
                    value={goals.fat}
                    onChange={(e) => handleGoalChange("fat", e.target.value)}
                  />
                </label>
                <label>
                  Carbs (g)
                  <input
                    type="number"
                    value={goals.carbs}
                    onChange={(e) => handleGoalChange("carbs", e.target.value)}
                  />
                </label>
                <label>
                  Water ({prefs.waterUnit})
                  <input
                    type="number"
                    value={waterGoalInput}
                    onChange={(e) =>
                      handleGoalChange("waterOz", e.target.value)
                    }
                  />
                </label>
                </div>
                <div className="macro-presets">
                  <span className="chip-label">Macro presets</span>
                  {Object.keys(MACRO_PRESETS).map((preset) => (
                  <button
                    key={preset}
                    className="chip"
                    onClick={() => applyMacroPreset(preset)}
                  >
                    {preset}
                  </button>
                  ))}
                </div>
              </div>

              <div className="settings-block">
                <div className="day-goals-header">
                  <div>
                    <h3>TDEE Calculator</h3>
                    <p className="muted">
                      Estimate maintenance calories and set your goal.
                    </p>
                  </div>
                  <span className="chip">
                    {globalTDEE
                      ? `Last: ${Math.round(globalTDEE)} kcal`
                      : "Not set"}
                  </span>
                </div>
                <div className="panel-actions">
                  <button className="btn primary" onClick={openTdeeCalculator}>
                    Calculate My TDEE
                  </button>
                  {globalTDEE && (
                    <button className="btn ghost" onClick={applySavedTdeeGoal}>
                      Set Goal to Saved TDEE
                    </button>
                  )}
                </div>
              </div>

              <div className="settings-block">
                <div className="day-goals-header">
                  <div>
                  <h3>Day Goal Overrides</h3>
                  <p className="muted">
                    Applies only to {getDisplayDate(activeDay)}.
                  </p>
                </div>
                <div className="chip-row">
                  <span className="chip">
                    {hasDayOverrides ? "Custom" : "Global"}
                  </span>
                  <button
                    className="btn ghost"
                    onClick={
                      hasDayOverrides ? clearDayOverrides : enableDayOverrides
                    }
                  >
                    {hasDayOverrides ? "Use Global Goals" : "Enable Day Goals"}
                  </button>
                </div>
              </div>
              <div className="settings-grid">
                <label>
                  Calories
                  <input
                    type="number"
                    value={dayGoalOverrides.calories || ""}
                    onChange={(e) =>
                      handleDayGoalChange("calories", e.target.value)
                    }
                    disabled={!hasDayOverrides}
                  />
                </label>
                <label>
                  Protein (g)
                  <input
                    type="number"
                    value={dayGoalOverrides.protein || ""}
                    onChange={(e) =>
                      handleDayGoalChange("protein", e.target.value)
                    }
                    disabled={!hasDayOverrides}
                  />
                </label>
                <label>
                  Fat (g)
                  <input
                    type="number"
                    value={dayGoalOverrides.fat || ""}
                    onChange={(e) =>
                      handleDayGoalChange("fat", e.target.value)
                    }
                    disabled={!hasDayOverrides}
                  />
                </label>
                <label>
                  Carbs (g)
                  <input
                    type="number"
                    value={dayGoalOverrides.carbs || ""}
                    onChange={(e) =>
                      handleDayGoalChange("carbs", e.target.value)
                    }
                    disabled={!hasDayOverrides}
                  />
                </label>
                <label>
                  Water ({prefs.waterUnit})
                  <input
                    type="number"
                    value={dayWaterGoalInput}
                    onChange={(e) =>
                      handleDayGoalChange("waterOz", e.target.value)
                    }
                    disabled={!hasDayOverrides}
                  />
                </label>
              </div>
            </div>

            <div className="settings-block">
              <h3>Preferences</h3>
              <div className="settings-grid">
                <label>
                  Theme
                  <select
                    className="select"
                    value={prefs.theme}
                    onChange={(e) => handlePrefChange("theme", e.target.value)}
                  >
                    {Object.keys(THEME_PRESETS).map((theme) => (
                      <option key={theme} value={theme}>
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Water Unit
                  <select
                    className="select"
                    value={prefs.waterUnit}
                    onChange={(e) =>
                      handlePrefChange("waterUnit", e.target.value)
                    }
                  >
                    <option value="oz">Ounces (oz)</option>
                    <option value="ml">Milliliters (ml)</option>
                  </select>
                </label>
                <label>
                  Water Step ({prefs.waterUnit})
                  <input
                    type="number"
                    value={prefs.waterStep}
                    onChange={(e) =>
                      handlePrefChange(
                        "waterStep",
                        Math.max(1, numberOrZero(e.target.value))
                      )
                    }
                  />
                </label>
                <label>
                  Density
                  <select
                    className="select"
                    value={prefs.density}
                    onChange={(e) =>
                      handlePrefChange("density", e.target.value)
                    }
                  >
                    <option value="comfy">Comfy</option>
                    <option value="compact">Compact</option>
                  </select>
                </label>
                <label>
                  Default Meal
                  <select
                    className="select"
                    value={prefs.defaultMeal}
                    onChange={(e) =>
                      handlePrefChange("defaultMeal", e.target.value)
                    }
                  >
                    <option value="Auto">Auto</option>
                    {MEALS.map((meal) => (
                      <option key={meal} value={meal}>
                        {meal}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="settings-block">
              <h3>Favorites Manager</h3>
              {favorites.length === 0 ? (
                <p className="muted">No favorites saved yet.</p>
              ) : (
                <div className="favorites-grid">
                  {favorites.map((fav) => (
                    <div key={fav.id || fav.food} className="favorite-card">
                      <div>
                        <strong>{fav.food}</strong>
                        {fav.brand && <span>{fav.brand}</span>}
                      </div>
                      <button
                        className="btn ghost"
                        onClick={() => removeFavorite(fav.food)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <CollapsibleSection
        id="log"
        title="Food Log"
        subtitle="Search, add, and manage foods"
        badge={`${visibleFoods.length} entries`}
        isOpen={dashboardSectionsOpen.log}
        onToggle={() => toggleDashboardSection("log")}
        headerRef={logRef}
      >
      <section className="control-panel">
        <div className="control-row">
          <input
            name="search"
            className="search"
            placeholder="Search USDA foods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchFood()}
          />
          <button className="btn primary" onClick={() => handleSearchFood()}>
            Search
          </button>
          <button className="btn ghost" onClick={handleCustomFood}>
            Custom Food
          </button>
        </div>

        <div className="control-row">
          <label className="field">
            Meal
            <select
              className="select"
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
            >
              {MEALS.map((meal) => (
                <option key={meal} value={meal}>
                  {meal}
                </option>
              ))}
            </select>
          </label>

          <button className="btn" onClick={handleQuickAdd}>
            Quick Calories
          </button>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleBarcodeUpload}
            className="file-input"
          />
          <button
            className="btn warning"
            onClick={() => fileInputRef.current?.click()}
          >
            Scan Barcode
          </button>
        </div>

        <div className="control-row">
          <button className="btn" onClick={handleExport}>
            Export
          </button>
          <label className="btn ghost file-label">
            Import
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="file-input"
            />
          </label>
          <button
            className="btn primary"
            onClick={toggleSettings}
          >
            Goals
          </button>
        </div>

        {searchHistory.length > 0 && (
          <div className="chip-row">
            <span className="chip-label">Recent searches</span>
            {searchHistory.map((term) => (
              <button
                key={term}
                className="chip"
                onClick={() => handleSearchFood(term)}
              >
                {term}
              </button>
            ))}
            <button className="chip danger" onClick={clearSearchHistory}>
              Clear
            </button>
          </div>
        )}

        {favorites.length > 0 && (
          <div className="chip-row">
            <span className="chip-label">Favorites</span>
            {favorites.map((fav) => (
              <button
                key={fav.id || fav.food}
                className="chip accent"
                onClick={() => addFromFavorite(fav)}
              >
                {fav.food}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="filter-row">
        <div className="chip-group">
          {["All", ...MEALS].map((meal) => (
            <button
              key={meal}
              className={`chip ${mealFilter === meal ? "active" : ""}`}
              onClick={() => setMealFilter(meal)}
            >
              {meal}
            </button>
          ))}
        </div>
        <div className="sort-group">
          <select
            className="select"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            {[
              "All",
              "manual",
              "custom",
              "quick",
              "barcode",
              "usda",
              "plan",
              "recipe",
              "favorite",
            ].map((source) => (
              <option key={source} value={source}>
                {source === "All"
                  ? "All sources"
                  : source.charAt(0).toUpperCase() + source.slice(1)}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={sortConfig.key}
            onChange={(e) =>
              setSortConfig((prev) => ({ ...prev, key: e.target.value }))
            }
          >
            <option value="createdAt">Newest</option>
            <option value="food">Name</option>
            <option value="meal">Meal</option>
            <option value="calories">Calories</option>
            <option value="protein">Protein</option>
            <option value="carbs">Carbs</option>
            <option value="fat">Fat</option>
          </select>
          <button className="btn ghost" onClick={toggleSortDir}>
            {sortConfig.dir === "asc" ? "Asc" : "Desc"}
          </button>
        </div>
      </section>

      <div className="table-wrap">
        <table className="food-table">
          <thead>
            <tr>
              <th>Food</th>
              <th>Meal</th>
              <th>Calories</th>
              <th>Protein (g)</th>
              <th>Fat (g)</th>
              <th>Carbs (g)</th>
              <th>Servings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleFoods.map((f) => (
                <tr key={f.id}>
                  <td data-label="Food">
                    <div className="food-cell">
                      <strong>{f.food}</strong>
                      <div className="food-meta">
                        {f.brand && <span>{f.brand}</span>}
                      {f.servingSize ? (
                        <span>
                          {formatNumber(f.servingSize)}
                          {f.servingUnit ? ` ${f.servingUnit}` : ""}
                        </span>
                      ) : null}
                      <span className={`badge ${f.source || "manual"}`}>
                        {f.source || "manual"}
                      </span>
                    </div>
                    {f.notes && <em className="food-notes">{f.notes}</em>}
                  </div>
                </td>
                  <td data-label="Meal">{f.meal}</td>
                  <td data-label="Calories">{formatNumber(f.calories)}</td>
                  <td data-label="Protein (g)">{formatNumber(f.protein)}</td>
                  <td data-label="Fat (g)">{formatNumber(f.fat)}</td>
                  <td data-label="Carbs (g)">{formatNumber(f.carbs)}</td>
                  <td data-label="Servings">{formatCount(f.servings)}</td>
                  <td data-label="Actions">
                    <div className="table-actions">
                      <button
                        className="action-btn"
                        onClick={() => handleEditFood(f.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => duplicateFood(f.id)}
                    >
                      Duplicate
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => toggleFavorite(f)}
                    >
                      {favorites.find((fav) => fav.food === f.food)
                        ? "Unsave"
                        : "Save"}
                    </button>
                    <button
                      className="action-btn danger"
                      onClick={() => removeFood(f.id)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
              {visibleFoods.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-state" data-label="">
                    No foods yet. Search, scan, or add a favorite to get going.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="breakdown"
        title="Meal Breakdown"
        subtitle="Calories and macros by meal"
        badge={`${MEALS.length} meals`}
        isOpen={dashboardSectionsOpen.breakdown}
        onToggle={() => toggleDashboardSection("breakdown")}
      >
        <section className="meal-breakdown">
          <div className="meal-grid">
            {MEALS.map((meal) => (
              <div key={meal} className="meal-card">
                <h3>{meal}</h3>
                <p>{Math.round(mealTotals[meal]?.calories || 0)} kcal</p>
                <div className="meal-macros">
                  <span>P {Math.round(mealTotals[meal]?.protein || 0)}g</span>
                  <span>C {Math.round(mealTotals[meal]?.carbs || 0)}g</span>
                  <span>F {Math.round(mealTotals[meal]?.fat || 0)}g</span>
                </div>
                <span className="meal-count">
                  {mealTotals[meal]?.count || 0} entries
                </span>
              </div>
            ))}
          </div>
        </section>
      </CollapsibleSection>

      <CollapsibleSection
        id="notes"
        title="Daily Notes"
        subtitle="Reflections, context, and wins"
        badge={activeDay.notes ? "Saved" : "Empty"}
        isOpen={dashboardSectionsOpen.notes}
        onToggle={() => toggleDashboardSection("notes")}
      >
        <section className="notes-panel">
          <textarea
            placeholder="How did today feel? Any wins to remember?"
            value={activeDay.notes}
            onChange={(e) =>
              updateCurrentDay((day) => ({ ...day, notes: e.target.value }))
            }
          />
        </section>
      </CollapsibleSection>

      <CollapsibleSection
        id="insights"
        title="Insights"
        subtitle="A rolling snapshot of the last 7 days"
        badge={`${insights.streak} day${insights.streak === 1 ? "" : "s"}`}
        isOpen={dashboardSectionsOpen.insights}
        onToggle={() => toggleDashboardSection("insights")}
        headerRef={insightsRef}
      >
        <section className="insights-panel">
          <div className="insights-grid">
            <div className="insight-card">
              <span>Avg Calories</span>
              <strong>{Math.round(insights.averages.calories)}</strong>
              <p>kcal</p>
            </div>
            <div className="insight-card">
              <span>Avg Protein</span>
              <strong>{Math.round(insights.averages.protein)}</strong>
              <p>g</p>
            </div>
            <div className="insight-card">
              <span>Avg Carbs</span>
              <strong>{Math.round(insights.averages.carbs)}</strong>
              <p>g</p>
            </div>
            <div className="insight-card">
              <span>Avg Fat</span>
              <strong>{Math.round(insights.averages.fat)}</strong>
              <p>g</p>
            </div>
            <div className="insight-card">
              <span>Avg Water</span>
              <strong>
                {Math.round(
                  toDisplayWater(insights.averages.waterOz, prefs.waterUnit)
                )}
              </strong>
              <p>{prefs.waterUnit}</p>
            </div>
          </div>

          <div className="insights-lists">
            <div className="insight-list">
              <h3>Top Foods</h3>
              {insights.topFoods.length === 0 ? (
                <p className="muted">Log more meals to see your favorites.</p>
              ) : (
                <ul>
                  {insights.topFoods.map((item) => (
                    <li key={item.food}>
                      <span>{item.food}</span>
                      <strong>{item.count}x</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="insight-list">
              <h3>Closest Day To Goal</h3>
              {insights.bestDay ? (
                <div className="best-day">
                  <strong>{getDisplayDate(insights.bestDay.day)}</strong>
                  <span>
                    {Math.round(insights.bestDay.totals.calories)} kcal
                  </span>
                </div>
              ) : (
                <p className="muted">No logged days yet.</p>
              )}
            </div>
          </div>
        </section>
      </CollapsibleSection>

      {days.length > 1 && (
        <div className="daysButtons">
          {[...days].reverse().map((day, reverseIdx) => {
            const originalIdx = days.length - 1 - reverseIdx;
            const isActive = originalIdx === currentDayIndex;

            return (
              <button
                key={originalIdx}
                onClick={() => switchDay(originalIdx)}
                className={isActive ? "active" : ""}
                title={`Switch to ${getDisplayDate(day)}`}
              >
                {day.dateLabel
                  ? `Day ${days.length - reverseIdx} - ${day.dateLabel}`
                  : `Day ${days.length - reverseIdx}`}
              </button>
            );
          })}
        </div>
      )}
            </>
          )}

          {activePage === "planner" && (
            <>
              <header className="page-header">
                <div>
                  <h2>Meal Planner</h2>
                  <p className="muted">
                    Schedule meals ahead and send them to your log.
                  </p>
                </div>
                <button
                  className="btn ghost"
                  onClick={() => setActivePage("dashboard")}
                >
                  Back to Dashboard
                </button>
              </header>

              <section className="panel">
                <div className="section-header">
                  <h3>Schedule a Meal</h3>
                  <button
                    className="btn ghost"
                    onClick={() => applyPlanForDate(activeDay.dateISO)}
                  >
                    Apply Today's Plan
                  </button>
                </div>
                <div className="form-grid">
                  <label>
                    Date
                    <input
                      type="date"
                      value={planForm.dateISO}
                      onChange={(e) =>
                        setPlanForm((prev) => ({
                          ...prev,
                          dateISO: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Meal
                    <select
                      className="select"
                      value={planForm.meal}
                      onChange={(e) =>
                        setPlanForm((prev) => ({
                          ...prev,
                          meal: e.target.value,
                        }))
                      }
                    >
                      {MEALS.map((meal) => (
                        <option key={meal} value={meal}>
                          {meal}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Meal Name
                    <input
                      type="text"
                      value={planForm.name}
                      onChange={(e) =>
                        setPlanForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g. Greek yogurt bowl"
                    />
                  </label>
                  <label>
                    Calories
                    <input
                      type="number"
                      value={planForm.calories}
                      onChange={(e) =>
                        setPlanForm((prev) => ({
                          ...prev,
                          calories: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Protein (g)
                    <input
                      type="number"
                      value={planForm.protein}
                      onChange={(e) =>
                        setPlanForm((prev) => ({
                          ...prev,
                          protein: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Carbs (g)
                    <input
                      type="number"
                      value={planForm.carbs}
                      onChange={(e) =>
                        setPlanForm((prev) => ({
                          ...prev,
                          carbs: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Fat (g)
                    <input
                      type="number"
                      value={planForm.fat}
                      onChange={(e) =>
                        setPlanForm((prev) => ({
                          ...prev,
                          fat: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Servings
                    <input
                      type="number"
                      value={planForm.servings}
                      min="0.25"
                      step="0.25"
                      onChange={(e) =>
                        setPlanForm((prev) => ({
                          ...prev,
                          servings: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Notes
                    <input
                      type="text"
                      value={planForm.notes}
                      onChange={(e) =>
                        setPlanForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                    />
                  </label>
                </div>
                <div className="panel-actions">
                  <button className="btn primary" onClick={handleAddPlanItem}>
                    Add to Plan
                  </button>
                  <button className="btn ghost" onClick={resetPlanForm}>
                    Clear
                  </button>
                </div>
              </section>

              <section className="panel">
                <div className="section-header">
                  <h3>Planned Days</h3>
                  <span className="chip">{plans.length} entries</span>
                </div>
                {sortedPlanDates.length === 0 ? (
                  <p className="muted">No planned meals yet.</p>
                ) : (
                  <div className="plan-list">
                    {sortedPlanDates.map((dateISO) => (
                      <div key={dateISO} className="plan-day">
                        <div className="plan-day-header">
                          <div>
                            <strong>
                              {formatDate(dateISO) || "Unscheduled"}
                            </strong>
                            <span className="muted">
                              {plansByDate[dateISO].length} entries
                            </span>
                          </div>
                          <div className="plan-day-actions">
                            <button
                              className="btn ghost"
                              onClick={() => applyPlanForDate(dateISO)}
                            >
                              Add to Log
                            </button>
                            <button
                              className="btn warning"
                              onClick={() => removePlanDate(dateISO)}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                        <div className="plan-items">
                          {plansByDate[dateISO].map((item) => (
                            <div key={item.id} className="plan-item">
                              <div>
                                <strong>{item.name}</strong>
                                <div className="plan-meta">
                                  <span>{item.meal}</span>
                                  <span>{item.servings} serv</span>
                                  {item.notes && <span>{item.notes}</span>}
                                </div>
                              </div>
                              <div className="plan-macros">
                                <span>
                                  {Math.round(item.calories * item.servings)}{" "}
                                  kcal
                                </span>
                                <span>
                                  P {Math.round(item.protein * item.servings)}g
                                </span>
                                <span>
                                  C {Math.round(item.carbs * item.servings)}g
                                </span>
                                <span>
                                  F {Math.round(item.fat * item.servings)}g
                                </span>
                              </div>
                              <button
                                className="action-btn danger"
                                onClick={() => removePlanItem(item.id)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
          {activePage === "recipes" && (
            <>
              <header className="page-header">
                <div>
                  <h2>Recipes Studio</h2>
                  <p className="muted">
                    Build your own recipes and drop them into the log instantly.
                  </p>
                </div>
                <button
                  className="btn ghost"
                  onClick={() => setActivePage("dashboard")}
                >
                  Back to Dashboard
                </button>
              </header>

              <section className="panel">
                <h3>Create Recipe</h3>
                <div className="form-grid">
                  <label>
                    Recipe Name
                    <input
                      type="text"
                      value={recipeForm.name}
                      onChange={(e) =>
                        setRecipeForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g. Power oats"
                    />
                  </label>
                  <label>
                    Servings
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={recipeForm.servings}
                      onChange={(e) =>
                        setRecipeForm((prev) => ({
                          ...prev,
                          servings: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Calories (per serving)
                    <input
                      type="number"
                      value={recipeForm.calories}
                      onChange={(e) =>
                        setRecipeForm((prev) => ({
                          ...prev,
                          calories: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Protein (g)
                    <input
                      type="number"
                      value={recipeForm.protein}
                      onChange={(e) =>
                        setRecipeForm((prev) => ({
                          ...prev,
                          protein: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Carbs (g)
                    <input
                      type="number"
                      value={recipeForm.carbs}
                      onChange={(e) =>
                        setRecipeForm((prev) => ({
                          ...prev,
                          carbs: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Fat (g)
                    <input
                      type="number"
                      value={recipeForm.fat}
                      onChange={(e) =>
                        setRecipeForm((prev) => ({
                          ...prev,
                          fat: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="form-span">
                    Ingredients (one per line)
                    <textarea
                      value={recipeForm.ingredients}
                      onChange={(e) =>
                        setRecipeForm((prev) => ({
                          ...prev,
                          ingredients: e.target.value,
                        }))
                      }
                      placeholder="Rolled oats&#10;Almond milk&#10;Banana"
                    />
                  </label>
                  <label className="form-span">
                    Notes
                    <textarea
                      value={recipeForm.notes}
                      onChange={(e) =>
                        setRecipeForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Optional prep notes"
                    />
                  </label>
                </div>
                <div className="panel-actions">
                  <button className="btn primary" onClick={handleAddRecipe}>
                    Save Recipe
                  </button>
                  <button className="btn ghost" onClick={resetRecipeForm}>
                    Clear
                  </button>
                </div>
              </section>

              <section className="panel">
                <div className="section-header">
                  <h3>Your Recipes</h3>
                  <span className="chip">{recipes.length} recipes</span>
                </div>
                {recipes.length === 0 ? (
                  <p className="muted">
                    No recipes yet. Build your first one above.
                  </p>
                ) : (
                  <div className="card-grid">
                    {recipes.map((recipe) => (
                      <div key={recipe.id} className="card recipe-card">
                        <div>
                          <strong>{recipe.name}</strong>
                          <span className="muted">
                            {recipe.servings} servings
                          </span>
                        </div>
                        <div className="macro-line">
                          <span>{Math.round(recipe.calories)} kcal</span>
                          <span>P {Math.round(recipe.protein)}g</span>
                          <span>C {Math.round(recipe.carbs)}g</span>
                          <span>F {Math.round(recipe.fat)}g</span>
                        </div>
                        {Array.isArray(recipe.ingredients) &&
                          recipe.ingredients.length > 0 && (
                          <ul className="ingredient-list">
                            {recipe.ingredients.map((item, idx) => (
                              <li key={`${recipe.id}-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {recipe.notes && <p className="muted">{recipe.notes}</p>}
                        <div className="card-actions">
                          <button
                            className="btn ghost"
                            onClick={() => addRecipeToDay(recipe)}
                          >
                            Add to Log
                          </button>
                          <button
                            className="btn ghost"
                            onClick={() => duplicateRecipe(recipe)}
                          >
                            Duplicate
                          </button>
                          <button
                            className="btn warning"
                            onClick={() => removeRecipe(recipe.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
          {activePage === "measurements" && (
            <>
              <header className="page-header">
                <div>
                  <h2>Body Measurements</h2>
                  <p className="muted">
                    Track progress with quick body metrics.
                  </p>
                </div>
                <button
                  className="btn ghost"
                  onClick={() => setActivePage("dashboard")}
                >
                  Back to Dashboard
                </button>
              </header>

              <section className="panel">
                <div className="section-header">
                  <h3>Quick Entry</h3>
                  {latestMeasurement && (
                    <span className="chip">
                      Latest: {formatDate(latestMeasurement.dateISO)}
                    </span>
                  )}
                </div>
                <div className="form-grid">
                  <label>
                    Date
                    <input
                      type="date"
                      value={measurementForm.dateISO}
                      onChange={(e) =>
                        setMeasurementForm((prev) => ({
                          ...prev,
                          dateISO: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Weight
                    <input
                      type="number"
                      value={measurementForm.weight}
                      onChange={(e) =>
                        setMeasurementForm((prev) => ({
                          ...prev,
                          weight: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Body Fat %
                    <input
                      type="number"
                      value={measurementForm.bodyFat}
                      onChange={(e) =>
                        setMeasurementForm((prev) => ({
                          ...prev,
                          bodyFat: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Waist
                    <input
                      type="number"
                      value={measurementForm.waist}
                      onChange={(e) =>
                        setMeasurementForm((prev) => ({
                          ...prev,
                          waist: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Hips
                    <input
                      type="number"
                      value={measurementForm.hips}
                      onChange={(e) =>
                        setMeasurementForm((prev) => ({
                          ...prev,
                          hips: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Chest
                    <input
                      type="number"
                      value={measurementForm.chest}
                      onChange={(e) =>
                        setMeasurementForm((prev) => ({
                          ...prev,
                          chest: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="form-span">
                    Notes
                    <input
                      type="text"
                      value={measurementForm.notes}
                      onChange={(e) =>
                        setMeasurementForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                    />
                  </label>
                </div>
                <div className="panel-actions">
                  <button className="btn primary" onClick={handleAddMeasurement}>
                    Save Measurement
                  </button>
                </div>
              </section>

              <section className="panel">
                <h3>Latest Snapshot</h3>
                {latestMeasurement ? (
                  <div className="stats-grid">
                    {[
                      { label: "Weight", key: "weight" },
                      { label: "Body Fat", key: "bodyFat" },
                      { label: "Waist", key: "waist" },
                      { label: "Hips", key: "hips" },
                      { label: "Chest", key: "chest" },
                    ].map((item) => {
                      const value = latestMeasurement[item.key];
                      const delta = measurementDelta(item.key);
                      return (
                        <div key={item.key} className="stat-card">
                          <span>{item.label}</span>
                          <strong>
                            {value === null || value === undefined ? "-" : value}
                          </strong>
                          {delta !== null && (
                            <em
                              className={`delta ${
                                delta > 0 ? "up" : delta < 0 ? "down" : ""
                              }`}
                            >
                              {formatDelta(delta)}
                            </em>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="muted">No measurements logged yet.</p>
                )}
              </section>

              <section className="panel">
                <div className="section-header">
                  <h3>Measurement History</h3>
                  <span className="chip">{measurements.length} entries</span>
                </div>
                {sortedMeasurements.length === 0 ? (
                  <p className="muted">
                    Log a measurement to start tracking.
                  </p>
                ) : (
                  <div className="table-wrap">
                    <table className="food-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Weight</th>
                          <th>Body Fat</th>
                          <th>Waist</th>
                          <th>Hips</th>
                          <th>Chest</th>
                          <th>Notes</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMeasurements.map((entry) => (
                          <tr key={entry.id}>
                            <td data-label="Date">
                              {formatDate(entry.dateISO)}
                            </td>
                            <td data-label="Weight">{entry.weight ?? "-"}</td>
                            <td data-label="Body Fat">
                              {entry.bodyFat ?? "-"}
                            </td>
                            <td data-label="Waist">{entry.waist ?? "-"}</td>
                            <td data-label="Hips">{entry.hips ?? "-"}</td>
                            <td data-label="Chest">{entry.chest ?? "-"}</td>
                            <td data-label="Notes">{entry.notes || "-"}</td>
                            <td data-label="Actions">
                              <button
                                className="action-btn danger"
                                onClick={() => removeMeasurement(entry.id)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
          {activePage === "training" && (
            <>
              <header className="page-header">
                <div>
                  <h2>Training Log</h2>
                  <p className="muted">
                    Capture workouts, exercises, and training volume.
                  </p>
                </div>
                <button
                  className="btn ghost"
                  onClick={() => setActivePage("dashboard")}
                >
                  Back to Dashboard
                </button>
              </header>

              <section className="panel">
                <h3>Workout Builder</h3>
                <div className="form-grid">
                  <label>
                    Date
                    <input
                      type="date"
                      value={workoutForm.dateISO}
                      onChange={(e) =>
                        setWorkoutForm((prev) => ({
                          ...prev,
                          dateISO: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Workout Name
                    <input
                      type="text"
                      value={workoutForm.title}
                      onChange={(e) =>
                        setWorkoutForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Push day, long run..."
                    />
                  </label>
                  <label>
                    Duration (min)
                    <input
                      type="number"
                      value={workoutForm.duration}
                      onChange={(e) =>
                        setWorkoutForm((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Calories Burned
                    <input
                      type="number"
                      value={workoutForm.calories}
                      onChange={(e) =>
                        setWorkoutForm((prev) => ({
                          ...prev,
                          calories: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="form-span">
                    Notes
                    <input
                      type="text"
                      value={workoutForm.notes}
                      onChange={(e) =>
                        setWorkoutForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Optional focus or energy notes"
                    />
                  </label>
                </div>

                <div className="exercise-builder">
                  <h4>Exercises</h4>
                  <div className="form-grid">
                    <label>
                      Exercise
                      <input
                        type="text"
                        value={exerciseDraft.name}
                        onChange={(e) =>
                          setExerciseDraft((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Bench press"
                      />
                    </label>
                    <label>
                      Sets
                      <input
                        type="number"
                        value={exerciseDraft.sets}
                        onChange={(e) =>
                          setExerciseDraft((prev) => ({
                            ...prev,
                            sets: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Reps
                      <input
                        type="number"
                        value={exerciseDraft.reps}
                        onChange={(e) =>
                          setExerciseDraft((prev) => ({
                            ...prev,
                            reps: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Weight
                      <input
                        type="number"
                        value={exerciseDraft.weight}
                        onChange={(e) =>
                          setExerciseDraft((prev) => ({
                            ...prev,
                            weight: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <button className="btn ghost" onClick={addExerciseToDraft}>
                    Add Exercise
                  </button>

                  {workoutExercises.length > 0 && (
                    <div className="exercise-list">
                      {workoutExercises.map((ex, idx) => (
                        <div key={`${ex.name}-${idx}`} className="exercise-item">
                          <div>
                            <strong>{ex.name}</strong>
                            <span>
                              {ex.sets} sets x {ex.reps} reps @ {ex.weight}
                            </span>
                          </div>
                          <button
                            className="action-btn danger"
                            onClick={() => removeDraftExercise(idx)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="panel-actions">
                  <button className="btn primary" onClick={saveWorkout}>
                    Save Workout
                  </button>
                </div>
              </section>

              <section className="panel">
                <div className="section-header">
                  <h3>Workout History</h3>
                  <span className="chip">{workouts.length} workouts</span>
                </div>
                {sortedWorkouts.length === 0 ? (
                  <p className="muted">No workouts logged yet.</p>
                ) : (
                  <div className="card-grid">
                    {sortedWorkouts.map((workout) => (
                      <div key={workout.id} className="card workout-card">
                        <div>
                          <strong>{workout.title}</strong>
                          <span className="muted">
                            {formatDate(workout.dateISO)}
                          </span>
                        </div>
                        <div className="macro-line">
                          <span>
                            {workout.duration ? `${workout.duration} min` : "-"}
                          </span>
                          <span>
                            {workout.calories
                              ? `${workout.calories} kcal`
                              : "-"}
                          </span>
                        </div>
                        {workout.exercises?.length > 0 && (
                          <ul className="exercise-summary">
                            {workout.exercises.map((ex, idx) => (
                              <li key={`${workout.id}-${idx}`}>
                                {ex.name} - {ex.sets}x{ex.reps} @ {ex.weight}
                              </li>
                            ))}
                          </ul>
                        )}
                        {workout.notes && <p className="muted">{workout.notes}</p>}
                        <div className="card-actions">
                          <button
                            className="btn warning"
                            onClick={() => removeWorkout(workout.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
