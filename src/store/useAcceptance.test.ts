import { ACCEPTANCE_VERSION } from '../data/legal';
import { isAccepted, useAcceptance } from './useAcceptance';

describe('useAcceptance', () => {
  beforeEach(() => {
    useAcceptance.setState({
      acceptedVersion: null,
      acceptedAt: null,
      hasHydrated: true,
    });
  });

  it('starts unaccepted', () => {
    expect(isAccepted(useAcceptance.getState())).toBe(false);
  });

  it('accept() stamps the current version and timestamp', () => {
    useAcceptance.getState().accept();
    const s = useAcceptance.getState();
    expect(s.acceptedVersion).toBe(ACCEPTANCE_VERSION);
    expect(s.acceptedAt).toBeGreaterThan(0);
    expect(isAccepted(s)).toBe(true);
  });

  it('treats a stale version as not accepted (re-prompts after policy update)', () => {
    useAcceptance.setState({
      acceptedVersion: ACCEPTANCE_VERSION - 1,
      acceptedAt: Date.now() - 100_000,
      hasHydrated: true,
    });
    expect(isAccepted(useAcceptance.getState())).toBe(false);
  });

  it('reset() clears acceptance', () => {
    useAcceptance.getState().accept();
    useAcceptance.getState().reset();
    expect(isAccepted(useAcceptance.getState())).toBe(false);
  });
});
