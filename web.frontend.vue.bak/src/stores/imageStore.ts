import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from '@/axios';
import { useAppStore } from './appStore';

export const useImageStore = defineStore('imageStore', () => {

    // ---- State ------------------------------------------------------



    // ---- Getters ----------------------------------------------------



    // ---- Actions ----------------------------------------------------

    async function uploadImages(payload: any[]) {
        
    }

    async function fetchImages(entity_type: string, entity_id: number) {

        const url = `${useAppStore().getAppUrl}/img/list?entity_type=${entity_type}&entity_id=${entity_id}&page=1&limit=50`
        const r = await axios.get(url)

        return r;
    }

    // - Expose --------------------------------------------------------
    return { fetchImages };
});
