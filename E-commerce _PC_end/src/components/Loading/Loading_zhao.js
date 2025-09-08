export default {
    props: {
        progress: {
            type: Number,
            default: 0
        },
        show: {
            type: Boolean,
            default: true
        },
        autoHide: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            visible: true,
            exiting: false
        };
    },
    computed: {
        clampedProgress() {
            const p = Math.max(0, Math.min(100, Math.round(this.progress)));
            return p;
        },
        hundreds() {
            // 对于0-99，百位是0；对于100，百位是1
            return this.clampedProgress >= 100 ? 1 : 0;
        },
        tens() {
            // 取十位数字
            return Math.floor(this.clampedProgress / 10) % 10;
        },
        ones() {
            // 取个位数字
            return this.clampedProgress % 10;
        }
    },
    watch: {
        show(val) {
            if (!val) {
                this.startExit();
            } else {
                this.visible = true;
                this.exiting = false;
            }
        },
        clampedProgress(val) {
            if (this.autoHide && val >= 100 && !this.exiting) {
                // 稍作延迟确保100%停留片刻
                setTimeout(() => this.startExit(), 150);
            }
        }
    },
    mounted() {
        if (!this.show) {
            this.startExit();
        }
    },
    methods: {
        columnStyle(digit) {
            return {
                transform: `translateY(-${digit * 10}%)`
            };
        },
        startExit() {
            if (this.exiting) return;
            this.exiting = true;
        },
        handleTransitionEnd(e) {
            if (!this.exiting) return;
            if (e.target !== this.$el) return;
            this.visible = false;
            this.$emit('finished');
        }
    }
}


