<template>
	<!-- <pre v-text="relationInfo" /> -->
	<component
		:is="layoutWrapper"
		v-if="relationInfo && relationInfo.relatedCollection"
		v-slot="{ layoutState }"
		v-model:layout-options="layoutOptions"
		v-model:layout-query="layoutQuery"
		:filter="filter"
		:collection="relationInfo.relatedCollection.collection"
	>
		<div class="table-o2m">
			<layout-tabular v-bind="layoutState" show-select="none" />
		</div>
	</component>
</template>

<script lang="ts" setup>
import { defineComponent, ref, toRefs, computed } from 'vue';
import { useStores, useLayout, useCollection } from '@directus/extensions-sdk';
import type { RelationO2M } from '@directus/shared/types';
defineComponent({
	name: 'TabularO2M',
});
const props = defineProps({
	value: {
		type: Array,
		default: () => [],
	},
	collection: {
		type: String,
		default: '',
	},
	field: {
		type: String,
		default: '',
	},
	tableFields: {
		type: Array,
		default: () => [],
	},
});

const { collection, field, tableFields } = toRefs(props);
const { useRelationsStore, useCollectionsStore, useFieldsStore } = useStores();
const { layoutWrapper } = useLayout(ref('tabular'));

console.log(tableFields.value);

const relationsStore = useRelationsStore();
const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();

const relationInfo = computed<RelationO2M>(() => {
	const relations = relationsStore.getRelationsForField(collection.value, field.value);

	if (relations.length !== 1) return undefined;

	const relation = relations[0];

	return {
		relation: relation,
		relatedCollection: collectionsStore.getCollection(relation.collection),
		relatedPrimaryKeyField: fieldsStore.getPrimaryKeyFieldForCollection(relation.collection),
		reverseJunctionField: fieldsStore.getField(relation.collection, relation.meta?.many_field as string),
		sortField: relation.meta?.sort_field ?? undefined,
		type: 'o2m',
	} as RelationO2M;
});

const relatedCollection = relationInfo.value.relatedCollection;
// const {fields} = useCollection(ref(relatedCollection.collection));

const layoutOptions = ref({ spacing: 'compact' });
const layoutQuery = ref({
	fields: tableFields.value.map((f) => f.field_name) ?? [],
	page: 1,
});
const filter = computed(() =>
	props.value.length > 0 ? { _and: [{ uuid: { _in: props.value ?? [] } }] } : { _and: [{ uuid: { _null: true } }] }
);
</script>

<style scoped>
.table-o2m {
	margin: 0 calc(var(--content-padding) * -1);
}
</style>
