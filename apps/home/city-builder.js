const buildingTypes = {
  house: { name: 'House', cost: 100, icon: 'home', color: '#e74c3c' },
  pokecenter: { name: 'Pokemon Center', cost: 500, icon: 'local_hospital', color: '#e74c3c' },
  pokemart: { name: 'Poke Mart', cost: 300, icon: 'store', color: '#3498db' },
  gym: { name: 'Gym', cost: 800, icon: 'fitness_center', color: '#9b59b6' },
  park: { name: 'Park', cost: 200, icon: 'park', color: '#27ae60' },
  fountain: { name: 'Fountain', cost: 150, icon: 'water_drop', color: '#5dade2' },
  lamp: { name: 'Lamp', cost: 50, icon: 'light', color: '#f1c40f' },
  tree: { name: 'Tree', cost: 25, icon: 'forest', color: '#27ae60' }
};

let cityState = {
  gold: 1000,
  buildings: [],
  selectedBuilding: null
};

function initCityBuilder() {
  const grid = document.getElementById('city-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  for (let i = 0; i < 24; i++) {
    const cell = document.createElement('div');
    cell.className = 'bg-surface-container-high/50 border border-surface-container-highest flex items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors';
    cell.dataset.cell = i;
    cell.addEventListener('click', () => placeBuilding(i));
    grid.appendChild(cell);
  }
  
  renderCityBuildings();
  updateGoldDisplay();
}

function selectBuilding(type) {
  if (!buildingTypes[type]) return;
  
  const allBuildingItems = document.querySelectorAll('.building-item');
  allBuildingItems.forEach(item => {
    item.classList.remove('bg-lcd-on/30', 'border-lcd-on');
    item.classList.add('bg-lcd-on/10', 'border-lcd-on/40');
  });
  
  const selectedItem = document.querySelector(`[data-building="${type}"]`);
  if (selectedItem) {
    selectedItem.classList.remove('bg-lcd-on/10', 'border-lcd-on/40');
    selectedItem.classList.add('bg-lcd-on/30', 'border-lcd-on');
  }
  
  cityState.selectedBuilding = type;
  
  const labelEl = document.getElementById('builder-label');
  if (labelEl) {
    labelEl.textContent = `SELECTED: ${buildingTypes[type].name.toUpperCase()} (${buildingTypes[type].cost}g)`;
  }
}

function placeBuilding(cellIndex) {
  if (!cityState.selectedBuilding) {
    const labelEl = document.getElementById('builder-label');
    if (labelEl) labelEl.textContent = 'SELECT_A_BUILDING_FIRST';
    return;
  }
  
  const buildingType = buildingTypes[cityState.selectedBuilding];
  
  const existingIdx = cityState.buildings.findIndex(b => b.cell === cellIndex);
  if (existingIdx >= 0) {
    cityState.gold += Math.floor(buildingTypes[cityState.buildings[existingIdx].type].cost * 0.5);
    cityState.buildings.splice(existingIdx, 1);
    renderCityBuildings();
    updateGoldDisplay();
    updateBuildingCount();
    return;
  }
  
  if (cityState.gold < buildingType.cost) {
    const labelEl = document.getElementById('builder-label');
    if (labelEl) labelEl.textContent = 'NOT_ENOUGH_GOLD!';
    return;
  }
  
  cityState.gold -= buildingType.cost;
  cityState.buildings.push({
    type: cityState.selectedBuilding,
    cell: cellIndex
  });
  
  renderCityBuildings();
  updateGoldDisplay();
  updateBuildingCount();
  
  const labelEl = document.getElementById('builder-label');
  if (labelEl) {
    labelEl.textContent = `PLACED: ${buildingType.name.toUpperCase()}`;
  }
}

function renderCityBuildings() {
  const grid = document.getElementById('city-grid');
  if (!grid) return;
  
  const cells = grid.children;
  
  for (let i = 0; i < cells.length; i++) {
    cells[i].innerHTML = '';
    cells[i].className = 'bg-surface-container-high/50 border border-surface-container-highest flex items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors';
  }
  
  cityState.buildings.forEach(building => {
    const cell = cells[building.cell];
    if (cell && buildingTypes[building.type]) {
      const bt = buildingTypes[building.type];
      cell.innerHTML = `<span class="material-symbols-outlined" style="color: ${bt.color}; font-size: 20px;">${bt.icon}</span>`;
      cell.classList.add('bg-surface-container-low');
    }
  });
}

function updateGoldDisplay() {
  const goldEl = document.getElementById('gold-display');
  if (goldEl) {
    goldEl.textContent = cityState.gold.toLocaleString();
  }
}

function updateBuildingCount() {
  const countEl = document.getElementById('building-count');
  if (countEl) {
    countEl.textContent = cityState.buildings.length;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedCity = localStorage.getItem('sinnoh_city_save');
  if (savedCity) {
    cityState = JSON.parse(savedCity);
  }
});

window.addEventListener('beforeunload', () => {
  localStorage.setItem('sinnoh_city_save', JSON.stringify(cityState));
});
