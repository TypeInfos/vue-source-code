let data = [1]

let _data = data

data = new Proxy(_data, {
  get(obj, key) {
    console.log(`get obj:${obj}, key: ${key}`)
    return Reflect.get(obj, key)
  },
  set(obj, key, newVal) {
    // 如果值插入成功返回true
    const result = Reflect.set(obj, key, newVal)
    if (result) {
      console.log(`set obj:${obj}, key: ${key},newVal:${newVal}`)
      return true
    }
    return false;
  }
})

// data[1] = 2 // 直接在下标为1的数字上面改
// set obj:1,2, key: 1,newVal:2
// data.push(10) // 因为push的操作是先取得length，再用data[length] = 10，然后返回length
// get obj:1,2, key: push
// get obj: 1, 2, key: length
// set obj: 1, 2, 10, key: 2, newVal: 10
// set obj: 1, 2, 10, key: length, newVal: 3
data.splice(1, 0, 23,45)