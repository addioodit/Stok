import { useOnboarding } from './useOnboarding';

describe('useOnboarding', () => {
  beforeEach(() => {
    useOnboarding.setState({ seen: false });
  });

  it('starts unseen', () => {
    expect(useOnboarding.getState().seen).toBe(false);
  });

  it('markSeen flips the flag so the App gate stops showing the tour', () => {
    useOnboarding.getState().markSeen();
    expect(useOnboarding.getState().seen).toBe(true);
  });

  it('resetSeen lets the user replay the tour from Settings', () => {
    useOnboarding.getState().markSeen();
    useOnboarding.getState().resetSeen();
    expect(useOnboarding.getState().seen).toBe(false);
  });
});
