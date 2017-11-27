/**
 * Created by reamd on 2017/11/23.
 */
import Vue from 'vue'
import Root from './Root.vue'
new Vue(Root).$mount('#main')

;(function () {
    let fontSize
    let userAgent = navigator.userAgent
    if (userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/) || userAgent.match(/Android/i)) {
        fontSize = document.documentElement.clientWidth / 6.4
        fontSize = fontSize > 60 ? 60 : fontSize
        document.documentElement.style.fontSize = fontSize + 'px'
    }
})()

