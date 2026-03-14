export class NotificationManager {
  static async requestPermission() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications.");
      return false;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return Notification.permission === "granted";
  }

  static sendTestAlert() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try {
        const n = new Notification("OptiSync OS: Connection Verified ✅", {
          body: "Your cognitive OS is now synchronized. We'll monitor your eye strain and alert you when a reset is needed.",
          icon: "/vite.svg",
          tag: "optisync-connect",
          requireInteraction: false
        });
        n.onclick = () => { window.focus(); n.close(); };
      } catch (e) {
        console.error("Failed to send test notification:", e);
      }
    }
  }

  /**
   * 80% Strain Warning - OS Notification (shows even when in another tab/app)
   */
  static sendHighFatigueAlert(strainLevel) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      try {
        // Close any previous strain alert first (by using same tag)
        const notification = new Notification("⚠️ OptiSync: High Eye Strain", {
          body: `Your strain level is now at ${strainLevel}%. Take a short break to prevent fatigue buildup.`,
          icon: "/vite.svg",
          tag: "optisync-strain-warning",  // same tag so it replaces, not stacks
          requireInteraction: false,
          silent: false
        });

        notification.onclick = function () {
          window.focus();
          this.close();
        };
      } catch (e) {
        console.error("Failed to send fatigue notification:", e);
      }
    }
  }

  /**
   * 100% Strain Critical - Focuses the tab and triggers the modal
   */
  static sendCriticalStrainAlert() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      try {
        const notification = new Notification("🚨 CRITICAL: Max Eye Strain Reached", {
          body: "Your strain has hit 100%! Serious eye damage risk. Click to open OptiSync and start a recovery session NOW.",
          icon: "/vite.svg",
          tag: "optisync-strain-critical",
          requireInteraction: true,  // Stays on screen until dismissed
          silent: false
        });

        notification.onclick = function () {
          window.focus();
          this.close();
        };
      } catch (e) {
        console.error("Failed to send critical notification:", e);
      }
    }
  }

  static sendProximityAlert() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      try {
        const notification = new Notification("🚨 CRITICAL: Proximity Hazard", {
          body: "You've been too close to the screen for over 90 seconds. This is damaging your vision. Please move back immediately!",
          icon: "/vite.svg",
          tag: "optisync-proximity",
          requireInteraction: true
        });

        notification.onclick = function () {
          window.focus();
          this.close();
        };
      } catch (e) {
        console.error("Failed to send proximity notification:", e);
      }
    }
  }
}
