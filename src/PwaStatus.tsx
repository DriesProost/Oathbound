import { useState, useSyncExternalStore } from "react";
import { Download, RefreshCw } from "lucide-react";
import { subscribePwa, getPwaState, applyPwaUpdate, installPwa } from "./pwa";
export function AppUpdate() {
  const status = useSyncExternalStore(subscribePwa, getPwaState);
  if (!status.waiting && !status.refreshAvailable) return null;
  return (
    <section className="app-update" aria-label="App update available">
      <p>A new edition is ready. Finish any entry before reloading.</p>
      <button className="secondary" onClick={applyPwaUpdate}>
        <RefreshCw size={16} /> Update & reload
      </button>
    </section>
  );
}
export function InstallApp() {
  const status = useSyncExternalStore(subscribePwa, getPwaState);
  const [instructions, setInstructions] = useState(false);
  return (
    <section className="install-app" aria-label="App installation">
      <div>
        <strong>
          {status.standalone
            ? "Your pocket campaign"
            : "Take your keep with you"}
        </strong>
        <p>
          {status.ready
            ? "App shell ready for offline use. Your campaign stays on this device."
            : "Your campaign saves in this browser."}
        </p>
      </div>
      {!status.standalone && (
        <button
          className="text-button"
          onClick={async () => {
            if (!(await installPwa())) setInstructions(!instructions);
          }}
        >
          <Download size={17} /> Add to home screen
        </button>
      )}
      {instructions && (
        <div className="install-instructions">
          <p>
            On iPhone, open in Safari and choose Share → Add to Home Screen. On
            Android, use your browser’s Install app / Add to home screen option.
          </p>
          <p>
            Use an HTTPS address. Open the installed app and check your
            Chronicle before starting the field test; some browsers keep
            installed-app storage separate.
          </p>
        </div>
      )}
    </section>
  );
}
