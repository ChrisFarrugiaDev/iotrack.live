import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "./stores/authStore";
import { useMessageStore } from "./stores/messageStore";

// ---------------------------------------------------------------------

const apiClient = axios.create({
    headers: {
        "Content-Type": "application/json" // Ensure all requests use JSON
    },

    timeout: 15000 // Timeout if the request takes longer than 15 seconds
});


// ---------------------------------------------------------------------

apiClient.interceptors.request.use (
    function(config: InternalAxiosRequestConfig<any>) {
        const authStore = useAuthStore();
        const isAuthenticated = authStore.isAuthenticated;

        if (isAuthenticated) {

            const token = authStore.getJwt;
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    function(err: unknown) {
        console.log('! apiClient.interceptors.request !');

        // Do something with request error
        return Promise.reject(err);
    }
);

// ---------------------------------------------------------------------
apiClient.interceptors.response.use (


    function (response: AxiosResponse<any, any>) {
        let data = response?.data

        if (data?.messages) {
            const messageStore = useMessageStore();
            messageStore.setFlashMessagesList([data.messages], 'flash-message--blue');
        }
        
        return response;
    },

    function(err: any) {

        console.error('! axios.interceptors.response !\n', err);

        // Axios error objects store status in err.response.status
        const status = err?.response?.status;
        const authStore = useAuthStore();

        if (status === 401  && authStore.isAuthenticated) {
            localStorage.clear();
            sessionStorage.clear();

            // Navigate to the login view regardless of the outcome of the above operations
            window.location.assign('/login');            
        } 

        return Promise.reject(err);        
    }
);


// ---------------------------------------------------------------------

export default apiClient;