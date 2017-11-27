# vue-calendar

> author: reamd

### Calendar (日期插件)
效果图：
- 展开状态

![open](https://raw.githubusercontent.com/reamd/material/master/vue-calendar/open.jpg)

- 收缩状态

![close](https://raw.githubusercontent.com/reamd/material/master/vue-calendar/close.jpg)


**1.引入Calendar**

`import Calendar from './components/calendar/Calendar.vue'`


**2.实例化插件**

- *init代表是否初始化，onReady是日历初始化完成后的回调函数*

    ```code
    let cDate = new Calendar.CDate(
        {
            init: true || false,
            onReady: function(){}
        }
     )
    ```

**3.插件集成的方法:**

- init

    初始化方法，会触发onReady执行

- onChange

    数据变化监听方法,事件类型为'INIT', 'LEFT', 'RIGHT', 'TODAY', 'CHOOSE'，

    接收参数(选中时间戳，[开始时间戳, 结束时间戳], 触发事件类型)

- renderClass([时间戳数组], class样式名称)

- removeClass([时间戳数组], class样式名称) or removeClass(class样式名称)

- stampToTime(时间戳, 时间格式化)

    第二个参数不传默认返回 [年, 月, 日] 时间数组

- getTimeStamp(年, 月, 日) 得到时间戳

    ```code
    cDate.init()
    cDate.renderClass([1488038400000], 'sign')
    cDate.onChange = function (c, sArr, type) {
        ...
    }
    ```
