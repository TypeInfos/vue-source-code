
let data = [1]
// 全局变量 target
let target = null;
let sum = 0
// Dep class
class Dep {
  constructor() {
    this.subscribers = [];
  }
  depend() {
    // 当target不为空，且不能重复添加
    if (target && !this.subscribers.includes(target)) {
      this.subscribers.push(target);
    }
  }
  notify() {
    // 通知对应的
    this.subscribers.forEach(sub => sub());
  }
}

// 为array实例一个Dep依赖
let arrayDep = new Dep()
let _data = data

data = new Proxy(_data ,{
  get(obj, key) {
    arrayDep.depend()
    return Reflect.get(obj, key)
  },
  set(obj, key, newVal) {
    // 如果值插入成功返回true
    const result = Reflect.set(obj, key, newVal)
    if (result) {
      if (key !== 'length') {
        arrayDep.notify()
      }
      return true
    }
    return false;
  }
})

function watcher(myFunc) {
  target = myFunc;
  target();
  target = null;
}
watcher(() => {
  sum = data.reduce((a, b) => a + b);
  console.log('sum:', sum)
});

data[0] = 10
data.push(20)
data.push(202)
// data.splice(1,0,23,232,434)