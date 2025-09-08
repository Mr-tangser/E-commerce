<template>
    <div
        v-if="visible"
        class="preloader-overlay"
        :class="{ 'is-exiting': exiting }"
        @transitionend="handleTransitionEnd"
    >
        <div class="preloader-inner">
            <div class="brand">
                <h1 class="brand-title">
                    <span class="brand-main">全品汇</span>
                    <span class="brand-sub">管理平台</span>
                </h1>
                <p class="brand-desc">全球好物汇聚，智慧管理引领</p>
            </div>

            <div class="counter" aria-label="loading progress">
                <div class="digit-column">
                    <div class="digit-strip" :style="columnStyle(hundreds)">
                        <span v-for="n in 10" :key="'h'+n" class="digit">{{ (n-1) }}</span>
                    </div>
                </div>
                <div class="digit-column">
                    <div class="digit-strip" :style="columnStyle(tens)">
                        <span v-for="n in 10" :key="'t'+n" class="digit">{{ (n-1) }}</span>
                    </div>
                </div>
                <div class="digit-column">
                    <div class="digit-strip" :style="columnStyle(ones)">
                        <span v-for="n in 10" :key="'o'+n" class="digit">{{ (n-1) }}</span>
                    </div>
                </div>
                <span class="percent">%</span>
            </div>

            <div class="progress">
                <div class="bar" :style="{ width: progress + '%' }"></div>
            </div>
        </div>
    </div>
</template>

<script>
import './Loading_zhao.css'
import script from './Loading_zhao.js'

export default {
    name: 'LoadingZhao',
    ...script
}
</script>


