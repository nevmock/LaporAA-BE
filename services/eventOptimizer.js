// Backend Event Optimization - Node.js
// Generated: July 4, 2025

class BackendEventOptimizer {
  constructor(io) {
    this.io = io;
    this.eventFilters = new Map();
    this.rateLimiters = new Map();
    this.pendingBatches = new Map();
    this.batchTimeout = 100; // 100ms
    this.maxBatchSize = 10;
    
    this.setupDefaultFilters();
    this.startBatchProcessor();
  }

  setupDefaultFilters() {
    // High-priority events - immediate delivery
    this.addFilter('newMessage', {
      rooms: ['global', 'admins'],
      roles: ['admin', 'super-admin'],
      priority: 'high',
      rateLimit: 10,
      batchable: false
    });

    this.addFilter('systemAlert', {
      rooms: ['global'],
      roles: ['admin', 'super-admin', 'user'],
      priority: 'critical',
      batchable: false
    });

    // Medium-priority events - can be batched
    this.addFilter('dashboardUpdate', {
      rooms: ['admins'],
      roles: ['admin', 'super-admin'],
      priority: 'normal',
      rateLimit: 5,
      batchable: true
    });

    this.addFilter('liveStatsUpdate', {
      rooms: ['admins'],
      roles: ['admin', 'super-admin'],
      priority: 'normal',
      rateLimit: 2,
      batchable: true
    });

    // Low-priority events - heavily batched
    this.addFilter('userActivity', {
      rooms: ['admins'],
      roles: ['admin', 'super-admin'],
      priority: 'low',
      rateLimit: 1,
      batchable: true
    });
  }

  addFilter(eventType, filter) {
    this.eventFilters.set(eventType, filter);
    console.log(`📋 Backend filter added: ${eventType}`);
  }

  // Optimized emit to rooms
  emitToRooms(rooms, event, data, options = {}) {
    const filter = this.eventFilters.get(event);
    
    if (!filter) {
      // No filter, emit normally
      rooms.forEach(room => {
        this.io.to(room).emit(event, data);
      });
      return;
    }

    // Check rate limiting
    if (!this.checkRateLimit(event, filter.rateLimit)) {
      console.log(`⚠️ Rate limit exceeded for ${event}`);
      return;
    }

    // Filter rooms
    const filteredRooms = this.filterRooms(rooms, filter.rooms);
    
    if (filter.batchable && filter.priority !== 'critical' && filter.priority !== 'high') {
      this.addToBatch(event, data, filteredRooms, filter);
    } else {
      // Emit immediately
      filteredRooms.forEach(room => {
        this.io.to(room).emit(event, data);
        console.log(`📡 Emitted ${event} to room: ${room}`);
      });
    }
  }

  checkRateLimit(eventType, limit) {
    if (!limit) return true;

    const now = Date.now();
    const rateLimiter = this.rateLimiters.get(eventType);

    if (!rateLimiter || now >= rateLimiter.resetTime) {
      this.rateLimiters.set(eventType, { count: 1, resetTime: now + 1000 });
      return true;
    }

    if (rateLimiter.count >= limit) {
      return false;
    }

    rateLimiter.count++;
    return true;
  }

  filterRooms(rooms, filterRooms) {
    if (!filterRooms || filterRooms.length === 0) return rooms;
    return rooms.filter(room => filterRooms.includes(room));
  }

  addToBatch(event, data, rooms, filter) {
    const batchKey = `${event}-${filter.priority}-${rooms.sort().join(',')}`;
    let batch = this.pendingBatches.get(batchKey);

    if (!batch) {
      batch = {
        events: [],
        rooms,
        priority: filter.priority,
        createdAt: Date.now(),
        flushAt: Date.now() + this.batchTimeout
      };
      this.pendingBatches.set(batchKey, batch);
    }

    batch.events.push({ event, data, timestamp: Date.now() });

    if (batch.events.length >= this.maxBatchSize) {
      this.flushBatch(batchKey);
    }
  }

  startBatchProcessor() {
    setInterval(() => {
      const now = Date.now();
      for (const [batchKey, batch] of this.pendingBatches) {
        if (now >= batch.flushAt) {
          this.flushBatch(batchKey);
        }
      }
    }, 50);
  }

  flushBatch(batchKey) {
    const batch = this.pendingBatches.get(batchKey);
    if (!batch || batch.events.length === 0) return;

    console.log(`📦 Flushing batch: ${batchKey} with ${batch.events.length} events`);

    const batchData = {
      batchId: batchKey,
      events: batch.events,
      count: batch.events.length,
      priority: batch.priority
    };

    batch.rooms.forEach(room => {
      this.io.to(room).emit('eventBatch', batchData);
    });

    this.pendingBatches.delete(batchKey);
  }

  getStats() {
    return {
      activeFilters: this.eventFilters.size,
      activeBatches: this.pendingBatches.size,
      totalPendingEvents: Array.from(this.pendingBatches.values())
        .reduce((sum, batch) => sum + batch.events.length, 0)
    };
  }
}

module.exports = BackendEventOptimizer;
