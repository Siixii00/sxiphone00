const preferenceSelect = document.getElementById('preference-select');
const regionSelect = document.getElementById('region-select');
const customRegionInput = document.getElementById('custom-region-input');
const timeSelect = document.getElementById('time-select');
const restrictionsInput = document.getElementById('restrictions-input');

const recommendBtn = document.getElementById('recommend-btn');
const randomBtn = document.getElementById('random-btn');
const worldbookCategorySelect = document.getElementById('worldbook-category-select');
const mountWorldbookBtn = document.getElementById('mount-worldbook-btn');
const mountStatusEl = document.getElementById('mount-status');

const dishNameEl = document.getElementById('dish-name');
const dishMetaEl = document.getElementById('dish-meta');
const dishTagEl = document.getElementById('dish-tag');
const dishDescEl = document.getElementById('dish-desc');
const tipsEl = document.getElementById('recipe-tips');

let userRegion = null;
let userPersonality = '';
let userRestrictions = [];

function loadUserPersonalityFromSettings() {
  try {
    if (typeof SxSettings !== 'undefined') {
      const currentUser = SxSettings.getCurrentUser();
      if (currentUser && currentUser.personality) {
        userPersonality = currentUser.personality.trim();
      }
    }
  } catch (e) {
    console.warn('[daily-recipe] 無法從設定載入個性:', e);
  }

  const savedPersonality = localStorage.getItem('sx_recipe_personality');
  if (savedPersonality) {
    userPersonality = savedPersonality;
  }

  if (userPersonality) {
    console.log('[daily-recipe] 使用者個性:', userPersonality);
  }
}

function loadUserRestrictionsFromSettings() {
  const savedRestrictions = localStorage.getItem('sx_recipe_restrictions');
  if (savedRestrictions) {
    try {
      userRestrictions = JSON.parse(savedRestrictions);
    } catch (e) {
      userRestrictions = savedRestrictions.split(/[,，、\n]/).map(s => s.trim()).filter(Boolean);
    }
  }

  if (restrictionsInput && userRestrictions.length > 0) {
    restrictionsInput.value = userRestrictions.join('、');
  }

  console.log('[daily-recipe] 飲食禁忌:', userRestrictions);
}

function getRestrictions() {
  const inputVal = restrictionsInput?.value?.trim() || '';
  if (inputVal) {
    userRestrictions = inputVal.split(/[,，、\n]/).map(s => s.trim()).filter(Boolean);
    localStorage.setItem('sx_recipe_restrictions', JSON.stringify(userRestrictions));
  }
  return userRestrictions;
}

function checkRestrictions(recipe) {
  const restrictions = getRestrictions();
  if (!restrictions || restrictions.length === 0) return { ok: true, matched: [] };

  const recipeText = `${recipe.name} ${recipe.desc} ${(recipe.tips || []).join(' ')}`.toLowerCase();
  const matched = [];

  for (const restriction of restrictions) {
    const r = restriction.toLowerCase();
    if (recipeText.includes(r)) {
      matched.push(restriction);
    }
  }

  return { ok: matched.length === 0, matched };
}

function loadUserRegionFromSettings() {
  try {
    if (typeof SxSettings !== 'undefined') {
      const currentUser = SxSettings.getCurrentUser();
      if (currentUser && currentUser.background) {
        const bg = currentUser.background.toLowerCase();
        if (/台灣|taiwan/.test(bg)) userRegion = 'taiwan';
        else if (/韓|korea|korean/.test(bg)) userRegion = 'korea';
        else if (/日|japan|japanese/.test(bg)) userRegion = 'japan';
        else if (/西式|美|歐|american|european|western/.test(bg)) userRegion = 'western';
        else if (/東南亞|泰|越|馬|泰國|vietnam|thai|malaysia/.test(bg)) userRegion = 'south-east';
        else if (bg.trim()) userRegion = bg.trim();
      }
    }
  } catch (e) {
    console.warn('[daily-recipe] 無法從設定載入地區:', e);
  }

  const savedRegion = localStorage.getItem('sx_recipe_region');
  if (savedRegion) {
    userRegion = savedRegion;
  }

  if (userRegion && regionSelect) {
    const option = Array.from(regionSelect.options).find(opt => opt.value === userRegion);
    if (option) {
      regionSelect.value = userRegion;
    } else if (!['taiwan', 'korea', 'japan', 'western', 'south-east'].includes(userRegion)) {
      regionSelect.value = 'custom';
      if (customRegionInput) {
        customRegionInput.classList.remove('hidden');
        customRegionInput.value = userRegion;
      }
    }
  }
}

function getSelectedRegion() {
  const selected = regionSelect?.value || '';
  if (selected === 'custom') {
    return customRegionInput?.value?.trim() || '';
  }
  return selected;
}

function saveRegionToStorage(region) {
  if (region) {
    localStorage.setItem('sx_recipe_region', region);
    userRegion = region;
  }
}

function showRegionPrompt() {
  const resultCard = document.querySelector('.result-card');
  if (!resultCard) return;

  dishNameEl.textContent = '請先設定地區';
  dishMetaEl.textContent = '我們需要知道您的所在地才能推薦合適的食譜';
  dishTagEl.textContent = '提示';
  dishDescEl.textContent = '請在上方選擇或輸入您的地區，這樣我們才能為您推薦當地或您喜愛的料理風格。';
  tipsEl.innerHTML = '<span class="tip tip-highlight">請選擇地區</span><span class="tip">或輸入自訂地區</span>';

  const existingImg = resultCard.querySelector('.dish-thumbnail');
  if (existingImg) existingImg.remove();
  const existingYt = resultCard.querySelector('.youtube-link');
  if (existingYt) existingYt.remove();

  regionSelect?.focus();
}

function showRestrictionsPrompt() {
  const resultCard = document.querySelector('.result-card');
  if (!resultCard) return;

  dishNameEl.textContent = '請填寫飲食禁忌';
  dishMetaEl.textContent = '為了您的安全，請填寫飲食禁忌或不喜歡的食物';
  dishTagEl.textContent = '重要提示';
  dishDescEl.textContent = '如果您有任何食物過敏、飲食禁忌或不喜歡的食物，請在上方「飲食禁忌」欄位填寫。若沒有特殊限制，請填寫「無」。';
  tipsEl.innerHTML = '<span class="tip tip-highlight">請填寫飲食禁忌</span><span class="tip">例如：花生過敏、不吃辣</span><span class="tip">若無限制請填「無」</span>';

  const existingImg = resultCard.querySelector('.dish-thumbnail');
  if (existingImg) existingImg.remove();
  const existingYt = resultCard.querySelector('.youtube-link');
  if (existingYt) existingYt.remove();

  restrictionsInput?.focus();
}

regionSelect?.addEventListener('change', () => {
  if (regionSelect.value === 'custom') {
    customRegionInput?.classList.remove('hidden');
    customRegionInput?.focus();
  } else {
    customRegionInput?.classList.add('hidden');
    saveRegionToStorage(regionSelect.value);
  }
});

customRegionInput?.addEventListener('blur', () => {
  const customValue = customRegionInput.value.trim();
  if (customValue) {
    saveRegionToStorage(customValue);
  }
});

customRegionInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const customValue = customRegionInput.value.trim();
    if (customValue) {
      saveRegionToStorage(customValue);
      recommendFromApi(false);
    }
  }
});

const recipes = [];

const mealDbCategories = {
  taiwan: ['Beef', 'Chicken', 'Seafood', 'Vegetarian'],
  korea: ['Beef', 'Chicken', 'Seafood', 'Pork'],
  japan: ['Seafood', 'Chicken', 'Beef', 'Vegetarian'],
  western: ['Beef', 'Chicken', 'Seafood', 'Vegetarian', 'Pasta'],
  'south-east': ['Seafood', 'Chicken', 'Beef', 'Vegetarian']
};

const categoryPreferenceMap = {
  meat: ['Beef', 'Chicken', 'Pork', 'Lamb', 'Goat'],
  veggie: ['Vegetarian', 'Vegan', 'Side', 'Starter'],
  seafood: ['Seafood', 'Fish'],
  any: ['Beef', 'Chicken', 'Seafood', 'Vegetarian', 'Pork', 'Lamb', 'Pasta', 'Misc']
};

let cachedMeals = [];
let isFetchingFromApi = false;

let mountedRecipes = [];

const regionLabel = {
  taiwan: '台灣',
  korea: '韓式',
  japan: '日式',
  western: '西式',
  'south-east': '東南亞'
};

const defaultRegionOptions = [
  { value: 'taiwan', label: '台灣' },
  { value: 'korea', label: '韓式' },
  { value: 'japan', label: '日式' },
  { value: 'western', label: '西式' },
  { value: 'south-east', label: '東南亞' }
];

const preferenceLabel = {
  any: '都可以',
  meat: '肉食系',
  veggie: '蔬食系',
  seafood: '海鮮系'
};

const timeLabel = {
  quick: '15 分鐘內',
  normal: '30 分鐘內',
  slow: '45 分鐘以上'
};

function scoreRecipe(recipe, profile) {
  let score = 0;

  if (profile.region === recipe.region) score += 4;
  if (profile.preference === 'any' || profile.preference === recipe.preference) score += 3;
  if (profile.time === recipe.time) score += 3;

  if (profile.personality && recipe.personalities) {
    const personalityLower = profile.personality.toLowerCase();
    if (recipe.personalities.some(p => p.toLowerCase().includes(personalityLower) || personalityLower.includes(p.toLowerCase()))) {
      score += 4;
    }
  }

  return score;
}

function getProfile() {
  return {
    personality: userPersonality,
    preference: preferenceSelect.value,
    region: getSelectedRegion(),
    time: timeSelect.value
  };
}

function getAllRecipes() {
  return [...recipes, ...mountedRecipes, ...cachedMeals];
}

async function fetchMealDbCategories() {
  try {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
    const data = await res.json();
    return (data.categories || []).map(c => c.strCategory);
  } catch (e) {
    console.warn('[daily-recipe] Failed to fetch categories:', e);
    return ['Beef', 'Chicken', 'Seafood', 'Vegetarian', 'Pasta'];
  }
}

async function fetchMealsByCategory(category) {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`);
    const data = await res.json();
    return data.meals || [];
  } catch (e) {
    console.warn(`[daily-recipe] Failed to fetch meals for ${category}:`, e);
    return [];
  }
}

async function fetchMealDetail(mealId) {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
    const data = await res.json();
    return data.meals?.[0] || null;
  } catch (e) {
    console.warn(`[daily-recipe] Failed to fetch meal detail ${mealId}:`, e);
    return null;
  }
}

async function fetchRandomMeal() {
  try {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
    const data = await res.json();
    return data.meals?.[0] || null;
  } catch (e) {
    console.warn('[daily-recipe] Failed to fetch random meal:', e);
    return null;
  }
}

function extractIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(measure ? `${measure.trim()} ${ingredient.trim()}` : ingredient.trim());
    }
  }
  return ingredients;
}

function estimateCookTime(meal) {
  const text = `${meal.strInstructions || ''} ${meal.strTags || ''}`.toLowerCase();
  if (/quick|fast|15|min|easy|simple/.test(text)) return 'quick';
  if (/slow|braise|stew|roast|marinate|overnight|hour/.test(text)) return 'slow';
  return 'normal';
}

function detectRegionFromMeal(meal) {
  const area = (meal.strArea || '').toLowerCase();
  const name = (meal.strMeal || '').toLowerCase();
  const combined = `${area} ${name}`;

  if (/taiwan|台灣/.test(combined)) return 'taiwan';
  if (/korea|korean/.test(combined)) return 'korea';
  if (/japan|japanese/.test(combined)) return 'japan';
  if (/italian|french|american|british|greek|spanish|irish|dutch|polish|portuguese/.test(combined)) return 'western';
  if (/thai|vietnamese|malaysian|indonesian|indian|chinese/.test(combined)) return 'south-east';
  return 'western';
}

function detectPreferenceFromMeal(meal) {
  const category = (meal.strCategory || '').toLowerCase();
  const name = (meal.strMeal || '').toLowerCase();
  const combined = `${category} ${name}`;

  if (/seafood|fish|shrimp|salmon|tuna|crab|lobster/.test(combined)) return 'seafood';
  if (/vegetarian|vegan|vegetable|salad/.test(combined)) return 'veggie';
  if (/beef|chicken|pork|lamb|meat/.test(combined)) return 'meat';
  return 'any';
}

function detectPersonalitiesFromMeal(meal) {
  const text = `${meal.strInstructions || ''} ${meal.strTags || ''}`.toLowerCase();
  const result = [];
  if (/spicy|exotic|adventurous|unique/.test(text)) result.push('adventurous');
  if (/balanced|healthy|fresh/.test(text)) result.push('balanced');
  if (/comfort|warm|hearty|classic/.test(text)) result.push('comfort');
  if (/quick|easy|simple|fast/.test(text)) result.push('efficient');
  return result.length > 0 ? result : ['balanced'];
}

function mealToRecipe(meal) {
  if (!meal) return null;
  const ingredients = extractIngredients(meal);
  const instructions = meal.strInstructions || '';
  const tips = ingredients.slice(0, 3);
  if (tips.length === 0) tips.push('請參考完整食譜步驟');

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    region: detectRegionFromMeal(meal),
    preference: detectPreferenceFromMeal(meal),
    time: estimateCookTime(meal),
    personalities: detectPersonalitiesFromMeal(meal),
    tag: meal.strArea || meal.strCategory || '網路食譜',
    desc: instructions.slice(0, 100) + (instructions.length > 100 ? '...' : ''),
    tips: tips,
    thumbnail: meal.strMealThumb,
    youtube: meal.strYoutube,
    source: 'themealdb'
  };
}

async function fetchMealsForProfile(profile) {
  const targetCategories = categoryPreferenceMap[profile.preference] || categoryPreferenceMap.any;
  const allMeals = [];

  for (const category of targetCategories.slice(0, 2)) {
    const meals = await fetchMealsByCategory(category);
    for (const meal of meals.slice(0, 5)) {
      const detail = await fetchMealDetail(meal.idMeal);
      if (detail) {
        const recipe = mealToRecipe(detail);
        if (recipe) allMeals.push(recipe);
      }
    }
    if (allMeals.length >= 10) break;
  }

  return allMeals;
}

async function fetchRandomMeals(count = 5) {
  const meals = [];
  for (let i = 0; i < count; i++) {
    const meal = await fetchRandomMeal();
    if (meal) {
      const recipe = mealToRecipe(meal);
      if (recipe) meals.push(recipe);
    }
  }
  return meals;
}

function normalizeValue(input = '') {
  return String(input || '').trim().toLowerCase();
}

function detectRegion(text = '') {
  const t = normalizeValue(text);
  if (!t) return 'taiwan';
  if (/台灣|taiwan|台式/.test(t)) return 'taiwan';
  if (/韓|korea|korean/.test(t)) return 'korea';
  if (/日|japan|japanese|和風/.test(t)) return 'japan';
  if (/西式|義式|法式|美式|western|italian|french/.test(t)) return 'western';
  if (/東南亞|泰|越|南洋|south[-\s]?east|thai|vietnam/.test(t)) return 'south-east';
  const marker = t.match(/region\s*[:：]\s*([a-z\-]+)/i);
  return marker?.[1] || 'taiwan';
}

function detectPreference(text = '') {
  const t = normalizeValue(text);
  if (/海鮮|seafood|fish|shrimp|鮭魚|蝦/.test(t)) return 'seafood';
  if (/蔬|veggie|vegetarian|豆腐|素/.test(t)) return 'veggie';
  if (/雞|豬|牛|肉|meat/.test(t)) return 'meat';
  return 'any';
}

function detectTime(text = '') {
  const t = normalizeValue(text);
  if (/15|快手|快速|quick|短時間/.test(t)) return 'quick';
  if (/45|慢燉|久煮|slow/.test(t)) return 'slow';
  return 'normal';
}

function detectPersonalities(text = '') {
  const t = normalizeValue(text);
  const result = [];
  if (/冒險|嘗鮮|辛香|異國|adventurous/.test(t)) result.push('adventurous');
  if (/均衡|清爽|balanced|健康/.test(t)) result.push('balanced');
  if (/家常|療癒|comfort|暖胃/.test(t)) result.push('comfort');
  if (/快速|效率|easy|efficient|簡單/.test(t)) result.push('efficient');
  return result.length > 0 ? result : ['balanced'];
}

function parseTips(content = '') {
  const lines = String(content)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const bulletTips = lines
    .filter(line => /^[-•·]/.test(line))
    .map(line => line.replace(/^[-•·]\s*/, '').trim())
    .filter(Boolean);

  if (bulletTips.length > 0) return bulletTips.slice(0, 3);

  return lines.join('、').split(/[、，,]/).map(v => v.trim()).filter(Boolean).slice(0, 3);
}

function worldbookEntryToRecipe(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const title = String(entry.title || '').trim();
  const content = String(entry.content || '').trim();
  const triggerText = Array.isArray(entry.triggers) ? entry.triggers.join(' ') : String(entry.triggers || '');
  const fullText = `${title} ${triggerText} ${content}`;

  if (!title || (!content && !triggerText)) return null;

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed
        .map(item => ({
          name: item.name || title,
          region: item.region || detectRegion(fullText),
          preference: item.preference || detectPreference(fullText),
          time: item.time || detectTime(fullText),
          personalities: Array.isArray(item.personalities) && item.personalities.length ? item.personalities : detectPersonalities(fullText),
          tag: item.tag || '世界書掛載',
          desc: item.desc || content.slice(0, 80) || `來自世界書條目：${title}`,
          tips: Array.isArray(item.tips) && item.tips.length ? item.tips.slice(0, 3) : parseTips(item.desc || content)
        }))
        .filter(item => item.name);
    }

    if (parsed && typeof parsed === 'object') {
      return {
        name: parsed.name || title,
        region: parsed.region || detectRegion(fullText),
        preference: parsed.preference || detectPreference(fullText),
        time: parsed.time || detectTime(fullText),
        personalities: Array.isArray(parsed.personalities) && parsed.personalities.length ? parsed.personalities : detectPersonalities(fullText),
        tag: parsed.tag || '世界書掛載',
        desc: parsed.desc || content.slice(0, 80) || `來自世界書條目：${title}`,
        tips: Array.isArray(parsed.tips) && parsed.tips.length ? parsed.tips.slice(0, 3) : parseTips(parsed.desc || content)
      };
    }
  } catch (_) {
    // 非 JSON 內容時使用關鍵字推斷
  }

  return {
    name: title,
    region: detectRegion(fullText),
    preference: detectPreference(fullText),
    time: detectTime(fullText),
    personalities: detectPersonalities(fullText),
    tag: '世界書掛載',
    desc: content.slice(0, 80) || `來自世界書條目：${title}`,
    tips: parseTips(content).length > 0 ? parseTips(content) : ['可補充做法段落', '可加關鍵字改善匹配', '可用 JSON 提供完整結構']
  };
}

function rebuildRegionOptions() {
  const previous = regionSelect.value;
  const mountedRegions = [...new Set(mountedRecipes.map(item => item.region).filter(Boolean))]
    .filter(region => !defaultRegionOptions.some(opt => opt.value === region));

  const allOptions = [
    ...defaultRegionOptions,
    ...mountedRegions.map(region => ({
      value: region,
      label: regionLabel[region] || `世界書：${region}`
    }))
  ];

  regionSelect.innerHTML = allOptions
    .map(option => `<option value="${option.value}">${option.label}</option>`)
    .join('');

  const hasPrevious = allOptions.some(option => option.value === previous);
  regionSelect.value = hasPrevious ? previous : allOptions[0].value;
}

function mountWorldbookRecipes() {
  const category = worldbookCategorySelect?.value || 'keywords';
  const key = `sx_worldbook_${category}`;
  const raw = localStorage.getItem(key);

  if (!raw) {
    mountedRecipes = [];
    rebuildRegionOptions();
    if (mountStatusEl) mountStatusEl.textContent = `找不到 ${category} 分頁資料，請先到世界書保存內容。`;
    recommend(true);
    return;
  }

  let entries = [];
  try {
    entries = JSON.parse(raw);
  } catch (_) {
    entries = [];
  }

  const converted = entries.flatMap(entry => {
    const recipe = worldbookEntryToRecipe(entry);
    return Array.isArray(recipe) ? recipe : recipe ? [recipe] : [];
  });

  const uniqueByName = new Map();
  converted.forEach(recipe => {
    if (!recipe?.name) return;
    uniqueByName.set(recipe.name, recipe);
    if (!regionLabel[recipe.region]) {
      regionLabel[recipe.region] = `世界書：${recipe.region}`;
    }
  });

  mountedRecipes = [...uniqueByName.values()];
  rebuildRegionOptions();

  if (mountStatusEl) {
    mountStatusEl.textContent = mountedRecipes.length > 0
      ? `已掛載 ${mountedRecipes.length} 筆世界書食譜（來源：${category}）`
      : `已讀取 ${category} 分頁，但沒有可轉換的食譜資料。`;
  }

  recommend(true);
}

function pickRecipe(randomize = false, avoidName = '') {
  const profile = getProfile();
  const restrictions = getRestrictions();

  const filtered = getAllRecipes().filter(recipe => {
    if (restrictions.length > 0) {
      const check = checkRestrictions(recipe);
      if (!check.ok) {
        console.log(`[daily-recipe] 過濾食譜 "${recipe.name}"：包含禁忌 ${check.matched.join(', ')}`);
        return false;
      }
    }
    return true;
  });

  const ranked = filtered
    .map(recipe => ({ recipe, score: scoreRecipe(recipe, profile) }))
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) return null;

  if (randomize) {
    const topScore = ranked[0].score;
    const topCandidates = ranked.filter(item => item.score >= topScore - 1);
    const candidates = topCandidates.filter(item => item.recipe.name !== avoidName);
    const pool = candidates.length > 0 ? candidates : topCandidates;
    return pool[Math.floor(Math.random() * pool.length)].recipe;
  }

  if (ranked[0].recipe.name !== avoidName) return ranked[0].recipe;
  return ranked[1]?.recipe || ranked[0].recipe;
}

function renderRecipe(recipe) {
  if (!recipe) return;

  dishNameEl.textContent = recipe.name;
  dishMetaEl.textContent = `地區：${regionLabel[recipe.region] || recipe.region} · 偏好：${preferenceLabel[recipe.preference] || recipe.preference} · 時間：${timeLabel[recipe.time] || recipe.time}`;
  dishTagEl.textContent = recipe.tag;
  dishDescEl.textContent = recipe.desc;
  tipsEl.innerHTML = recipe.tips.map(tip => `<span class="tip">${tip}</span>`).join('');

  const resultCard = document.querySelector('.result-card');
  if (resultCard && recipe.thumbnail) {
    let imgEl = resultCard.querySelector('.dish-thumbnail');
    if (!imgEl) {
      imgEl = document.createElement('img');
      imgEl.className = 'dish-thumbnail';
      resultCard.insertBefore(imgEl, resultCard.firstChild);
    }
    imgEl.src = recipe.thumbnail;
    imgEl.alt = recipe.name;
  }

  if (recipe.youtube) {
    let ytBtn = document.querySelector('.youtube-link');
    if (!ytBtn) {
      ytBtn = document.createElement('a');
      ytBtn.className = 'youtube-link';
      ytBtn.target = '_blank';
      ytBtn.innerHTML = '<i class="fab fa-youtube"></i> 觀看教學影片';
      tipsEl.parentNode.insertBefore(ytBtn, tipsEl.nextSibling);
    }
    ytBtn.href = recipe.youtube;
  }
}

function recommend(randomize = false) {
  const currentName = dishNameEl.textContent || '';
  const recipe = pickRecipe(randomize, currentName);
  renderRecipe(recipe);
}

async function recommendFromApi(randomize = false) {
  const region = getSelectedRegion();
  if (!region) {
    showRegionPrompt();
    return;
  }

  const restrictionsValue = restrictionsInput?.value?.trim();
  if (!restrictionsValue) {
    showRestrictionsPrompt();
    return;
  }

  if (isFetchingFromApi) {
    recommend(randomize);
    return;
  }

  isFetchingFromApi = true;
  const originalLabel = recommendBtn.textContent;
  recommendBtn.textContent = '從網路獲取中...';
  recommendBtn.disabled = true;

  try {
    const profile = getProfile();
    let newMeals = [];

    if (randomize) {
      newMeals = await fetchRandomMeals(3);
    } else {
      newMeals = await fetchMealsForProfile(profile);
    }

    cachedMeals = [...cachedMeals, ...newMeals].filter((meal, index, self) =>
      meal && self.findIndex(m => m.name === meal.name) === index
    );

    recommend(randomize);
  } catch (e) {
    console.error('[daily-recipe] API fetch failed:', e);
    recommend(randomize);
  } finally {
    isFetchingFromApi = false;
    recommendBtn.textContent = originalLabel;
    recommendBtn.disabled = false;
  }
}

async function randomFromApi() {
  const region = getSelectedRegion();
  if (!region) {
    showRegionPrompt();
    return;
  }

  const restrictionsValue = restrictionsInput?.value?.trim();
  if (!restrictionsValue) {
    showRestrictionsPrompt();
    return;
  }

  if (isFetchingFromApi) {
    recommend(true);
    return;
  }

  isFetchingFromApi = true;
  randomBtn.disabled = true;

  try {
    const newMeals = await fetchRandomMeals(1);
    cachedMeals = [...cachedMeals, ...newMeals].filter((meal, index, self) =>
      meal && self.findIndex(m => m.name === meal.name) === index
    );
    recommend(true);
  } catch (e) {
    console.error('[daily-recipe] Random fetch failed:', e);
    recommend(true);
  } finally {
    isFetchingFromApi = false;
    randomBtn.disabled = false;
  }
}

recommendBtn?.addEventListener('click', () => recommendFromApi(false));
randomBtn?.addEventListener('click', () => randomFromApi());
mountWorldbookBtn?.addEventListener('click', () => {
  mountWorldbookBtn.disabled = true;
  const originalLabel = mountWorldbookBtn.textContent;
  mountWorldbookBtn.textContent = '掛載中...';

  setTimeout(() => {
    mountWorldbookRecipes();
    mountWorldbookBtn.textContent = '已掛載';
    setTimeout(() => {
      mountWorldbookBtn.textContent = originalLabel;
      mountWorldbookBtn.disabled = false;
    }, 600);
  }, 180);
});

function loadSxSettings() {
  if (typeof SxSettings === 'undefined') return null;
  const settings = SxSettings.getSettingsSnapshot();
  console.log('[daily-recipe] Loaded settings:', {
    characters: settings.characters.length,
    users: settings.users.length,
    worldbook: Object.keys(settings.worldbook).length
  });
  return settings;
}

loadSxSettings();
loadUserPersonalityFromSettings();
loadUserRegionFromSettings();
loadUserRestrictionsFromSettings();

if (!getSelectedRegion()) {
  showRegionPrompt();
} else if (!restrictionsInput?.value?.trim()) {
  showRestrictionsPrompt();
} else {
  recommendFromApi(true);
}

console.log('Loaded app: daily-recipe');

