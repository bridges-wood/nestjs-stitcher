import { describe, it, expect } from 'vitest';
import { ExecutorFactory } from './executor-factory.js';

describe('ExecutorFactory', () => {
  it('should create and cache executors', () => {
    const factory = new ExecutorFactory([]);
    const executor1 = factory.getExecutor('http://localhost:4000');
    const executor2 = factory.getExecutor('http://localhost:4000');
    expect(executor1).toBe(executor2);
  });

  it('should create different executors for different URLs', () => {
    const factory = new ExecutorFactory([]);
    const executor1 = factory.getExecutor('http://localhost:4000');
    const executor2 = factory.getExecutor('http://localhost:4001');
    expect(executor1).not.toBe(executor2);
  });

  it('should invalidate cached executors', () => {
    const factory = new ExecutorFactory([]);
    const executor1 = factory.getExecutor('http://localhost:4000');
    factory.invalidateExecutor('http://localhost:4000');
    const executor2 = factory.getExecutor('http://localhost:4000');
    expect(executor1).not.toBe(executor2);
  });
});
