type BackgroundTask = () => Promise<void> | void;

const queue: Array<{ label: string; task: BackgroundTask }> = [];
let running = false;

function drainBackgroundQueue() {
  if (running || queue.length === 0) return;
  running = true;
  const item = queue.shift();
  if (!item) {
    running = false;
    return;
  }

  setImmediate(() => {
    Promise.resolve()
      .then(item.task)
      .catch(error => {
        console.error(`[Background task] ${item.label} failed`, error);
      })
      .finally(() => {
        running = false;
        drainBackgroundQueue();
      });
  });
}

/**
 * Queue non-critical work after the mutation has already completed its core write.
 * This is intentionally best-effort and in-process; critical data writes remain
 * awaited in the tRPC procedure and must not depend on this queue.
 */
export function enqueueBackgroundTask(label: string, task: BackgroundTask) {
  queue.push({ label, task });
  drainBackgroundQueue();
}
