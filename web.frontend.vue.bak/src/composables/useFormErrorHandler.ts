import { type Ref } from 'vue';
import { useMessageStore } from '@/stores/messageStore';

type ErrorMap = Record<string, string>;

export function useFormErrorHandler(errors: Ref<ErrorMap>) {
	const messageStore = useMessageStore();

	/**
	 * Handle API/validation errors and update `errors` + flash messages.
	 * Returns `true` if the error was handled and the caller should `return` early.
	 */
	function handleFormError(err: any): boolean {
		// 1) Field-level validation errors
		const fieldErrors = err?.response?.data?.error?.details?.fieldErrors;
		if (fieldErrors && typeof fieldErrors === 'object') {
			for (const key in fieldErrors) {
				if (Object.prototype.hasOwnProperty.call(errors.value, key)) {
					errors.value[key] = fieldErrors[key][0];
				}
			}
			messageStore.setFlashMessagesList(
				['Please fix the highlighted errors and try again.'],
				'flash-message--orange'
			);
			return true;
		}

		// 2) Known global message
		const message = err?.response?.data?.message;
		if (message === 'Invalid input.') {
			messageStore.setFlashMessagesList(
				['Some of the provided information is invalid.'],
				'flash-message--orange'
			);
			return true;
		}

		// 3) Fallback
		messageStore.setFlashMessagesList(
			[message ?? 'An unexpected error occurred. Please try again later.'],
			'flash-message--orange'
		);

		return true;
	}

	return { handleFormError };
}
