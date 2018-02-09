const util = require("util");
const redis = require("redis");

class Database {
  constructor(host, port) {
    this.client = redis.createClient({
      host: host,
      port: port,
      connect_timeout: 1000
    });

    /* Promisify all used Redis commands, creating corresponding async methods */
    this.client.multiAsync = () => {
      const multi = this.client.multi();
      multi.execAsync = util.promisify(multi.exec);
      return multi;
    };
    this.client.flushdbAsync = util.promisify(this.client.flushdb);
    this.client.zrangebyscoreAsync = util.promisify(this.client.zrangebyscore);
    this.client.zrankAsync = util.promisify(this.client.zrank);
    this.client.zaddAsync = util.promisify(this.client.zadd);
    this.client.zrevrangeAsync = util.promisify(this.client.zrevrange);
    this.client.hgetAsync = util.promisify(this.client.hget);
  }

  flush() {
    return this.client.flushdbAsync();
  }

  /**********************/
  /* Watch List methods */
  /**********************/
  createWatchList(ipArr) {
    const multi = this.client.multiAsync();
    ipArr.forEach(({ subnet, start, end }) => {
      let net = subnet.slice(0, -1);
      for (let i = start; i <= end; i++) {
        multi.zadd("watchList", 0, net + i);
      }
    });
    return multi.execAsync();
  }

  getWatchList(ms) {
    return this.client.zrangebyscoreAsync([
      "watchList",
      0,
      (Date.now() - ms).toString()
    ]);
  }

  setWatchListScore(ip) {
    return this.client.zaddAsync("watchList", "XX", Date.now(), ip);
  }

  verifyWatchList(ip) {
    return this.client.zrankAsync("watchList", ip);
  }

  /*************************/
  /* Master record methods */
  /*************************/
  getMaster(ip) {
    return this.client.hgetAsync("master", ip);
  }

  setMaster(ip, state) {
    return this.client.hsetAsync("master", ip, JSON.stringify(state));
  }

  /**************************/
  /* History record methods */
  /**************************/
  getHistory(ip, key) {
    return this.client.zrevrange([
      "History:" + ip + ":" + key,
      0,
      -1,
      "WITHSCORES"
    ]);
  }

  setHistory(ip, diff) {
    const multi = this.client.multiAsync();
    for (const key in diff) {
      multi.zadd("History:" + ip + ":" + key, Date.now(), diff[key]);
      multi.zremrangebyrank("History:" + ip + ":" + key, 0, -101);
    }
    return multi.execAsync();
  }
}

module.exports = (port, ip) => new Database(port, ip);
