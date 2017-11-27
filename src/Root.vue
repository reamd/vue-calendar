<template>
    <div class="wrap">
        <calendar></calendar>
    </div>
</template>
<script>
    import $ from 'jquery'
    import Calendar from './components/calendar/Calendar.vue'
    export default {
        name: 'root',
        components: {
            Calendar
        },
        created () {
        },
        mounted () {
            let cDate = new Calendar.CDate(
                {
                    init: true,
                    onReady: function(){}
                }
            )
        }
    }
</script>
