// option 就是new Vue(option)包括data,methods,watcher
Vue.prototype._init = function (options) {
  var vm = this;
  // a flag to avoid this being observed
  // 做个标记，避免后面被Observer()实例化
  vm._isVue = true;
  {
    initProxy(vm);
  }
  // expose real self
  vm._self = vm;
  initLifecycle(vm);
  initEvents(vm);
  initRender(vm);
  // beforeCreate 函数调用
  callHook(vm, 'beforeCreate');
  initInjections(vm); // resolve injections before data/props
  initState(vm);
  initProvide(vm); // resolve provide after data/props
  // created 函数调用
  callHook(vm, 'created');
  // 查询是否有节点，并挂载到当前节点
  if (vm.$options.el) {
    vm.$mount(vm.$options.el);
  }
};


// 代理
function proxy(target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key]
  };
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}



//找到{{abc}}这样的
const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g   //.+的意义是最小匹配, 找到符合的马上结束

//正则的元字符  ^ $ . * + ? = ! : | \ / ( ) [ ] { }
const regexEscapeRE = /[-.*+?^${}()|[\]/\\]/g



// text => {{ message + name }} 文本节点
function parseText(
  text,
  delimiters
) {
  var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
  // 判断text是否符合{{}}的格式
  if (!tagRE.test(text)) {
    return
  }
  var tokens = [];
  var rawTokens = [];
  var lastIndex = tagRE.lastIndex = 0;
  var match, index, tokenValue;
  while ((match = tagRE.exec(text))) {
    index = match.index;
    // push text token
    if (index > lastIndex) {
      rawTokens.push(tokenValue = text.slice(lastIndex, index));
      tokens.push(JSON.stringify(tokenValue));
    }
    // tag token
    var exp = parseFilters(match[1].trim());
    tokens.push(("_s(" + exp + ")"));
    rawTokens.push({ '@binding': exp });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex));
    tokens.push(JSON.stringify(tokenValue));
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}





//exp: (message + name) | test
parseFilters(exp) 
// return "_f("test")((message + name))"
// 数据绑定：更新显示
// vm中的数据劫持用来触发data中数据的变化
// data数据劫持用来更改页面中对应的值


function observe(value, asRootData) {
  // 判断是否是对象
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value);
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob
}


/**
 * Define a property.
 */
function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

var Observer = function Observer(value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;
  // 在这个属性上面添加__ob__这个属性
  // function def(obj, key, val, enumerable) {
  //   Object.defineProperty(obj, key, {
  //     value: val,
  //     enumerable: !!enumerable, => true
  //     writable: true,
  //     configurable: true
  //   });
  // }
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    // var hasProto = '__proto__' in {}  => true
    if (hasProto) {
      // 如果value是数组就将Array原型上面的方法都拷贝到value.__proto__
      protoAugment(value, arrayMethods);
    } else {
      copyAugment(value, arrayMethods, arrayKeys);
    }
    // 如果是value是数组那么遍历数组调用observer()
    this.observeArray(value);
  } else {
    // 重点
    this.walk(value);
  }
};
/**
 * Walk through all properties and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 */
// 遍历所有属性并将它们转换为getter/setter。此方法只应在值类型为Object时调用。
Observer.prototype.walk = function walk(obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive$$1(obj, keys[i]);
  }
};

/**
   * Define a reactive property on an Object.
   */
  // 声明一个响应式对象
function defineReactive$$1(
  obj,
  key,
  val,
  customSetter,
  shallow
) {
  var dep = new Dep();
// 获取对应属性的描述符
// {
//   configurable: true
//   enumerable: true
//   value: "hello world!"
//   writable: true
// }
  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }

  var childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },
    set: function reactiveSetter(newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      // (newVal !== newVal && value !== value)用来判断 是否是NaN，如果是NaN就直接return
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (customSetter) {
        customSetter();
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) { return }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}

function createReactiveObject(
  target, 
  toProxy, 
  toRaw, 
  baseHandlers, 
  collectionHandlers) {
  if (!isObject(target)) {
    {
      console.warn(`value cannot be made reactive: ${String(target)}`);
    }
    return target;
  }
  // target already has corresponding Proxy
  let observed = toProxy.get(target);
  if (observed !== void 0) {
    return observed;
  }
  // target is already a Proxy
  if (toRaw.has(target)) {
    return target;
  }
  // only a whitelist of value types can be observed.
  if (!canObserve(target)) {
    return target;
  }
  const handlers = collectionTypes.has(target.constructor)
    ? collectionHandlers
    : baseHandlers;
  observed = new Proxy(target, handlers);
  toProxy.set(target, observed);
  toRaw.set(observed, target);
  if (!targetMap.has(target)) {
    targetMap.set(target, new Map());
  }
  return observed;
}


function initComputed(vm, computed) {
  // $flow-disable-line
  var watchers = vm._computedWatchers = Object.create(null);
  // computed properties are just getters during SSR
  var isSSR = isServerRendering();

  for (var key in computed) {
    var userDef = computed[key];
    // 判断是function 还是对象 get | set
    // { [key: string]: Function | { get: Function, set: Function } }
    var getter = typeof userDef === 'function' ? userDef : userDef.get;
    if (getter == null) {
      warn(
        ("Getter is missing for computed property \"" + key + "\"."),
        vm
      );
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      );
    }

    // 无操作  为了占位而定义的函数
    // function noop(a, b, c) { }
    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    } else {
      if (key in vm.$data) {
        warn(("The computed property \"" + key + "\" is already defined in data."), vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
      }
    }
  }
}

let computedObject =  {
  get: function createComputedGetter(key) {
    return function computedGetter() {
      var watcher = this._computedWatchers && this._computedWatchers[key];
      if (watcher) {
        if (watcher.dirty) {
          watcher.evaluate();
        }
        if (Dep.target) {
          watcher.depend();
        }
        return watcher.value
      }
    }
  },
  set: function() {

  }
}

Dep.prototype.addSub = function addSub(sub) {
// sub 被调用是是在watcher调用 添加的是this，也就是watcher
  this.subs.push(sub);
};

Watcher.prototype.addDep = function addDep(dep) {
  var id = dep.id;
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id);
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) {
      dep.addSub(this);
    }
  }
};


// 将监视程序推入监视程度队列，带有重复id的作业将被跳过，除非它是当队列刷新时推入的
function queueWatcher(watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {
      queue.push(watcher);
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) {
      waiting = true;

      if (!config.async) {
        flushSchedulerQueue();
        return
      }
      nextTick(flushSchedulerQueue);
    }
  }
}

function nextTick(cb, ctx) {
  var _resolve;
  callbacks.push(function () {
    if (cb) {
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, 'nextTick');
      }
    } else if (_resolve) {
      console.log('_resolve', _resolve)
      _resolve(ctx);
    }
  });
  if (!pending) {
    pending = true;
    timerFunc();
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(function (resolve) {
      _resolve = resolve;
    })
  }
}


// 渲染节点的值
if (!prevVnode) {
  // initial render
  vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
} else {
  // updates
  vm.$el = vm.__patch__(prevVnode, vnode);
}