class CollisionSystem {
  constructor() {
    this.collisionMap = new Map();
  }
  
  buildCollisionMap(floor) {
    const map = MAP_DATA[floor];
    if (!map) return;
    
    const collisions = [];
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        if (tile && this.isCollidable(tile)) {
          collisions.push({ x, y, type: tile.type, tile });
        }
      }
    }
    
    this.collisionMap.set(floor, collisions);
  }
  
  isCollidable(tile) {
    const collidableTypes = [
      TILE_TYPES.WALL,
      TILE_TYPES.MACHINE,
      TILE_TYPES.NPC,
      TILE_TYPES.SERVICE_DESK,
      TILE_TYPES.DECORATION
    ];
    
    return collidableTypes.includes(tile.type);
  }
  
  checkCollision(floor, x, y) {
    const map = MAP_DATA[floor];
    if (!map) return true;
    
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return true;
    }
    
    const tile = map[y][x];
    if (!tile) return true;
    
    return this.isCollidable(tile);
  }
  
  getCollisionBox(floor, x, y) {
    const map = MAP_DATA[floor];
    if (!map || !map[y] || !map[y][x]) return null;
    
    const tile = map[y][x];
    if (!this.isCollidable(tile)) return null;
    
    return {
      x: x * TILE_SIZE,
      y: y * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      type: tile.type
    };
  }
  
  getNearbyCollidables(floor, x, y, radius = 2) {
    const nearby = [];
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const checkX = x + dx;
        const checkY = y + dy;
        
        if (this.checkCollision(floor, checkX, checkY)) {
          nearby.push({ x: checkX, y: checkY, distance: Math.abs(dx) + Math.abs(dy) });
        }
      }
    }
    
    return nearby.sort((a, b) => a.distance - b.distance);
  }
  
  findPath(floor, startX, startY, endX, endY) {
    const map = MAP_DATA[floor];
    if (!map) return null;
    
    const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
    const closedSet = new Set();
    
    const heuristic = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);
    
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      
      if (current.x === endX && current.y === endY) {
        const path = [];
        let node = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        return path;
      }
      
      closedSet.add(`${current.x},${current.y}`);
      
      const neighbors = [
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y }
      ];
      
      for (const neighbor of neighbors) {
        if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;
        if (this.checkCollision(floor, neighbor.x, neighbor.y)) continue;
        
        const g = current.g + 1;
        const h = heuristic(neighbor.x, neighbor.y, endX, endY);
        const f = g + h;
        
        const existing = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
        if (existing) {
          if (g < existing.g) {
            existing.g = g;
            existing.f = f;
            existing.parent = current;
          }
        } else {
          openSet.push({ x: neighbor.x, y: neighbor.y, g, h, f, parent: current });
        }
      }
    }
    
    return null;
  }
  
  raycast(floor, startX, startY, direction, maxDistance = 10) {
    const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
    const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
    
    for (let i = 1; i <= maxDistance; i++) {
      const checkX = startX + dx * i;
      const checkY = startY + dy * i;
      
      if (this.checkCollision(floor, checkX, checkY)) {
        return {
          hit: true,
          x: checkX,
          y: checkY,
          distance: i,
          tile: MAP_DATA[floor]?.[checkY]?.[checkX]
        };
      }
    }
    
    return { hit: false, distance: maxDistance };
  }
}

const collisionSystem = new CollisionSystem();

Object.keys(MAP_DATA).forEach(floor => {
  collisionSystem.buildCollisionMap(floor);
});
