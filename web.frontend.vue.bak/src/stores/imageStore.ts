import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from '@/axios'
import { useAppStore } from './appStore'

type Img = {
    filename: string
    imageId: string
    url: string
}

type ImageBuckets = Record<string, Record<string, Img[]>>

export const useImageStore = defineStore('imageStore', () => {

    // ---- State ------------------------------------------------------
    const appImages = ref<ImageBuckets>({})

    // ---- Getter (computed-style) ------------------------------------



    // ---- Helpers ----------------------------------------------------

    function ensureBucket(entity_type: string, entity_id: string) {
        const t = String(entity_type)
        const id = String(entity_id)
        if (!appImages.value[t]) appImages.value[t] = {}
        if (!appImages.value[t][id]) appImages.value[t][id] = []
        return appImages.value[t][id]
    }

    function setImages(entity_type: string, entity_id: string, list: Img[]) {
        const t = String(entity_type)
        const id = String(entity_id)
        const bucket = ensureBucket(t, id)

        // mutate the existing array to preserve its reference
        bucket.splice(0, bucket.length, ...(list ?? []))
        return bucket
    }

    function addImages(entity_type: string, entity_id: string, list: Img[]) {
        const bucket = ensureBucket(entity_type, entity_id)
        bucket.push(...(list ?? []))
        return bucket
    }

    // ---- Actions ----------------------------------------------------
    async function deleteImage(imageId: string) {

        const url = `${useAppStore().getAppUrl}/img/delete/${imageId}`;
        const r = await axios.delete(url);

        return r
    }

    async function fetchImages(entity_type: string, entity_id: string) {

        if (!entity_id) return [];
        const bucket = ensureBucket(entity_type, entity_id);

        if (bucket.length) {
            console.log('> fetch from store');
            return bucket;
        } else {
            console.log('> fetch file.server.go');
        }
        

        const url = `${useAppStore().getAppUrl}/img/list?entity_type=${entity_type}&entity_id=${entity_id}&page=1&limit=50`;

        try {
            const r = await axios.get(url)
            const images: Img[] = r?.data?.data?.images ?? []
            return await setImages(entity_type, entity_id, images);

        } catch (err) {
            throw err;
        }
    }

    // /** Merge newly uploaded images (parsed from your FilePond response) */
    // function uploadImages(entity_type: string, entity_id: number, uploaded: Img[]) {
    //     return addImages(entity_type, entity_id, uploaded)
    // }

    // function clearImages(entity_type: string, entity_id: number) {
    //     setImages(entity_type, entity_id, [])
    // }

    // - Expose --------------------------------------------------------
    return {
        appImages,
        fetchImages,
        addImages,
        deleteImage,
        // uploadImages,
        // clearImages,
    }
})
