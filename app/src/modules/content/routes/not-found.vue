<template>
	<private-view :title="t('page_not_found')">
		<template #navigation>
			<content-navigation />
		</template>

		<div class="not-found">
			<v-info :title="t('page_not_found')" icon="not_interested">
				{{ t('page_not_found_body') }}
			</v-info>
		</div>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent } from 'vue';
import ContentNavigation from '../components/navigation.vue';

export default defineComponent({
	components: { ContentNavigation },
	setup() {
		const { t } = useI18n();
		return { t };
	},
});
</script>

<style lang="scss" scoped>
.not-found {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20vh 0;
}
</style>
