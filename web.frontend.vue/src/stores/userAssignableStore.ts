/**
 * userAssignableStore
 *
 * Used by User Create / User Edit forms to preload and manage
 * assignable Organisations, Assets, and Devices.
 *
 * This store:
 * - Fetches assignment options per organisation
 * - Caches results to avoid refetching
 * - Builds grouped/tree structures for selection components
 *
 * It is UI/workflow-specific and assumes permissions
 * are already validated elsewhere.
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAppStore } from './appStore'
import axios from '@/axios'
import type { Asset } from '@/types/asset.type'
import type { Device } from '@/types/device.type'
import { useAssetStore } from './assetStore'
import { useDeviceStore } from './deviceStore'

export const useUserAssignableStore = defineStore('userAssignableStore', () => {
    // ---- Types ------------------------------------------------------
    type TreeNode = {
        id: number | string
        label: string
        children?: TreeNode[]
    }

    // ---- Store/Deps -------------------------------------------------
    const appStore = useAppStore()

    // ---- State ------------------------------------------------------
    const selectedOrgId = ref<string>('0')    // The org id currently being managed
    const fetchedOrgIds = ref<string[]>([])   // Which orgs have already been fetched (avoid refetch)
    // assignableResources holds response data for each org: { [orgId]: { organisations, assets, devices } }
    const assignableResources = ref<Record<string, any>>({})

    // ---- Getters ----------------------------------------------------
    // Returns raw assignable resources for the current org
    const getAssignableResources = computed(() => assignableResources.value);

    // The currently selected org id
    const getSelectedOrgId = computed(() => selectedOrgId.value);

    // Tree/grouped structures for UI (computed from raw assignable data)
    const filterAssetsByUser = ref(false);
    const getGroupedAssets = computed(() => buildAssetsTree(filterAssetsByUser.value));

    const filterDevicesByUser = ref(false);
    const getGroupedDevices = computed(() => buildDeviceTree(filterDevicesByUser.value));

    const getGroupedOrganisations = computed(() => buildOrgTree());

    // ---- Actions ----------------------------------------------------
    /**
     * Fetch assignable resources for a given org id.
     * Caches results to avoid redundant API calls.
     */
    async function fetchAssignableResources(org_id: string) {
        try {
            if (fetchedOrgIds.value.includes(org_id)) {
                selectedOrgId.value = org_id
                return
            }

            const url = `${appStore.getAppUrl}/api/user/assignment-options`
            const result = await axios.post(url, { org_id })

            // Cache org_id as fetched and set active org
            fetchedOrgIds.value.push(org_id)
            selectedOrgId.value = org_id
            assignableResources.value[org_id] = result.data.data
        } catch (err) {
            console.error('! useUserAssignableStore fetchAssignableResources !\n', err)
            throw err
        }
    }

    /**
     * Build a hierarchical organisation tree, omitting the selected org as root.
     * Used for UI tree dropdowns.
     */
    function buildOrgTree(): TreeNode[] {
        const orgId = selectedOrgId.value
        const orgs = assignableResources.value[orgId]?.organisation

        if (!orgs) return []

        // 1. Create flat node map
        const nodeMap: Record<string, TreeNode & { children: TreeNode[] }> = {}
        Object.values(orgs as Record<string, any>).forEach((org) => {
            nodeMap[org.id] = {
                id: org.id,
                label: org.name,
                children: [],
            }
        })

        const topLevel: TreeNode[] = []

        // 2. Link nodes into a tree, skipping the root org
        Object.values(orgs as Record<string, any>).forEach((org) => {

            const parentId = org.parent_org_id ?? null
            if (parentId === orgId) {
                topLevel.push(nodeMap[org.id]) // direct children of root
            } else if (parentId && nodeMap[parentId]) {
                nodeMap[parentId].children.push(nodeMap[org.id])
            } else {
                topLevel.push(nodeMap[org.id])
            }
        })

        // 3. Optionally, strip empty children arrays for a clean TreeNode[]
        const stripEmptyChildren = (node: TreeNode & { children?: TreeNode[] }): TreeNode => {
            const { id, label, children } = node
            if (!children || children.length === 0) {
                return { id, label }
            }
            return { id, label, children: children.map(stripEmptyChildren) }
        }
        return topLevel.map(stripEmptyChildren)
    }

    /**
     * Build a grouping tree of assets by organisation (for UI).
     */
    function buildAssetsTree(filterByUserAssets: boolean = false): Record<string, TreeNode> {
        const orgId = selectedOrgId.value
        const orgs = assignableResources.value[orgId]?.organisation
        const assets = assignableResources.value[orgId]?.assets as Record<string, Asset>

        if (!assets || !orgs) return {}

        const groupedAssets: Record<string, TreeNode> = {}

        const userAssetIds = filterByUserAssets
            ? new Set(Object.keys(useAssetStore().getAssets || {}))
            : null

        for (const asset of Object.values(assets)) {
            const organisation = orgs[asset.organisation_id]
            if (!organisation) continue

            if (!(organisation.name in groupedAssets)) {
                groupedAssets[organisation.name] = {
                    label: organisation.name,
                    id: organisation.name,
                    children: []
                }
            }

            if (filterByUserAssets && !userAssetIds!.has(asset.id)) {
                continue
            }

            groupedAssets[organisation.name]!.children!.push({
                label: asset.name,
                id: asset.id,
            })
        }
        return groupedAssets
    }

    /**
     * Build a grouping tree of devices by organisation (for UI).
     */
    function buildDeviceTree(filterByUserDevices: boolean = false): Record<string, TreeNode> {
        const orgId = selectedOrgId.value
        const orgs = assignableResources.value[orgId]?.organisation
        const devices = assignableResources.value[orgId]?.devices as Record<string, Device>

        if (!devices || !orgs) return {}

        const groupedDevices: Record<string, TreeNode> = {}

        const userDeviceIds = filterByUserDevices
            ? new Set(Object.keys(useDeviceStore().getDevices || {}))
            : null

        for (const device of Object.values(devices)) {
            const organisation = orgs[device.organisation_id!]
            if (!organisation) continue

            if (!(organisation.name in groupedDevices)) {
                groupedDevices[organisation.name] = {
                    label: organisation.name,
                    id: "org_" + organisation.id,
                    children: []
                }
            }

            if (filterByUserDevices && !userDeviceIds!.has(device.id)) {
                continue
            }

            const label = device.model
                ? `${device.model} ${device.external_id}`
                : `${device.external_id}`

            groupedDevices[organisation.name]!.children!.push({
                label,
                id: device.id,
            })
        }

        return groupedDevices
    }

    // ---- Expose API -------------------------------------------------
    return {
        fetchAssignableResources,
        getAssignableResources,
        getGroupedAssets,
        getGroupedDevices,
        getGroupedOrganisations,
        getSelectedOrgId,

        selectedOrgId,
        fetchedOrgIds,
        assignableResources,

        filterAssetsByUser,
        filterDevicesByUser,

    }
})
