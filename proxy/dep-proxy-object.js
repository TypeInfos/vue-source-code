// let data = { price: 5, quantity: 2, arr: [10, 120] };
let data = {one:1,two:2,arr:[3,4]}
// 全局变量 target
let target = null;

let total = 0

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

// 遍历data的每个属性并添加get、set方法
let deps = new Map()
Object.keys(data).forEach(key => {
  deps.set(key, new Dep());
});
let _data = data

function get(obj, key) {
  console.log('get', obj, key)
  if (Array.isArray(obj)) {
    new Proxy(obj, traps)
  }
  return Reflect.get(obj, key)
  // deps.get(key).depend();
  // return obj[key]
}
function set(obj, key, newVal, receiver) {
  const result = Reflect.set(obj, key, newVal)
  if (result) {
    console.log('set', obj, key, newVal, receiver)
    return true
  }
  // deps.get(key).notify()
  return false;
}
const traps = {
  get,
  set
}
data = new Proxy(_data, traps)

// The code to watch to listen for reactive properties
// 
function watcher(myFunc) {
  target = myFunc;
  target();
  target = null;
}
watcher(() => {
  total = data.one * data.two + data.arr.reduce((a, b) => a + b);
  console.log('渲染页面节点的值 total:', total)
});

// console.log("total = " + data.total)
// data.price = 20
// data.push(432)
data.arr[0] = 2
// data.push(1312)
// console.log("total = " + data.total)
// data.quantity = 10
// console.log("total = " + data.total)
// data.arr[0] = 1000
// console.log("total = " + data.total)