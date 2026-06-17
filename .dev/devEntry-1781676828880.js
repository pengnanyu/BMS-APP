import Cache from './mock/cache.js';
import mockKV from './mock/kv.js';
import worker from '/home/user/workspace/functions/index.ts';

Cache.port = 18080;
mockKV.port = 18080;

export default worker;
