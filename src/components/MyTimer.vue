<template>
  <span>
    {{ show_text }}
  </span>
</template>

<script>
export default {
  name: 'Timer',
  props: {},
  data() {
    return {
      start_time: 0,
      show_text: null,
      elapsed_seconds: 0,
      cur_interval_pointer: null
    }
  },
  methods: {
    start() {
      this.start_time = new Date().getTime() - (this.elapsed_seconds * 1000)
      this.cur_interval_pointer = setInterval(() => {
        this.elapsed_seconds = Math.floor((new Date().getTime() - this.start_time) / 1000)
        this.show_text = this.formatTime(this.elapsed_seconds)
        this.$emit('update', this.elapsed_seconds)
      }, 1000)
    },
    stop() {
      clearInterval(this.cur_interval_pointer)
      this.cur_interval_pointer = null
    },
    reset() {
      this.stop()
      this.elapsed_seconds = 0
      this.show_text = null
      this.$emit('update', 0)
    },
    setTime(seconds) {
      this.elapsed_seconds = seconds
      this.show_text = this.formatTime(seconds)
    },
    getTime() {
      return this.elapsed_seconds
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    }
  }
}
</script>