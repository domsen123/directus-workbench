<template>
	<div>Sample1: {{ value }}</div>
</template>

<script lang="ts" setup>
import { defineComponent } from 'vue';
defineComponent({
	name: 'SampleDisplay',
});
defineProps({
	value: {
		type: String,
		default: null,
	},
});
</script>
