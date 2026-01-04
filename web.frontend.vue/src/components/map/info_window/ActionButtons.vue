<template>
	<div class="action-buttons">

		<button class="action-buttons__btn" title="Toggle Favorite" @click="assetStore.toggleFavorites(props.asset.id)">
			<svg class="action-buttons__icon">
				<use xlink:href="@/ui/svg/sprite.svg#icon-star-2" v-if="assetStore.isFavorite(props.asset.id)"></use>
				<use xlink:href="@/ui/svg/sprite.svg#icon-star-1" v-else></use>
			</svg>
		</button>

		<button class="action-buttons__btn" title="View on Google Map" @click="navigateToAsset()">
			<svg class="action-buttons__icon">
				<use xlink:href="@/ui/svg/sprite.svg#icon-map"></use>
			</svg>
		</button>

		<button class="action-buttons__btn" :class="{'action-buttons__btn--active': getIsFollowed}" title="Follow Asset" @click="followAsset()" >
			<svg class="action-buttons__icon">
				<use xlink:href="@/ui/svg/sprite.svg#icon-route-start"></use>
			</svg>
		</button>

		<button class="action-buttons__btn" title="Edit Asset" @click="goToAssetEdit(asset.uuid)">
			<svg class="action-buttons__icon">
				<use xlink:href="@/ui/svg/sprite.svg#icon-edit-2"></use>
			</svg>
		</button>

		<button class="action-buttons__btn" title="View Notifications">
			<svg class="action-buttons__icon">
				<use xlink:href="@/ui/svg/sprite.svg#icon-bell"></use>
			</svg>
		</button>

	</div>
</template>

<script setup lang="ts">
import { useAssetStore } from '@/stores/assetStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { useMapStore } from '@/stores/mapStore';
import type { Asset } from '@/types/asset.type';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const deviceStore = useDeviceStore();
const assetStore = useAssetStore();
const mapStore = useMapStore();

// - Router ------------------------------------------------------------

const router = useRouter();

// - Props -------------------------------------------------------------
const props = defineProps<{
    asset: Asset
}>();

const getDevice = computed(()=>{
	return deviceStore.getDevices?.[props.asset.devices[0].id]
})

const getIsFollowed = computed(()=>{
	return props.asset.id == mapStore.getFollow;
});


// - Methods -----------------------------------------------------------


function goToAssetEdit(uuid: string) {
	router.push({
		name: 'assets.list',
		query: {
			update: 'true',
			asset_uuid: uuid
		}
	});
}

function navigateToAsset() {

    const lat = getDevice.value?.last_telemetry?.latitude;
    const lng = getDevice.value?.last_telemetry?.longitude;

	if (!lat || !lng) return;

    const formattedCoordinates = `${lat},${lng}`;

    // Construct the Google Maps URL
    const googleMapsURL = `https://www.google.com/maps/place/${encodeURIComponent(formattedCoordinates)}`;

    window.open(googleMapsURL, '_blank');
}

function followAsset() {
	mapStore.followAsset(props.asset.id);
}



</script>

<style lang="scss" scoped>
.action-buttons {
	border-top: 1px solid var(--color-zinc-200);
	padding-top: 1rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 0.5rem;
	margin-bottom: 0.25rem;
	gap: 0.5rem;


	&__btn {
		background: transparent;
		border: 1px solid var(--color-zinc-700);
		border-radius: 6px;
		padding: 0.4rem;
		cursor: pointer;
		transition: all 0.1s ease;

		display: flex;
		align-items: center;
		justify-content: center;

		opacity: .8;

		&:hover {
			background: var(--color-zinc-200);
			opacity: 1;
		}

		&--active {
			background: var(--color-zinc-300);
			opacity: 1;
		}

		&:active {
			background: var(--color-zinc-400);
			opacity: 1;
		}
	}

	&__icon {
		width: 18px;
		height: 18px;
		fill: var(--color-zinc-700);
		transition: fill 0.2s ease-in-out;
		color: var(--color-zinc-700);

		// .action-buttons__btn:hover & {
		// 	fill: #4da3ff;
		// }
	}
}
</style>
