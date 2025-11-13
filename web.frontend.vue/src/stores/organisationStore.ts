import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Organisation } from '@/types/organisation.type';

export const useOrganisationStore = defineStore('organisationStore', () => {

    type OrgMap = Record<string, Organisation>;
    type TreeNode = {
        id: string;
        label: string;
        children?: TreeNode[];
    };

    // ---- State ------------------------------------------------------

    const organisation = ref<Record<string, string> | null>(null)
    const organisationScope = ref<Record<string, any> | null>(null)

    // ---- Getters ----------------------------------------------------

    const getOrganisation = computed(() => organisation.value);
    const getOrganisationScope = computed(() => organisationScope.value);

    const getGroupedOrganisations = computed(() => {

        return buildOrgTree() ?? [];

    });

    // ---- Setters (Actions) ------------------------------------------

    function setOrganisation(val: Record<string, string> | null) {
        organisation.value = val
    }
    function setOrganisationScope(val: Record<string, any> | null) {
        organisationScope.value = val
    }


    function clear() {
        organisation.value = null;
        organisationScope.value = null;
    }


    function buildOrgTree(): TreeNode[] | null {
        const orgs = organisationScope.value;
        const rootToSkipId = organisation.value?.id;

        if (!orgs || !rootToSkipId) return null;

        // nodeMap is an internal lookup table used while constructing the tree.
        // - Each key is an organisation ID (string) eg: ("1", "2", "4", etc.).
        // - Each value is a TreeNode, but with `children` ALWAYS defined as an array.
        //   (TreeNode normally has optional children, but for building the tree we
        //    want a guaranteed empty array so we can safely push child nodes into it
        //    without checking for undefined.)
        const nodeMap: Record<string, TreeNode & { children: TreeNode[] }> = {};

        Object.values(orgs).forEach((org) => {
            nodeMap[org.id] = {
                id: org.id,
                label: org.name,
                children: [],
            };
        });

        const topLevel: TreeNode[] = [];

        // Second: link children to parents, and decide top-level nodes
        Object.values(orgs).forEach((org) => {
            if (org.id === rootToSkipId) {
                // We completely skip this org in the tree
                return;
            }

            const parentId = org.parent_org_id ?? null;

            if (parentId === rootToSkipId) {
                // Direct child of the skipped root → becomes top-level
                topLevel.push(nodeMap[org.id]);
            } else if (parentId && nodeMap[parentId]) {
                // Normal child → attach to its parent
                nodeMap[parentId].children.push(nodeMap[org.id]);
            } else {
                // No parent or parent not in map → also treat as top-level
                topLevel.push(nodeMap[org.id]);
            }
        });

        // Optionally clean up empty children arrays
        const stripEmptyChildren = (node: TreeNode & { children?: TreeNode[] }): TreeNode => {
            const { id, label, children } = node;
            if (!children || children.length === 0) {
                return { id, label };
            }
            return {
                id,
                label,
                children: children.map(stripEmptyChildren),
            };
        };

        return topLevel.map(stripEmptyChildren);
    }

    // ---- Expose -----------------------------------------------------
    return {

        getOrganisation,
        setOrganisation,

        getOrganisationScope,
        setOrganisationScope,

        getGroupedOrganisations,

        clear,
    }
});
