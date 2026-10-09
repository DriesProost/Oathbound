type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type PwaState = {
  ready: boolean;
  waiting: ServiceWorker | null;
  install: InstallPrompt | null;
  standalone: boolean;
  refreshAvailable: boolean;
};
let snapshot: PwaState = {
  ready: false,
  waiting: null,
  install: null,
  standalone: false,
  refreshAvailable: false,
};
const listeners = new Set<() => void>();
let registration: ServiceWorkerRegistration | null = null;
let applying = false,
  lastCheck = 0;
export const getPwaState = () => snapshot;
export function subscribePwa(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function notify(patch: Partial<PwaState>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((fn) => fn());
}
export function startPwa() {
  notify({
    standalone:
      matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  });
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    notify({ install: e as InstallPrompt });
  });
  window.addEventListener("appinstalled", () =>
    notify({ install: null, standalone: true }),
  );
  if (
    !import.meta.env.PROD ||
    !("serviceWorker" in navigator) ||
    !window.isSecureContext
  )
    return;
  const check = () => {
    if (!registration || Date.now() - lastCheck < 60000) return;
    lastCheck = Date.now();
    void registration.update().catch(() => {});
  };
  let controlled = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    notify({
      ready: true,
      waiting: null,
      refreshAvailable: controlled && !applying,
    });
    controlled = true;
    if (applying) window.location.reload();
  });
  void navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: "none",
    })
    .then((reg) => {
      registration = reg;
      if (reg.active) notify({ ready: true });
      if (reg.waiting) notify({ waiting: reg.waiting });
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") {
            if (reg.waiting && reg.active) notify({ waiting: reg.waiting });
            else notify({ ready: true });
          }
        });
      });
      check();
    })
    .catch(() => {});
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
}
export function applyPwaUpdate() {
  if (!snapshot.waiting) {
    if (snapshot.refreshAvailable) window.location.reload();
    return;
  }
  applying = true;
  snapshot.waiting.postMessage({ type: "APPLY_UPDATE" });
}
export async function installPwa() {
  const prompt = snapshot.install;
  if (!prompt) return false;
  try {
    await prompt.prompt();
    await prompt.userChoice;
    notify({ install: null });
    return true;
  } catch {
    return false;
  }
}
