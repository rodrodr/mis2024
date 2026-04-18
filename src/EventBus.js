/**
 * EventBus.js
 * Centralized event bus for inter-component communication.
 * Components emit events and subscribe to them.
 */

class EventBusImpl {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error(`EventBus error in "${event}":`, e);
      }
    });
  }

  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }
}

const globalBus = new EventBusImpl();

export { globalBus as EventBus };

window.appBus = globalBus;
