const customizeCategories = {
  hair: [
    { id: 'hair1', name: 'HAIR_STYLE_01', icon: 'face_retouching_natural' },
    { id: 'hair2', name: 'HAIR_STYLE_02', icon: 'content_cut' },
    { id: 'hair3', name: 'HAIR_STYLE_03', icon: 'brush' }
  ],
  face: [
    { id: 'face1', name: 'FACE_STYLE_01', icon: 'visibility' },
    { id: 'face2', name: 'FACE_STYLE_02', icon: 'mood' },
    { id: 'face3', name: 'FACE_STYLE_03', icon: 'sentiment_satisfied' }
  ],
  gear: [
    { id: 'gear1', name: 'GEAR_STYLE_01', icon: 'checkroom' },
    { id: 'gear2', name: 'GEAR_STYLE_02', icon: 'work' },
    { id: 'gear3', name: 'GEAR_STYLE_03', icon: 'backpack' }
  ],
  palette: [
    { id: 'palette1', name: 'COLOR_SCHEME_01', icon: 'palette' },
    { id: 'palette2', name: 'COLOR_SCHEME_02', icon: 'colorize' },
    { id: 'palette3', name: 'COLOR_SCHEME_03', icon: 'gradient' }
  ]
};

let currentCategory = 'gear';
let currentSlotIndex = 1;
let selectedItems = {
  hair: 0,
  face: 0,
  gear: 0,
  palette: 0
};

function setCustomizeCategory(category) {
  currentCategory = category;
  
  const navButtons = document.querySelectorAll('#customize-nav button');
  navButtons.forEach(btn => {
    btn.classList.remove('bg-tertiary-container', 'text-on-tertiary-container', 'border-2', 'border-tertiary');
    btn.classList.add('text-outline');
  });
  
  const activeBtn = event.currentTarget;
  activeBtn.classList.remove('text-outline');
  activeBtn.classList.add('bg-tertiary-container', 'text-on-tertiary-container', 'border-2', 'border-tertiary');
  
  updateCustomizeSlots();
}

function updateCustomizeSlots() {
  const slotsContainer = document.getElementById('customize-slots');
  const labelEl = document.getElementById('customize-label');
  if (!slotsContainer || !labelEl) return;
  
  const items = customizeCategories[currentCategory];
  const startIdx = Math.max(0, Math.min(currentSlotIndex - 1, items.length - 3));
  
  slotsContainer.innerHTML = '';
  
  for (let i = 0; i < 3; i++) {
    const itemIdx = startIdx + i;
    const item = items[itemIdx];
    const isSelected = itemIdx === currentSlotIndex;
    
    const slot = document.createElement('div');
    slot.className = `slot-item w-16 h-16 border-4 ${isSelected ? 'slot-selected' : 'border-[#586000] bg-[#788800] opacity-60'} p-1 flex items-center justify-center relative`;
    slot.dataset.slot = i;
    slot.dataset.itemIdx = itemIdx;
    
    if (isSelected) {
      slot.innerHTML = `
        <div class="absolute -top-1 -left-1 w-2 h-2 bg-[#303000]"></div>
        <div class="w-full h-full border-2 border-dotted border-[#303000] flex items-center justify-center">
          <span class="material-symbols-outlined text-[#303000] text-2xl">${item?.icon || 'help'}</span>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <div class="w-full h-full border-2 border-dotted border-[#586000] flex items-center justify-center">
          <span class="material-symbols-outlined text-[#586000] text-2xl">${item?.icon || 'help'}</span>
        </div>
      `;
    }
    
    slot.addEventListener('click', () => selectSlot(itemIdx));
    slotsContainer.appendChild(slot);
  }
  
  const currentItem = items[currentSlotIndex];
  labelEl.textContent = `SELECT_${currentItem?.name || 'UNKNOWN'}`;
}

function selectSlot(itemIdx) {
  const items = customizeCategories[currentCategory];
  if (itemIdx >= 0 && itemIdx < items.length) {
    currentSlotIndex = itemIdx;
    selectedItems[currentCategory] = itemIdx;
    updateCustomizeSlots();
    updateTrainerPreview();
  }
}

function prevSlot() {
  const items = customizeCategories[currentCategory];
  currentSlotIndex = Math.max(0, currentSlotIndex - 1);
  updateCustomizeSlots();
  selectedItems[currentCategory] = currentSlotIndex;
  updateTrainerPreview();
}

function nextSlot() {
  const items = customizeCategories[currentCategory];
  currentSlotIndex = Math.min(items.length - 1, currentSlotIndex + 1);
  updateCustomizeSlots();
  selectedItems[currentCategory] = currentSlotIndex;
  updateTrainerPreview();
}

function updateTrainerPreview() {
  const levelEl = document.getElementById('trainer-level');
  if (levelEl) {
    const baseLevel = 42;
    const bonusLevel = Object.values(selectedItems).reduce((sum, idx) => sum + idx, 0);
    levelEl.textContent = baseLevel + bonusLevel;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCustomizeSlots();
});
