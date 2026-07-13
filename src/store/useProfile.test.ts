import { useProfile } from './useProfile';

describe('useProfile', () => {
  beforeEach(() => {
    useProfile.setState({
      username: null,
      displayName: '',
      joinedAt: null,
    });
  });

  it('starts empty until setProfile runs', () => {
    const s = useProfile.getState();
    expect(s.username).toBeNull();
    expect(s.displayName).toBe('');
    expect(s.joinedAt).toBeNull();
  });

  it('setProfile stamps joinedAt on first setup', () => {
    const before = Date.now();
    useProfile.getState().setProfile('  jane_gy  ', ' Jane ');
    const s = useProfile.getState();
    expect(s.username).toBe('jane_gy');
    expect(s.displayName).toBe('Jane');
    expect(s.joinedAt).not.toBeNull();
    expect(s.joinedAt!).toBeGreaterThanOrEqual(before);
  });

  it('changeUsername trims but leaves joinedAt alone', () => {
    useProfile.setState({
      username: 'old',
      displayName: 'Old',
      joinedAt: 111,
    });
    useProfile.getState().changeUsername(' new_name ');
    const s = useProfile.getState();
    expect(s.username).toBe('new_name');
    expect(s.joinedAt).toBe(111);
  });

  it('updateDisplayName trims and does not touch username', () => {
    useProfile.setState({
      username: 'keep',
      displayName: 'Old',
      joinedAt: 1,
    });
    useProfile.getState().updateDisplayName(' New Name ');
    const s = useProfile.getState();
    expect(s.displayName).toBe('New Name');
    expect(s.username).toBe('keep');
  });
});
