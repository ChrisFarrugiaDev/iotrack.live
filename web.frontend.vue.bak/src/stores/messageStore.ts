import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useMessageStore = defineStore("messageStore", () => {

    // - State ---------------------------------------------------------

    const flashMessageList = ref<string[]>([]);

    const flashMessageClass = ref<string | null>('flash-message--orange');

    const flashMessageDuration = ref<number>(0);

    // - Getters -------------------------------------------------------

    const getFlashMessageList = computed(()=>{
        return flashMessageList.value;
    });

    const getFlashMessageClass = computed(()=>{
        return flashMessageClass.value;
    });

    const getFlashMessageDuration = computed(()=>{
        return flashMessageDuration.value;
    });

    // - Actions -------------------------------------------------------
    function setFlashMessagesList(msg: string[], msgClass: null | string = null, duration=0) {       
        flashMessageList.value = msg;
        flashMessageDuration.value = duration;
        if (msgClass) {
            flashMessageClass.value = msgClass;
        }        
    }
    
    function setFlashMessageClass(msgClass: string | null) {
         flashMessageClass.value = msgClass;
    }

    function clearFlashMessageList() {
        flashMessageList.value = [];
        flashMessageClass.value = null;
    }

    function setFlashMessageDuration(val: number) {
        flashMessageDuration.value = val
    }

    function decreaseFlashMessageDuration() {
        
        if (flashMessageDuration.value != 0) {
            flashMessageDuration.value -= 1;
        } 
        if (flashMessageDuration.value < 0) {
            flashMessageDuration.value = 0;
        }   
    }

    return {
        getFlashMessageList, 
        getFlashMessageClass, 
        getFlashMessageDuration,
        setFlashMessagesList,
        setFlashMessageClass,
        clearFlashMessageList,
        setFlashMessageDuration,
        decreaseFlashMessageDuration,
    }
})