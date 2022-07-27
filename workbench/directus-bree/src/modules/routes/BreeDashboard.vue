<template>
	<private-view title="Scheduler">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary disabled><v-icon name="update" /></v-button>
		</template>
		<template #headline>
			<v-breadcrumb :items="[{ name: 'Scheduler', to: '/bree' }]" />
		</template>
		<template #actions>
			<template v-if="hasSelection">
				<v-button v-if="selectedItem.status === 'disabled'" icon rounded @click="enableItem">
					<v-icon name="not_started" />
				</v-button>
				<template v-if="selectedItem.status === 'waiting'">
					<v-button v-tooltip.bottom="'Run'" icon rounded @click="runItem">
						<v-icon name="play_circle" />
					</v-button>
					<v-button v-tooltip.bottom="'Disable'" icon rounded @click="disableItem">
						<v-icon name="power_settings_new" />
					</v-button>
				</template>
				<template v-if="selectedItem.status === 'active'">
					<v-button v-tooltip.bottom="'Stop'" icon rounded @click="stopItem">
						<v-icon name="stop_circle" />
					</v-button>
				</template>
			</template>
		</template>
		<div class="layout-bree">
			<v-table
				v-model="selection"
				:loading="isLoading"
				:headers="headers"
				:items="jobs"
				item-key="path"
				show-select
			></v-table>
			<pre v-text="selection" />
		</div>
	</private-view>
</template>

<script lang="ts" setup>
import { computed, defineComponent, ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { BreeJob } from 'src/types';

defineComponent({
	name: 'BreeDashboard',
});

const api = useApi();
const isLoading = ref<boolean>(false);
const jobs = ref<BreeJob[]>([]);
const selection = ref<BreeJob[]>([]);
const hasSelection = computed(() => selection.value.length === 1);
const selectedItem = computed(() => selection.value[0]);

const headers = [
	{
		text: 'JobName',
		value: 'name',
	},
	{
		text: 'Status',
		value: 'status',
	},
	{
		text: 'Cron',
		value: 'cron',
	},
];

const listJobs = async () => {
	isLoading.value = true;
	const { data } = await api.request({
		method: 'GET',
		url: '/bree/jobs',
	});
	jobs.value = data;

	isLoading.value = false;
};

const updateState = (job: BreeJob) => {
	const jobName = job.name;
	const index = jobs.value.findIndex((j) => j.name === jobName);
	if (index !== -1) {
		jobs.value[index] = job;
	}
};

const enableItem = async () => {
	if (hasSelection.value) {
		const jobName = selectedItem.value.name;
		const { data } = await api.request({
			method: 'PUT',
			url: `/bree/jobs/${jobName}`,
			data: {
				action: 'enable',
				cron: '* * * * *',
			},
		});
		updateState(data);
	}
};

const disableItem = async () => {
	if (hasSelection.value) {
		const jobName = selectedItem.value.name;
		const { data } = await api.request({
			method: 'PUT',
			url: `/bree/jobs/${jobName}`,
			data: {
				action: 'disable',
			},
		});
		updateState(data);
	}
};
const runItem = async () => {
	if (hasSelection.value) {
		const jobName = selectedItem.value.name;
		const { data } = await api.request({
			method: 'PUT',
			url: `/bree/jobs/${jobName}`,
			data: {
				action: 'run',
			},
		});
		updateState(data);
	}
};

const stopItem = async () => {
	if (hasSelection.value) {
		const jobName = selectedItem.value.name;
		const { data } = await api.request({
			method: 'PUT',
			url: `/bree/jobs/${jobName}`,
			data: {
				action: 'stop',
			},
		});
		updateState(data);
	}
};

listJobs();
</script>

<style lang="scss">
.layout-bree {
	margin: var(--content-padding);
	margin-bottom: var(--content-padding-bottom);
}
</style>
