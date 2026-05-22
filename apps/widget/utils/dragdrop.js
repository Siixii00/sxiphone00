export class DragDropManager {
  constructor(options = {}) {
    this.dragStartDelay = options.dragStartDelay || 500;
    this.onDragStart = options.onDragStart || (() => {});
    this.onDragMove = options.onDragMove || (() => {});
    this.onDragEnd = options.onDragEnd || (() => {});
    this.onDragCancel = options.onDragCancel || (() => {});
    
    this.isDragging = false;
    this.draggedElement = null;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.timer = null;
    this.dragClone = null;
    this.dropZones = [];
  }
  
  attach(element) {
    element.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    element.addEventListener('pointermove', this.handlePointerMove.bind(this));
    element.addEventListener('pointerup', this.handlePointerUp.bind(this));
    element.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
  }
  
  detach(element) {
    element.removeEventListener('pointerdown', this.handlePointerDown.bind(this));
    element.removeEventListener('pointermove', this.handlePointerMove.bind(this));
    element.removeEventListener('pointerup', this.handlePointerUp.bind(this));
    element.removeEventListener('pointercancel', this.handlePointerCancel.bind(this));
  }
  
  registerDropZone(element) {
    this.dropZones.push(element);
  }
  
  unregisterDropZone(element) {
    const index = this.dropZones.indexOf(element);
    if (index > -1) {
      this.dropZones.splice(index, 1);
    }
  }
  
  handlePointerDown(e) {
    if (e.button !== 0) return;
    
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.draggedElement = e.target.closest('[draggable="true"], .draggable');
    
    if (!this.draggedElement) return;
    
    this.timer = setTimeout(() => {
      this.startDrag(e);
    }, this.dragStartDelay);
  }
  
  handlePointerMove(e) {
    if (!this.draggedElement) return;
    
    this.currentX = e.clientX;
    this.currentY = e.clientY;
    
    if (!this.isDragging) {
      const dx = Math.abs(this.currentX - this.startX);
      const dy = Math.abs(this.currentY - this.startY);
      
      if (dx > 10 || dy > 10) {
        this.cancelDrag();
        return;
      }
      return;
    }
    
    e.preventDefault();
    
    if (this.dragClone) {
      this.dragClone.style.left = (this.currentX - this.dragClone.offsetWidth / 2) + 'px';
      this.dragClone.style.top = (this.currentY - this.dragClone.offsetHeight / 2) + 'px';
    }
    
    this.highlightDropZone(e);
    
    this.onDragMove({
      element: this.draggedElement,
      dx: this.currentX - this.startX,
      dy: this.currentY - this.startY,
      x: this.currentX,
      y: this.currentY
    });
  }
  
  handlePointerUp(e) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.isDragging) {
      this.endDrag(e);
    }
    
    this.reset();
  }
  
  handlePointerCancel(e) {
    this.cancelDrag();
  }
  
  startDrag(e) {
    this.isDragging = true;
    
    this.draggedElement.classList.add('dragging');
    
    this.createDragClone();
    
    this.onDragStart({
      element: this.draggedElement,
      x: this.startX,
      y: this.startY
    });
  }
  
  createDragClone() {
    if (!this.draggedElement) return;
    
    this.dragClone = this.draggedElement.cloneNode(true);
    this.dragClone.classList.add('drag-clone');
    this.dragClone.style.cssText = `
      position: fixed;
      left: ${this.startX - this.draggedElement.offsetWidth / 2}px;
      top: ${this.startY - this.draggedElement.offsetHeight / 2}px;
      width: ${this.draggedElement.offsetWidth}px;
      height: ${this.draggedElement.offsetHeight}px;
      opacity: 0.9;
      transform: scale(1.05);
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(this.dragClone);
  }
  
  highlightDropZone(e) {
    this.dropZones.forEach(zone => {
      const rect = zone.getBoundingClientRect();
      const isOver = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
      zone.classList.toggle('drag-over', isOver);
    });
  }
  
  endDrag(e) {
    let dropped = false;
    
    this.dropZones.forEach(zone => {
      const rect = zone.getBoundingClientRect();
      const isOver = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
      
      if (isOver) {
        this.onDragEnd({
          element: this.draggedElement,
          dropZone: zone,
          x: e.clientX,
          y: e.clientY
        });
        dropped = true;
      }
    });
    
    if (!dropped) {
      this.onDragCancel({
        element: this.draggedElement
      });
    }
    
    this.dropZones.forEach(zone => zone.classList.remove('drag-over'));
  }
  
  cancelDrag() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.isDragging) {
      this.onDragCancel({
        element: this.draggedElement
      });
    }
    
    this.reset();
  }
  
  reset() {
    if (this.draggedElement) {
      this.draggedElement.classList.remove('dragging');
    }
    
    if (this.dragClone) {
      this.dragClone.remove();
      this.dragClone = null;
    }
    
    this.isDragging = false;
    this.draggedElement = null;
    this.dropZones.forEach(zone => zone.classList.remove('drag-over'));
  }
  
  isCurrentlyDragging() {
    return this.isDragging;
  }
  
  getDraggedElement() {
    return this.draggedElement;
  }
}

export function createDraggable(element, options = {}) {
  const manager = new DragDropManager(options);
  manager.attach(element);
  return manager;
}

export function makeDropZone(element, options = {}) {
  const onDrop = options.onDrop || (() => {});
  
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    element.classList.add('drag-over');
  });
  
  element.addEventListener('dragleave', () => {
    element.classList.remove('drag-over');
  });
  
  element.addEventListener('drop', (e) => {
    e.preventDefault();
    element.classList.remove('drag-over');
    
    const data = e.dataTransfer.getData('text/plain');
    onDrop({
      element: element,
      data: data,
      x: e.clientX,
      y: e.clientY
    });
  });
  
  return element;
}
