export type Unsubscribe = () => void;

/** Minimal typed event emitter. Handler errors are isolated and logged. */
export class Emitter<Events extends object> {
  private handlers = new Map<keyof Events, Set<(payload: any) => void>>();

  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): Unsubscribe {
    let set = this.handlers.get(event);
    if (!set) this.handlers.set(event, (set = new Set()));
    set.add(handler);
    return () => this.off(event, handler);
  }

  once<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): Unsubscribe {
    const off = this.on(event, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[officetohtml] "${String(event)}" handler failed:`, err);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
