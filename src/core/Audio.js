/**
 * Audio service
 */
export const audio = {
  play: (sound) => {
    console.log(`Playing sound: ${sound}`);
    // In a real app, we would play the sound
    return Promise.resolve();
  },
  stop: () => {},
  pause: () => {},
  resume: () => {}
};
