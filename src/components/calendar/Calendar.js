/**
 * Created by reamd on 2017/3/15.
 */
import CalendarConverter from './CalendarConverter.js'
import touchSwipe from './jquery.touchSwipe.min.js'
import $ from 'jquery'

export default class {
    constructor (options) {
        let opt = options?options:{}
        let defaults = {
            init: typeof opt.init === 'undefined'?false:opt.init,
            showType: typeof opt.type === 'undefined'? 'month':opt.type,
            onReady: opt.onReady || function () {},
        }
        let dateObj = new Date(),
            // 获取当前时间
            _year = parseInt(dateObj.getFullYear()),
            _month = dateObj.getMonth() + 1,
            _date = dateObj.getDate(),
            _week = dateObj.getDay(),
            gYear = _year,
            gMonth = _month,
            gDate = _date;
        let me = this
        let $targetNode = ''
        let remBasic = 50
        let touchCfg = {
            startY: 0,
            endY: 0,
            timer: null
        }
        let swipeTrigger = false
        // 渲染样式
        const [TODAY_CLASS, CURR_CLASS, PREV_CLASS, NEXT_CLASS, SIGN_CLASS] = ['today', 'curr', 'prev', 'next', 'sign']
        // onChange的事件类型
        const [INIT_TYPE, LEFT_TYPE, RIGHT_TYPE, LEFT_S_TYPE, RIGHT_S_TYPE, TODAY_TYPE, CHOOSE_TYPE, OPEN_TYPE, CLOSE_TYPE] = ['INIT', 'LEFT', 'RIGHT', 'LEFT_SWIPE', 'RIGHT_SWIPE', 'TODAY', 'CHOOSE', 'OPEN', 'CLOSE']

        /* 纯逻辑功能 */
        // 当前月的前一个月份
        function _preMonth (m) {
            if (m === 1) {
                return 12
            }
            return m-1
        }

        // 当前月的后一个月份
        function _afterMonth (m) {
            if (m === 12) {
                return 1
            }
            return m+1
        }

        // 前一个日期
        function _preDate(y, m, d) {
            let tempY = y
            let tempM = m
            let tempD = null
            if(typeof d === 'undefined') {
                tempM = _preMonth(m)
                if (tempM > m) {
                    tempY = y-1
                }
                return [tempY, tempM]
            }else {
                tempD = d-1
                if(tempD === 0) {
                    return [tempY, tempM-1, _getDateCount(tempY, tempM-1)]
                }else {
                    return [tempY, tempM, tempD]
                }
            }
        }

        // 后一个日期
        function _afterDate(y, m, d) {
            let tempY = y
            let tempM = m
            let tempD = null
            if(typeof d === 'undefined') {
                tempM = _afterMonth(m)
                if (tempM < m) {
                    tempY = y+1
                }
                return [tempY, tempM]
            }else {
                tempD = d+1
                if(d === _getDateCount(y, m)) {
                    return [tempY, tempM+1, 1]
                }else {
                    return [tempY, tempM, tempD]
                }
            }
        }

        // 得到某月份的最后一天日期
        function _getDateCount (y, m){
            return [31, y % 4 == 0 && y % 100 != 0  || y % 400 == 0 ? 29 : 28 ,31,30,31,30,31,31,30,31,30,31][ m-1 ];
        }

        // 得到某日期的星期
        function _getWeek(dStr) {
            dStr = dStr.replace(/-/g, '/')
            return new Date(dStr).getDay()
        }

        // 某日或某月为个位数时自动补零
        function _preZero(num) {
            return num.toString().padStart(2, '0');
        }

        // 得到日期面板日期数组(阳历)
        function _getDateData(y, m) {
            let afterDate = 1
            let preDate = _getDateCount(y, _preMonth(m))
            let endDate = _getDateCount(y, m)
            let sw = _getWeek(`${y}-${m}-1`)
            let ew = _getWeek(`${y}-${m}-${endDate}`)
            let preArr = []
            let afterArr = []
            let currArr = []
            let dataArr = []
            // i>0,j<6星期日排第一位
            for (let i=sw; i > 0; i--) {
                preArr.push(preDate)
                preDate--
            }

            for (let j=ew; j < 6; j++) {
                afterArr.push(afterDate)
                afterDate++
            }

            for (let k=1,l=endDate+1; k < l; k++) {
                currArr.push(k)
            }

            currArr = preArr.reverse().concat(currArr)
            dataArr = currArr.concat(afterArr)
            return dataArr
        }

        // 得到日期面板中非当月的日期数组
        function _getNoSign(arr) {
            let firstPos = arr.indexOf(1)
            let lastPos = arr.concat().reverse().indexOf(1)
            lastPos = lastPos > 6?null:lastPos
            let len = arr.length-1
            let signArr = []
            if (firstPos === 0) {
                // 第一行没有非本月标识
                if(lastPos !== null) {
                    for(let i=lastPos; i>-1; i--) {
                        signArr.push(len-i)
                    }
                }
            }else {
                for(let j=0; j < firstPos; j++) {
                    signArr.push(j)
                }
                if(lastPos !== null) {
                    for(let i=lastPos; i>-1; i--) {
                        signArr.push(len-i)
                    }
                }
            }
            return signArr
        }

        // 把日期并转为时间戳
        function getTimeStamp(y, m, d) {
            return new Date(`${y}/${m}/${d}`).getTime()
        }

        // 把时间戳转为日期
        function stampToTime (num, chr) {
            let t = new Date(num),
                y = t.getFullYear(),
                m = t.getMonth() + 1,
                d = t.getDate();
            return typeof chr === 'undefined'?[y, m, d]:`${y}${chr}${m}${chr}${d}`
        }

        // 当前日期面板跨度
        this.timeSpan = () => {
            let [pYear, pMonth, year, month, aYear, aMonth] = getPanelDate()
            let resArr = _getDateData(year, month)
            let fDay = resArr[0]
            let lDay = resArr.pop()
            if(fDay === 1) {
                pYear = year
                pMonth = month
            }
            if(lDay > 27) {
                aYear = year
                aMonth = month
            }
            return [getTimeStamp(pYear, pMonth, fDay), getTimeStamp(aYear, aMonth, lDay)]
        }

        /* 业务功能 */
        // 当前日期节假日判断
        function _festivalReplace(lunarDate) {
            if(lunarDate.lunarFestival) {
                return lunarDate.lunarFestival
            }else if(lunarDate.solarFestival){
                return lunarDate.solarFestival
            }else if(lunarDate.solarTerms) {
                return lunarDate.solarTerms
            }
            return lunarDate.lunarDay
        }

        // 渲染日期界面
        function _renderDate (y, m, cb) {
            let dateArr = _getDateData(y, m)
            let dateTpl = ''
            let endNum = 0
            let quotient = 0
            let signArr = _getNoSign(dateArr)
            let signTpl = ''
            let tempTpl = ''
            let lunarDate = ''
            let cc = new CalendarConverter()
            let lastNum = dateArr.length/7 - 1
            let lastFlag = false
            let closePFlag = !$('.calendar_panel .common_btn').hasClass('open')
            // 组装日期模板
            dateArr.forEach(function (item, idx) {
                if(signArr.includes(idx)) {
                    if(idx < 6) {
                        signTpl = ' class="prev"'
                        lunarDate = _festivalReplace(cc.solar2lunar(new Date(y, m-2, item)))
                    }else {
                        signTpl = ' class="next"'
                        lunarDate = _festivalReplace(cc.solar2lunar(new Date(y, m, item)))
                    }
                }else {
                    signTpl = ''
                    lunarDate = _festivalReplace(cc.solar2lunar(new Date(y, m-1, item)))
                }
                tempTpl = `<li ${signTpl}><div class="date_info"><span class="first">${item}</span><span class="last">${lunarDate}</span><i class="dot"></i></div></li>`
                if (idx%7 === 0) {
                    endNum = idx + 6
                    quotient = idx / 7
                    if(quotient === lastNum) {
                        lastFlag = true
                    }
                    dateTpl += `<ul data-line="${quotient}" last="${lastFlag}" class="tr_day">${tempTpl}`
                }else {
                    if (idx === endNum) {
                        dateTpl += `${tempTpl}</ul>`
                    }else {
                        dateTpl += tempTpl
                    }
                }
            })
            //渲染数据
            $('.calendar_panel .year').html(y)
            $('.calendar_panel .month').html(_preZero(m))
            $('.calendar_panel .bottom_button').hide()
            if(closePFlag){ //判断是否收缩
                $('.date_panel').hide()
            }
            $('.calendar_panel .date_panel').html(dateTpl)
            $('.calendar_panel').css('min-height', '0')
            $('.calendar_panel .bottom_button').show()
            if (cb) {
                setTimeout(function () {
                    $('.calendar_panel').css('min-height', $('.calendar_panel').height())
                    if(closePFlag){
                        setTimeout(function () {
                            _closeCalendar(true)
                            $('.date_panel').show()
                        },0)
                    }
                    cb()
                }, 0)
            }
        }

        // 计算时间提示内容
        function _timeTip(dateArr) {
            let content = `${dateArr[0]}年${dateArr[1]}月${dateArr[2]}日`
            let iDays = parseInt((getTimeStamp(...dateArr) - getTimeStamp(_year, _month, _date)) / 1000 / 60 / 60 /24)
            //把相差的毫秒数转换为天数
            let days = Math.abs(iDays)
            let res = ''
            if(days > 0 && days <= 31) { //按天统计
                res = ` ${days}天`
            }else if (days > 31){
                let difference = dateArr[0] - _year
                let tMonth = iDays > 0? (dateArr[2] >= _date? 0:-1):(dateArr[2] >= _date? -1:0)
                if(difference > 0) { //未来时间
                    res = ` ${12*difference -_month + dateArr[1] + tMonth}月`
                }else if(difference < 0){//过去时间
                    res = ` ${12*Math.abs(difference) - dateArr[1] + _month + tMonth}月`
                }else {
                    res = ` ${Math.abs(dateArr[1]-_month) + tMonth}月`
                }
            }
            if(iDays < 0) {
                res += '前'
            }else if(iDays > 0){
                res += '后'
            }
            $('.bottom_button .date_tip').text(content + res)
        }

        // 收缩展开动画效果
        function _slide(t, cb) {
            let timer = null
            let $dom = $('.date_panel').find('li.curr').closest('.tr_day').siblings('.tr_day')
            let ht = $('.date_panel').find('li.curr').height()
            let i = 0
            let speed = 4
            let fn = ()=>{}
            if(t === 'down') {
                fn = function () {
                    i += speed
                    if (i < ht) {
                        $dom.css('height', i)
                        timer = window.requestAnimationFrame(fn)
                    } else {
                        cancelAnimationFrame(timer)
                        $dom.removeAttr('style')
                        cb()
                    }
                }
                $dom.css({display: 'list-item', overflow: 'hidden',height: 0})
            }else if(t === 'up') {
                i = ht
                fn = function () {
                    i -= speed
                    if (i > 0) {
                        $dom.css('height', i)
                        timer = window.requestAnimationFrame(fn)
                    } else {
                        cancelAnimationFrame(timer)
                        $dom.attr('style', 'display:none;')
                        cb()
                    }
                }
                $dom.css({overflow: 'hidden'})
            }
            timer = window.requestAnimationFrame(fn)
        }

        // 展开日历
        function _openCalendar(flag) {
            if (flag) {
                $('.date_panel .tr_day').show()
                $('.calendar_panel').css('min-height', $('.calendar_panel').height())
            } else {
                _slide('down', ()=>{
                    $('.calendar_shim').hide()
                    let h = $('.calendar_panel').height()
                    $('.calendar_panel').css('min-height', h)
                    me.onChange($('.calendar_panel'), h, OPEN_TYPE)
                })
            }
        }

        // 收缩日历
        function _closeCalendar(flag) {
            $('.calendar_panel').css('min-height', '0')
            $('.date_panel ul[selected="selected"]').removeAttr('selected')
            $('.date_panel').find('li.curr').closest('.tr_day').attr('selected', true)
            if(flag) {
                $('.date_panel').find('li.curr').closest('.tr_day').siblings('.tr_day').hide()
                $('.calendar_panel').css('min-height', $('.calendar_panel').height())
            }else {
                _slide('up', ()=>{
                    $('.calendar_shim').show()
                    $('.calendar_shim')[0].scrollIntoView()
                    let h = $('.calendar_panel').height()
                    $('.calendar_panel').css('min-height', h)
                    me.onChange($('.calendar_panel'), h, CLOSE_TYPE)
                })
            }
        }
        
        // 得到当前面板的值
        function getPanelDate() {
            let year = Number.parseInt($('.calendar_panel .year').text())
            let month = Number.parseInt($('.calendar_panel .month').text())
            let pMonth = _preMonth(month)
            let aMonth = _afterMonth(month)
            let pYear = year
            let aYear = year
            if (pMonth > month) {
                pYear -= 1
            }
            if (aMonth < month) {
                aYear += 1
            }

            return [pYear, pMonth, year, month, aYear, aMonth]
        }

        // 返回当前选中元素时间
        function getCheckedDate($dom) {
            let year = Number.parseInt($('.calendar_panel .year').text())
            let month = Number.parseInt($('.calendar_panel .month').text())
            let day = Number.parseInt($dom.find('span.first').text())
            let tMonth,tYear = year
            // 取出当前值
            if($dom.hasClass(PREV_CLASS)) {
                tMonth = _preMonth(month)
                if(tMonth > month) {
                    tYear = year - 1
                }
            }else if($dom.hasClass(NEXT_CLASS)) {
                tMonth = _afterMonth(month)
                if(tMonth < month) {
                    tYear = year + 1
                }
            }else {
                tMonth = month
            }
            return [tYear, tMonth, day]
        }

        // 渲染特殊日期方法
        function rDateClass(arr, cls) {
            let [pYear, pMonth, year, month, aYear, aMonth] = getPanelDate()
            $('.date_panel .tr_day li').each(function (idx, item) {
                let day = $(item).find('.first').text()
                let dateStamp = 0
                if ($(item).hasClass(PREV_CLASS)){
                    dateStamp = getTimeStamp(pYear, pMonth, day)
                }else if($(item).hasClass(NEXT_CLASS)) {
                    dateStamp = getTimeStamp(aYear, aMonth, day)
                }else {
                    dateStamp = getTimeStamp(year, month, day)
                }
                if(arr.includes(dateStamp)){
                    $(item).addClass(cls)
                }
            })
        }

        // 移除渲染特殊日期
        function removeDateClass(param1, param2) {
            let [pYear, pMonth, year, month, aYear, aMonth] = getPanelDate()
            if(typeof param2 !== 'undefined') {
                $('.date_panel .tr_day li').each(function (idx, item) {
                    let day = $(item).find('.first').text()
                    let dateStamp = 0
                    if ($(item).hasClass(PREV_CLASS)){
                        dateStamp = getTimeStamp(pYear, pMonth, day)
                    }else if($(item).hasClass(NEXT_CLASS)) {
                        dateStamp = getTimeStamp(aYear, aMonth, day)
                    }else {
                        dateStamp = getTimeStamp(year, month, day)
                    }
                    if(param1.includes(dateStamp)){
                        $(item).removeClass(param2)
                    }
                })
            }else {
                $('.date_panel .tr_day li').removeClass(param1)
            }
        }

        /*按周滑动相关方法*/
        // 判断当前是否哪一周
        function _getWeekGps() {
            let $dom = $('.date_panel ul[selected="selected"]')
            let num = $dom.data('line')
            let flag = $dom.attr('last')
            if(num === 0) {
                return 'start'
            }else if(flag === 'true') {
                return 'end'
            }else {
                return 'other'
            }
        }

        // 定位下一月定位首周
        function _showFirstWeek() {
            swipeTrigger = true
            $('.calendar_panel .right').trigger('click')
            setTimeout(()=>{
                $('.date_panel ul').hide()
                $('.date_panel ul[selected="selected"]').removeAttr('selected')
                $('.date_panel ul[data-line="0"]').show().attr('selected', true)
                $('.date_panel ul[data-line="0"]').find('li:nth-child(2)').trigger('click')
            }, 0)
        }

        // 定位上一月定位末周
        function _showLastWeek() {
            swipeTrigger = true
            $('.calendar_panel .left').trigger('click')
            setTimeout(()=>{
                $('.date_panel ul').hide()
                $('.date_panel ul[selected="selected"]').removeAttr('selected')
                $('.date_panel ul[last="true"]').show().attr('selected', true)
                $('.date_panel ul[last="true"]').find('li:nth-child(2)').trigger('click')
            }, 0)
        }

        // 翻周up or down
        function _rollWeek(direction) {
            let num = parseInt($('.date_panel ul[selected="selected"]').data('line'))
            $('.date_panel ul').hide()
            if(direction === 'up') {
                $(`.date_panel ul[data-line="${num-1}"]`).show().attr('selected', true)
                $(`.date_panel ul[data-line="${num-1}"]`).find('li:nth-child(2)').trigger('click')
                $(`.date_panel ul[data-line="${num}"]`).removeAttr('selected')
            }else if(direction === 'down'){
                $(`.date_panel ul[data-line="${num+1}"]`).show().attr('selected', true)
                $(`.date_panel ul[data-line="${num+1}"]`).find('li:nth-child(2)').trigger('click')
                $(`.date_panel ul[data-line="${num}"]`).removeAttr('selected')
            }
        }

        this.year = _year
        this.month = _month
        this.date = _date
        this.INIT_TYPE = INIT_TYPE
        this.TODAY_TYPE = TODAY_TYPE
        this.CURR_CLASS = CURR_CLASS
        this.onReady = defaults.onReady
        this.showType = defaults.showType
        this.renderClass = rDateClass
        this.removeClass = removeDateClass
        this.getTimeStamp = getTimeStamp
        this.stampToTime = stampToTime
        this.getCheckedDate = getCheckedDate

        // 今天日期
        this.today = (y, m, d, cb) => {
            _renderDate(_year, _month, function () {
                _timeTip([y, m, d])
                rDateClass([getTimeStamp(y, m, d)], `${TODAY_CLASS} ${CURR_CLASS}`)
                if(cb) {cb()}
            })
        }

        // 其它日期
        this.dLocation = (stamp, cb) => {
            let dateArr = this.stampToTime(stamp)
            _renderDate(dateArr[0], dateArr[1], function () {
                _timeTip(dateArr)
                rDateClass([stamp], `${CURR_CLASS}`)
                if(cb) {cb()}
            })
        }

        $(function () {
            let remBasic = Number.parseFloat($('html').css('fontSize').replace(/px/g,""))
            let bodyDOM = $('body')[0]

            $('.calendar_panel .left').on('click', function () {
                let arr = getPanelDate()
                gYear = arr[0]
                gMonth = arr[1]
                _renderDate(gYear, gMonth, function () {
                    let y, m, d
                    if(gYear === _year && gMonth === _month){
                        y = _year
                        m = _month
                        d = _date
                        rDateClass([getTimeStamp(_year, _month, _date)], `${TODAY_CLASS} ${CURR_CLASS}`)
                    }else {
                        y = gYear
                        m = gMonth
                        d = 1
                        rDateClass([getTimeStamp(gYear, gMonth, 1)], CURR_CLASS)
                    }
                    if(me.onChange){
                        if(swipeTrigger) {
                            swipeTrigger = false
                            me.onChange(getTimeStamp(y, m, d), me.timeSpan(), LEFT_S_TYPE)
                        }else {
                            me.onChange(getTimeStamp(y, m, d), me.timeSpan(), LEFT_TYPE)
                        }
                    }
                    _timeTip([y, m, d])
                })
            })

            $('.calendar_panel .right').on('click', function () {
                let arr = getPanelDate()
                gYear = arr[4]
                gMonth = arr[5]
                _renderDate(gYear, gMonth, function () {
                    let y, m, d
                    if(gYear === _year && gMonth === _month){
                        y = _year
                        m = _month
                        d = _date
                        rDateClass([getTimeStamp(_year, _month, _date)], `${TODAY_CLASS} ${CURR_CLASS}`)
                    }else {
                        y = gYear
                        m = gMonth
                        d = 1
                        rDateClass([getTimeStamp(gYear, gMonth, 1)], CURR_CLASS)
                    }
                    if(me.onChange){
                        if(swipeTrigger) {
                            swipeTrigger = false
                            me.onChange(getTimeStamp(y, m, d), me.timeSpan(), RIGHT_S_TYPE)
                        }else {
                            me.onChange(getTimeStamp(y, m, d), me.timeSpan(), RIGHT_TYPE)
                        }
                    }
                    _timeTip([y, m, d])
                })
            })

            $('.calendar_panel .bToday').on('click', function () {
                me.today(_year, _month, _date, function () {
                    if(me.onChange){
                        me.onChange(getTimeStamp(_year, _month, _date), me.timeSpan(), TODAY_TYPE)
                    }
                })
            })

            $('.date_panel').on('click', 'li', function (e) {
                e.preventDefault()
                let $this = $(this)
                if($(this).hasClass(CURR_CLASS)){
                    return
                }
                $('.tr_day .curr').removeClass(CURR_CLASS)
                $(this).addClass(CURR_CLASS)
                let dateArr = getCheckedDate($this)
                _timeTip(dateArr)
                if(me.onChange){
                    me.onChange(getTimeStamp(...dateArr), me.timeSpan(), CHOOSE_TYPE)
                }
            })
            
            $('.calendar_panel .common_btn').on('click', function () {
                if($(this).hasClass('open')) {
                    _closeCalendar()
                }else {
                    _openCalendar()
                }
                $(this).toggleClass('open')
            })

            $('.date_panel').swipe({
                swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
                    // 先判断当前日历是否收起
                    if($('.calendar_panel .common_btn').hasClass('open')) { //展开
                        if(direction === 'left') { // 按月滑动
                            $('.calendar_panel .right').trigger('click')
                        }else if(direction === 'right'){
                            $('.calendar_panel .left').trigger('click')
                        }
                    }else { // 收缩 按周滑动
                        let weekGps = _getWeekGps()
                        if(direction === 'left') { //向后翻
                            if(weekGps === 'end'){
                                _showFirstWeek()
                            }else {
                                _rollWeek('down')
                            }
                        }else if(direction === 'right'){// 向前翻
                            if(weekGps === 'start'){
                                _showLastWeek()
                            }else {
                                _rollWeek('up')
                            }
                        }
                    }
                }
            })
        })

        // 是否初始化(初始化今天)
        if(defaults.init) {
            this.today(_year, _month, _date, function () {
                defaults.onReady(getTimeStamp(_year, _month, _date), me.timeSpan(), INIT_TYPE)
            })
            $('.calendar_panel').show()
            if(defaults.showType === 'week') {
                setTimeout(function () {
                    $('.calendar_panel .common_btn').click()
                })
            }
        }
        return this
    }

    // 初始化方法
    init (stamp) {
        let me = this
        if(stamp) {
            me.dLocation(stamp, function () {
                me.onReady(stamp, me.timeSpan(), me.INIT_TYPE)
            })
        }else {
            let y = this.year
            let m = this.month
            let d = this.date
            me.today(y, m, d, function () {
                me.onReady(me.getTimeStamp(y, m, d), me.timeSpan(), me.TODAY_TYPE)
            })
        }
        $('.calendar_panel').show()
        if(me.showType === 'week') {
            setTimeout(function () {
                $('.calendar_panel .common_btn').click()
            })
        }
    }

    // 获取当前面板选中日期，时间跨度
    checkedDate (cb) {
        let me = this
        setTimeout(function () {
            let arr = me.getCheckedDate($('.calendar_panel li.curr'))
            cb(me.getTimeStamp(...arr), me.timeSpan())
        },0)
    }
}
