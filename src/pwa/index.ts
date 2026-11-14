import { track } from "@/analytics";

/** Kjører appen som installert (standalone), ikke i en nettleserfane? */
export const isStandalone = (): boolean =>
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

let launchTracked = false;

/** Én hendelse per sidelasting i installert modus. Ingenting lagres på enheten. */
export const trackLaunchOnce = () => {
    if (launchTracked) {
        return;
    }
    launchTracked = true;
    if (isStandalone()) {
        track("pwa_launched");
    }
};
