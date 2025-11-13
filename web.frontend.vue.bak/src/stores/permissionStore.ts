import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const usePermissionStore = defineStore('permissionStore', () => {

    // ---- Types ------------------------------------------------------

    type Permission = {
        perm_id: string
        key: string
        description: string
    }

    type TreeNode = {
        id: string
        label: string
        children?: TreeNode[]
    }

    // ---- State ------------------------------------------------------
    const roles = ref<Record<string, string>>({});
    const permissions = ref<Permission[]>([]);


    // ---- Getters ----------------------------------------------------
    const getRoles = computed(() => roles.value);
    const getGroupedPermissions = computed(() => {
        const groupMap: Record<string, TreeNode> = {}
        const ungrouped: TreeNode[] = []

        permissions.value.forEach(perm => {
            const node: TreeNode = {
                id: perm.perm_id,
                label: perm.description,
            }

            if ("group_name" in perm && typeof perm.group_name === 'string') {
                // Grouped permission
                if (!groupMap[perm.group_name]) {
                    groupMap[perm.group_name] = {
                        id: perm.group_name,
                        label: perm.group_name,
                        children: [],
                    }
                }
                groupMap[perm.group_name].children!.push(node)
            } else {
                // No group, just add to root
                ungrouped.push(node)
            }
        })

        // Output: ungrouped nodes first, then each group as its own node
        return [
            ...ungrouped,
            ...Object.values(groupMap)
        ]
    })


    const getPermissions = computed(() => permissions.value);


    // ---- Actions ----------------------------------------------------

    function setRoles(r: Record<string, string>) {
        roles.value = r;
    }
    function setPermissions(p: Permission[]) {
        permissions.value = p;
    }


    // - Expose --------------------------------------------------------
    return {
        getRoles,
        setRoles,
        getPermissions,
        setPermissions,
        getGroupedPermissions,
    };
});
