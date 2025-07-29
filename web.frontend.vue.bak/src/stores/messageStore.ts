import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useMessageStore = defineStore("messageStore", () => {

    // - State ---------------------------------------------------------

    const flashMessages = ref<string[]>(["hello world"]);

    const flashClass = ref<string | null>('flash-message--orange');

    const persistFlashMessage = ref<number>(0);

    // - Getters -------------------------------------------------------

    const getFlashMessages = computed(()=>{
        return flashMessages.value;
    });

    const getFlashClass = computed(()=>{
        return flashClass.value;
    });

    const getPersistFlashMessage = computed(()=>{
        return persistFlashMessage.value;
    });

    // - Actions -------------------------------------------------------
    function setFlashMessages(msg: string[], msgClass: null | string = null) {       
        flashMessages.value = msg;
        if (msgClass) {
            flashClass.value = msgClass;
        }
    }
    
    function setFlashClass(msgClass: string | null) {
         flashClass.value = msgClass;
    }

    function clearFlashMessage() {
        flashMessages.value = [];
        flashClass.value = null;
    }

    function setPersistFlashMessage(val: number) {
        persistFlashMessage.value = val
    }

    function decreasePersistFlashMessage() {
        
        if (persistFlashMessage.value != 0) {
            persistFlashMessage.value -= 1;
        }
        console.log(persistFlashMessage.value);
    }

    return {
        getFlashMessages, 
        getFlashClass, 
        getPersistFlashMessage,
        setFlashMessages,
        setFlashClass,
        clearFlashMessage,
        setPersistFlashMessage,
        decreasePersistFlashMessage,
    }
})