import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthorizationStore = defineStore('authorizationStore', () => {

    // ---- Types ------------------------------------------------------

    type Permission = {
        perm_id: number
        key: string
        description: string
    }

    type TreeNode = {
        id: number | string
        label: string
        children?: TreeNode[]
    }

    // ---- State ------------------------------------------------------
    const roles = ref<Record<string, string>>({});
    const permissions = ref<Permission[]>([]);
    const rolePermissions = ref<Record<string, number[]>>({});

    const userPermissions = ref<Set<string>>(new Set())
    

    const loaded = ref(false);


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
    });

    const getPermissions = computed(() => permissions.value);

    const getRolePermissions = computed(() => {
        return rolePermissions.value;
    });    

    const isLoaded = computed(() => loaded.value);

    const getUserPermissions = computed(() => {
        return userPermissions.value;
    });

    const can = computed(() => {
        return (permissionKey: string) => {
            return userPermissions.value.has(permissionKey)
        }
    });

    // ---- Actions ----------------------------------------------------

    function setRoles(r: Record<string, string>) {
        roles.value = r;
        checkLoaded();
    }
    function setPermissions(p: Permission[]) {
        permissions.value = p;
        checkLoaded();
    }

    function setRolePermissions(rp: Record<string, number[]>) {
        rolePermissions.value = rp;
        checkLoaded();
    }

    // Helper to check if all are populated
    function checkLoaded() {
        // Only set loaded if all data is non-empty
        if (
            Object.keys(roles.value).length > 0 &&
            permissions.value.length > 0 &&
            Object.keys(rolePermissions.value).length > 0
        ) {
            loaded.value = true;
        }
    }

    function comparePermissionsDiff(
        rolePermissions: number[],
        userPermissions: number[]
    ): Record<number, boolean> {

        const result: Record<number, boolean> = {};

        // Permissions the user has but the role does not → TRUE
        userPermissions.forEach(perm => {
            if (!rolePermissions.includes(perm)) {
                result[perm] = true;
            }
        });

        // Permissions the role has but the user does not → FALSE
        rolePermissions.forEach(perm => {
            if (!userPermissions.includes(perm)) {
                result[perm] = false;
            }
        });

        return result;
    }


    function setUserPermissions(perms: string[]) {
        userPermissions.value = new Set(perms)
    }


    // - Expose --------------------------------------------------------
    return {
        getRoles,
        setRoles,
        getPermissions,
        setPermissions,
        getGroupedPermissions,
        getRolePermissions,
        setRolePermissions,
        isLoaded,
        comparePermissionsDiff,

        userPermissions,
        getUserPermissions,
        setUserPermissions,
        can,
  
    };
});
