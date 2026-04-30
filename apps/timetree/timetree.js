/**
 * TimeTree App - SXI Phone
 * 一個仿 TimeTree 的共享日曆應用程式
 */

(function() {
  'use strict';

  // ==================== 狀態管理 ====================
  const state = {
    currentDate: new Date(),
    selectedDate: null,
    currentCalendar: 'personal',
    events: [],
    editingEventId: null,
    calendars: {
      personal: { name: '我的日曆', color: '#4CAF50', type: '個人' },
      family: { name: '家庭', color: '#FF9800', type: '共享' },
      work: { name: '工作', color: '#2196F3', type: '共享' },
      love: { name: '戀人', color: '#E91E63', type: '共享' }
    },
    members: {
      personal: [{ name: '我', role: '擁有者', avatar: '我' }],
      family: [
        { name: '我', role: '擁有者', avatar: '我' },
        { name: '媽媽', role: '成員', avatar: '媽' },
        { name: '爸爸', role: '成員', avatar: '爸' }
      ],
      work: [
        { name: '我', role: '擁有者', avatar: '我' },
        { name: '同事A', role: '成員', avatar: 'A' }
      ],
      love: [
        { name: '我', role: '擁有者', avatar: '我' },
        { name: '親愛的', role: '成員', avatar: '愛' }
      ]
    }
  };

  // ==================== DOM 元素 ====================
  const elements = {
    // Top Bar
    backBtn: document.getElementById('backBtn'),
    
    // Header
    menuBtn: document.getElementById('menuBtn'),
    addEventBtn: document.getElementById('addEventBtn'),
    currentCalendarName: document.getElementById('currentCalendarName'),
    calendarType: document.getElementById('calendarType'),
    
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    calendarList: document.getElementById('calendarList'),
    newCalendarBtn: document.getElementById('newCalendarBtn'),
    searchBtn: document.getElementById('searchBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    
    // Calendar
    calendarGrid: document.getElementById('calendarGrid'),
    currentYear: document.getElementById('currentYear'),
    currentMonth: document.getElementById('currentMonth'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    todayBtn: document.getElementById('todayBtn'),
    
    // Event Panel
    eventPanel: document.getElementById('eventPanel'),
    panelDate: document.getElementById('panelDate'),
    dayEvents: document.getElementById('dayEvents'),
    closePanelBtn: document.getElementById('closePanelBtn'),
    addEventCardBtn: document.getElementById('addEventCardBtn'),
    
    // Event Modal
    eventModal: document.getElementById('eventModal'),
    modalTitle: document.getElementById('modalTitle'),
    eventForm: document.getElementById('eventForm'),
    eventTitle: document.getElementById('eventTitle'),
    eventStartDate: document.getElementById('eventStartDate'),
    eventStartTime: document.getElementById('eventStartTime'),
    eventEndDate: document.getElementById('eventEndDate'),
    eventEndTime: document.getElementById('eventEndTime'),
    eventCalendar: document.getElementById('eventCalendar'),
    eventMemo: document.getElementById('eventMemo'),
    eventAllDay: document.getElementById('eventAllDay'),
    eventReminder: document.getElementById('eventReminder'),
    colorPicker: document.getElementById('colorPicker'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelEventBtn: document.getElementById('cancelEventBtn'),
    
    // Search Modal
    searchModal: document.getElementById('searchModal'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    closeSearchBtn: document.getElementById('closeSearchBtn'),
    
    // Members Modal
    membersModal: document.getElementById('membersModal'),
    membersList: document.getElementById('membersList'),
    closeMembersBtn: document.getElementById('closeMembersBtn'),
    inviteBtn: document.getElementById('inviteBtn')
  };

  // ==================== 工具函數 ====================
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                      '七月', '八月', '九月', '十月', '十一月', '十二月'];
  
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? '下午' : '上午';
    const h12 = h % 12 || 12;
    return `${ampm} ${h12}:${minutes}`;
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  // ==================== 本地存儲 ====================
  function saveEvents() {
    localStorage.setItem('timetree_events', JSON.stringify(state.events));
  }

  function loadEvents() {
    const saved = localStorage.getItem('timetree_events');
    if (saved) {
      state.events = JSON.parse(saved);
    } else {
      // 預設示範事件
      const today = new Date();
      state.events = [
        {
          id: generateId(),
          title: '團隊會議',
          startDate: formatDate(today),
          startTime: '10:00',
          endDate: formatDate(today),
          endTime: '11:30',
          calendar: 'work',
          color: '#2196F3',
          memo: '討論專案進度',
          allDay: false,
          reminder: true
        },
        {
          id: generateId(),
          title: '家庭聚餐',
          startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)),
          startTime: '18:00',
          endDate: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)),
          endTime: '21:00',
          calendar: 'family',
          color: '#FF9800',
          memo: '慶祝媽媽生日',
          allDay: false,
          reminder: true
        },
        {
          id: generateId(),
          title: '約會',
          startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5)),
          startTime: '19:00',
          endDate: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5)),
          endTime: '22:00',
          calendar: 'love',
          color: '#E91E63',
          memo: '電影約會',
          allDay: false,
          reminder: true
        },
        {
          id: generateId(),
          title: '健身',
          startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)),
          startTime: '07:00',
          endDate: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)),
          endTime: '08:00',
          calendar: 'personal',
          color: '#4CAF50',
          memo: '晨跑 + 重訓',
          allDay: false,
          reminder: false
        }
      ];
      saveEvents();
    }
  }

  // ==================== 日曆渲染 ====================
  function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    
    // 更新標題
    elements.currentYear.textContent = year;
    elements.currentMonth.textContent = monthNames[month];
    
    // 清空日曆
    elements.calendarGrid.innerHTML = '';
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    
    const today = new Date();
    
    // 上個月的日期
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      createDayCell(date, true);
    }
    
    // 當月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      createDayCell(date, false);
    }
    
    // 下個月的日期
    const totalCells = elements.calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      createDayCell(date, true);
    }
  }

  function createDayCell(date, isOtherMonth) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    
    const today = new Date();
    const dayOfWeek = date.getDay();
    
    if (isOtherMonth) {
      cell.classList.add('other-month');
    }
    
    if (isSameDay(date, today)) {
      cell.classList.add('today');
    }
    
    if (dayOfWeek === 0) {
      cell.classList.add('sun');
    } else if (dayOfWeek === 6) {
      cell.classList.add('sat');
    }
    
    if (state.selectedDate && isSameDay(date, state.selectedDate)) {
      cell.classList.add('selected');
    }
    
    // 日期數字
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    cell.appendChild(dayNumber);
    
    // 事件
    const dayEventsContainer = document.createElement('div');
    dayEventsContainer.className = 'day-events';
    
    const dayEvents = getEventsForDate(date);
    const maxVisible = 3;
    
    dayEvents.slice(0, maxVisible).forEach(event => {
      const eventDot = document.createElement('div');
      eventDot.className = 'event-dot';
      eventDot.style.background = event.color;
      eventDot.textContent = event.title;
      eventDot.addEventListener('click', (e) => {
        e.stopPropagation();
        openEventModal(event);
      });
      dayEventsContainer.appendChild(eventDot);
    });
    
    if (dayEvents.length > maxVisible) {
      const more = document.createElement('div');
      more.className = 'event-more';
      more.textContent = `+${dayEvents.length - maxVisible} 更多`;
      more.addEventListener('click', (e) => {
        e.stopPropagation();
        selectDate(date);
      });
      dayEventsContainer.appendChild(more);
    }
    
    cell.appendChild(dayEventsContainer);
    
    // 點擊選擇日期
    cell.addEventListener('click', () => {
      selectDate(date);
    });
    
    elements.calendarGrid.appendChild(cell);
  }

  function getEventsForDate(date) {
    const dateStr = formatDate(date);
    return state.events.filter(event => {
      return event.startDate === dateStr || 
             (event.startDate <= dateStr && event.endDate >= dateStr);
    }).sort((a, b) => {
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return 0;
    });
  }

  // ==================== 日期選擇 ====================
  function selectDate(date) {
    state.selectedDate = date;
    renderCalendar();
    showEventPanel(date);
  }

  function showEventPanel(date) {
    elements.panelDate.textContent = formatDisplayDate(date);
    renderDayEvents(date);
    elements.eventPanel.classList.add('open');
  }

  function hideEventPanel() {
    elements.eventPanel.classList.remove('open');
    state.selectedDate = null;
    renderCalendar();
  }

  function renderDayEvents(date) {
    const events = getEventsForDate(date);
    
    if (events.length === 0) {
      elements.dayEvents.innerHTML = '<p class="no-events">這天沒有任何事件</p>';
      return;
    }
    
    elements.dayEvents.innerHTML = '<div class="day-events-list"></div>';
    const list = elements.dayEvents.querySelector('.day-events-list');
    
    events.forEach(event => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.style.borderLeftColor = event.color;
      
      const timeStr = event.allDay ? '全天' : 
                      (event.startTime ? formatTime(event.startTime) : '');
      
      card.innerHTML = `
        <div class="event-time">${timeStr}</div>
        <div class="event-info">
          <div class="event-title">${event.title}</div>
          ${event.memo ? `<div class="event-memo">${event.memo}</div>` : ''}
        </div>
      `;
      
      card.addEventListener('click', () => {
        openEventModal(event);
      });
      
      list.appendChild(card);
    });
  }

  // ==================== 事件 Modal ====================
  function openEventModal(event = null) {
    if (event) {
      // 編輯模式
      state.editingEventId = event.id;
      elements.modalTitle.textContent = '編輯事件';
      elements.eventTitle.value = event.title;
      elements.eventStartDate.value = event.startDate;
      elements.eventStartTime.value = event.startTime || '';
      elements.eventEndDate.value = event.endDate || event.startDate;
      elements.eventEndTime.value = event.endTime || '';
      elements.eventCalendar.value = event.calendar;
      elements.eventMemo.value = event.memo || '';
      elements.eventAllDay.checked = event.allDay;
      elements.eventReminder.checked = event.reminder;
      
      // 設定顏色
      const colorOptions = elements.colorPicker.querySelectorAll('.color-option');
      colorOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.color === event.color);
      });
    } else {
      // 新增模式
      state.editingEventId = null;
      elements.modalTitle.textContent = '新增事件';
      elements.eventForm.reset();
      
      // 設定預設日期
      const defaultDate = state.selectedDate || new Date();
      elements.eventStartDate.value = formatDate(defaultDate);
      elements.eventEndDate.value = formatDate(defaultDate);
      
      // 設定預設日曆
      elements.eventCalendar.value = state.currentCalendar;
      
      // 重置顏色選擇
      const colorOptions = elements.colorPicker.querySelectorAll('.color-option');
      colorOptions.forEach(opt => opt.classList.remove('active'));
      colorOptions[0].classList.add('active');
    }
    
    elements.eventModal.classList.add('open');
  }

  function closeEventModal() {
    elements.eventModal.classList.remove('open');
    state.editingEventId = null;
  }

  function saveEvent(e) {
    e.preventDefault();
    
    const selectedColor = elements.colorPicker.querySelector('.color-option.active');
    
    const eventData = {
      id: state.editingEventId || generateId(),
      title: elements.eventTitle.value,
      startDate: elements.eventStartDate.value,
      startTime: elements.eventAllDay.checked ? '' : elements.eventStartTime.value,
      endDate: elements.eventEndDate.value || elements.eventStartDate.value,
      endTime: elements.eventAllDay.checked ? '' : elements.eventEndTime.value,
      calendar: elements.eventCalendar.value,
      color: selectedColor ? selectedColor.dataset.color : '#4CAF50',
      memo: elements.eventMemo.value,
      allDay: elements.eventAllDay.checked,
      reminder: elements.eventReminder.checked
    };
    
    if (state.editingEventId) {
      // 更新現有事件
      const index = state.events.findIndex(e => e.id === state.editingEventId);
      if (index !== -1) {
        state.events[index] = eventData;
      }
    } else {
      // 新增事件
      state.events.push(eventData);
    }
    
    saveEvents();
    closeEventModal();
    renderCalendar();
    
    // 如果事件面板開著，更新它
    if (state.selectedDate) {
      renderDayEvents(state.selectedDate);
    }
  }

  function deleteEvent() {
    if (!state.editingEventId) return;
    
    if (confirm('確定要刪除這個事件嗎？')) {
      state.events = state.events.filter(e => e.id !== state.editingEventId);
      saveEvents();
      closeEventModal();
      renderCalendar();
      
      if (state.selectedDate) {
        renderDayEvents(state.selectedDate);
      }
    }
  }

  // ==================== 搜尋功能 ====================
  function openSearchModal() {
    elements.searchModal.classList.add('open');
    elements.searchInput.value = '';
    elements.searchResults.innerHTML = '<p class="search-hint">輸入關鍵字搜尋事件</p>';
    elements.searchInput.focus();
  }

  function closeSearchModal() {
    elements.searchModal.classList.remove('open');
  }

  function searchEvents(query) {
    if (!query.trim()) {
      elements.searchResults.innerHTML = '<p class="search-hint">輸入關鍵字搜尋事件</p>';
      return;
    }
    
    const results = state.events.filter(event => 
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      (event.memo && event.memo.toLowerCase().includes(query.toLowerCase()))
    );
    
    if (results.length === 0) {
      elements.searchResults.innerHTML = '<p class="search-hint">沒有找到相關事件</p>';
      return;
    }
    
    elements.searchResults.innerHTML = '';
    results.forEach(event => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      
      const date = new Date(event.startDate);
      item.innerHTML = `
        <div class="search-result-color" style="background: ${event.color}"></div>
        <div class="search-result-info">
          <div class="search-result-title">${event.title}</div>
          <div class="search-result-date">${formatDisplayDate(date)}</div>
        </div>
      `;
      
      item.addEventListener('click', () => {
        closeSearchModal();
        state.currentDate = new Date(event.startDate);
        renderCalendar();
        selectDate(new Date(event.startDate));
        openEventModal(event);
      });
      
      elements.searchResults.appendChild(item);
    });
  }

  // ==================== 成員管理 ====================
  function openMembersModal() {
    const members = state.members[state.currentCalendar] || [];
    
    elements.membersList.innerHTML = '';
    members.forEach(member => {
      const item = document.createElement('div');
      item.className = 'member-item';
      item.innerHTML = `
        <div class="member-avatar">${member.avatar}</div>
        <div class="member-info">
          <div class="member-name">${member.name}</div>
          <div class="member-role">${member.role}</div>
        </div>
      `;
      elements.membersList.appendChild(item);
    });
    
    elements.membersModal.classList.add('open');
  }

  function closeMembersModal() {
    elements.membersModal.classList.remove('open');
  }

  function openNewCalendarModal() {
    const modal = document.getElementById('newCalendarModal');
    const form = document.getElementById('newCalendarForm');
    const nameInput = document.getElementById('newCalendarName');
    const colorPicker = document.getElementById('newCalendarColorPicker');
    
    form.reset();
    nameInput.focus();
    
    const colorOptions = colorPicker.querySelectorAll('.color-option');
    colorOptions.forEach(opt => opt.classList.remove('active'));
    colorOptions[0].classList.add('active');
    
    modal.classList.add('open');
  }

  function closeNewCalendarModal() {
    document.getElementById('newCalendarModal').classList.remove('open');
  }

  function saveNewCalendar(e) {
    e.preventDefault();
    
    const name = document.getElementById('newCalendarName').value.trim();
    const type = document.getElementById('newCalendarType').value;
    const colorPicker = document.getElementById('newCalendarColorPicker');
    const selectedColor = colorPicker.querySelector('.color-option.active');
    const color = selectedColor ? selectedColor.dataset.color : '#4CAF50';
    
    if (!name) return;
    
    const id = 'custom_' + generateId();
    state.calendars[id] = { name, color, type };
    state.members[id] = [{ name: '我', role: '擁有者', avatar: '我' }];
    
    saveCalendars();
    renderCalendarList();
    closeNewCalendarModal();
    
    switchCalendar(id);
  }

  function saveCalendars() {
    localStorage.setItem('timetree_calendars', JSON.stringify(state.calendars));
    localStorage.setItem('timetree_members', JSON.stringify(state.members));
  }

  function loadCalendars() {
    const savedCalendars = localStorage.getItem('timetree_calendars');
    const savedMembers = localStorage.getItem('timetree_members');
    
    if (savedCalendars) {
      try {
        const parsed = JSON.parse(savedCalendars);
        Object.assign(state.calendars, parsed);
      } catch (e) {
        console.warn('Failed to load calendars:', e);
      }
    }
    
    if (savedMembers) {
      try {
        const parsed = JSON.parse(savedMembers);
        Object.assign(state.members, parsed);
      } catch (e) {
        console.warn('Failed to load members:', e);
      }
    }
  }

  function renderCalendarList() {
    const list = elements.calendarList;
    list.innerHTML = '';
    
    Object.entries(state.calendars).forEach(([id, calendar]) => {
      const item = document.createElement('li');
      item.className = 'calendar-item';
      item.dataset.calendar = id;
      if (id === state.currentCalendar) {
        item.classList.add('active');
      }
      
      item.innerHTML = `
        <span class="calendar-dot" style="background: ${calendar.color};"></span>
        <span class="calendar-name">${calendar.name}</span>
        <span class="calendar-badge">${calendar.type}</span>
      `;
      
      list.appendChild(item);
    });
  }

  function openInviteModal() {
    const modal = document.getElementById('inviteModal');
    const nameInput = document.getElementById('inviteMemberName');
    const linkInput = document.getElementById('inviteLink');
    
    nameInput.value = '';
    nameInput.focus();
    
    const shareId = state.currentCalendar + '_' + Date.now().toString(36);
    const shareUrl = `${window.location.origin}${window.location.pathname}?join=${shareId}`;
    linkInput.value = shareUrl;
    
    modal.classList.add('open');
  }

  function closeInviteModal() {
    document.getElementById('inviteModal').classList.remove('open');
  }

  function addInvitedMember() {
    const name = document.getElementById('inviteMemberName').value.trim();
    const role = document.getElementById('inviteMemberRole').value;
    
    if (!name) {
      alert('請輸入成員名稱');
      return;
    }
    
    const calendarId = state.currentCalendar;
    if (!state.members[calendarId]) {
      state.members[calendarId] = [{ name: '我', role: '擁有者', avatar: '我' }];
    }
    
    const avatar = name.charAt(0).toUpperCase();
    state.members[calendarId].push({ name, role, avatar });
    
    saveCalendars();
    closeInviteModal();
    openMembersModal();
  }

  function copyInviteLink() {
    const linkInput = document.getElementById('inviteLink');
    linkInput.select();
    document.execCommand('copy');
    
    const copyBtn = document.getElementById('copyInviteLink');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '已複製';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1500);
  }

  // ==================== 側邊欄 ====================
  function toggleSidebar() {
    elements.sidebar.classList.toggle('open');
  }

  function closeSidebar() {
    elements.sidebar.classList.remove('open');
  }

  function switchCalendar(calendarId) {
    state.currentCalendar = calendarId;
    const calendar = state.calendars[calendarId];
    
    elements.currentCalendarName.textContent = calendar.name;
    elements.calendarType.textContent = calendar.type;
    
    // 更新側邊欄選中狀態
    const items = elements.calendarList.querySelectorAll('.calendar-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.calendar === calendarId);
    });
    
    closeSidebar();
    renderCalendar();
  }

  // ==================== 月份導航 ====================
  function prevMonth() {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    renderCalendar();
  }

  function nextMonth() {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    renderCalendar();
  }

  function goToToday() {
    state.currentDate = new Date();
    renderCalendar();
    selectDate(new Date());
  }

  // ==================== 顏色選擇 ====================
  function initColorPicker() {
    const colorOptions = elements.colorPicker.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
      });
    });
  }

  // ==================== 事件綁定 ====================
  function bindEvents() {
    // Top Bar - 返回按鈕
    elements.backBtn.addEventListener('click', () => {
      if (window.parent) {
        window.parent.postMessage({ type: 'closeApp' }, '*');
      }
    });
    
    // Header
    elements.menuBtn.addEventListener('click', toggleSidebar);
    elements.addEventBtn.addEventListener('click', () => openEventModal());
    
    // Sidebar
    elements.calendarList.addEventListener('click', (e) => {
      const item = e.target.closest('.calendar-item');
      if (item) {
        switchCalendar(item.dataset.calendar);
      }
    });
    
    elements.newCalendarBtn.addEventListener('click', openNewCalendarModal);
    
    elements.searchBtn.addEventListener('click', () => {
      closeSidebar();
      openSearchModal();
    });
    
    elements.settingsBtn.addEventListener('click', () => {
      closeSidebar();
      if (window.parent) {
        window.parent.postMessage({ type: 'openApp', app: 'settings' }, '*');
      }
    });
    
    // Month Navigation
    elements.prevMonth.addEventListener('click', prevMonth);
    elements.nextMonth.addEventListener('click', nextMonth);
    elements.todayBtn.addEventListener('click', goToToday);
    
    // Event Panel
    elements.closePanelBtn.addEventListener('click', hideEventPanel);
    elements.addEventCardBtn.addEventListener('click', () => openEventModal());
    
    // Event Modal
    elements.eventForm.addEventListener('submit', saveEvent);
    elements.closeModalBtn.addEventListener('click', closeEventModal);
    elements.cancelEventBtn.addEventListener('click', closeEventModal);
    
    // Search Modal
    elements.closeSearchBtn.addEventListener('click', closeSearchModal);
    elements.searchInput.addEventListener('input', (e) => searchEvents(e.target.value));
    
    // Members Modal
    elements.closeMembersBtn.addEventListener('click', closeMembersModal);
    elements.inviteBtn.addEventListener('click', openInviteModal);
    
    // 點擊側邊欄外部關閉
    document.addEventListener('click', (e) => {
      if (elements.sidebar.classList.contains('open') &&
          !elements.sidebar.contains(e.target) &&
          !elements.menuBtn.contains(e.target)) {
        closeSidebar();
      }
    });
    
    // 點擊 Modal 外部關閉
    elements.eventModal.addEventListener('click', (e) => {
      if (e.target === elements.eventModal) {
        closeEventModal();
      }
    });
    
    elements.searchModal.addEventListener('click', (e) => {
      if (e.target === elements.searchModal) {
        closeSearchModal();
      }
    });
    
    elements.membersModal.addEventListener('click', (e) => {
      if (e.target === elements.membersModal) {
        closeMembersModal();
      }
    });
    
    document.getElementById('newCalendarModal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('newCalendarModal')) {
        closeNewCalendarModal();
      }
    });
    
    document.getElementById('inviteModal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('inviteModal')) {
        closeInviteModal();
      }
    });
    
    document.getElementById('newCalendarForm')?.addEventListener('submit', saveNewCalendar);
    document.getElementById('closeNewCalendarBtn')?.addEventListener('click', closeNewCalendarModal);
    document.getElementById('cancelNewCalendarBtn')?.addEventListener('click', closeNewCalendarModal);
    
    document.getElementById('closeInviteBtn')?.addEventListener('click', closeInviteModal);
    document.getElementById('cancelInviteBtn')?.addEventListener('click', closeInviteModal);
    document.getElementById('confirmInviteBtn')?.addEventListener('click', addInvitedMember);
    document.getElementById('copyInviteLink')?.addEventListener('click', copyInviteLink);
    
    const newColorPicker = document.getElementById('newCalendarColorPicker');
    if (newColorPicker) {
      newColorPicker.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
          newColorPicker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
        });
      });
    }
    
    // 全天事件切換
    elements.eventAllDay.addEventListener('change', (e) => {
      const disabled = e.target.checked;
      elements.eventStartTime.disabled = disabled;
      elements.eventEndTime.disabled = disabled;
    });
    
    // 日曆選擇時更新顏色
    elements.eventCalendar.addEventListener('change', (e) => {
      const calendar = state.calendars[e.target.value];
      const colorOptions = elements.colorPicker.querySelectorAll('.color-option');
      colorOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.color === calendar.color);
      });
    });
    
    // 鍵盤快捷鍵
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeEventModal();
        closeSearchModal();
        closeMembersModal();
        hideEventPanel();
        closeSidebar();
      }
    });
  }

  // ==================== iOS Safari / Android Chrome 儲存保護 ====================
  const saveTimetreeData = () => {
    try {
      localStorage.setItem('sx_timetree_events', JSON.stringify(state.events));
      localStorage.setItem('sx_timetree_calendars', JSON.stringify(state.calendars));
    } catch (e) {
      console.warn('[timetree] 保存數據失敗:', e);
    }
  };

  window.addEventListener('pagehide', saveTimetreeData);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveTimetreeData();
  });
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'APP_WILL_CLOSE') saveTimetreeData();
  });

  // ==================== 初始化 ====================
  function loadSxSettings() {
    if (typeof SxSettings === 'undefined') return null;
    const settings = SxSettings.getSettingsSnapshot();
    console.log('[timetree] Loaded settings:', {
      characters: settings.characters.length,
      users: settings.users.length,
      npcs: settings.npcs.length
    });
    return settings;
  }

  function init() {
    loadSxSettings();
    loadCalendars();
    loadEvents();
    renderCalendarList();
    renderCalendar();
    initColorPicker();
    bindEvents();
    
    // 預設選擇今天
    const today = new Date();
    if (state.currentDate.getMonth() === today.getMonth() && 
        state.currentDate.getFullYear() === today.getFullYear()) {
      // 如果當前月份包含今天，不自動選擇
    }
    
    console.log('TimeTree app initialized');
  }

  // 啟動應用
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
