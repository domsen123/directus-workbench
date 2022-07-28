<template>
	<private-view title="Scheduler">
		<template #actions></template>
		<div class="table-wrapper">
			<table class="v-bree-table">
				<thead>
					<tr>
						<td v-for="header in headers" :key="header.value">
							<span>{{ header.text }}</span>
						</td>
						<td>
							<span>Actions</span>
						</td>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(item, row) in items" :key="`row_${row}`">
						<td v-for="(header, col) in headers" :key="`col_${col}`">
							<template v-if="header.value === 'orphaned'">
								<span class="orphaned" :class="{ warn: item[header.value] }">
									{{ item[header.value] === 'true' ? 'ORPHANED' : 'No' }}
								</span>
							</template>
							<template v-else-if="header.value === 'status'">
								<span class="badge" :class="item[header.value]">{{ item[header.value] }}</span>
							</template>
							<template v-else-if="header.value === 'cron'">
								<input
									v-if="item['status'] === 'disabled'"
									v-model="item[header.value]"
									class="cron-input"
									type="text"
								/>
								<span v-else class="cron" :class="{ muted: !item[header.value] }">
									{{ item[header.value] ?? 'n/a' }}
								</span>
							</template>
							<span v-else>{{ item[header.value] }}</span>
						</td>
						<td>
							<div class="display-flex">
								<template v-if="item.status === 'disabled'">
									<button
										class="action-btn"
										type="button"
										:disabled="!item.cron || item.cron.length === 0"
										@click="setJob(item, 'enable')"
									>
										Enable
									</button>
								</template>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<!-- <pre v-text="headers" /> -->
		<pre v-text="items" />
		<!-- <pre v-text="items" /> -->
	</private-view>
</template>

<script lang="ts" setup>
import { useLayout, useApi, useItems, useCollection } from '@directus/extensions-sdk';
import type { Query } from '@directus/shared/types';
import { API_URL, COLLECTION_NAME } from '../../constants';
import { computed, defineComponent, ref } from 'vue';
import type { Ref, ComputedRef, WritableComputedRef } from 'vue';
import { BreeAction } from '../../types';
//@ts-ignore
import SearchInput from '@/views/private/components/search-input.vue';

defineComponent({
	name: 'BreeDashboard',
});

const api = useApi();
const collectionName = ref<string>(COLLECTION_NAME);
const query = {
	page: ref<number>(1),
	limit: ref<number>(25),
	fields: ref<string[]>(['name', 'cron', 'status', 'orphaned']),
	sort: ref<string[]>(['name']),
	search: ref<string>(''),
	filter: ref<any>(),
};
const collection = useCollection(collectionName);
const _items = useItems(collectionName, query);

const items = computed({
	get: () => _items.items.value,
	set: (v) => (_items.items.value = v),
});

const headers = computed(() =>
	collection.fields.value
		.filter((field) => !field.meta?.hidden && field.field !== 'path')
		.map((field) => ({ text: field.name, value: field.field }))
);
const updateLocalJob = (item: any) => {
	const index = items.value.findIndex((i) => i.path === item.path);
	if (index !== -1) {
		items.value[index] = item;
	}
};
const setJob = async (item: any, action: BreeAction) => {
	const { cron, uuid } = item;
	const { data } = await api.request({
		method: 'PUT',
		url: `${API_URL}/${uuid}`,
		data: { action, cron },
	});
	console.log(data);
	updateLocalJob(data);
};
</script>

<style lang="scss" scoped>
:global(body) {
	--v-table-height: auto;
	--v-table-sticky-offset-top: 0;
	--v-table-color: var(--foreground-normal);
	--v-table-background-color: var(--background-input);
}
.table-wrapper {
	margin: var(--content-padding);
	margin-bottom: var(--content-padding-bottom);
}
.v-bree-table {
	position: relative;
	height: var(--v-table-height);
	overflow-y: auto;
}

table {
	min-width: 100%;
	border-collapse: collapse;
	border-spacing: 0;
}
table thead tr td span {
	padding: 1px 4px;
	font-weight: bold;
	font-size: 12px;
	font-style: italic;
	text-transform: uppercase;
}
table tbody tr {
	border-top: 1px solid #f1f1f1;
	&:first-child {
		border-width: 2px;
	}
	&:last-child {
		border-bottom: 1px solid #f1f1f1;
	}
	&:nth-child(2) {
		background-color: #fcfcfc;
	}
	&:hover {
		background-color: #f9f9f9;
	}
}
table tbody tr td span {
	display: block;
	padding: 4px;
}
table tbody tr td span.orphaned {
	color: #d8d8d8;
}
table tbody tr td span.muted {
	color: #d8d8d8;
}
table tbody tr td .display-flex {
	display: flex;
	> * {
		margin-right: 2px;
	}
}
table tbody tr td input.cron-input {
	border: 1px solid #e1e1e1;
}
button.action-btn {
	font-size: 12px;
	&:not(:disabled):hover {
		text-decoration: underline;
	}
	&:disabled {
		color: #e1e1e1;
	}
}
</style>
