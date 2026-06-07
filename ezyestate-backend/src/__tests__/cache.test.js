const cacheService = require('../services/cacheService');

describe('In-Memory Cache Service', () => {
  beforeEach(async () => {
    // Clear cache between tests
    await cacheService.delPattern('*');
  });

  it('should store and retrieve values correctly', async () => {
    const key = 'test_key';
    const value = { name: 'SocialEstate', role: 'admin' };
    
    await cacheService.set(key, value);
    const retrieved = await cacheService.get(key);
    
    expect(retrieved).toEqual(value);
  });

  it('should return null for non-existent keys', async () => {
    const retrieved = await cacheService.get('non_existent');
    expect(retrieved).toBeNull();
  });

  it('should respect TTL expiration times', async () => {
    const key = 'expire_key';
    const value = 'temp_data';
    const ttl = 1; // 1 second TTL

    await cacheService.set(key, value, ttl);
    const retrievedBefore = await cacheService.get(key);
    expect(retrievedBefore).toBe(value);

    // Mock time passing to trigger expiration
    const realDateNow = Date.now;
    global.Date.now = () => realDateNow() + 2000; // Fast forward 2 seconds

    const retrievedAfter = await cacheService.get(key);
    expect(retrievedAfter).toBeNull();

    // Restore original Date.now
    global.Date.now = realDateNow;
  });

  it('should delete keys successfully', async () => {
    const key = 'delete_key';
    await cacheService.set(key, 'delete_me');
    await cacheService.del(key);
    
    const retrieved = await cacheService.get(key);
    expect(retrieved).toBeNull();
  });

  it('should perform wildcard pattern deletions correctly', async () => {
    await cacheService.set('project:1', 'Project One');
    await cacheService.set('project:2', 'Project Two');
    await cacheService.set('listing:1', 'Listing One');

    await cacheService.delPattern('project:*');

    expect(await cacheService.get('project:1')).toBeNull();
    expect(await cacheService.get('project:2')).toBeNull();
    expect(await cacheService.get('listing:1')).toBe('Listing One');
  });
});
