/**
 * Media Stream Manager
 * Holds active local media streams across routing navigation without re-prompting.
 * Strictly local to the browser.
 */

let activeCameraStream: MediaStream | null = null;
let activeScreenStream: MediaStream | null = null;

export const mediaManager = {
  setCameraStream(stream: MediaStream | null) {
    activeCameraStream = stream;
  },

  getCameraStream(): MediaStream | null {
    if (activeCameraStream && activeCameraStream.active) {
      return activeCameraStream;
    }
    return null;
  },

  setScreenStream(stream: MediaStream | null) {
    activeScreenStream = stream;
  },

  getScreenStream(): MediaStream | null {
    if (activeScreenStream && activeScreenStream.active) {
      return activeScreenStream;
    }
    return null;
  },

  stopAll() {
    if (activeCameraStream) {
      try {
        activeCameraStream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Error stopping camera track:', e);
      }
      activeCameraStream = null;
    }

    if (activeScreenStream) {
      try {
        activeScreenStream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Error stopping screen track:', e);
      }
      activeScreenStream = null;
    }
  },
};
