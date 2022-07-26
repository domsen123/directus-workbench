<template>
	<private-view title="Sample Extension Module">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary disabled>
				<v-icon name="bolt" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: 'Sample Extension Module', to: '/sample-extension-module' }]" />
		</template>

		<template #navigation>
			<v-list-item to="/sample-extension-module">
				<v-list-item-icon><v-icon name="bolt" /></v-list-item-icon>
				<v-list-item-content>
					<v-text-overflow text="Sample Extension" />
				</v-list-item-content>
			</v-list-item>
		</template>

		<h1>Hello</h1>
	</private-view>
</template>

<script lang="ts" setup>
import { defineComponent } from 'vue';

defineComponent({
	name: 'SampleExtensionModule',
});
</script>
